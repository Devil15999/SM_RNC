import React, { useState } from 'react';
import {
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Image,
    TextInput,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { RootStackParamList } from '../../types/navigation';
import { Colors } from '../../constants/theme';
import { useAppDispatch, useAppSelector, logout, updateUser } from '../../store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../config';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

const getImageUrl = (photoPath: string | undefined | null) => {
    if (!photoPath) return null;
    if (photoPath.startsWith('data:image/') || photoPath.startsWith('http://') || photoPath.startsWith('https://')) {
        return photoPath;
    }
    return `${API_BASE_URL.replace('/api', '')}${photoPath}`;
};

const ProfileScreen: React.FC<Props> = ({ navigation }) => {
    const dispatch = useAppDispatch();
    const token = useAppSelector(state => state.auth.token);
    const user = useAppSelector(state => state.auth.user);

    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [emailInput, setEmailInput] = useState(user?.email || '');
    const [addressInput, setAddressInput] = useState(user?.address || '');
    const [permanentAddressInput, setPermanentAddressInput] = useState(user?.permanentAddress || '');

    const startEditing = () => {
        setEmailInput(user?.email || '');
        setAddressInput(user?.address || '');
        setPermanentAddressInput(user?.permanentAddress || '');
        setIsEditing(true);
    };

    const handleSave = async () => {
        if (!emailInput.trim()) {
            Alert.alert('Validation Error', 'Email Address is required.');
            return;
        }
        if (!permanentAddressInput.trim()) {
            Alert.alert('Validation Error', 'Permanent Address is required.');
            return;
        }

        setIsSaving(true);
        try {
            const res = await fetch(`${API_BASE_URL}/users/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    email: emailInput.trim(),
                    address: addressInput.trim(),
                    permanentAddress: permanentAddressInput.trim(),
                }),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                // Update local redux state
                dispatch(updateUser(data.user));

                // Update AsyncStorage session details
                const sessionStr = await AsyncStorage.getItem('@session_employee');
                if (sessionStr) {
                    const session = JSON.parse(sessionStr);
                    const updatedSession = { ...session, ...data.user };
                    await AsyncStorage.setItem('@session_employee', JSON.stringify(updatedSession));
                }
                
                setIsEditing(false);
                Alert.alert('Success', 'Profile updated successfully.');
            } else {
                Alert.alert('Update Failed', data.message || 'Could not update profile details.');
            }
        } catch (err) {
            console.log('Error updating profile:', err);
            Alert.alert('Connection Error', 'Failed to reach the server.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleLogout = async () => {
        try {
            await AsyncStorage.removeItem('@session_employee');
        } catch (e) {
            console.log('Error clearing session:', e);
        }
        dispatch(logout());
    };

    const initials = (user?.name ?? 'E')
        .split(' ')
        .map(w => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    return (
        <SafeAreaView style={styles.safe}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.BACKGROUND} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} disabled={isSaving}>
                    <Icon name="chevron-left" size={18} color={Colors.TEXT_SECONDARY} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Profile</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {/* Profile Card */}
                <View style={styles.profileCard}>
                    <View style={styles.avatarContainer}>
                        {user?.userPhoto ? (
                            <Image 
                                source={{ uri: getImageUrl(user.userPhoto) || undefined }} 
                                style={styles.avatarImg}
                            />
                        ) : (
                            <Image 
                                source={require('../../assets/user.png')} 
                                style={styles.avatarImg}
                            />
                        )}
                        {user?.isVerifiedEmployee && (
                            <View style={styles.verifiedBadge}>
                                <Icon name="check" size={10} color={Colors.WHITE} />
                            </View>
                        )}
                    </View>

                    <Text style={styles.name}>{user?.name ?? 'Employee Name'}</Text>
                    <Text style={styles.occupation}>{user?.occupation ?? 'Care Professional'}</Text>

                    <View style={[styles.statusBadge, user?.isVerifiedEmployee ? styles.statusBadgeApproved : styles.statusBadgePending]}>
                        <Icon 
                            name={user?.isVerifiedEmployee ? "check-circle" : "hourglass-half"} 
                            size={12} 
                            color={user?.isVerifiedEmployee ? Colors.SUCCESS : "#f59e0b"} 
                            style={{ marginRight: 6 }} 
                        />
                        <Text style={[styles.statusText, user?.isVerifiedEmployee ? styles.statusTextApproved : styles.statusTextPending]}>
                            {user?.isVerifiedEmployee ? 'Approved Professional' : 'Pending Verification'}
                        </Text>
                    </View>
                </View>

                {/* Account Details */}
                <View style={styles.detailsCard}>
                    <View style={styles.cardHeaderRow}>
                        <Text style={styles.cardHeader}>Work Profile Details</Text>
                        {!isEditing && (
                            <TouchableOpacity 
                                onPress={startEditing} 
                                style={styles.cardEditBtn}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                activeOpacity={0.7}
                            >
                                <Icon name="pen" size={14} color={Colors.PRIMARY} />
                            </TouchableOpacity>
                        )}
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Mobile Number</Text>
                        <Text style={styles.infoValue}>+91 {user?.mobile ?? '—'}</Text>
                    </View>
                    <View style={styles.divider} />

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Email Address</Text>
                        {isEditing ? (
                            <TextInput
                                style={styles.input}
                                value={emailInput}
                                onChangeText={setEmailInput}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                placeholder="Enter Email Address"
                                placeholderTextColor={Colors.TEXT_HINT}
                            />
                        ) : (
                            <Text style={styles.infoValue}>{user?.email ?? '—'}</Text>
                        )}
                    </View>
                    <View style={styles.divider} />

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Working Address</Text>
                        {isEditing ? (
                            <TextInput
                                style={[styles.input, { minHeight: 60, textAlignVertical: 'top' }]}
                                value={addressInput}
                                onChangeText={setAddressInput}
                                multiline
                                placeholder="Enter Working Address (Optional)"
                                placeholderTextColor={Colors.TEXT_HINT}
                            />
                        ) : (
                            <Text style={[styles.infoValue, { lineHeight: 18 }]}>{user?.address || 'Not Provided'}</Text>
                        )}
                    </View>
                    <View style={styles.divider} />

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Permanent Address</Text>
                        {isEditing ? (
                            <TextInput
                                style={[styles.input, { minHeight: 60, textAlignVertical: 'top' }]}
                                value={permanentAddressInput}
                                onChangeText={setPermanentAddressInput}
                                multiline
                                placeholder="Enter Permanent Address (Mandatory)"
                                placeholderTextColor={Colors.TEXT_HINT}
                            />
                        ) : (
                            <Text style={[styles.infoValue, { lineHeight: 18 }]}>{user?.permanentAddress ?? '—'}</Text>
                        )}
                    </View>

                    {isEditing && (
                        <>
                            <View style={styles.divider} />
                            <View style={styles.cardActionsRow}>
                                <TouchableOpacity 
                                    style={[styles.cardCancelBtn, isSaving && { opacity: 0.7 }]} 
                                    onPress={() => setIsEditing(false)}
                                    disabled={isSaving}
                                    activeOpacity={0.8}
                                >
                                    <Text style={styles.cardCancelBtnText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={[styles.cardSaveBtn, isSaving && { opacity: 0.7 }]} 
                                    onPress={handleSave}
                                    disabled={isSaving}
                                    activeOpacity={0.8}
                                >
                                    {isSaving ? (
                                        <ActivityIndicator size="small" color={Colors.WHITE} />
                                    ) : (
                                        <>
                                            <Icon name="check" size={12} color={Colors.WHITE} style={{ marginRight: 6 }} />
                                            <Text style={styles.cardSaveBtnText}>Save</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </>
                    )}
                </View>

                {/* Quick Info Aadhar */}
                <View style={styles.detailsCard}>
                    <Text style={styles.cardHeader}>ID & Document Summary</Text>
                    
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Aadhar Card</Text>
                        <Text style={[styles.infoValue, { fontFamily: 'monospace', fontWeight: 'bold' }]}>
                            {user?.aadharNumber ? `XXXX XXXX ${user.aadharNumber.slice(-4)}` : '—'}
                        </Text>
                    </View>
                </View>



                {/* Sign Out Button */}
                <TouchableOpacity
                    style={styles.logoutBtn}
                    onPress={handleLogout}
                    activeOpacity={0.8}
                >
                    <Icon name="sign-out-alt" size={16} color={Colors.ERROR} style={{ marginRight: 10 }} />
                    <Text style={styles.logoutText}>Log Out Account</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: Colors.BACKGROUND },
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
    headerTitle: { fontSize: 17, fontWeight: '700', color: Colors.TEXT_PRIMARY },
    scroll: {
        padding: 20,
        paddingBottom: 40,
    },
    profileCard: {
        backgroundColor: Colors.WHITE,
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.BORDER,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    avatarContainer: {
        width: 90,
        height: 90,
        borderRadius: 45,
        position: 'relative',
        marginBottom: 16,
    },
    avatarImg: {
        width: '100%',
        height: '100%',
        borderRadius: 45,
    },
    avatarPlaceholder: {
        width: '100%',
        height: '100%',
        borderRadius: 45,
        backgroundColor: Colors.PRIMARY,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: Colors.WHITE,
        fontSize: 28,
        fontWeight: '800',
    },
    verifiedBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: Colors.SUCCESS,
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: Colors.WHITE,
    },
    name: {
        fontSize: 20,
        fontWeight: '800',
        color: Colors.TEXT_PRIMARY,
        marginBottom: 4,
    },
    occupation: {
        fontSize: 13,
        color: Colors.TEXT_SECONDARY,
        marginBottom: 14,
        fontWeight: '600',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
    },
    statusBadgeApproved: {
        backgroundColor: 'rgba(39, 174, 96, 0.08)',
        borderColor: 'rgba(39, 174, 96, 0.25)',
    },
    statusBadgePending: {
        backgroundColor: 'rgba(245, 158, 11, 0.08)',
        borderColor: 'rgba(245, 158, 11, 0.25)',
    },
    statusText: {
        fontSize: 12,
        fontWeight: '700',
    },
    statusTextApproved: {
        color: Colors.SUCCESS,
    },
    statusTextPending: {
        color: '#f59e0b',
    },
    detailsCard: {
        backgroundColor: Colors.WHITE,
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: Colors.BORDER,
        marginBottom: 20,
    },
    cardHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    cardHeader: {
        fontSize: 12,
        fontWeight: '800',
        color: Colors.PRIMARY,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    cardEditBtn: {
        padding: 4,
    },
    infoRow: {
        marginVertical: 4,
    },
    infoLabel: {
        fontSize: 11,
        color: Colors.TEXT_SECONDARY,
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    infoValue: {
        fontSize: 14,
        color: Colors.TEXT_PRIMARY,
        fontWeight: '600',
    },
    divider: {
        height: 1,
        backgroundColor: Colors.DIVIDER,
        marginVertical: 12,
    },
    logoutBtn: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(217, 79, 79, 0.08)',
        borderWidth: 1,
        borderColor: 'rgba(217, 79, 79, 0.2)',
        borderRadius: 16,
        paddingVertical: 16,
        marginTop: 10,
    },
    logoutText: {
        color: Colors.ERROR,
        fontSize: 15,
        fontWeight: '800',
    },
    input: {
        borderWidth: 1,
        borderColor: Colors.BORDER,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
        color: Colors.TEXT_PRIMARY,
        fontSize: 14,
        fontWeight: '600',
        backgroundColor: '#fafafa',
        marginTop: 6,
    },
    editBtn: {
        padding: 4,
    },
    cardActionsRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 8,
        marginTop: 4,
    },
    cardCancelBtn: {
        paddingHorizontal: 16,
        height: 36,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.BORDER,
        backgroundColor: Colors.WHITE,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardCancelBtnText: {
        color: Colors.TEXT_SECONDARY,
        fontSize: 13,
        fontWeight: '700',
    },
    cardSaveBtn: {
        paddingHorizontal: 20,
        height: 36,
        borderRadius: 8,
        backgroundColor: Colors.PRIMARY,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
    },
    cardSaveBtnText: {
        color: Colors.WHITE,
        fontSize: 13,
        fontWeight: '700',
    },
});

export default ProfileScreen;
