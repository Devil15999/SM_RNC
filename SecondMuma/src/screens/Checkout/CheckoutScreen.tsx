import React, { useState } from 'react';
import {
    SafeAreaView,
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
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { Colors } from '../../constants/theme';
import { Routes } from '../../constants/routes';

type Props = NativeStackScreenProps<RootStackParamList, 'Checkout'>;

const CheckoutScreen: React.FC<Props> = ({ navigation, route }) => {
    const { packageTitle, planLabel, price, emoji, accentColor } = route.params;

    // Address form state
    const [fullName, setFullName] = useState('');
    const [mobile, setMobile] = useState('');
    const [flatNo, setFlatNo] = useState('');
    const [street, setStreet] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [pincode, setPincode] = useState('');

    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!fullName.trim()) newErrors.fullName = 'Required';
        if (!mobile.trim() || mobile.length !== 10) newErrors.mobile = 'Enter 10 digit mobile';
        if (!flatNo.trim()) newErrors.flatNo = 'Required';
        if (!street.trim()) newErrors.street = 'Required';
        if (!city.trim()) newErrors.city = 'Required';
        if (!state.trim()) newErrors.state = 'Required';
        if (!pincode.trim() || pincode.length !== 6) newErrors.pincode = 'Valid 6 digit pincode';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleProceedToPay = () => {
        if (!validate()) return;
        navigation.navigate(Routes.PAYMENT, {
            packageTitle,
            planLabel,
            price,
            emoji,
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
                        <Text style={styles.backText}>← Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Checkout</Text>
                    <View style={styles.backBtnPlaceholder} />
                </View>

                <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

                    {/* Order Summary */}
                    <Text style={styles.sectionTitle}>Order Summary</Text>
                    <View style={styles.summaryCard}>
                        <View style={styles.summaryRow}>
                            <View style={styles.summaryLeft}>
                                <Text style={styles.summaryEmoji}>{emoji}</Text>
                                <View>
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

                    {/* Address Details */}
                    <Text style={styles.sectionTitle}>Delivery / Billing Address</Text>
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

                        {renderInput('Pincode', pincode, (t) => setPincode(t.replace(/[^0-9]/g, '')), 'pincode', { keyboardType: 'number-pad', maxLength: 6 })}
                    </View>

                    {/* Proceed Button */}
                    <TouchableOpacity
                        style={[styles.btn, { backgroundColor: accentColor }]}
                        activeOpacity={0.85}
                        onPress={handleProceedToPay}>
                        <Text style={styles.btnText}>Proceed to Payment →</Text>
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
});

export default CheckoutScreen;
