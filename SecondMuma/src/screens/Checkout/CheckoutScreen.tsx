import React, { useState, useEffect } from 'react';
import {
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/FontAwesome5';
import CustomDatePicker from '../../components/CustomDatePicker';
import { RootStackParamList } from '../../types/navigation';
import { Colors } from '../../constants/theme';
import { Routes } from '../../constants/routes';
import { useAppSelector } from '../../store';
import { API_BASE_URL } from '../../config';

type Props = NativeStackScreenProps<RootStackParamList, 'Checkout'>;

const CheckoutScreen: React.FC<Props> = ({ navigation, route }) => {
    const insets = useSafeAreaInsets();
    const { packageType, planKey, packageTitle, planLabel, price, icon, accentColor } = route.params;

    const token = useAppSelector(state => state.auth.user?.token);
    const user = useAppSelector(state => state.auth.user);

    // Address form state
    const [fullName, setFullName] = useState(user?.name || '');
    const [mobile, setMobile] = useState(user?.mobile || '');
    const [flatNo, setFlatNo] = useState('');
    const [street, setStreet] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [pincode, setPincode] = useState('');
    const [pincodeStatus, setPincodeStatus] = useState<'idle' | 'checking' | 'verified' | 'unserviceable'>('idle');
    const [pincodeMessage, setPincodeMessage] = useState('');
    const [pincodeError, setPincodeError] = useState('');
    const [pincodeLoading, setPincodeLoading] = useState(false);

    // Booking details states
    const [motherName, setMotherName] = useState(packageType !== 'baby' ? (user?.name || '') : '');
    const [motherAge, setMotherAge] = useState('');
    const [babyName, setBabyName] = useState('');
    const [babyAge, setBabyAge] = useState(''); // '0-3', '3-6', '6-9', 'more than 9 months'
    const [startDate, setStartDate] = useState<any>(null);
    const [timeSlot, setTimeSlot] = useState<'morning' | 'afternoon' | 'evening' | ''>('');
    const [selectedTime, setSelectedTime] = useState('');
    const [showDatePicker, setShowDatePicker] = useState(false);

    const [dbTimeslots, setDbTimeslots] = useState<Record<string, string[]>>({ morning: [], afternoon: [], evening: [] });
    const [showTimeDropdown, setShowTimeDropdown] = useState(false);
    const [debugMsg, setDebugMsg] = useState<string>('');

    const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Fetch timeslots from backend
    useEffect(() => {
        if (!token) return;
        let isMounted = true;
        const fetchTimeslots = async () => {
            try {
                setDebugMsg('Fetching timeslots...');
                const res = await fetch(`${API_BASE_URL}/timeslots`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const status = res.status;
                const data = await res.json();
                
                if (res.ok && data.success) {
                    const rawData = data.data;
                    const normalized: Record<string, string[]> = { morning: [], afternoon: [], evening: [] };
                    
                    if (Array.isArray(rawData)) {
                        rawData.forEach((item: any) => {
                            if (item && item.slot && Array.isArray(item.times)) {
                                normalized[item.slot] = item.times;
                            }
                        });
                    } else if (rawData && typeof rawData === 'object') {
                        if (Array.isArray(rawData.morning)) normalized.morning = rawData.morning;
                        if (Array.isArray(rawData.afternoon)) normalized.afternoon = rawData.afternoon;
                        if (Array.isArray(rawData.evening)) normalized.evening = rawData.evening;
                    }
                    
                    if (isMounted) {
                        setDbTimeslots(normalized);
                        setDebugMsg(`Success: Morning(${normalized.morning.length}), Afternoon(${normalized.afternoon.length}), Evening(${normalized.evening.length})`);
                    }
                } else {
                    if (isMounted) {
                        setDebugMsg(`Failed status: ${status}, msg: ${data.message || 'unknown'}`);
                    }
                }
            } catch (err: any) {
                console.log('Error fetching timeslots:', err);
                if (isMounted) {
                    setDebugMsg(`Catch Error: ${err?.message || String(err)}`);
                }
            }
        };
        fetchTimeslots();
        return () => { isMounted = false; };
    }, [token]);

    useEffect(() => {
        if (!token) return;
        let isMounted = true;
        const fetchAddresses = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/addresses`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (res.ok && data.success && isMounted) {
                    setSavedAddresses(data.data);
                }
            } catch (err) {
                console.log('Error fetching addresses:', err);
            }
        };
        fetchAddresses();
        return () => { isMounted = false; };
    }, [token]);

    const handleVerifyPincode = async () => {
        if (!pincode.trim() || pincode.length !== 6) {
            setErrors(prev => ({ ...prev, pincode: 'Enter valid 6-digit pincode' }));
            return;
        }
        setPincodeLoading(true);
        setPincodeError('');
        setPincodeMessage('');
        try {
            const res = await fetch(`${API_BASE_URL}/packages/check-pincode`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({
                    pincode: pincode.trim(),
                    mobile: mobile.trim(),
                    userId: user?.id
                })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                if (data.serviceable) {
                    setPincodeStatus('verified');
                    setErrors(prev => {
                        const updated = { ...prev };
                        delete updated.pincode;
                        return updated;
                    });
                } else {
                    setPincodeStatus('unserviceable');
                    setPincodeMessage(data.message || 'Service is not available in your area.');
                }
            } else {
                setPincodeError(data.message || 'Verification failed. Please try again.');
            }
        } catch (err: any) {
            setPincodeError('Network error. Please try again.');
        } finally {
            setPincodeLoading(false);
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!fullName.trim()) newErrors.fullName = 'Required';
        if (!mobile.trim() || mobile.length !== 10) newErrors.mobile = 'Enter 10 digit mobile';
        if (!flatNo.trim()) newErrors.flatNo = 'Required';
        if (!street.trim()) newErrors.street = 'Required';
        if (!city.trim()) newErrors.city = 'Required';
        if (!state.trim()) newErrors.state = 'Required';
        if (!pincode.trim() || pincode.length !== 6) {
            newErrors.pincode = 'Valid 6 digit pincode';
        } else if (pincodeStatus !== 'verified') {
            newErrors.pincode = 'Please verify pincode before checkout';
        }

        // Booking details validations
        if (packageType !== 'baby') {
            if (!motherName.trim()) newErrors.motherName = 'Required';
            const ageNum = parseInt(motherAge, 10);
            if (!motherAge.trim()) {
                newErrors.motherAge = 'Required';
            } else if (isNaN(ageNum) || ageNum < 15 || ageNum > 90) {
                newErrors.motherAge = 'Enter valid age (15-90)';
            }
        }
        if (packageType !== 'mother') {
            if (!babyName.trim()) newErrors.babyName = 'Required';
            if (!babyAge) newErrors.babyAge = 'Select baby age';
        }
        if (!startDate) newErrors.startDate = 'Select start date';
        if (!timeSlot) newErrors.timeSlot = 'Select time slot';
        if (!selectedTime) newErrors.selectedTime = 'Select preferred time';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleProceedToPay = () => {
        if (!validate()) return;
        navigation.navigate(Routes.PAYMENT, {
            packageType,
            planKey,
            packageTitle,
            planLabel,
            price,
            icon,
            accentColor,
            address: {
                fullName,
                mobile,
                flatNo,
                street,
                city,
                state,
                pincode,
            },
            motherName: packageType !== 'baby' ? motherName : '',
            motherAge: packageType !== 'baby' ? motherAge : '',
            babyName: packageType !== 'mother' ? babyName : '',
            babyAge: packageType !== 'mother' ? babyAge : '',
            startDate: startDate ? startDate.toISOString() : '',
            timeSlot,
            selectedTime,
        });
    };

    const renderInput = (
        label: string,
        value: string,
        onChange: (t: string) => void,
        fieldKey: string,
        props?: any
    ) => (
        <View style={styles.inputGroup}>
            <Text style={styles.label}>{label}</Text>
            <TextInput
                style={[
                    styles.input,
                    errors[fieldKey] ? styles.inputErrorBorder : null
                ]}
                value={value}
                onChangeText={t => {
                    onChange(t);
                    setErrors({ ...errors, [fieldKey]: '' });
                }}
                {...props}
            />
            {!!errors[fieldKey] && <Text style={styles.errorText}>{errors[fieldKey]}</Text>}
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
                    <Text style={styles.headerTitle}>Checkout</Text>
                    <View style={styles.backBtnPlaceholder} />
                </View>

                <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: Math.max(insets.bottom, 16) + 40 }]} showsVerticalScrollIndicator={false}>

                    {/* Order Summary */}
                    <Text style={styles.sectionTitle}>Order Summary</Text>
                    <View style={styles.summaryCard}>
                        <View style={styles.summaryRow}>
                            <View style={styles.summaryLeft}>
                                <Icon name={icon} size={28} color={accentColor} style={{ marginRight: 12 }} />
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.summaryTitle}>{packageTitle}</Text>
                                    <Text style={styles.summaryPlan}>{planLabel} Plan</Text>
                                </View>
                            </View>
                            <Text style={[styles.summaryPrice, { color: accentColor }]}>
                                ₹{price.toLocaleString('en-IN')}
                            </Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Amount to Pay</Text>
                            <Text style={styles.totalAmount}>₹{price.toLocaleString('en-IN')}</Text>
                        </View>
                    </View>

                    {/* Care & Booking Details */}
                    <Text style={styles.sectionTitle}>Care & Booking Details</Text>
                    <View style={styles.formCard}>
                        {/* Mother Details */}
                        {packageType !== 'baby' && (
                            <View>
                                <Text style={styles.formSubSectionTitle}>Mother's Profile</Text>
                                {renderInput("Mother's Name", motherName, setMotherName, 'motherName', { placeholder: "Enter mother's name" })}
                                {renderInput("Mother's Age", motherAge, (t) => setMotherAge(t.replace(/[^0-9]/g, '')), 'motherAge', { keyboardType: 'number-pad', maxLength: 2, placeholder: "e.g. 28" })}
                                <View style={styles.formDivider} />
                            </View>
                        )}

                        {/* Baby Details */}
                        {packageType !== 'mother' && (
                            <View>
                                <Text style={styles.formSubSectionTitle}>Baby's Profile</Text>
                                {renderInput("Baby's Name", babyName, setBabyName, 'babyName', { placeholder: "Enter baby's name (or Baby of Mother's Name)" })}
                                
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Baby's Age Range</Text>
                                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                                        {['0-3', '3-6', '6-9', 'more than 9 months'].map(ageRange => {
                                            const isSelected = babyAge === ageRange;
                                            return (
                                                <TouchableOpacity
                                                    key={ageRange}
                                                    style={[
                                                        styles.chip,
                                                        isSelected && { backgroundColor: accentColor, borderColor: accentColor }
                                                    ]}
                                                    onPress={() => {
                                                        setBabyAge(ageRange);
                                                        setErrors({ ...errors, babyAge: '' });
                                                    }}
                                                >
                                                    <Text style={[styles.chipText, isSelected && { color: Colors.WHITE, fontWeight: '700' }]}>
                                                        {ageRange} {ageRange !== 'more than 9 months' ? 'months' : ''}
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                    {!!errors.babyAge && <Text style={styles.errorText}>{errors.babyAge}</Text>}
                                </View>
                                <View style={styles.formDivider} />
                            </View>
                        )}

                        {/* Appointment Schedule */}
                        <Text style={styles.formSubSectionTitle}>Appointment Schedule</Text>
                        
                        {/* Appointment Start Date */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Preferred Start Date</Text>
                            <TouchableOpacity 
                                style={[
                                    styles.dropdownButton,
                                    errors.startDate ? { borderColor: Colors.ERROR } : null
                                ]}
                                onPress={() => setShowDatePicker(true)}
                                activeOpacity={0.8}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Icon name="calendar-alt" size={14} color={startDate ? accentColor : Colors.TEXT_SECONDARY} style={{ marginRight: 10 }} />
                                    <Text style={[
                                        styles.dropdownButtonText,
                                        !startDate && { color: Colors.TEXT_SECONDARY, fontWeight: '500' }
                                    ]}>
                                        {startDate ? startDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Select Preferred Start Date'}
                                    </Text>
                                </View>
                                <Icon name="chevron-down" size={12} color={Colors.TEXT_SECONDARY} />
                            </TouchableOpacity>
                            {!!errors.startDate && <Text style={styles.errorText}>{errors.startDate}</Text>}
                        </View>

                        {/* Custom Date Picker Modal */}
                        <CustomDatePicker
                            visible={showDatePicker}
                            value={startDate}
                            onClose={() => setShowDatePicker(false)}
                            onChange={(date) => {
                                setStartDate(date);
                                setErrors({ ...errors, startDate: '' });
                            }}
                            minimumDate={new Date()}
                            accentColor={accentColor}
                        />

                        {/* Time Slot Chips */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Preferred Time Slot</Text>
                            {!!debugMsg && (
                                <Text style={{ fontSize: 10, color: Colors.TEXT_SECONDARY, marginBottom: 6, fontStyle: 'italic' }}>
                                    Status: {debugMsg}
                                </Text>
                            )}
                            <View style={{ flexDirection: 'row', gap: 10 }}>
                                {['morning', 'afternoon', 'evening'].map(slot => {
                                    const isSelected = timeSlot === slot;
                                    return (
                                        <TouchableOpacity
                                            key={slot}
                                            style={[
                                                styles.slotChip,
                                                isSelected && { backgroundColor: accentColor, borderColor: accentColor }
                                            ]}
                                            onPress={() => {
                                                setTimeSlot(slot as any);
                                                setSelectedTime('');
                                                setShowTimeDropdown(false);
                                                setErrors({ ...errors, timeSlot: '', selectedTime: '' });
                                            }}
                                        >
                                            <Icon
                                                name={slot === 'morning' ? 'sun' : slot === 'afternoon' ? 'cloud-sun' : 'moon'}
                                                size={12}
                                                color={isSelected ? Colors.WHITE : Colors.TEXT_SECONDARY}
                                                style={{ marginRight: 6 }}
                                            />
                                            <Text style={[styles.slotChipText, isSelected && { color: Colors.WHITE, fontWeight: '700' }]}>
                                                {slot.charAt(0).toUpperCase() + slot.slice(1)}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                            {!!errors.timeSlot && <Text style={styles.errorText}>{errors.timeSlot}</Text>}
                        </View>

                        {/* Dynamic Time Dropdown */}
                        {timeSlot !== '' && (
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Preferred Time</Text>
                                <TouchableOpacity 
                                    style={[
                                        styles.dropdownButton,
                                        errors.selectedTime ? { borderColor: Colors.ERROR } : null
                                    ]}
                                    onPress={() => setShowTimeDropdown(!showTimeDropdown)}
                                >
                                    <Text style={styles.dropdownButtonText}>
                                        {selectedTime || 'Select Preferred Time'}
                                    </Text>
                                    <Icon name={showTimeDropdown ? "chevron-up" : "chevron-down"} size={12} color={Colors.TEXT_SECONDARY} />
                                </TouchableOpacity>

                                {showTimeDropdown && (
                                    <View style={styles.dropdownList}>
                                        {(dbTimeslots[timeSlot] || []).length > 0 ? (dbTimeslots[timeSlot] || []).map((t) => (
                                            <TouchableOpacity 
                                                key={t} 
                                                style={styles.dropdownItem} 
                                                onPress={() => {
                                                    setSelectedTime(t);
                                                    setShowTimeDropdown(false);
                                                    setErrors({ ...errors, selectedTime: '' });
                                                }}
                                            >
                                                <Text style={styles.dropdownItemText}>{t}</Text>
                                            </TouchableOpacity>
                                        )) : (
                                            <View style={{ padding: 12, alignItems: 'center' }}>
                                                <Text style={{ fontSize: 13, color: Colors.TEXT_HINT, fontStyle: 'italic' }}>
                                                    No times available for this slot
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                )}
                                {!!errors.selectedTime && <Text style={styles.errorText}>{errors.selectedTime}</Text>}
                            </View>
                        )}
                    </View>

                    {/* Address Details */}
                    <Text style={styles.sectionTitle}>Delivery / Billing Address</Text>

                    {/* Saved Addresses Selector */}
                    {savedAddresses.length > 0 && (
                        <View style={{ marginBottom: 16 }}>
                            <Text style={styles.sectionSubTitle}>Select from Saved Addresses</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
                                {savedAddresses.map(addr => (
                                    <TouchableOpacity
                                        key={addr._id}
                                        style={[
                                            styles.addressChip,
                                            flatNo === addr.flatNo && street === addr.street ? styles.addressChipActive : null
                                        ]}
                                        onPress={() => {
                                            setFullName(addr.fullName);
                                            setMobile(addr.mobile);
                                            setFlatNo(addr.flatNo);
                                            setStreet(addr.street);
                                            setCity(addr.city);
                                            setState(addr.state);
                                            setPincode(addr.pincode);
                                            setPincodeStatus('idle');
                                            setPincodeMessage('');
                                            setPincodeError('');
                                        }}
                                        activeOpacity={0.8}
                                    >
                                        <Icon
                                            name="map-marker-alt"
                                            size={11}
                                            color={flatNo === addr.flatNo && street === addr.street ? Colors.WHITE : Colors.PRIMARY}
                                            style={{ marginRight: 6 }}
                                        />
                                        <Text style={[styles.addressChipText, flatNo === addr.flatNo && street === addr.street ? styles.addressChipTextActive : null]}>
                                            {addr.flatNo}, {addr.street}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    )}

                    <View style={styles.formCard}>
                        {renderInput('Full Name', fullName, setFullName, 'fullName')}
                        {renderInput('Mobile Number', mobile, (t) => setMobile(t.replace(/[^0-9]/g, '')), 'mobile', { keyboardType: 'number-pad', maxLength: 10 })}

                        <View style={styles.row}>
                            <View style={styles.flex1}>
                                {renderInput('House/Flat No', flatNo, setFlatNo, 'flatNo')}
                            </View>
                            <View style={styles.space} />
                            <View style={styles.flex1}>
                                {renderInput('Street/Locality', street, setStreet, 'street')}
                            </View>
                        </View>

                        <View style={styles.row}>
                            <View style={styles.flex1}>
                                {renderInput('City', city, setCity, 'city')}
                            </View>
                            <View style={styles.space} />
                            <View style={styles.flex1}>
                                {renderInput('State', state, setState, 'state')}
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Pincode</Text>
                            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                                <TextInput
                                    style={[
                                        styles.input,
                                        { flex: 1 },
                                        errors.pincode ? styles.inputErrorBorder : null,
                                        pincodeStatus === 'verified' ? { borderColor: Colors.SUCCESS } : null
                                    ]}
                                    value={pincode}
                                    onChangeText={t => {
                                        const clean = t.replace(/[^0-9]/g, '');
                                        setPincode(clean);
                                        setPincodeStatus('idle');
                                        setPincodeMessage('');
                                        setPincodeError('');
                                        setErrors(prev => ({ ...prev, pincode: '' }));
                                    }}
                                    keyboardType="number-pad"
                                    maxLength={6}
                                    placeholder="Enter 6-digit pincode"
                                />
                                <TouchableOpacity
                                    style={[
                                        styles.verifyBtn,
                                        { backgroundColor: pincodeStatus === 'verified' ? Colors.SUCCESS : accentColor }
                                    ]}
                                    onPress={handleVerifyPincode}
                                    disabled={pincodeLoading || pincode.length !== 6}
                                >
                                    <Text style={styles.verifyBtnText}>
                                        {pincodeLoading ? 'Checking...' : pincodeStatus === 'verified' ? 'Verified ✓' : 'Send'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                            {!!errors.pincode && <Text style={styles.errorText}>{errors.pincode}</Text>}
                            {pincodeStatus === 'unserviceable' && (
                                <View style={styles.unserviceableAlert}>
                                    <Icon name="exclamation-circle" size={14} color="#78350F" style={{ marginRight: 6, marginTop: 1 }} />
                                    <Text style={styles.unserviceableText}>
                                        {pincodeMessage || 'Request to this service in your area has been sent. Currently enjoy the other available services.'}
                                    </Text>
                                </View>
                            )}
                            {!!pincodeError && <Text style={styles.errorText}>{pincodeError}</Text>}
                        </View>
                    </View>

                    {/* Proceed Button */}
                    <TouchableOpacity
                        style={[styles.btn, { backgroundColor: accentColor }]}
                        activeOpacity={0.85}
                        onPress={handleProceedToPay}>
                        <Text style={styles.btnText}>Proceed to Payment</Text>
                    </TouchableOpacity>
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

    scroll: {
        paddingHorizontal: 20,
        paddingTop: 24,
        paddingBottom: 40,
        flexGrow: 1,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.TEXT_SECONDARY,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 12,
    },
    summaryCard: {
        backgroundColor: Colors.SURFACE,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.BORDER,
        marginBottom: 24,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    summaryLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 16,
    },
    summaryEmoji: { fontSize: 32, marginRight: 12 },
    summaryTitle: { fontSize: 16, fontWeight: '800', color: Colors.TEXT_PRIMARY },
    summaryPlan: { fontSize: 13, color: Colors.TEXT_SECONDARY, marginTop: 2 },
    summaryPrice: { fontSize: 18, fontWeight: '800' },
    divider: { height: 1, backgroundColor: Colors.DIVIDER, marginVertical: 14 },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    totalLabel: { fontSize: 14, color: Colors.TEXT_PRIMARY, fontWeight: '600' },
    totalAmount: { fontSize: 18, fontWeight: '800', color: Colors.TEXT_PRIMARY },

    formCard: {
        backgroundColor: Colors.WHITE,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.BORDER,
        marginBottom: 24,
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
    inputErrorBorder: { borderColor: Colors.ERROR },
    errorText: { color: Colors.ERROR, fontSize: 10, marginTop: 4, marginLeft: 2 },

    btn: {
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    btnText: { color: Colors.WHITE, fontSize: 16, fontWeight: '800' },

    sectionSubTitle: {
        fontSize: 11,
        fontWeight: '700',
        color: Colors.TEXT_SECONDARY,
        marginBottom: 6,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    addressChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.SURFACE,
        borderWidth: 1.5,
        borderColor: Colors.BORDER,
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 7,
    },
    addressChipActive: {
        backgroundColor: Colors.PRIMARY,
        borderColor: Colors.PRIMARY,
    },
    addressChipText: {
        fontSize: 12,
        color: Colors.TEXT_PRIMARY,
        fontWeight: '600',
    },
    addressChipTextActive: {
        color: Colors.WHITE,
        fontWeight: '700',
    },
    formSubSectionTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.PRIMARY,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
        marginTop: 4,
        marginBottom: 12,
    },
    formDivider: {
        height: 1,
        backgroundColor: Colors.DIVIDER,
        marginVertical: 18,
    },
    chip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: Colors.BORDER,
        backgroundColor: Colors.SURFACE,
    },
    chipText: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.TEXT_SECONDARY,
    },

    slotChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: Colors.BORDER,
        backgroundColor: Colors.SURFACE,
        flex: 1,
        justifyContent: 'center',
    },
    slotChipText: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.TEXT_PRIMARY,
    },
    dropdownButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: Colors.SURFACE,
        borderWidth: 1.5,
        borderColor: Colors.BORDER,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
    },
    dropdownButtonText: {
        fontSize: 14,
        color: Colors.TEXT_PRIMARY,
        fontWeight: '600',
    },
    dropdownList: {
        backgroundColor: Colors.WHITE,
        borderWidth: 1.5,
        borderColor: Colors.BORDER,
        borderRadius: 12,
        marginTop: 6,
        overflow: 'hidden',
    },
    dropdownItem: {
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.DIVIDER,
    },
    dropdownItemText: {
        fontSize: 14,
        color: Colors.TEXT_PRIMARY,
        fontWeight: '500',
    },
    verifyBtn: {
        height: 48,
        borderRadius: 12,
        paddingHorizontal: 16,
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: 80,
    },
    verifyBtnText: {
        color: Colors.WHITE,
        fontSize: 13,
        fontWeight: '700',
    },
    unserviceableAlert: {
        flexDirection: 'row',
        backgroundColor: '#FEF3C7',
        borderWidth: 1,
        borderColor: '#FDE68A',
        borderRadius: 10,
        padding: 12,
        marginTop: 8,
        alignItems: 'flex-start',
    },
    unserviceableText: {
        fontSize: 12,
        color: '#78350F',
        flex: 1,
        lineHeight: 16,
    },
});

export default CheckoutScreen;
