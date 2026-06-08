import React, { useState } from 'react';
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
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { RootStackParamList } from '../../types/navigation';
import { Routes } from '../../constants/routes';
import { Colors } from '../../constants/theme';
import { API_BASE_URL } from '../../config';
import { useAppSelector } from '../../store';

type Props = NativeStackScreenProps<RootStackParamList, 'Checkin'>;

const CheckinScreen: React.FC<Props> = ({ navigation, route }) => {
    const { appointmentId, customerName, customerMobile } = route.params;
    const { token } = useAppSelector(state => state.auth);

    const [otp, setOtp] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [locatingText, setLocatingText] = useState('');
    const [error, setError] = useState('');
    const [successData, setSuccessData] = useState<any>(null);

    const isOtpValid = otp.length === 6 && /^\d{6}$/.test(otp);

    const handleCheckin = () => {
        if (!isOtpValid) return;
        setIsLoading(true);
        setError('');
        setLocatingText('Acquiring high-accuracy GPS signal...');

        // Simulate GPS satellite acquisition and coordinate capture
        setTimeout(() => {
            setLocatingText('Capturing coordinates & verifying OTP...');
            
            // Generate mock latitude/longitude near Bangalore, India
            const mockLat = 12.9715987 + (Math.random() - 0.5) * 0.005;
            const mockLng = 77.5945627 + (Math.random() - 0.5) * 0.005;

            submitCheckin(mockLat, mockLng);
        }, 1500);
    };

    const submitCheckin = async (latitude: number, longitude: number) => {
        try {
            const res = await fetch(`${API_BASE_URL}/employee/appointments/${appointmentId}/checkin`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    otp,
                    latitude,
                    longitude,
                }),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setSuccessData({
                    latitude,
                    longitude,
                    time: new Date().toLocaleTimeString(),
                });
            } else {
                setError(data.message || 'Verification failed. Please check client OTP.');
            }
        } catch {
            setError('Network error. Failed to complete check-in.');
        } finally {
            setIsLoading(false);
            setLocatingText('');
        }
    };

    if (successData) {
        return (
            <SafeAreaView style={styles.safe}>
                <StatusBar barStyle="dark-content" backgroundColor={Colors.BACKGROUND} />
                <View style={styles.successContainer}>
                    <View style={styles.successBadge}>
                        <Icon name="check" size={32} color={Colors.WHITE} />
                    </View>
                    <Text style={styles.successTitle}>Check-in Successful!</Text>
                    <Text style={styles.successSub}>
                        Verification complete for customer {customerName}.
                    </Text>

                    <View style={styles.infoCard}>
                        <View style={styles.infoRow}>
                            <Icon name="map-marker-alt" size={14} color={Colors.PRIMARY} style={styles.infoIcon} />
                            <Text style={styles.infoText}>
                                Coordinates: {successData.latitude.toFixed(6)}, {successData.longitude.toFixed(6)}
                            </Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Icon name="clock" size={14} color={Colors.PRIMARY} style={styles.infoIcon} />
                            <Text style={styles.infoText}>Time Recorded: {successData.time}</Text>
                        </View>
                    </View>

                    <TouchableOpacity 
                        style={styles.doneBtn} 
                        onPress={() => navigation.navigate(Routes.HOME)}>
                        <Text style={styles.doneBtnText}>Return to Dashboard</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safe}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.BACKGROUND} />
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                
                <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                        <Icon name="chevron-left" size={18} color={Colors.TEXT_SECONDARY} />
                    </TouchableOpacity>

                    {/* Customer Info */}
                    <View style={styles.clientSection}>
                        <View style={styles.clientBadge}>
                            <Icon name="briefcase" size={18} color={Colors.PRIMARY} />
                        </View>
                        <Text style={styles.title}>Client Check-in</Text>
                        <Text style={styles.clientName}>{customerName}</Text>
                        <Text style={styles.clientPhone}>+91 {customerMobile}</Text>
                    </View>

                    <Text style={styles.subtitle}>
                        Enter the 6-digit verification OTP provided by the customer to start the session.
                    </Text>

                    {error ? <Text style={styles.error}>{error}</Text> : null}

                    {/* OTP input field */}
                    <Text style={styles.inputLabel}>Verification OTP *</Text>
                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={styles.input}
                            placeholder="6-digit code"
                            placeholderTextColor={Colors.TEXT_HINT}
                            keyboardType="number-pad"
                            maxLength={6}
                            value={otp}
                            onChangeText={text => {
                                setError('');
                                setOtp(text.replace(/[^0-9]/g, ''));
                            }}
                            editable={!isLoading}
                        />
                    </View>

                    {/* Locator feedback */}
                    {locatingText ? (
                        <View style={styles.locatorRow}>
                            <ActivityIndicator size="small" color={Colors.PRIMARY} style={{ marginRight: 10 }} />
                            <Text style={styles.locatorText}>{locatingText}</Text>
                        </View>
                    ) : null}

                    {/* Submit Button */}
                    <TouchableOpacity
                        style={[styles.button, (!isOtpValid || isLoading) && styles.buttonOff]}
                        onPress={handleCheckin}
                        disabled={!isOtpValid || isLoading}
                        activeOpacity={0.85}>
                        {isLoading ? (
                            <ActivityIndicator color={Colors.WHITE} />
                        ) : (
                            <Text style={styles.buttonText}>Verify OTP & Record GPS</Text>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: Colors.BACKGROUND },
    flex: { flex: 1 },
    container: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: 16,
    },
    backBtn: {
        marginBottom: 24,
        paddingVertical: 4,
    },
    clientSection: {
        alignItems: 'center',
        marginBottom: 20,
    },
    clientBadge: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: Colors.PRIMARY_LIGHT,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: Colors.PRIMARY_MID,
        marginBottom: 14,
    },
    title: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.TEXT_SECONDARY,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 6,
    },
    clientName: {
        fontSize: 22,
        fontWeight: '800',
        color: Colors.TEXT_PRIMARY,
    },
    clientPhone: {
        fontSize: 14,
        color: Colors.TEXT_SECONDARY,
        marginTop: 2,
    },
    subtitle: {
        fontSize: 14,
        color: Colors.TEXT_SECONDARY,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 32,
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
        backgroundColor: Colors.SURFACE,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: Colors.BORDER,
        marginBottom: 16,
        overflow: 'hidden',
    },
    input: {
        paddingHorizontal: 16,
        paddingVertical: 16,
        color: Colors.TEXT_PRIMARY,
        fontSize: 18,
        letterSpacing: 6,
        fontWeight: '800',
        textAlign: 'center',
    },
    error: {
        color: Colors.ERROR,
        fontSize: 13,
        textAlign: 'center',
        marginBottom: 16,
        fontWeight: '600',
    },
    button: {
        height: 54,
        backgroundColor: Colors.PRIMARY,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
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
    locatorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    locatorText: {
        fontSize: 12,
        color: Colors.PRIMARY_DARK,
        fontWeight: '600',
    },

    // Success Screen
    successContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    successBadge: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: Colors.SUCCESS,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        shadowColor: Colors.SUCCESS,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 14,
        elevation: 8,
    },
    successTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: Colors.TEXT_PRIMARY,
        marginBottom: 8,
    },
    successSub: {
        fontSize: 14,
        color: Colors.TEXT_SECONDARY,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 32,
    },
    infoCard: {
        width: '100%',
        backgroundColor: Colors.SURFACE,
        borderWidth: 1,
        borderColor: Colors.BORDER,
        borderRadius: 16,
        padding: 20,
        marginBottom: 36,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    infoIcon: {
        marginRight: 10,
        width: 16,
    },
    infoText: {
        fontSize: 14,
        color: Colors.TEXT_PRIMARY,
        fontWeight: '600',
    },
    doneBtn: {
        height: 54,
        width: '100%',
        backgroundColor: Colors.PRIMARY,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    doneBtnText: {
        color: Colors.WHITE,
        fontSize: 16,
        fontWeight: '700',
    },
});

export default CheckinScreen;
