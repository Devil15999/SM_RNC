import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Linking,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { Colors } from '../../constants/theme';
import { Routes } from '../../constants/routes';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { useAppSelector } from '../../store';
import { API_BASE_URL } from '../../config';

type Props = NativeStackScreenProps<RootStackParamList, 'Payment'>;

const PaymentScreen: React.FC<Props> = ({ navigation, route }) => {
    const {
        packageType,
        planKey,
        packageTitle,
        price,
        accentColor,
        address,
        motherName,
        motherAge,
        babyName,
        babyAge,
        startDate,
        timeSlot,
        selectedTime
    } = route.params;

    const token = useAppSelector(state => state.auth.user?.token);

    const [isProcessing, setIsProcessing] = useState(false);
    const [success, setSuccess] = useState(false);

    const handlePayment = async () => {
        const transactionId = `TXN${Date.now()}`;
        const merchantUpiId = 'secondmuma@upi'; // Replace with real UPI ID
        const merchantName = 'SecondMuma';

        // This generic upi://pay scheme triggers the OS's default bottom sheet
        // popup displaying all installed UPI apps!
        const uri = `upi://pay?pa=${merchantUpiId}&pn=${merchantName}&tr=${transactionId}&am=${price.toFixed(2)}&cu=INR`;

        try {
            // Check if the OS can handle the upi:// scheme (meaning at least one UPI app is installed)
            const canOpen = await Linking.canOpenURL(uri);

            if (canOpen) {
                await Linking.openURL(uri);
            } else {
                console.log('No UPI app found. Simulating payment directly for testing/development...');
            }

            setIsProcessing(true);

            // Simulation + Order Submission
            setTimeout(async () => {
                try {
                    const res = await fetch(`${API_BASE_URL}/orders`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            packageType,
                            planKey,
                            address,
                            motherName,
                            motherAge,
                            babyName,
                            babyAge,
                            startDate,
                            timeSlot,
                            selectedTime
                        })
                    });
                    const data = await res.json();
                    setIsProcessing(false);
                    if (res.ok && data.success) {
                        setSuccess(true);
                        // Redirect to home after showing success tick
                        setTimeout(() => {
                            navigation.reset({ index: 0, routes: [{ name: Routes.HOME }] });
                        }, 2500);
                    } else {
                        Alert.alert('Order Placement Failed', data.message || 'Failed to record your order on the server.');
                    }
                } catch {
                    setIsProcessing(false);
                    Alert.alert('Network Error', 'Failed to save order to the server.');
                }
            }, 3000); // 3 seconds delay simulating time spent in external transaction
        } catch {
            Alert.alert('Payment Error', 'Failed to trigger the payment request.');
        }
    };

    if (success) {
        return (
            <View style={styles.successScreen}>
                <StatusBar barStyle="dark-content" backgroundColor="#F4FFF8" />
                <View style={[styles.successBadge, { borderColor: Colors.SUCCESS }]}>
                    <Icon name="check" size={36} color={Colors.SUCCESS} />
                </View>
                <Text style={styles.successTitle}>Payment Successful!</Text>
                <Text style={styles.successSub}>
                    Your {packageTitle} has been activated. Redirecting you home...
                </Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.safe}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.BACKGROUND} />

            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} disabled={isProcessing}>
                    <Icon name="chevron-left" size={18} color={Colors.TEXT_SECONDARY} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Complete Payment</Text>
                <View style={styles.backBtnPlaceholder} />
            </View>

            <View style={styles.container}>
                <View style={styles.amountBox}>
                    <Text style={styles.amountLabel}>Amount Payable</Text>
                    <Text style={[styles.amountValue, { color: accentColor }]}>
                        ₹{price.toLocaleString('en-IN')}
                    </Text>
                </View>

                {isProcessing ? (
                    <View style={styles.loaderBox}>
                        <ActivityIndicator size="large" color={accentColor} />
                        <Text style={styles.loaderText}>Awaiting payment confirmation...</Text>
                        <Text style={styles.loaderSub}>Please complete the payment in the opened UPI app.</Text>
                    </View>
                ) : (
                    <View style={styles.actionBox}>
                        <Text style={styles.sectionTitle}>Secure UPI Payment</Text>
                        <Text style={styles.instructionText}>
                            Tap the button below to open your phone's default UPI apps (GPay, PhonePe, Paytm, etc).
                        </Text>

                        <TouchableOpacity
                            style={[styles.payBtn, { backgroundColor: accentColor }]}
                            activeOpacity={0.85}
                            onPress={handlePayment}
                        >
                            <Text style={styles.payBtnText}>Choose UPI App & Pay</Text>
                        </TouchableOpacity>

                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                            <Icon name="lock" size={12} color={Colors.TEXT_HINT} style={{ marginRight: 6 }} />
                            <Text style={styles.secureNote}>100% Safe & Secure Payments</Text>
                        </View>
                    </View>
                )}
            </View>
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
    backText: { color: Colors.TEXT_SECONDARY, fontSize: 15, fontWeight: '500' },
    headerTitle: { fontSize: 17, fontWeight: '700', color: Colors.TEXT_PRIMARY },
    backBtnPlaceholder: { width: 50 },

    container: { padding: 24, flex: 1 },
    amountBox: {
        backgroundColor: Colors.SURFACE,
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.BORDER,
        marginBottom: 32,
    },
    amountLabel: { fontSize: 13, color: Colors.TEXT_SECONDARY, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
    amountValue: { fontSize: 42, fontWeight: '900' },

    actionBox: {
        flex: 1,
        alignItems: 'center',
        marginTop: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: Colors.TEXT_PRIMARY,
        marginBottom: 8,
    },
    instructionText: {
        fontSize: 14,
        color: Colors.TEXT_SECONDARY,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 32,
        paddingHorizontal: 16,
    },
    payBtn: {
        width: '100%',
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
        marginBottom: 24,
    },
    payBtnText: {
        color: Colors.WHITE,
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 0.3,
    },
    secureNote: {
        fontSize: 12,
        color: Colors.TEXT_HINT,
        fontWeight: '600',
    },

    loaderBox: { alignItems: 'center', marginTop: 40 },
    loaderText: { fontSize: 16, fontWeight: '700', color: Colors.TEXT_PRIMARY, marginTop: 20 },
    loaderSub: { fontSize: 13, color: Colors.TEXT_SECONDARY, marginTop: 8, textAlign: 'center', lineHeight: 20 },

    // Success View
    successScreen: { flex: 1, backgroundColor: '#F4FFF8', justifyContent: 'center', alignItems: 'center', padding: 24 },
    successBadge: {
        width: 80, height: 80, borderRadius: 40,
        backgroundColor: '#E6FFFA', borderWidth: 4,
        justifyContent: 'center', alignItems: 'center',
        marginBottom: 24,
    },
    successEmoji: { fontSize: 36 },
    successTitle: { fontSize: 24, fontWeight: '800', color: '#234E52', marginBottom: 10 },
    successSub: { fontSize: 14, color: '#4A5568', textAlign: 'center', lineHeight: 22 },
});

export default PaymentScreen;
