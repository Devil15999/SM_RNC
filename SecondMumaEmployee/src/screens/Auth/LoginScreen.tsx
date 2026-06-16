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
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { Routes } from '../../constants/routes';
import { Colors } from '../../constants/theme';
import { API_BASE_URL } from '../../config';
import {
    useAppDispatch,
    useAppSelector,
    verifyOtpStart,
    verifyOtpSuccess,
    verifyOtpFailure,
    clearError,
} from '../../store';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

const LoginScreen: React.FC<Props> = ({ navigation }) => {
    const dispatch = useAppDispatch();
    const { isLoading, error } = useAppSelector(state => state.auth);
    const [mobile, setMobile] = useState('');
    const [password, setPassword] = useState('');
    const [focusedField, setFocusedField] = useState<'mobile' | 'password' | null>(null);

    const isMobileValid = mobile.length === 10 && /^[6-9]\d{9}$/.test(mobile);
    const isFormValid = isMobileValid && password.length >= 6;

    const handleLogin = async () => {
        if (!isFormValid) {
            return;
        }
        dispatch(clearError());
        dispatch(verifyOtpStart());

        const requestUrl = `${API_BASE_URL}/auth/employee/login`;

        try {
            const res = await fetch(requestUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mobile, password }),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                const session = {
                    id: data.user.id || data.user._id,
                    name: data.user.name,
                    email: data.user.email,
                    mobile: data.user.mobile,
                    token: data.token,
                    role: data.user.role || 'employee',
                    occupation: data.user.occupation,
                    address: data.user.address,
                    permanentAddress: data.user.permanentAddress,
                    userPhoto: data.user.userPhoto,
                    isVerifiedEmployee: data.user.isVerifiedEmployee,
                    aadharNumber: data.user.aadharNumber,
                };
                await AsyncStorage.setItem('@session_employee', JSON.stringify(session));
                dispatch(verifyOtpSuccess(session));
            } else {
                console.log('Login failed with message:', data.message);
                dispatch(verifyOtpFailure(data.message || 'Login failed. Please check your credentials.'));
            }
        } catch (err) {
            console.error('Login screen network error details:', err);
            dispatch(verifyOtpFailure('Network error. Failed to log in.'));
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
                        <Text style={styles.brandName}>Muma care</Text>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>EMPLOYEE</Text>
                        </View>
                    </View>

                    {/* Heading */}
                    <View style={styles.header}>
                        <Text style={styles.title}>Welcome Back</Text>
                        <Text style={styles.subtitle}>
                            Sign in to view your assigned appointments and log your check-ins.
                        </Text>
                    </View>

                    {/* Mobile Input */}
                    <Text style={styles.inputLabel}>Mobile Number</Text>
                    <View
                        style={[
                            styles.inputWrapper,
                            focusedField === 'mobile' && styles.inputWrapperFocused,
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
                            onFocus={() => setFocusedField('mobile')}
                            onBlur={() => setFocusedField(null)}
                        />
                    </View>

                    {/* Password Input */}
                    <Text style={styles.inputLabel}>Password</Text>
                    <View
                        style={[
                            styles.inputWrapper,
                            focusedField === 'password' && styles.inputWrapperFocused,
                            error ? styles.inputWrapperError : null,
                        ]}>
                        <TextInput
                            style={[styles.input, { letterSpacing: 0, paddingLeft: 16 }]}
                            placeholder="Enter password"
                            placeholderTextColor={Colors.TEXT_HINT}
                            secureTextEntry
                            value={password}
                            onChangeText={text => {
                                dispatch(clearError());
                                setPassword(text);
                            }}
                            onFocus={() => setFocusedField('password')}
                            onBlur={() => setFocusedField(null)}
                            onSubmitEditing={handleLogin}
                        />
                    </View>

                    {error ? <Text style={styles.error}>{error}</Text> : null}

                    {/* Forgot Password Link */}
                    <TouchableOpacity
                        onPress={() => navigation.navigate(Routes.FORGOT_PASSWORD)}
                        style={styles.forgotPasswordContainer}>
                        <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                    </TouchableOpacity>

                    {/* CTA */}
                    <TouchableOpacity
                        style={[styles.button, (!isFormValid || isLoading) && styles.buttonOff]}
                        onPress={handleLogin}
                        disabled={!isFormValid || isLoading}
                        activeOpacity={0.85}>
                        {isLoading ? (
                            <ActivityIndicator color={Colors.WHITE} />
                        ) : (
                            <Text style={styles.buttonText}>Sign In</Text>
                        )}
                    </TouchableOpacity>

                    {/* Register link */}
                    <View style={styles.registerRow}>
                        <Text style={styles.registerLabel}>Join as an employee? </Text>
                        <TouchableOpacity onPress={() => navigation.navigate(Routes.REGISTER)}>
                            <Text style={styles.registerLink}>Register Now</Text>
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
        marginRight: 8,
    },
    badge: {
        backgroundColor: 'rgba(31, 189, 189, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: Colors.PRIMARY,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: Colors.PRIMARY,
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
    forgotPasswordContainer: {
        alignSelf: 'flex-end',
        marginBottom: 20,
        marginTop: -8,
    },
    forgotPasswordText: {
        color: Colors.PRIMARY,
        fontSize: 13,
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
    registerRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 24,
    },
    registerLabel: { color: Colors.TEXT_HINT, fontSize: 13 },
    registerLink: {
        color: Colors.PRIMARY,
        fontSize: 13,
        fontWeight: '700',
    },
});

export default LoginScreen;
