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
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { Routes } from '../../constants/routes';
import { Colors } from '../../constants/theme';
import { API_BASE_URL } from '../../config';
import { useAppDispatch, clearError } from '../../store';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;


const RegisterScreen: React.FC<Props> = ({ navigation }) => {
    const dispatch = useAppDispatch();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Personal details state
    const [mobile, setMobile] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [address, setAddress] = useState('');
    const [permanentAddress, setPermanentAddress] = useState('');
    const [occupation, setOccupation] = useState('');
    const [aadharNumber, setAadharNumber] = useState('');

    // Simulated image states (hold the base64 or URL)
    const [userPhoto, setUserPhoto] = useState<string | null>(null);
    const [aadharPhoto, setAadharPhoto] = useState<string | null>(null);
    const [certificatePhotos, setCertificatePhotos] = useState<(string | null)[]>([null, null, null]);

    const [focusedField, setFocusedField] = useState<string | null>(null);

    const handleSelectImage = (setter: (uri: string | null) => void) => {
        Alert.alert(
            'Select Image',
            'Choose an option to upload the image',
            [
                {
                    text: 'Take Photo',
                    onPress: () => {
                        launchCamera(
                            {
                                mediaType: 'photo',
                                includeBase64: true,
                                quality: 0.8,
                            },
                            (response) => {
                                if (response.didCancel) return;
                                if (response.errorMessage) {
                                    Alert.alert('Error', response.errorMessage);
                                    return;
                                }
                                if (response.assets && response.assets.length > 0) {
                                    const asset = response.assets[0];
                                    const base64Str = `data:${asset.type || 'image/jpeg'};base64,${asset.base64}`;
                                    setter(base64Str);
                                }
                            }
                        );
                    },
                },
                {
                    text: 'Choose from Gallery',
                    onPress: () => {
                        launchImageLibrary(
                            {
                                mediaType: 'photo',
                                includeBase64: true,
                                quality: 0.8,
                            },
                            (response) => {
                                if (response.didCancel) return;
                                if (response.errorMessage) {
                                    Alert.alert('Error', response.errorMessage);
                                    return;
                                }
                                if (response.assets && response.assets.length > 0) {
                                    const asset = response.assets[0];
                                    const base64Str = `data:${asset.type || 'image/jpeg'};base64,${asset.base64}`;
                                    setter(base64Str);
                                }
                            }
                        );
                    },
                },
                { text: 'Cancel', style: 'cancel' },
            ]
        );
    };

    const handleSelectCertificate = (index: number) => {
        handleSelectImage((uri) => {
            setCertificatePhotos(prev => {
                const updated = [...prev];
                updated[index] = uri;
                return updated;
            });
        });
    };

    const isMobileValid = mobile.length === 10 && /^[6-9]\d{9}$/.test(mobile);
    const isAadharValid = aadharNumber.length === 12 && /^\d{12}$/.test(aadharNumber);

    // Check if form fields are filled and mandatory photos selected
    const isFormValid =
        isMobileValid &&
        password.length >= 6 &&
        name.trim().length >= 2 &&
        email.trim().includes('@') &&
        permanentAddress.trim().length >= 5 &&
        occupation.trim().length >= 2 &&
        isAadharValid &&
        userPhoto !== null &&
        aadharPhoto !== null;

    const handleRegister = async () => {
        if (!isFormValid) {
            Alert.alert('Incomplete Form', 'Please fill all mandatory fields and attach required documents.');
            return;
        }

        setIsLoading(true);
        setError('');
        dispatch(clearError());

        const bodyData = {
            mobile,
            password,
            name,
            email,
            address,
            permanentAddress,
            occupation,
            aadharNumber,
            aadharPhoto,
            userPhoto,
            // Send only non-null entries, up to 3
            certificatesPhoto: certificatePhotos.filter(Boolean),
        };

        try {
            const res = await fetch(`${API_BASE_URL}/auth/employee/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bodyData),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                Alert.alert('Success', `OTP sent to +91 ${mobile}`);
                navigation.navigate(Routes.OTP, { mobile });
            } else {
                setError(data.message || 'Registration failed. Please try again.');
            }
        } catch (err) {
            setError('Network error. Failed to submit registration.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.flex}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.BACKGROUND} />
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

                <ScrollView
                    contentContainerStyle={styles.container}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}>

                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>Join as Employee</Text>
                        <Text style={styles.subtitle}>
                            Fill out your personal and verification details to set up your work profile.
                        </Text>
                    </View>

                    {error ? <Text style={styles.error}>{error}</Text> : null}

                    {/* Section: Credentials */}
                    <Text style={styles.sectionTitle}>1. Account Access</Text>

                    <Text style={styles.inputLabel}>Mobile Number *</Text>
                    <View style={[styles.inputWrapper, focusedField === 'mobile' && styles.inputWrapperFocused]}>
                        <View style={styles.prefixBox}>
                            <Text style={styles.prefix}>+91</Text>
                        </View>
                        <View style={styles.inputDivider} />
                        <TextInput
                            style={styles.input}
                            placeholder="10-digit mobile"
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

                    <Text style={styles.inputLabel}>Password (Min 6 chars) *</Text>
                    <View style={[styles.inputWrapper, focusedField === 'password' && styles.inputWrapperFocused]}>
                        <TextInput
                            style={[styles.input, { paddingLeft: 16 }]}
                            placeholder="Create password"
                            placeholderTextColor={Colors.TEXT_HINT}
                            secureTextEntry
                            value={password}
                            onChangeText={setPassword}
                            onFocus={() => setFocusedField('password')}
                            onBlur={() => setFocusedField(null)}
                        />
                    </View>

                    {/* Section: Personal Info */}
                    <Text style={styles.sectionTitle}>2. Personal Details</Text>

                    <Text style={styles.inputLabel}>Full Name *</Text>
                    <View style={[styles.inputWrapper, focusedField === 'name' && styles.inputWrapperFocused]}>
                        <TextInput
                            style={[styles.input, { paddingLeft: 16 }]}
                            placeholder="Enter full name"
                            placeholderTextColor={Colors.TEXT_HINT}
                            value={name}
                            onChangeText={setName}
                            onFocus={() => setFocusedField('name')}
                            onBlur={() => setFocusedField(null)}
                        />
                    </View>

                    <Text style={styles.inputLabel}>Email Address *</Text>
                    <View style={[styles.inputWrapper, focusedField === 'email' && styles.inputWrapperFocused]}>
                        <TextInput
                            style={[styles.input, { paddingLeft: 16 }]}
                            placeholder="email@example.com"
                            placeholderTextColor={Colors.TEXT_HINT}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            value={email}
                            onChangeText={setEmail}
                            onFocus={() => setFocusedField('email')}
                            onBlur={() => setFocusedField(null)}
                        />
                    </View>

                    <Text style={styles.inputLabel}>Occupation *</Text>
                    <View style={[styles.inputWrapper, focusedField === 'occupation' && styles.inputWrapperFocused]}>
                        <TextInput
                            style={[styles.input, { paddingLeft: 16 }]}
                            placeholder="e.g. Baby Sitter, Senior Nurse"
                            placeholderTextColor={Colors.TEXT_HINT}
                            value={occupation}
                            onChangeText={setOccupation}
                            onFocus={() => setFocusedField('occupation')}
                            onBlur={() => setFocusedField(null)}
                        />
                    </View>

                    <Text style={styles.inputLabel}>Working Address (Optional)</Text>
                    <View style={[styles.inputWrapper, focusedField === 'address' && styles.inputWrapperFocused, { height: 80, alignItems: 'flex-start' }]}>
                        <TextInput
                            style={[styles.input, { paddingLeft: 16, textAlignVertical: 'top', height: '100%' }]}
                            placeholder="Flat, street details, pincode (optional)"
                            placeholderTextColor={Colors.TEXT_HINT}
                            multiline
                            numberOfLines={3}
                            value={address}
                            onChangeText={setAddress}
                            onFocus={() => setFocusedField('address')}
                            onBlur={() => setFocusedField(null)}
                        />
                    </View>

                    <Text style={styles.inputLabel}>Permanent Address *</Text>
                    <View style={[styles.inputWrapper, focusedField === 'permanentAddress' && styles.inputWrapperFocused, { height: 80, alignItems: 'flex-start' }]}>
                        <TextInput
                            style={[styles.input, { paddingLeft: 16, textAlignVertical: 'top', height: '100%' }]}
                            placeholder="Full permanent address (mandatory)"
                            placeholderTextColor={Colors.TEXT_HINT}
                            multiline
                            numberOfLines={3}
                            value={permanentAddress}
                            onChangeText={setPermanentAddress}
                            onFocus={() => setFocusedField('permanentAddress')}
                            onBlur={() => setFocusedField(null)}
                        />
                    </View>

                    {/* Section: Documents */}
                    <Text style={styles.sectionTitle}>3. Verification Documents</Text>

                    <Text style={styles.inputLabel}>Aadhar Card Number (12 digits) *</Text>
                    <View style={[styles.inputWrapper, focusedField === 'aadhar' && styles.inputWrapperFocused]}>
                        <TextInput
                            style={[styles.input, { paddingLeft: 16 }]}
                            placeholder="12-digit number"
                            placeholderTextColor={Colors.TEXT_HINT}
                            keyboardType="number-pad"
                            maxLength={12}
                            value={aadharNumber}
                            onChangeText={text => setAadharNumber(text.replace(/[^0-9]/g, ''))}
                            onFocus={() => setFocusedField('aadhar')}
                            onBlur={() => setFocusedField(null)}
                        />
                    </View>

                    {/* Document Attachments */}
                    <View style={styles.photoUploadRow}>
                        <View style={styles.photoContainer}>
                            <Text style={styles.photoLabel}>User Photo *</Text>
                            <View style={[styles.photoBox, userPhoto ? styles.photoBoxFilled : null]}>
                                {userPhoto ? (
                                    <TouchableOpacity
                                        style={{ width: '100%', height: '100%' }}
                                        onPress={() => handleSelectImage(setUserPhoto)}
                                        activeOpacity={0.85}
                                    >
                                        <Image source={{ uri: userPhoto }} style={styles.photoPreview} resizeMode="cover" />
                                        <TouchableOpacity
                                            style={styles.removeBtn}
                                            onPress={() => setUserPhoto(null)}
                                            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                                        >
                                            <Text style={styles.removeBtnText}>✕</Text>
                                        </TouchableOpacity>
                                    </TouchableOpacity>
                                ) : (
                                    <TouchableOpacity
                                        style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}
                                        onPress={() => handleSelectImage(setUserPhoto)}
                                        activeOpacity={0.85}
                                    >
                                        <Text style={[styles.photoBoxPlaceholder, { fontSize: 22 }]}>📷</Text>
                                        <Text style={styles.photoBoxPlaceholder}>+ Select</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>

                        <View style={styles.photoContainer}>
                            <Text style={styles.photoLabel}>Aadhar Photo *</Text>
                            <View style={[styles.photoBox, aadharPhoto ? styles.photoBoxFilled : null]}>
                                {aadharPhoto ? (
                                    <TouchableOpacity
                                        style={{ width: '100%', height: '100%' }}
                                        onPress={() => handleSelectImage(setAadharPhoto)}
                                        activeOpacity={0.85}
                                    >
                                        <Image source={{ uri: aadharPhoto }} style={styles.photoPreview} resizeMode="cover" />
                                        <TouchableOpacity
                                            style={styles.removeBtn}
                                            onPress={() => setAadharPhoto(null)}
                                            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                                        >
                                            <Text style={styles.removeBtnText}>✕</Text>
                                        </TouchableOpacity>
                                    </TouchableOpacity>
                                ) : (
                                    <TouchableOpacity
                                        style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}
                                        onPress={() => handleSelectImage(setAadharPhoto)}
                                        activeOpacity={0.85}
                                    >
                                        <Text style={[styles.photoBoxPlaceholder, { fontSize: 22 }]}>🪪</Text>
                                        <Text style={styles.photoBoxPlaceholder}>+ Select</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    </View>

                    <View style={[styles.photoUploadRow, { marginTop: 10 }]}>
                        <View style={[styles.photoContainer, { width: '100%' }]}>
                            <Text style={styles.photoLabel}>Certificates (Optional, up to 3)</Text>
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                {[0, 1, 2].map((index) => (
                                    <View
                                        key={index}
                                        style={[
                                            styles.certBox,
                                            certificatePhotos[index] ? styles.photoBoxFilled : null
                                        ]}
                                    >
                                        {certificatePhotos[index] ? (
                                            <>
                                                <TouchableOpacity
                                                    style={{ width: '100%', height: '100%' }}
                                                    onPress={() => handleSelectCertificate(index)}
                                                    activeOpacity={0.85}
                                                >
                                                    <Image
                                                        source={{ uri: certificatePhotos[index]! }}
                                                        style={{ width: '100%', height: '100%', borderRadius: 12 }}
                                                        resizeMode="cover"
                                                    />
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    style={styles.removeBtn}
                                                    onPress={() => {
                                                        setCertificatePhotos(prev => {
                                                            const u = [...prev]; u[index] = null; return u;
                                                        });
                                                    }}
                                                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                                                >
                                                    <Text style={styles.removeBtnText}>✕</Text>
                                                </TouchableOpacity>
                                            </>
                                        ) : (
                                            <TouchableOpacity
                                                style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}
                                                onPress={() => handleSelectCertificate(index)}
                                                activeOpacity={0.8}
                                            >
                                                <Text style={[styles.photoBoxPlaceholder, { fontSize: 20 }]}>+</Text>
                                                <Text style={[styles.photoBoxPlaceholder, { fontSize: 10, marginTop: 2 }]}>Cert {index + 1}</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                ))}
                            </View>
                        </View>
                    </View>

                    {/* CTA */}
                    <TouchableOpacity
                        style={[styles.button, (!isFormValid || isLoading) && styles.buttonOff]}
                        onPress={handleRegister}
                        disabled={!isFormValid || isLoading}
                        activeOpacity={0.85}>
                        {isLoading ? (
                            <ActivityIndicator color={Colors.WHITE} />
                        ) : (
                            <Text style={styles.buttonText}>Submit Profile & Get OTP</Text>
                        )}
                    </TouchableOpacity>

                    <View style={styles.loginRow}>
                        <Text style={styles.loginLabel}>Already registered? </Text>
                        <TouchableOpacity onPress={() => navigation.navigate(Routes.LOGIN)}>
                            <Text style={styles.loginLink}>Sign In</Text>
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
        paddingTop: 20,
        paddingBottom: 40,
    },
    header: { marginBottom: 24 },
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
    sectionTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: Colors.PRIMARY,
        marginTop: 12,
        marginBottom: 16,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    inputLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: Colors.TEXT_SECONDARY,
        marginBottom: 6,
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
        paddingVertical: 14,
    },
    prefix: {
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
        paddingVertical: 14,
        color: Colors.TEXT_PRIMARY,
        fontSize: 15,
        fontWeight: '600',
    },
    photoUploadRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    photoContainer: {
        width: '48%',
    },
    photoLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: Colors.TEXT_SECONDARY,
        marginBottom: 6,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    photoBox: {
        height: 100,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: Colors.BORDER,
        borderStyle: 'dashed',
        backgroundColor: Colors.SURFACE,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    photoPreview: {
        width: '100%',
        height: '100%',
        borderRadius: 12,
    },
    photoBoxFilled: {
        borderStyle: 'solid',
        borderColor: Colors.PRIMARY,
        backgroundColor: Colors.PRIMARY_LIGHT,
    },
    removeBtn: {
        position: 'absolute',
        top: 5,
        right: 5,
        backgroundColor: 'rgba(0,0,0,0.55)',
        width: 22,
        height: 22,
        borderRadius: 11,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.4)',
        zIndex: 10,
    },
    removeBtnText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '700',
        lineHeight: 14,
    },
    certBox: {
        flex: 1,
        height: 90,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: Colors.BORDER,
        borderStyle: 'dashed',
        backgroundColor: Colors.SURFACE,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        position: 'relative',
    },
    photoBoxPlaceholder: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.TEXT_SECONDARY,
    },
    photoBoxText: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.PRIMARY,
    },
    error: {
        color: Colors.ERROR,
        fontSize: 13,
        marginBottom: 16,
        fontWeight: '600',
    },
    button: {
        height: 54,
        backgroundColor: Colors.PRIMARY,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 16,
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
