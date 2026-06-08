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
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { Routes } from '../../constants/routes';
import { Colors } from '../../constants/theme';
import { API_BASE_URL } from '../../config';

type Props = NativeStackScreenProps<RootStackParamList, 'ForgotPassword'>;

const ForgotPasswordScreen: React.FC<Props> = ({ navigation }) => {
    const [step, setStep] = useState<1 | 2>(1);
    const [mobile, setMobile] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [focusedField, setFocusedField] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const isMobileValid = mobile.length === 10 && /^[6-9]\d{9}$/.test(mobile);
    const isStep2Valid = otp.length === 6 && newPassword.length >= 6;

    const handleSendOtp = async () => {
        if (!isMobileValid) return;
        setIsLoading(true);
        setError('');
        try {
            const res = await fetch(`${API_BASE_URL}/auth/employee/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mobile }),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setStep(2);
                setSuccessMessage(`OTP sent to +91 ${mobile}`);
            } else {
                setError(data.message || 'Failed to send OTP. Please try again.');
            }
        } catch {
            setError('Network error. Failed to send OTP.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (!isStep2Valid) return;
        setIsLoading(true);
        setError('');
        try {
            const res = await fetch(`${API_BASE_URL}/auth/employee/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mobile, otp, newPassword }),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                Alert.alert('Success', 'Password reset successfully! Please log in.');
                navigation.navigate(Routes.LOGIN);
            } else {
                setError(data.message || 'Verification failed. Please check the OTP.');
            }
        } catch {
            setError('Network error. Failed to reset password.');
        } finally {
            setIsLoading(false);
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
                    
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>Reset Password</Text>
                        <Text style={styles.subtitle}>
                            {step === 1 
                                ? 'Enter your registered mobile number to receive a verification OTP.' 
                                : 'Enter the 6-digit OTP and your new password below.'}
                        </Text>
                    </View>

                    {successMessage ? <Text style={styles.success}>{successMessage}</Text> : null}
                    {error ? <Text style={styles.error}>{error}</Text> : null}

                    {step === 1 ? (
                        <>
                            {/* Mobile Input */}
                            <Text style={styles.inputLabel}>Mobile Number</Text>
                            <View style={[styles.inputWrapper, focusedField === 'mobile' && styles.inputWrapperFocused]}>
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
                                        setError('');
                                        setMobile(text.replace(/[^0-9]/g, ''));
                                    }}
                                    onFocus={() => setFocusedField('mobile')}
                                    onBlur={() => setFocusedField(null)}
                                />
                            </View>

                            <TouchableOpacity
                                style={[styles.button, !isMobileValid && styles.buttonOff]}
                                onPress={handleSendOtp}
                                disabled={!isMobileValid || isLoading}>
                                {isLoading ? <ActivityIndicator color={Colors.WHITE} /> : <Text style={styles.buttonText}>Send OTP</Text>}
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            {/* OTP Input */}
                            <Text style={styles.inputLabel}>Enter OTP</Text>
                            <View style={[styles.inputWrapper, focusedField === 'otp' && styles.inputWrapperFocused]}>
                                <TextInput
                                    style={[styles.input, { letterSpacing: 4, paddingLeft: 16 }]}
                                    placeholder="6-digit OTP"
                                    placeholderTextColor={Colors.TEXT_HINT}
                                    keyboardType="number-pad"
                                    maxLength={6}
                                    value={otp}
                                    onChangeText={text => {
                                        setError('');
                                        setOtp(text.replace(/[^0-9]/g, ''));
                                    }}
                                    onFocus={() => setFocusedField('otp')}
                                    onBlur={() => setFocusedField(null)}
                                />
                            </View>

                            {/* New Password Input */}
                            <Text style={styles.inputLabel}>New Password</Text>
                            <View style={[styles.inputWrapper, focusedField === 'password' && styles.inputWrapperFocused]}>
                                <TextInput
                                    style={[styles.input, { letterSpacing: 0, paddingLeft: 16 }]}
                                    placeholder="Minimum 6 characters"
                                    placeholderTextColor={Colors.TEXT_HINT}
                                    secureTextEntry
                                    value={newPassword}
                                    onChangeText={text => {
                                        setError('');
                                        setNewPassword(text);
                                    }}
                                    onFocus={() => setFocusedField('password')}
                                    onBlur={() => setFocusedField(null)}
                                />
                            </View>

                            <TouchableOpacity
                                style={[styles.button, !isStep2Valid && styles.buttonOff]}
                                onPress={handleResetPassword}
                                disabled={!isStep2Valid || isLoading}>
                                {isLoading ? <ActivityIndicator color={Colors.WHITE} /> : <Text style={styles.buttonText}>Reset Password</Text>}
                            </TouchableOpacity>
                        </>
                    )}

                    <TouchableOpacity onPress={() => navigation.navigate(Routes.LOGIN)} style={styles.backButton}>
                        <Text style={styles.backButtonText}>Back to Sign In</Text>
                    </TouchableOpacity>
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
        fontSize: 11,
        fontWeight: '700',
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
        marginBottom: 16,
        overflow: 'hidden',
    },
    inputWrapperFocused: {
        borderColor: Colors.PRIMARY,
        backgroundColor: Colors.PRIMARY_LIGHT,
    },
    prefixBox: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 16,
        gap: 6,
    },
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
        fontWeight: '600',
    },
    error: {
        color: Colors.ERROR,
        fontSize: 13,
        marginBottom: 16,
        marginLeft: 4,
        fontWeight: '600',
    },
    success: {
        color: Colors.SUCCESS,
        fontSize: 13,
        marginBottom: 16,
        marginLeft: 4,
        fontWeight: '600',
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
    backButton: {
        alignSelf: 'center',
        marginTop: 24,
    },
    backButtonText: {
        color: Colors.PRIMARY,
        fontSize: 14,
        fontWeight: '700',
    },
});

export default ForgotPasswordScreen;
