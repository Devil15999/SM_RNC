import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    ScrollView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { Routes } from '../../constants/routes';
import { Colors } from '../../constants/theme';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { API_BASE_URL } from '../../config';
import {
    useAppDispatch,
    useAppSelector,
    verifyOtpStart,
    verifyOtpSuccess,
    verifyOtpFailure,
    sendOtpStart,
    sendOtpSuccess,
    clearError,
} from '../../store';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Props = NativeStackScreenProps<RootStackParamList, 'OTP'>;

const OTP_LENGTH = 6;

const OTPScreen: React.FC<Props> = ({ navigation, route }) => {
    // Params: mobile always present; name & email only from Register flow
    const { mobile, name } = route.params;
    const isRegisterFlow = Boolean(name);

    const dispatch = useAppDispatch();
    const { isLoading, error } = useAppSelector(state => state.auth);

    const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
    const [resendTimer, setResendTimer] = useState(30);
    const inputRefs = useRef<Array<TextInput | null>>([]);

    // ── Countdown ──────────────────────────────────────────────────────────────
    useEffect(() => {
        if (resendTimer <= 0) { return; }
        const id = setInterval(() => setResendTimer(t => t - 1), 1000);
        return () => clearInterval(id);
    }, [resendTimer]);

    // ── OTP input ──────────────────────────────────────────────────────────────
    const handleChange = (text: string, index: number) => {
        const digit = text.replace(/[^0-9]/g, '').slice(-1);
        const updated = [...otp];
        updated[index] = digit;
        setOtp(updated);
        dispatch(clearError());
        if (digit && index < OTP_LENGTH - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyPress = (key: string, index: number) => {
        if (key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    // ── Verify ─────────────────────────────────────────────────────────────────
    const filledOtp = otp.join('');
    const isComplete = filledOtp.length === OTP_LENGTH;

    const handleVerify = async () => {
        if (!isComplete) { return; }
        dispatch(verifyOtpStart());

        try {
            const res = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mobile,
                    otp: filledOtp,
                }),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                const userObj = data.user;
                const token = data.token;

                if (!userObj.name || userObj.name.trim() === '') {
                    dispatch(verifyOtpFailure('')); // stop loading spinner
                    navigation.navigate(Routes.COMPLETE_PROFILE, {
                        mobile: userObj.mobile,
                        token: token,
                    });
                } else {
                    const session = {
                        id: userObj.id,
                        name: userObj.name,
                        email: userObj.email,
                        mobile: userObj.mobile,
                        token: token,
                    };
                    try {
                        await AsyncStorage.setItem('@session', JSON.stringify(session));
                    } catch (e) {
                        console.log('Error saving session:', e);
                    }
                    dispatch(verifyOtpSuccess(session));
                }
            } else {
                dispatch(verifyOtpFailure(data.message || 'Invalid OTP. Please try again.'));
                setOtp(Array(OTP_LENGTH).fill(''));
                inputRefs.current[0]?.focus();
            }
        } catch {
            dispatch(verifyOtpFailure('Network error. Failed to verify OTP.'));
        }
    };

    // ── Resend ─────────────────────────────────────────────────────────────────
    const handleResend = async () => {
        if (resendTimer > 0) { return; }
        dispatch(clearError());
        dispatch(sendOtpStart());
        setOtp(Array(OTP_LENGTH).fill(''));

        try {
            const res = await fetch(`${API_BASE_URL}/auth/resend-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mobile }),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                dispatch(sendOtpSuccess());
                setResendTimer(30);
            } else {
                dispatch(verifyOtpFailure(data.message || 'Failed to resend OTP.'));
            }
        } catch {
            dispatch(verifyOtpFailure('Network error. Failed to resend OTP.'));
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.BACKGROUND} />

            <ScrollView
                contentContainerStyle={styles.container}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}>
                {/* Back */}
                <TouchableOpacity
                    style={styles.backBtn}
                    onPress={() => navigation.goBack()}>
                    <Text style={styles.backText}>← Back</Text>
                </TouchableOpacity>

                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.iconBadge}>
                        <Icon name="lock" size={28} color={Colors.PRIMARY} />
                    </View>
                    <Text style={styles.title}>OTP Verification</Text>

                    {/* Show user info if from register */}
                    {isRegisterFlow && (
                        <View style={styles.userChip}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Icon name="user" size={12} color={Colors.TEXT_PRIMARY} style={{ marginRight: 6 }} />
                                <Text style={styles.userChipText}>{name}</Text>
                            </View>
                        </View>
                    )}

                    <Text style={styles.subtitle}>
                        A 6-digit code was sent to{'\n'}
                        <Text style={styles.mobileText}>+91 {mobile}</Text>
                    </Text>
                </View>

                {/* Step indicator — only for register flow */}
                {isRegisterFlow && (
                    <View style={styles.stepRow}>
                        <View style={styles.stepDone}>
                            <Text style={styles.stepDoneText}>✓</Text>
                        </View>
                        <View style={styles.stepLineActive} />
                        <View style={styles.stepActive}>
                            <Text style={styles.stepActiveText}>2</Text>
                        </View>
                        {/* <View style={styles.stepLabel}>
                            <Text style={styles.stepDesc}>Details → OTP Verify</Text>
                        </View> */}
                    </View>
                )}

                {/* OTP Boxes */}
                <View style={styles.otpRow}>
                    {otp.map((digit, index) => (
                        <TextInput
                            key={index}
                            ref={ref => { inputRefs.current[index] = ref; }}
                            style={[
                                styles.otpBox,
                                digit ? styles.otpBoxFilled : null,
                                error ? styles.otpBoxError : null,
                            ]}
                            keyboardType="numeric"
                            maxLength={1}
                            value={digit}
                            onChangeText={text => handleChange(text, index)}
                            onKeyPress={({ nativeEvent }) =>
                                handleKeyPress(nativeEvent.key, index)
                            }
                            selectTextOnFocus
                            caretHidden
                        />
                    ))}
                </View>

                {error ? <Text style={styles.error}>{error}</Text> : null}

                {/* Verify Button */}
                <TouchableOpacity
                    style={[styles.button, (!isComplete || isLoading) && styles.buttonOff]}
                    onPress={handleVerify}
                    disabled={!isComplete || isLoading}
                    activeOpacity={0.85}>
                    {isLoading ? (
                        <ActivityIndicator color={Colors.WHITE} />
                    ) : (
                        <Text style={styles.buttonText}>
                            {isRegisterFlow ? 'Verify & Create Account →' : 'Verify & Continue →'}
                        </Text>
                    )}
                </TouchableOpacity>

                {/* Resend */}
                <View style={styles.resendRow}>
                    <Text style={styles.resendLabel}>Didn't receive the code? </Text>
                    <TouchableOpacity onPress={handleResend} disabled={resendTimer > 0}>
                        <Text style={[styles.resend, resendTimer > 0 && styles.resendDisabled]}>
                            {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
                        </Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.hint}>Use OTP: 123456 for testing</Text>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    flex: { flex: 1, backgroundColor: Colors.BACKGROUND },
    container: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: 56,
    },
    backBtn: { marginBottom: 28 },
    backText: {
        color: Colors.TEXT_SECONDARY,
        fontSize: 15,
        fontWeight: '500',
    },
    header: { marginBottom: 28, alignItems: 'center' },
    iconBadge: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: Colors.PRIMARY_LIGHT,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 14,
        borderWidth: 2,
        borderColor: Colors.PRIMARY_MID,
    },
    iconText: { fontSize: 32 },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: Colors.TEXT_PRIMARY,
        marginBottom: 8,
    },
    userChip: {
        backgroundColor: Colors.SURFACE_DEEP,
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 5,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: Colors.BORDER,
    },
    userChipText: {
        color: Colors.PRIMARY_DARK,
        fontSize: 12,
        fontWeight: '600',
    },
    subtitle: {
        color: Colors.TEXT_SECONDARY,
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 22,
    },
    mobileText: {
        color: Colors.PRIMARY_DARK,
        fontWeight: '700',
    },

    // Step indicator
    stepRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
        backgroundColor: Colors.SURFACE,
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: Colors.BORDER,
    },
    stepDone: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: Colors.SUCCESS,
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepDoneText: { color: Colors.WHITE, fontSize: 12, fontWeight: '700' },
    stepLineActive: {
        width: '80%',
        height: 2,
        backgroundColor: Colors.PRIMARY_MID,
        marginHorizontal: 6,
    },
    stepActive: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: Colors.PRIMARY,
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepActiveText: { color: Colors.WHITE, fontSize: 12, fontWeight: '700' },
    stepLabel: { flex: 1, marginLeft: 10 },
    stepDesc: {
        color: Colors.TEXT_SECONDARY,
        fontSize: 12,
        fontWeight: '500',
    },

    // OTP
    otpRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 18,
    },
    otpBox: {
        width: 50,
        height: 58,
        backgroundColor: Colors.SURFACE,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: Colors.BORDER,
        textAlign: 'center',
        fontSize: 22,
        fontWeight: '800',
        color: Colors.TEXT_PRIMARY,
    },
    otpBoxFilled: {
        borderColor: Colors.PRIMARY,
        backgroundColor: Colors.PRIMARY_LIGHT,
        color: Colors.PRIMARY_DARK,
    },
    otpBoxError: {
        borderColor: Colors.ERROR,
        backgroundColor: '#FFF5F5',
    },
    error: {
        color: Colors.ERROR,
        fontSize: 12,
        textAlign: 'center',
        marginBottom: 14,
    },
    button: {
        height: 54,
        backgroundColor: Colors.PRIMARY,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 4,
        shadowColor: Colors.PRIMARY,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 14,
        elevation: 8,
    },
    buttonOff: { backgroundColor: Colors.DISABLED, shadowOpacity: 0 },
    buttonText: {
        color: Colors.TEXT_ON_PRIMARY,
        fontSize: 15,
        fontWeight: '700',
    },
    resendRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 24,
    },
    resendLabel: { color: Colors.TEXT_HINT, fontSize: 13 },
    resend: { color: Colors.PRIMARY, fontSize: 13, fontWeight: '700' },
    resendDisabled: { color: Colors.TEXT_HINT },
    hint: {
        textAlign: 'center',
        color: Colors.PRIMARY_MID,
        fontSize: 11,
        marginTop: 32,
    },
});

export default OTPScreen;
