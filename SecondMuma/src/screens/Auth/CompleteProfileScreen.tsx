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
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { Colors } from '../../constants/theme';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { API_BASE_URL } from '../../config';
import {
    useAppDispatch,
    verifyOtpSuccess,
} from '../../store';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Props = NativeStackScreenProps<RootStackParamList, 'CompleteProfile'>;

const isValidName = (v: string) => v.trim().length >= 2;
const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

interface FieldError {
    name?: string;
    email?: string;
}

const CompleteProfileScreen: React.FC<Props> = ({ route }) => {
    const { mobile, token } = route.params;
    const dispatch = useAppDispatch();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [fieldErrors, setFieldErrors] = useState<FieldError>({});
    const [focused, setFocused] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const validate = (): boolean => {
        const errors: FieldError = {};
        if (!isValidName(name)) {
            errors.name = 'Enter your full name (min 2 characters)';
        }
        if (!isValidEmail(email)) {
            errors.email = 'Enter a valid email address';
        }
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) { return; }
        setIsLoading(true);
        setSubmitError(null);

        try {
            const res = await fetch(`${API_BASE_URL}/users/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: name.trim(),
                    email: email.trim().toLowerCase(),
                }),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                const session = {
                    id: data.user.id,
                    name: data.user.name,
                    email: data.user.email,
                    mobile: data.user.mobile,
                    token: token,
                };
                try {
                    await AsyncStorage.setItem('@session', JSON.stringify(session));
                } catch (e) {
                    console.log('Error saving session:', e);
                }
                dispatch(verifyOtpSuccess(session));
            } else {
                setSubmitError(data.message || 'Failed to update profile details.');
            }
        } catch {
            setSubmitError('Network error. Failed to save profile details.');
        } finally {
            setIsLoading(false);
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

                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.iconBadge}>
                        <Icon name="user-check" size={28} color={Colors.PRIMARY} />
                    </View>
                    <Text style={styles.title}>Complete Profile</Text>
                    <Text style={styles.subtitle}>
                        It looks like you're logging in for the first time on +91 {mobile}. Please tell us a bit about yourself.
                    </Text>
                </View>

                {/* Name */}
                <Text style={styles.inputLabel}>Full Name</Text>
                <View
                    style={[
                        styles.inputWrapper,
                        focused === 'name' && styles.inputWrapperFocused,
                        fieldErrors.name ? styles.inputWrapperError : null,
                    ]}>
                    <View style={styles.iconBox}>
                        <Icon name="user" size={16} color={focused === 'name' ? Colors.PRIMARY : Colors.TEXT_HINT} />
                    </View>
                    <TextInput
                        style={styles.input}
                        placeholder="John Doe"
                        placeholderTextColor={Colors.TEXT_HINT}
                        value={name}
                        onChangeText={text => {
                            setName(text);
                            setFieldErrors(prev => ({ ...prev, name: undefined }));
                            setSubmitError(null);
                        }}
                        onFocus={() => setFocused('name')}
                        onBlur={() => setFocused(null)}
                        autoCapitalize="words"
                    />
                </View>
                {fieldErrors.name && <Text style={styles.fieldError}>{fieldErrors.name}</Text>}

                {/* Email */}
                <Text style={styles.inputLabel}>Email Address</Text>
                <View
                    style={[
                        styles.inputWrapper,
                        focused === 'email' && styles.inputWrapperFocused,
                        fieldErrors.email ? styles.inputWrapperError : null,
                    ]}>
                    <View style={styles.iconBox}>
                        <Icon name="envelope" size={16} color={focused === 'email' ? Colors.PRIMARY : Colors.TEXT_HINT} />
                    </View>
                    <TextInput
                        style={styles.input}
                        placeholder="john.doe@example.com"
                        placeholderTextColor={Colors.TEXT_HINT}
                        keyboardType="email-address"
                        value={email}
                        onChangeText={text => {
                            setEmail(text);
                            setFieldErrors(prev => ({ ...prev, email: undefined }));
                            setSubmitError(null);
                        }}
                        onFocus={() => setFocused('email')}
                        onBlur={() => setFocused(null)}
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                </View>
                {fieldErrors.email && <Text style={styles.fieldError}>{fieldErrors.email}</Text>}

                {submitError ? <Text style={styles.error}>{submitError}</Text> : null}

                {/* Submit Button */}
                <TouchableOpacity
                    style={[styles.button, isLoading && styles.buttonOff]}
                    onPress={handleSubmit}
                    disabled={isLoading}
                    activeOpacity={0.85}>
                    {isLoading ? (
                        <ActivityIndicator color={Colors.WHITE} />
                    ) : (
                        <Text style={styles.buttonText}>Complete & Proceed →</Text>
                    )}
                </TouchableOpacity>
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
        justifyContent: 'center',
    },
    header: { marginBottom: 32, alignItems: 'center' },
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
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: Colors.TEXT_PRIMARY,
        marginBottom: 8,
    },
    subtitle: {
        color: Colors.TEXT_SECONDARY,
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 22,
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
    iconBox: {
        paddingHorizontal: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        paddingVertical: 16,
        paddingRight: 14,
        color: Colors.TEXT_PRIMARY,
        fontSize: 15,
        fontWeight: '600',
    },
    fieldError: {
        color: Colors.ERROR,
        fontSize: 11,
        marginTop: -6,
        marginBottom: 12,
        marginLeft: 4,
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
        marginTop: 12,
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
});

export default CompleteProfileScreen;
