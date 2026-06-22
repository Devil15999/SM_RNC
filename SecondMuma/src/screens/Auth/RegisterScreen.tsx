import React, { useState } from 'react';
import {
    ActivityIndicator,
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
import { RootStackParamList } from '../../types/navigation';
import { Routes } from '../../constants/routes';
import { Colors } from '../../constants/theme';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { API_BASE_URL } from '../../config';
import {
    useAppDispatch,
    useAppSelector,
    sendOtpStart,
    sendOtpSuccess,
    sendOtpFailure,
    clearError,
} from '../../store';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

// ── Validation helpers ─────────────────────────────────────────────────────────
const isValidName = (v: string) => v.trim().length >= 2;
const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
const isValidMobile = (v: string) => /^[6-9]\d{9}$/.test(v);

interface FieldError {
    name?: string;
    email?: string;
    mobile?: string;
}

const RegisterScreen: React.FC<Props> = ({ navigation }) => {
    const dispatch = useAppDispatch();
    const { isLoading, error: apiError } = useAppSelector(state => state.auth);

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [mobile, setMobile] = useState('');
    const [fieldErrors, setFieldErrors] = useState<FieldError>({});
    const [focused, setFocused] = useState<string | null>(null);

    // ── Validate all fields ────────────────────────────────────────────────────
    const validate = (): boolean => {
        const errors: FieldError = {};
        if (!isValidName(name)) {
            errors.name = 'Enter your full name (min 2 characters)';
        }
        if (!isValidEmail(email)) {
            errors.email = 'Enter a valid email address';
        }
        if (!isValidMobile(mobile)) {
            errors.mobile = 'Enter a valid 10-digit Indian mobile number';
        }
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // ── Submit ─────────────────────────────────────────────────────────────────
    const handleContinue = async () => {
        if (!validate()) { return; }
        dispatch(clearError());
        dispatch(sendOtpStart());

        try {
            const res = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: name.trim(),
                    email: email.trim().toLowerCase(),
                    mobile,
                }),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                dispatch(sendOtpSuccess());
                navigation.navigate(Routes.OTP, {
                    mobile,
                    name: name.trim(),
                    email: email.trim().toLowerCase(),
                });
            } else {
                dispatch(sendOtpFailure(data.message || 'Registration failed. Please try again.'));
            }
        } catch {
            dispatch(sendOtpFailure('Network error. Registration failed.'));
        }
    };

    // ── Reusable input builder ─────────────────────────────────────────────────
    const renderField = ({
        label,
        value,
        onChangeText,
        placeholder,
        keyboardType = 'default',
        autoCapitalize = 'none',
        maxLength,
        prefix,
        fieldKey,
    }: {
        label: string;
        value: string;
        onChangeText: (t: string) => void;
        placeholder: string;
        keyboardType?: 'default' | 'email-address' | 'phone-pad';
        autoCapitalize?: 'none' | 'words';
        maxLength?: number;
        prefix?: React.ReactNode;
        fieldKey: string;
    }) => {
        const isFocused = focused === fieldKey;
        const fieldError = fieldErrors[fieldKey as keyof FieldError];

        return (
            <View style={styles.fieldGroup}>
                <Text style={styles.label}>{label}</Text>
                <View
                    style={[
                        styles.inputWrapper,
                        isFocused && styles.inputWrapperFocused,
                        fieldError ? styles.inputWrapperError : null,
                    ]}>
                    {prefix}
                    {prefix ? <View style={styles.inputDivider} /> : null}
                    <TextInput
                        style={[styles.input, prefix ? styles.inputWithPrefix : null]}
                        placeholder={placeholder}
                        placeholderTextColor={Colors.TEXT_HINT}
                        value={value}
                        onChangeText={text => {
                            onChangeText(text);
                            if (fieldErrors[fieldKey as keyof FieldError]) {
                                setFieldErrors(prev => ({ ...prev, [fieldKey]: undefined }));
                            }
                        }}
                        keyboardType={keyboardType}
                        autoCapitalize={autoCapitalize}
                        maxLength={maxLength}
                        onFocus={() => setFocused(fieldKey)}
                        onBlur={() => setFocused(null)}
                        returnKeyType="next"
                    />
                </View>
                {fieldError ? (
                    <Text style={styles.fieldError}>⚠ {fieldError}</Text>
                ) : null}
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.flex} edges={['top', 'left', 'right']}>
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <StatusBar barStyle="dark-content" backgroundColor={Colors.BACKGROUND} />

                <ScrollView
                    contentContainerStyle={styles.scroll}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}>

                {/* Back */}
                <TouchableOpacity
                    style={styles.backBtn}
                    onPress={() => navigation.goBack()}>
                    <Icon name="chevron-left" size={18} color={Colors.TEXT_SECONDARY} />
                </TouchableOpacity>

                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.iconBadge}>
                        <Icon name="baby" size={30} color={Colors.PRIMARY} />
                    </View>
                    <Text style={styles.title}>Create Account</Text>
                    <Text style={styles.subtitle}>
                        Join Second Muma — your trusted baby care companion
                    </Text>
                </View>

                {/* Step indicator */}
                <View style={styles.stepRow}>
                    <View style={styles.stepActive}>
                        <Text style={styles.stepActiveText}>1</Text>
                    </View>
                    <View style={styles.stepLine} />
                    <View style={styles.stepInactive}>
                        <Text style={styles.stepInactiveText}>2</Text>
                    </View>
                    {/* <View style={styles.stepLabel}>
                        <Text style={styles.stepDesc}>Details · OTP Verify</Text>
                    </View> */}
                </View>

                {/* Fields */}
                {renderField({
                    label: 'Full Name',
                    value: name,
                    onChangeText: setName,
                    placeholder: 'e.g. Priya Sharma',
                    autoCapitalize: 'words',
                    fieldKey: 'name',
                })}

                {renderField({
                    label: 'Email Address',
                    value: email,
                    onChangeText: setEmail,
                    placeholder: 'e.g. priya@example.com',
                    keyboardType: 'email-address',
                    fieldKey: 'email',
                })}

                {renderField({
                    label: 'Mobile Number',
                    value: mobile,
                    onChangeText: t => setMobile(t.replace(/[^0-9]/g, '')),
                    placeholder: '10-digit number',
                    keyboardType: 'phone-pad',
                    maxLength: 10,
                    fieldKey: 'mobile',
                    prefix: (
                        <View style={styles.prefixBox}>
                            <Text style={styles.prefixText}>+91</Text>
                        </View>
                    ),
                })}

                {/* API error */}
                {apiError ? <Text style={styles.apiError}>{apiError}</Text> : null}

                {/* CTA */}
                <TouchableOpacity
                    style={isLoading ? styles.buttonOff : null}
                    onPress={handleContinue}
                    disabled={isLoading}
                    activeOpacity={0.85}>
                    <LinearGradient
                        colors={isLoading ? [Colors.DISABLED, Colors.DISABLED] : [Colors.PRIMARY, Colors.PRIMARY_DARK]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.button}
                    >
                        {isLoading ? (
                            <ActivityIndicator color={Colors.WHITE} />
                        ) : (
                            <Text style={styles.buttonText}>Complete & Proceed</Text>
                        )}
                    </LinearGradient>
                </TouchableOpacity>

                {/* Login link */}
                <View style={styles.loginRow}>
                    <Text style={styles.loginLabel}>Already have an account? </Text>
                    <TouchableOpacity onPress={() => navigation.navigate(Routes.LOGIN)}>
                        <Text style={styles.loginLink}>Sign In</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    flex: { flex: 1, backgroundColor: Colors.BACKGROUND },
    scroll: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 48,
    },
    backBtn: { marginBottom: 28 },
    backText: {
        color: Colors.TEXT_SECONDARY,
        fontSize: 15,
        fontWeight: '500',
    },
    header: { alignItems: 'center', marginBottom: 28 },
    iconBadge: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: Colors.PRIMARY_LIGHT,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 2,
        borderColor: Colors.PRIMARY_MID,
    },
    iconText: { fontSize: 32 },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: Colors.TEXT_PRIMARY,
        marginBottom: 6,
    },
    subtitle: {
        color: Colors.TEXT_SECONDARY,
        fontSize: 13,
        textAlign: 'center',
        lineHeight: 20,
    },

    // Step indicator
    stepRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 28,
        backgroundColor: Colors.SURFACE,
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: Colors.BORDER,
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
    stepLine: {
        flex: 0,
        width: '80%',
        height: 2,
        backgroundColor: Colors.BORDER,
        marginHorizontal: 6,
    },
    stepInactive: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: Colors.SURFACE_DEEP,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.BORDER,
    },
    stepInactiveText: {
        color: Colors.TEXT_HINT,
        fontSize: 12,
        fontWeight: '700',
    },
    stepLabel: { flex: 1, marginLeft: 10 },
    stepDesc: {
        color: Colors.TEXT_SECONDARY,
        fontSize: 12,
        fontWeight: '500',
    },

    // Field
    fieldGroup: { marginBottom: 16 },
    label: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.TEXT_SECONDARY,
        marginBottom: 7,
        textTransform: 'uppercase',
        letterSpacing: 0.7,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.SURFACE,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: Colors.BORDER,
        overflow: 'hidden',
    },
    inputWrapperFocused: {
        borderColor: Colors.PRIMARY,
        backgroundColor: Colors.PRIMARY_LIGHT,
    },
    inputWrapperError: {
        borderColor: Colors.ERROR,
        backgroundColor: '#FFF8F8',
    },
    prefixBox: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 15,
        gap: 5,
    },
    flag: { fontSize: 16 },
    prefixText: {
        color: Colors.TEXT_PRIMARY,
        fontSize: 15,
        fontWeight: '700',
    },
    inputDivider: {
        width: 1.5,
        height: 24,
        backgroundColor: Colors.BORDER,
    },
    input: {
        flex: 1,
        paddingHorizontal: 14,
        paddingVertical: 15,
        color: Colors.TEXT_PRIMARY,
        fontSize: 15,
        fontWeight: '500',
    },
    inputWithPrefix: {
        paddingLeft: 12,
    },
    fieldError: {
        color: Colors.ERROR,
        fontSize: 11,
        marginTop: 5,
        marginLeft: 4,
    },

    // API error
    apiError: {
        color: Colors.ERROR,
        fontSize: 12,
        textAlign: 'center',
        marginBottom: 14,
        marginTop: -4,
    },

    // Button
    button: {
        height: 54,
        backgroundColor: Colors.PRIMARY,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 6,
        shadowColor: Colors.PRIMARY,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 14,
        elevation: 8,
    },
    buttonOff: { backgroundColor: Colors.DISABLED, shadowOpacity: 0 },
    buttonText: {
        color: Colors.TEXT_ON_PRIMARY,
        fontSize: 16,
        fontWeight: '700',
    },

    // Login link
    loginRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 24,
    },
    loginLabel: { color: Colors.TEXT_HINT, fontSize: 13 },
    loginLink: {
        color: Colors.PRIMARY,
        fontSize: 13,
        fontWeight: '700',
    },
});

export default RegisterScreen;
