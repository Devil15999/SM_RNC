import React, { useState, useEffect } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { RootStackParamList } from '../../types/navigation';
import { Colors } from '../../constants/theme';
import { Routes } from '../../constants/routes';
import { useAppDispatch, useAppSelector, updateProfileSuccess, logout } from '../../store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../config';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;
type TabKey = 'profile' | 'addresses' | 'orders';

interface SavedAddress {
    _id: string;
    fullName: string;
    mobile: string;
    flatNo: string;
    street: string;
    city: string;
    state: string;
    pincode: string;
}

interface OrderItem {
    _id: string;
    packageType: 'mother' | 'baby' | 'muma';
    packageTitle: string;
    planKey: '1month' | '3month' | '6month';
    planLabel: string;
    price: number;
    paymentStatus: 'pending' | 'processing' | 'success' | 'failed' | 'refunded';
    status: 'created' | 'active' | 'completed' | 'cancelled';
    address: {
        fullName: string;
        mobile: string;
        flatNo: string;
        street: string;
        city: string;
        state: string;
        pincode: string;
    };
    createdAt: string;
}

const ProfileScreen: React.FC<Props> = ({ navigation }) => {
    const dispatch = useAppDispatch();
    const token = useAppSelector(state => state.auth.user?.token);
    const user = useAppSelector(state => state.auth.user);

    const [activeTab, setActiveTab] = useState<TabKey>('profile');

    // Profile State
    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

    // Address Book State
    const [addresses, setAddresses] = useState<SavedAddress[]>([]);
    const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
    const [showAddAddressForm, setShowAddAddressForm] = useState(false);
    const [addrName, setAddrName] = useState(user?.name || '');
    const [addrMobile, setAddrMobile] = useState(user?.mobile || '');
    const [addrFlat, setAddrFlat] = useState('');
    const [addrStreet, setAddrStreet] = useState('');
    const [addrCity, setAddrCity] = useState('');
    const [addrState, setAddrState] = useState('');
    const [addrPincode, setAddrPincode] = useState('');
    const [isSavingAddress, setIsSavingAddress] = useState(false);
    const [addressErrors, setAddressErrors] = useState<Record<string, string>>({});

    // Orders State
    const [orders, setOrders] = useState<OrderItem[]>([]);
    const [isLoadingOrders, setIsLoadingOrders] = useState(false);

    // Fetch addresses
    const fetchAddresses = async () => {
        if (!token) return;
        setIsLoadingAddresses(true);
        try {
            const res = await fetch(`${API_BASE_URL}/addresses`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setAddresses(data.data);
            }
        } catch (err) {
            console.log('Error fetching addresses:', err);
        } finally {
            setIsLoadingAddresses(false);
        }
    };

    // Fetch orders
    const fetchOrders = async () => {
        if (!token) return;
        setIsLoadingOrders(true);
        try {
            const res = await fetch(`${API_BASE_URL}/orders`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setOrders(data.data);
            }
        } catch (err) {
            console.log('Error fetching orders:', err);
        } finally {
            setIsLoadingOrders(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'addresses') {
            fetchAddresses();
        } else if (activeTab === 'orders') {
            fetchOrders();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab]);

    // Logout
    const handleLogout = async () => {
        try {
            await AsyncStorage.removeItem('@session');
        } catch (e) {
            console.log('Error clearing session:', e);
        }
        dispatch(logout());
    };

    // Handle Edit Profile
    const handleUpdateProfile = async () => {
        if (!name.trim()) {
            Alert.alert('Error', 'Name is required');
            return;
        }
        if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            Alert.alert('Error', 'Enter a valid email');
            return;
        }
        setIsUpdatingProfile(true);
        try {
            const res = await fetch(`${API_BASE_URL}/users/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase() }),
            });
            const data = await res.json();
            if (res.ok && data.success && data.user) {
                dispatch(updateProfileSuccess({ name: data.user.name, email: data.user.email }));
                
                // Save updated session to AsyncStorage
                const sessionStr = await AsyncStorage.getItem('@session');
                if (sessionStr) {
                    const session = JSON.parse(sessionStr);
                    const updatedSession = { ...session, name: data.user.name, email: data.user.email };
                    await AsyncStorage.setItem('@session', JSON.stringify(updatedSession));
                }

                Alert.alert('Success', 'Profile updated successfully!');
            } else {
                Alert.alert('Error', data.message || 'Failed to update profile');
            }
        } catch (err) {
            console.log('Error updating profile:', err);
            Alert.alert('Error', 'Network error updating profile');
        } finally {
            setIsUpdatingProfile(false);
        }
    };

    // Validate Address fields
    const validateAddress = () => {
        const errs: Record<string, string> = {};
        if (!addrName.trim()) errs.name = 'Required';
        if (!addrMobile.trim() || addrMobile.length !== 10) errs.mobile = 'Enter 10-digit mobile';
        if (!addrFlat.trim()) errs.flat = 'Required';
        if (!addrStreet.trim()) errs.street = 'Required';
        if (!addrCity.trim()) errs.city = 'Required';
        if (!addrState.trim()) errs.state = 'Required';
        if (!addrPincode.trim() || addrPincode.length !== 6) errs.pincode = 'Enter 6-digit pincode';

        setAddressErrors(errs);
        return Object.keys(errs).length === 0;
    };

    // Add Address
    const handleAddAddress = async () => {
        if (!validateAddress()) return;
        setIsSavingAddress(true);
        try {
            const res = await fetch(`${API_BASE_URL}/addresses`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    fullName: addrName.trim(),
                    mobile: addrMobile.trim(),
                    flatNo: addrFlat.trim(),
                    street: addrStreet.trim(),
                    city: addrCity.trim(),
                    state: addrState.trim(),
                    pincode: addrPincode.trim(),
                }),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                Alert.alert('Success', 'Address saved successfully!');
                setShowAddAddressForm(false);
                setAddrFlat('');
                setAddrStreet('');
                setAddrCity('');
                setAddrState('');
                setAddrPincode('');
                fetchAddresses();
            } else {
                Alert.alert('Error', data.message || 'Failed to save address');
            }
        } catch {
            Alert.alert('Error', 'Network error saving address');
        } finally {
            setIsSavingAddress(false);
        }
    };

    // Delete Address
    const handleDeleteAddress = (id: string) => {
        Alert.alert(
            'Delete Address',
            'Are you sure you want to delete this address?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const res = await fetch(`${API_BASE_URL}/addresses/${id}`, {
                                method: 'DELETE',
                                headers: { 'Authorization': `Bearer ${token}` }
                            });
                            const data = await res.json();
                            if (res.ok && data.success) {
                                fetchAddresses();
                            } else {
                                Alert.alert('Error', data.message || 'Failed to delete address');
                            }
                        } catch {
                            Alert.alert('Error', 'Network error deleting address');
                        }
                    }
                }
            ]
        );
    };

    const getPackageDetails = (type: string) => {
        switch (type) {
            case 'mother':
                return { label: 'Mother Care', icon: 'user-pregnant', color: '#E91E8A' };
            case 'baby':
                return { label: 'Baby Care', icon: 'baby', color: '#1FBDBD' };
            case 'muma':
                return { label: 'Muma Care', icon: 'hand-holding-heart', color: '#7B2D8B' };
            default:
                return { label: 'Care Package', icon: 'box', color: Colors.PRIMARY };
        }
    };

    const getPlanLabel = (key: string) => {
        switch (key) {
            case '1month': return '1 Month';
            case '3month': return '3 Months';
            case '6month': return '6 Months';
            default: return key;
        }
    };

    const renderInput = (
        label: string,
        value: string,
        onChange: (t: string) => void,
        fieldKey: string,
        errorMap: Record<string, string>,
        props?: any
    ) => (
        <View style={styles.inputGroup}>
            <Text style={styles.label}>{label}</Text>
            <TextInput
                style={[
                    styles.input,
                    errorMap[fieldKey] ? styles.inputErrorBorder : null
                ]}
                value={value}
                onChangeText={onChange}
                placeholderTextColor={Colors.TEXT_HINT}
                {...props}
            />
            {!!errorMap[fieldKey] && <Text style={styles.errorText}>{errorMap[fieldKey]}</Text>}
        </View>
    );

    return (
        <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <SafeAreaView style={styles.safe}>
                <StatusBar barStyle="dark-content" backgroundColor={Colors.BACKGROUND} />

                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                        <Icon name="chevron-left" size={18} color={Colors.TEXT_SECONDARY} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>My Account</Text>
                    <View style={styles.backBtnPlaceholder} />
                </View>

                {/* Segmented Control / Tabs */}
                <View style={styles.tabBar}>
                    {(['profile', 'addresses', 'orders'] as TabKey[]).map(tab => (
                        <TouchableOpacity
                            key={tab}
                            style={[styles.tabItem, activeTab === tab && styles.tabItemActive]}
                            onPress={() => {
                                setShowAddAddressForm(false);
                                setActiveTab(tab);
                            }}
                            activeOpacity={0.8}
                        >
                            <Text style={[styles.tabItemText, activeTab === tab && styles.tabItemTextActive]}>
                                {tab === 'profile' ? 'Profile' : tab === 'addresses' ? 'Addresses' : 'Orders'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

                    {/* PROFILE TAB */}
                    {activeTab === 'profile' && (
                        <View>
                            <View style={styles.card}>
                                <Text style={styles.cardHeader}>Personal Details</Text>
                                {renderInput('Full Name', name, setName, 'name', {})}
                                {renderInput('Email Address', email, setEmail, 'email', {}, { keyboardType: 'email-address', autoCapitalize: 'none' })}

                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Mobile Number (Linked)</Text>
                                    <View style={[styles.input, styles.disabledInput]}>
                                        <Text style={styles.disabledInputText}>+91 {user?.mobile}</Text>
                                    </View>
                                </View>

                                 <TouchableOpacity
                                     style={isUpdatingProfile ? styles.btnDisabled : null}
                                     activeOpacity={0.85}
                                     onPress={handleUpdateProfile}
                                     disabled={isUpdatingProfile}
                                 >
                                     <LinearGradient
                                         colors={isUpdatingProfile ? [Colors.DISABLED, Colors.DISABLED] : [Colors.PRIMARY, Colors.PRIMARY_DARK]}
                                         start={{ x: 0, y: 0 }}
                                         end={{ x: 1, y: 0 }}
                                         style={styles.btn}
                                     >
                                         {isUpdatingProfile ? (
                                             <ActivityIndicator color={Colors.WHITE} />
                                         ) : (
                                             <Text style={styles.btnText}>Save Changes</Text>
                                         )}
                                     </LinearGradient>
                                 </TouchableOpacity>
                            </View>

                            {/* Account Details */}
                            {/* <View style={styles.accountCard}>
                                <Text style={styles.accountCardHeader}>Account Details</Text>
                                <View style={styles.accountRow}>
                                    <Text style={styles.accountLabel}>Mobile</Text>
                                    <Text style={styles.accountValue}>+91 {user?.mobile ?? '—'}</Text>
                                </View>
                                <View style={styles.accountDivider} />
                                <View style={styles.accountRow}>
                                    <Text style={styles.accountLabel}>User ID</Text>
                                    <Text style={styles.accountValue}>{user?.id ?? '—'}</Text>
                                </View>
                            </View> */}

                            {/* Quick Actions */}
                            <Text style={styles.quickTitle}>Quick Actions</Text>
                            <View style={styles.tileGrid}>
                                {[
                                    { label: 'Baby Tracker', icon: 'baby' },
                                    { label: 'Appointments', icon: 'calendar-alt' },
                                    { label: 'Support', icon: 'comments' },
                                    { label: 'Orders', icon: 'box-open' },
                                ].map(item => (
                                    <TouchableOpacity
                                        key={item.label}
                                        style={styles.tile}
                                        activeOpacity={0.75}
                                        onPress={() => {
                                            if (item.label === 'Orders') {
                                                setActiveTab('orders');
                                            } else if (item.label === 'Support') {
                                                navigation.navigate(Routes.HELP_SUPPORT);
                                            } else if (item.label === 'Appointments') {
                                                navigation.navigate(Routes.APPOINTMENTS);
                                            }
                                        }}
                                    >
                                        <Icon name={item.icon} size={22} color={Colors.PRIMARY} style={{ marginBottom: 8 }} />
                                        <Text style={styles.tileText}>{item.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Sign Out */}
                            <TouchableOpacity
                                style={styles.logoutBtn}
                                onPress={handleLogout}
                                activeOpacity={0.8}>
                                <Text style={styles.logoutText}>Log Out</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* ADDRESSES TAB */}
                    {activeTab === 'addresses' && (
                        <View>
                            {!showAddAddressForm ? (
                                <View>
                                    <TouchableOpacity
                                        style={styles.addAddressBtn}
                                        onPress={() => setShowAddAddressForm(true)}
                                        activeOpacity={0.8}
                                    >
                                        <Icon name="plus" size={12} color={Colors.PRIMARY} style={{ marginRight: 8 }} />
                                        <Text style={styles.addAddressBtnText}>Add New Address</Text>
                                    </TouchableOpacity>

                                    {isLoadingAddresses ? (
                                        <ActivityIndicator color={Colors.PRIMARY} style={{ marginTop: 24 }} />
                                    ) : addresses.length === 0 ? (
                                        <View style={styles.emptyBox}>
                                            <Icon name="map-marked-alt" size={40} color={Colors.BORDER} style={{ marginBottom: 12 }} />
                                            <Text style={styles.emptyText}>No saved addresses found.</Text>
                                        </View>
                                    ) : (
                                        addresses.map(addr => (
                                            <View key={addr._id} style={styles.addressCard}>
                                                <View style={styles.addressCardLeft}>
                                                    <View style={styles.pinIconBox}>
                                                        <Icon name="map-marker-alt" size={16} color={Colors.PRIMARY} />
                                                    </View>
                                                    <View style={styles.addressDetails}>
                                                        <Text style={styles.addressName}>{addr.fullName}</Text>
                                                        <Text style={styles.addressMobile}>Mobile: +91 {addr.mobile}</Text>
                                                        <Text style={styles.addressLine}>
                                                            {addr.flatNo}, {addr.street}
                                                        </Text>
                                                        <Text style={styles.addressLine}>
                                                            {addr.city}, {addr.state} - {addr.pincode}
                                                        </Text>
                                                    </View>
                                                </View>
                                                <TouchableOpacity
                                                    style={styles.deleteAddressBtn}
                                                    onPress={() => handleDeleteAddress(addr._id)}
                                                    activeOpacity={0.8}
                                                >
                                                    <Icon name="trash-alt" size={14} color={Colors.ERROR} />
                                                </TouchableOpacity>
                                            </View>
                                        ))
                                    )}
                                </View>
                            ) : (
                                <View style={styles.card}>
                                    <Text style={styles.cardHeader}>Add New Address</Text>
                                    {renderInput('Receiver Name', addrName, setAddrName, 'name', addressErrors)}
                                    {renderInput('Receiver Mobile', addrMobile, (t) => setAddrMobile(t.replace(/[^0-9]/g, '')), 'mobile', addressErrors, { keyboardType: 'number-pad', maxLength: 10 })}

                                    <View style={styles.row}>
                                        <View style={styles.flex1}>
                                            {renderInput('House/Flat No', addrFlat, setAddrFlat, 'flat', addressErrors)}
                                        </View>
                                        <View style={styles.space} />
                                        <View style={styles.flex1}>
                                            {renderInput('Street/Locality', addrStreet, setAddrStreet, 'street', addressErrors)}
                                        </View>
                                    </View>

                                    <View style={styles.row}>
                                        <View style={styles.flex1}>
                                            {renderInput('City', addrCity, setAddrCity, 'city', addressErrors)}
                                        </View>
                                        <View style={styles.space} />
                                        <View style={styles.flex1}>
                                            {renderInput('State', addrState, setAddrState, 'state', addressErrors)}
                                        </View>
                                    </View>

                                    {renderInput('Pincode', addrPincode, (t) => setAddrPincode(t.replace(/[^0-9]/g, '')), 'pincode', addressErrors, { keyboardType: 'number-pad', maxLength: 6 })}

                                    <View style={[styles.row, { marginTop: 10 }]}>
                                        <TouchableOpacity
                                            style={[styles.btn, styles.cancelBtn, styles.flex1]}
                                            onPress={() => setShowAddAddressForm(false)}
                                            disabled={isSavingAddress}
                                        >
                                            <Text style={styles.cancelBtnText}>Cancel</Text>
                                        </TouchableOpacity>
                                        <View style={styles.space} />
                                        <TouchableOpacity
                                            style={[styles.btn, styles.flex1, isSavingAddress && styles.btnDisabled]}
                                            onPress={handleAddAddress}
                                            disabled={isSavingAddress}
                                        >
                                            {isSavingAddress ? (
                                                <ActivityIndicator color={Colors.WHITE} />
                                            ) : (
                                                <Text style={styles.btnText}>Save Address</Text>
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}
                        </View>
                    )}

                    {/* ORDERS TAB */}
                    {activeTab === 'orders' && (
                        <View>
                            {isLoadingOrders ? (
                                <ActivityIndicator color={Colors.PRIMARY} style={{ marginTop: 24 }} />
                            ) : orders.length === 0 ? (
                                <View style={styles.emptyBox}>
                                    <Icon name="box-open" size={40} color={Colors.BORDER} style={{ marginBottom: 12 }} />
                                    <Text style={styles.emptyText}>You haven't ordered any packages yet.</Text>
                                </View>
                            ) : (
                                orders.map(order => {
                                    const details = getPackageDetails(order.packageType);
                                    return (
                                        <View key={order._id} style={styles.orderCard}>
                                            <View style={styles.orderHeader}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 }}>
                                                    <View style={[styles.orderIconBox, { backgroundColor: details.color + '14' }]}>
                                                        <Icon name={details.icon} size={15} color={details.color} />
                                                    </View>
                                                    <View style={{ marginLeft: 10, flex: 1 }}>
                                                        <Text style={styles.orderTitle}>{details.label}</Text>
                                                        <Text style={styles.orderPlan}>{getPlanLabel(order.planKey)} Plan</Text>
                                                    </View>
                                                </View>
                                                <View style={[styles.statusBadge, order.status === 'active' && styles.statusPaid, order.status === 'completed' && styles.statusCompleted]}>
                                                    <Text style={[styles.statusText, order.status === 'active' && styles.statusTextPaid, order.status === 'completed' && styles.statusTextCompleted]}>
                                                        {order.status.toUpperCase()}
                                                    </Text>
                                                </View>
                                            </View>

                                            <View style={styles.orderDivider} />

                                            <View style={styles.orderRow}>
                                                <Text style={styles.orderLabel}>Amount Paid</Text>
                                                <Text style={styles.orderValue}>₹{order.price != null ? order.price.toLocaleString('en-IN') : '—'}</Text>
                                            </View>

                                            <View style={styles.orderRow}>
                                                <Text style={styles.orderLabel}>Date</Text>
                                                <Text style={styles.orderValue}>
                                                    {order.createdAt
                                                        ? new Date(order.createdAt).toLocaleDateString('en-IN', {
                                                            day: 'numeric',
                                                            month: 'short',
                                                            year: 'numeric'
                                                        })
                                                        : '—'}
                                                </Text>
                                            </View>

                                            <View style={styles.orderRow}>
                                                <Text style={styles.orderLabel}>Deliver to</Text>
                                                <Text style={styles.orderValue} numberOfLines={1}>
                                                    {order.address
                                                        ? `${order.address.fullName ?? ''} - ${order.address.flatNo ?? ''}, ${order.address.street ?? ''}`
                                                        : '—'}
                                                </Text>
                                            </View>
                                        </View>
                                    );
                                })
                            )}
                        </View>
                    )}

                </ScrollView>
            </SafeAreaView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    flex: { flex: 1, backgroundColor: Colors.BACKGROUND },
    safe: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: Colors.BORDER,
    },
    backBtn: { padding: 4 },
    backText: { color: Colors.TEXT_SECONDARY, fontSize: 15, fontWeight: '500' },
    headerTitle: { fontSize: 17, fontWeight: '700', color: Colors.TEXT_PRIMARY },
    backBtnPlaceholder: { width: 50 },

    // Tabs
    tabBar: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: Colors.SURFACE,
        borderBottomWidth: 1.5,
        borderBottomColor: Colors.DIVIDER,
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 8,
        borderRadius: 20,
    },
    tabItemActive: {
        backgroundColor: Colors.WHITE,
        shadowColor: Colors.SHADOW,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
    },
    tabItemText: {
        fontSize: 13,
        color: Colors.TEXT_SECONDARY,
        fontWeight: '600',
    },
    tabItemTextActive: {
        color: Colors.PRIMARY,
        fontWeight: '700',
    },

    scroll: {
        padding: 20,
        paddingBottom: 40,
        flexGrow: 1,
    },

    // Card/Forms
    card: {
        backgroundColor: Colors.WHITE,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.BORDER,
        marginBottom: 20,
    },
    cardHeader: {
        fontSize: 15,
        fontWeight: '800',
        color: Colors.TEXT_PRIMARY,
        marginBottom: 16,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
    },
    row: { flexDirection: 'row' },
    flex1: { flex: 1 },
    space: { width: 12 },

    inputGroup: { marginBottom: 16 },
    label: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.TEXT_SECONDARY,
        marginBottom: 6,
    },
    input: {
        backgroundColor: Colors.SURFACE,
        borderWidth: 1,
        borderColor: Colors.BORDER,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 14,
        color: Colors.TEXT_PRIMARY,
    },
    disabledInput: {
        backgroundColor: Colors.DIVIDER,
        borderColor: Colors.DIVIDER,
    },
    disabledInputText: {
        color: Colors.TEXT_SECONDARY,
        fontSize: 14,
        fontWeight: '600',
    },
    inputErrorBorder: { borderColor: Colors.ERROR },
    errorText: { color: Colors.ERROR, fontSize: 10, marginTop: 4, marginLeft: 2 },

    btn: {
        height: 52,
        borderRadius: 14,
        backgroundColor: Colors.PRIMARY,
        justifyContent: 'center',
        alignItems: 'center',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 5,
    },
    btnDisabled: {
        backgroundColor: Colors.DISABLED,
        shadowOpacity: 0,
    },
    btnText: { color: Colors.WHITE, fontSize: 15, fontWeight: '800' },
    cancelBtn: {
        backgroundColor: Colors.WHITE,
        borderWidth: 1.5,
        borderColor: Colors.BORDER,
        shadowOpacity: 0,
    },
    cancelBtnText: { color: Colors.TEXT_SECONDARY, fontSize: 15, fontWeight: '700' },

    // Address list
    addAddressBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.SURFACE,
        borderWidth: 1.5,
        borderStyle: 'dashed',
        borderColor: Colors.PRIMARY,
        borderRadius: 14,
        paddingVertical: 14,
        marginBottom: 20,
    },
    addAddressBtnText: {
        color: Colors.PRIMARY,
        fontSize: 14,
        fontWeight: '700',
    },
    addressCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: Colors.WHITE,
        borderWidth: 1,
        borderColor: Colors.BORDER,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
    },
    addressCardLeft: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        flex: 1,
    },
    pinIconBox: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Colors.PRIMARY_LIGHT,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        marginTop: 2,
    },
    addressDetails: {
        flex: 1,
    },
    addressName: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.TEXT_PRIMARY,
        marginBottom: 2,
    },
    addressMobile: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
        marginBottom: 6,
        fontWeight: '500',
    },
    addressLine: {
        fontSize: 13,
        color: Colors.TEXT_SECONDARY,
        lineHeight: 18,
    },
    deleteAddressBtn: {
        padding: 8,
    },

    // Empty Box
    emptyBox: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 48,
    },
    emptyText: {
        color: Colors.TEXT_HINT,
        fontSize: 13,
        fontWeight: '600',
        marginTop: 6,
    },

    // Order History Cards
    orderCard: {
        backgroundColor: Colors.WHITE,
        borderWidth: 1,
        borderColor: Colors.BORDER,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    orderIconBox: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    orderTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: Colors.TEXT_PRIMARY,
    },
    orderPlan: {
        fontSize: 11,
        color: Colors.TEXT_SECONDARY,
        fontWeight: '600',
        marginTop: 2,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        backgroundColor: Colors.DIVIDER,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '700',
        color: Colors.TEXT_SECONDARY,
    },
    statusPaid: { backgroundColor: '#EBF8FF' },
    statusTextPaid: { color: '#2B6CB0' },
    statusCompleted: { backgroundColor: '#E6FFFA' },
    statusTextCompleted: { color: '#234E52' },

    orderDivider: {
        height: 1,
        backgroundColor: Colors.DIVIDER,
        marginVertical: 12,
    },
    orderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    orderLabel: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
        fontWeight: '500',
    },
    orderValue: {
        fontSize: 12,
        color: Colors.TEXT_PRIMARY,
        fontWeight: '600',
        maxWidth: '70%',
    },

    // Account Details card
    accountCard: {
        backgroundColor: Colors.WHITE,
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: Colors.BORDER,
    },
    accountCardHeader: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.TEXT_SECONDARY,
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    accountRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 4,
    },
    accountLabel: { color: Colors.TEXT_HINT, fontSize: 13 },
    accountValue: { color: Colors.TEXT_PRIMARY, fontSize: 14, fontWeight: '600' },
    accountDivider: {
        height: 1,
        backgroundColor: Colors.DIVIDER,
        marginVertical: 10,
    },

    // Quick Actions
    quickTitle: {
        color: Colors.TEXT_SECONDARY,
        fontSize: 12,
        fontWeight: '700',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    tileGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 24,
    },
    tile: {
        width: '47%',
        backgroundColor: Colors.SURFACE,
        borderRadius: 16,
        paddingVertical: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.BORDER,
    },
    tileText: {
        color: Colors.TEXT_PRIMARY,
        fontSize: 13,
        fontWeight: '600',
    },

    // Sign Out
    logoutBtn: {
        height: 50,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: Colors.ERROR,
        backgroundColor: '#FFF5F5',
        marginBottom: 8,
    },
    logoutText: {
        color: Colors.ERROR,
        fontSize: 15,
        fontWeight: '700',
    },
});

export default ProfileScreen;
