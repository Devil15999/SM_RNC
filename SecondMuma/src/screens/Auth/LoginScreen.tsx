import React, { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    ActivityIndicator,
    StatusBar,
    ScrollView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { Routes } from '../../constants/routes';
import { Colors } from '../../constants/theme';
import { API_BASE_URL } from '../../config';
import {
    useAppDispatch,
    useAppSelector,
    sendOtpStart,
    sendOtpSuccess,
    sendOtpFailure,
    clearError,
} from '../../store';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

const LoginScreen: React.FC<Props> = ({ navigation }) => {
    const dispatch = useAppDispatch();
    const { isLoading, error } = useAppSelector(state => state.auth);
    const [mobile, setMobile] = useState('');
    const [focused, setFocused] = useState(false);

    const isValid = mobile.length === 10 && /^[6-9]\d{9}$/.test(mobile);

    const handleSendOtp = async () => {
        if (!isValid) {
            return;
        }
        dispatch(clearError());
        dispatch(sendOtpStart());

        try {
            const res = await fetch(`${API_BASE_URL}/auth/send-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mobile }),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                dispatch(sendOtpSuccess());
                navigation.navigate(Routes.OTP, { mobile });
            } else {
                dispatch(sendOtpFailure(data.message || 'Failed to send OTP. Please try again.'));
            }
        } catch (err) {
            console.error('Login screen network error details:', err);
            dispatch(sendOtpFailure('Network error. Failed to send OTP.'));
        }
    };

    return (
        <SafeAreaView style={styles.flex}>
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <StatusBar barStyle="dark-content" backgroundColor={Colors.BACKGROUND} />

                <ScrollView
                    contentContainerStyle={styles.container}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}>
                {/* Brand Header */}
                <View style={styles.brandRow}>
                    <View style={styles.logoMini}>
                        <View style={styles.logoInner} />
                    </View>
                    <Text style={styles.brandName}>Second Muma</Text>
                </View>

                {/* Heading */}
                <View style={styles.header}>
                    <Text style={styles.title}>Login to your account</Text>
                    <Text style={styles.subtitle}>
                        Enter your mobile number to receive a one-time password
                    </Text>
                </View>

                {/* Mobile Input */}
                <Text style={styles.inputLabel}>Mobile Number</Text>
                <View
                    style={[
                        styles.inputWrapper,
                        focused && styles.inputWrapperFocused,
                        error ? styles.inputWrapperError : null,
                    ]}>
                    <View style={styles.prefixBox}>
                        <Text style={styles.prefix}>+91</Text>
                    </View>
                    <View style={styles.inputDivider} />
                    <TextInput
                        style={styles.input}
                        placeholder="10-digit number"
                        placeholderTextColor={Colors.TEXT_HINT}
                        keyboardType="phone-pad"
                        maxLength={10}
                        value={mobile}
                        onChangeText={text => {
                            dispatch(clearError());
                            setMobile(text.replace(/[^0-9]/g, ''));
                        }}
                        onFocus={() => setFocused(true)}
                        onBlur={() => setFocused(false)}
                        returnKeyType="done"
                        onSubmitEditing={handleSendOtp}
                    />
                </View>

                {error ? <Text style={styles.error}>{error}</Text> : null}

                {/* CTA */}
                <TouchableOpacity
                    style={(!isValid || isLoading) ? styles.buttonOff : null}
                    onPress={handleSendOtp}
                    disabled={!isValid || isLoading}
                    activeOpacity={0.85}>
                    <LinearGradient
                        colors={(!isValid || isLoading) ? [Colors.DISABLED, Colors.DISABLED] : [Colors.PRIMARY, Colors.PRIMARY_DARK]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.button}
                    >
                        {isLoading ? (
                            <ActivityIndicator color={Colors.WHITE} />
                        ) : (
                            <Text style={styles.buttonText}>Send OTP</Text>
                        )}
                    </LinearGradient>
                </TouchableOpacity>

                <Text style={styles.tnc}>
                    By continuing you agree to our{' '}
                    <Text style={styles.link}>Terms &amp; Privacy Policy</Text>
                </Text>

                {/* Register link */}
                <View style={styles.registerRow}>
                    <Text style={styles.registerLabel}>New to Second Muma? </Text>
                    <TouchableOpacity onPress={() => navigation.navigate(Routes.REGISTER)}>
                        <Text style={styles.registerLink}>Create Account</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    flex: { flex: 1, backgroundColor: Colors.BACKGROUND },
    container: {
        flexGrow: 1,
        paddingHorizontal: 24,
        justifyContent: 'center',
    },
    brandRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 36,
    },
    logoMini: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: Colors.PRIMARY,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    logoInner: {
        width: 18,
        height: 18,
        borderRadius: 9,
        borderWidth: 2.5,
        borderColor: Colors.WHITE,
    },
    brandName: {
        fontSize: 17,
        fontWeight: '700',
        color: Colors.TEXT_PRIMARY,
    },
    header: { marginBottom: 32 },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: Colors.TEXT_PRIMARY,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 13,
        color: Colors.TEXT_SECONDARY,
        lineHeight: 20,
    },
    inputLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.TEXT_SECONDARY,
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.SURFACE,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: Colors.BORDER,
        marginBottom: 12,
        overflow: 'hidden',
    },
    inputWrapperFocused: {
        borderColor: Colors.PRIMARY,
        backgroundColor: Colors.PRIMARY_LIGHT,
    },
    inputWrapperError: {
        borderColor: Colors.ERROR,
    },
    prefixBox: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 16,
        gap: 6,
    },
    flag: { fontSize: 16 },
    prefix: {
        color: Colors.TEXT_PRIMARY,
        fontSize: 15,
        fontWeight: '700',
    },
    inputDivider: {
        width: 1.5,
        height: 28,
        backgroundColor: Colors.BORDER,
    },
    input: {
        flex: 1,
        paddingHorizontal: 14,
        paddingVertical: 16,
        color: Colors.TEXT_PRIMARY,
        fontSize: 16,
        letterSpacing: 1.5,
        fontWeight: '600',
    },
    error: {
        color: Colors.ERROR,
        fontSize: 12,
        marginBottom: 12,
        marginLeft: 4,
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
    buttonOff: {
        backgroundColor: Colors.DISABLED,
        shadowOpacity: 0,
    },
    buttonText: {
        color: Colors.TEXT_ON_PRIMARY,
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    tnc: {
        textAlign: 'center',
        color: Colors.TEXT_HINT,
        fontSize: 11,
        marginTop: 24,
        lineHeight: 18,
    },
    link: {
        color: Colors.PRIMARY,
        textDecorationLine: 'underline',
    },
    registerRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 18,
    },
    registerLabel: { color: Colors.TEXT_HINT, fontSize: 13 },
    registerLink: {
        color: Colors.PRIMARY,
        fontSize: 13,
        fontWeight: '700',
    },
});

export default LoginScreen;
