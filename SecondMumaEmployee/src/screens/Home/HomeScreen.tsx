import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ActivityIndicator,
    Image,
    RefreshControl,
    Alert,
    Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { RootStackParamList } from '../../types/navigation';
import { Colors } from '../../constants/theme';
import { useAppDispatch, useAppSelector, logout, updateUser } from '../../store';
import { Routes } from '../../constants/routes';
import { API_BASE_URL } from '../../config';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

interface Appointment {
    _id: string;
    customerName: string;
    customerMobile: string;
    customerAddress: string;
    dateTime: string;
    details?: string;
    status: 'pending' | 'checked_in' | 'completed';
    otp: string;
    checkinLocation?: {
        latitude: number;
        longitude: number;
    };
    checkinTime?: string;
}

const HomeScreen: React.FC<Props> = ({ navigation }) => {
    const dispatch = useAppDispatch();
    const { user, token } = useAppSelector(state => state.auth);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isCheckingStatus, setIsCheckingStatus] = useState(false);
    const [fetchError, setFetchError] = useState(false);

    const checkVerificationStatus = useCallback(async (silent = false) => {
        if (!silent) setIsCheckingStatus(true);
        try {
            const res = await fetch(`${API_BASE_URL}/users/profile`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const data = await res.json();
            if (res.ok && data.success && data.user) {
                // Update Redux state
                dispatch(updateUser(data.user));

                // Update AsyncStorage session
                const sessionStr = await AsyncStorage.getItem('@session_employee');
                if (sessionStr) {
                    const session = JSON.parse(sessionStr);
                    const updatedSession = { ...session, ...data.user };
                    await AsyncStorage.setItem('@session_employee', JSON.stringify(updatedSession));
                }

                if (!silent) {
                    if (data.user.isVerifiedEmployee) {
                        Alert.alert('Approved!', 'Your account has been successfully approved! Welcome.');
                    } else {
                        Alert.alert('Verification Pending', 'Your documents are still being reviewed. We will notify you once approved.');
                    }
                }
            } else if (!silent) {
                Alert.alert('Error', 'Unable to fetch status. Please try again.');
            }
        } catch (err) {
            console.log('Error checking verification status:', err);
            if (!silent) {
                Alert.alert('Connection Error', 'Could not reach the server. Please check your internet connection.');
            }
        } finally {
            if (!silent) setIsCheckingStatus(false);
        }
    }, [token, dispatch]);

    const handleLogout = async () => {
        try {
            await AsyncStorage.removeItem('@session_employee');
        } catch (e) {
            console.log('Error clearing session:', e);
        }
        dispatch(logout());
    };

    const fetchAppointments = useCallback(async () => {
        setFetchError(false);
        try {
            const res = await fetch(`${API_BASE_URL}/employee/appointments`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setAppointments(data.data || []);
            } else {
                setFetchError(true);
            }
        } catch {
            setFetchError(true);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [token]);


    useEffect(() => {
        let interval: any;

        if (user && !user.isVerifiedEmployee) {
            // Check status immediately
            checkVerificationStatus(true);

            // Then poll every 10 seconds in background
            interval = setInterval(() => {
                checkVerificationStatus(true);
            }, 10000);
        } else {
            fetchAppointments();
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [user?.isVerifiedEmployee, checkVerificationStatus, fetchAppointments]);

    const onRefresh = () => {
        setIsRefreshing(true);
        fetchAppointments();
    };

    const upcoming = appointments.filter(a => a.status === 'pending');
    const completed = appointments.filter(a => a.status === 'checked_in' || a.status === 'completed');

    const formatDateTime = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const initials = (user?.name ?? 'E')
        .split(' ')
        .map(w => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    if (user && !user.isVerifiedEmployee) {
        return (
            <SafeAreaView style={styles.safePending}>
                <StatusBar barStyle="dark-content" backgroundColor={Colors.BACKGROUND} />
                <View style={styles.pendingContainerFull}>
                    <Image
                        source={require('../../assets/Document_Verification2.png')}
                        style={styles.pendingImage}
                        resizeMode="contain"
                    />

                    <View style={styles.badgePendingContainer}>
                        <Icon name="clock" size={12} color="#f59e0b" style={{ marginRight: 6 }} />
                        <Text style={styles.badgePendingText}>Verification Pending</Text>
                    </View>

                    <Text style={styles.pendingTitle}>Document Verification</Text>

                    <Text style={styles.pendingSub}>
                        Hello, <Text style={{ fontWeight: '700', color: Colors.TEXT_PRIMARY }}>{user.name}</Text>. Our administrators are currently reviewing your documents and profile details.
                    </Text>

                    <Text style={styles.pendingSubSecondary}>
                        Please wait until your details are approved. You will automatically get access to the home page once your account is approved.
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safe}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.BACKGROUND} />

            {/* Top Header */}
            <View style={styles.topBar}>
                <View style={styles.topBarLeft}>
                    <TouchableOpacity
                        style={styles.avatar}
                        activeOpacity={0.8}
                        onPress={() => navigation.navigate(Routes.PROFILE)}
                    >
                        {user?.userPhoto ? (
                            <Image 
                                source={{ uri: `${API_BASE_URL.replace('/api', '')}${user.userPhoto}` }} 
                                style={styles.avatarImg}
                            />
                        ) : (
                            <Image 
                                source={require('../../assets/user.png')} 
                                style={styles.avatarImg}
                            />
                        )}
                    </TouchableOpacity>
                    <View style={styles.headerInfo}>
                        <Text style={styles.welcome}>Good Day,</Text>
                        <Text style={styles.name}>{user?.name ?? 'Employee'}</Text>
                        <Text style={styles.occupation}>{user?.occupation ?? 'Care Professional'}</Text>
                    </View>
                </View>
                <TouchableOpacity
                    style={styles.profileBtn}
                    onPress={() => navigation.navigate(Routes.PROFILE)}>
                    <Icon name="cog" size={20} color={Colors.TEXT_SECONDARY} />
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={styles.scroll}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[Colors.PRIMARY]} />
                }
            >
                {/* Stats Section */}
                <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                        <Icon name="calendar-alt" size={20} color={Colors.PRIMARY} style={styles.statIcon} />
                        <Text style={styles.statVal}>{upcoming.length}</Text>
                        <Text style={styles.statLabel}>Upcoming</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Icon name="check-circle" size={20} color={Colors.SUCCESS} style={styles.statIcon} />
                        <Text style={styles.statVal}>{completed.length}</Text>
                        <Text style={styles.statLabel}>Completed</Text>
                    </View>
                </View>

                {/* Main Banner */}
                <View style={styles.banner}>
                    <View style={styles.bannerBadge}>
                        <Text style={styles.bannerBadgeText}>DASHBOARD</Text>
                    </View>
                    <Text style={styles.bannerTitle}>Check-in Guidance</Text>
                    <Text style={styles.bannerSub}>
                        Always verify the client's OTP at the location. On verification, the system will record your GPS coordinates.
                    </Text>
                </View>

                {/* Section: Upcoming Appointments */}
                <Text style={styles.sectionTitle}>Assigned Appointments ({upcoming.length})</Text>

                {isLoading && (
                    <ActivityIndicator size="large" color={Colors.PRIMARY} style={{ marginVertical: 24 }} />
                )}

                {!isLoading && fetchError && (
                    <View style={styles.errorBox}>
                        <Icon name="exclamation-circle" size={32} color={Colors.ERROR} style={{ marginBottom: 12 }} />
                        <Text style={styles.errorTitle}>Failed to load appointments</Text>
                        <TouchableOpacity style={styles.retryBtn} onPress={fetchAppointments}>
                            <Text style={styles.retryText}>Retry</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {!isLoading && !fetchError && upcoming.length === 0 && (
                    <View style={styles.emptyBox}>
                        <Icon name="calendar-check" size={36} color={Colors.TEXT_HINT} style={{ marginBottom: 12 }} />
                        <Text style={styles.emptyText}>No pending appointments assigned to you.</Text>
                    </View>
                )}

                {!isLoading && !fetchError && upcoming.map(appt => (
                    <View key={appt._id} style={styles.apptCard}>
                        <View style={styles.apptHeader}>
                            <View style={styles.clientIconBox}>
                                <Icon name="user" size={16} color={Colors.PRIMARY} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.clientName}>{appt.customerName}</Text>
                                <Text style={styles.clientPhone}>{appt.customerMobile}</Text>
                            </View>
                            <View style={styles.timeBadge}>
                                <Text style={styles.timeBadgeText}>PENDING</Text>
                            </View>
                        </View>

                        <View style={styles.apptDivider} />

                        <View style={styles.detailsRow}>
                            <Icon name="clock" size={13} color={Colors.TEXT_SECONDARY} style={styles.detailIcon} />
                            <Text style={styles.detailsText}>{formatDateTime(appt.dateTime)}</Text>
                        </View>

                        <View style={styles.detailsRow}>
                            <Icon name="map-marker-alt" size={13} color={Colors.TEXT_SECONDARY} style={styles.detailIcon} />
                            <Text style={[styles.detailsText, { fontWeight: '600' }]}>{appt.customerAddress}</Text>
                        </View>

                        {appt.details ? (
                            <View style={[styles.detailsRow, { alignItems: 'flex-start' }]}>
                                <Icon name="align-left" size={13} color={Colors.TEXT_SECONDARY} style={[styles.detailIcon, { marginTop: 3 }]} />
                                <Text style={styles.detailsText}>{appt.details}</Text>
                            </View>
                        ) : null}

                        <TouchableOpacity
                            style={styles.checkinBtn}
                            activeOpacity={0.8}
                            onPress={() => navigation.navigate(Routes.CHECKIN, {
                                appointmentId: appt._id,
                                customerName: appt.customerName,
                                customerMobile: appt.customerMobile,
                            })}
                        >
                            <Icon name="key" size={14} color={Colors.WHITE} style={{ marginRight: 8 }} />
                            <Text style={styles.checkinBtnText}>Check In with Customer OTP</Text>
                        </TouchableOpacity>
                    </View>
                ))}

                {/* Section: Completed History */}
                {completed.length > 0 && (
                    <>
                        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Recent Completions</Text>
                        {completed.map(appt => (
                            <View key={appt._id} style={[styles.apptCard, styles.apptCardCompleted]}>
                                <View style={styles.apptHeader}>
                                    <View style={[styles.clientIconBox, { backgroundColor: 'rgba(39, 174, 96, 0.1)' }]}>
                                        <Icon name="check" size={14} color={Colors.SUCCESS} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.clientName}>{appt.customerName}</Text>
                                        <Text style={styles.clientPhone}>{appt.customerMobile}</Text>
                                    </View>
                                    <View style={[styles.timeBadge, { backgroundColor: 'rgba(39, 174, 96, 0.12)' }]}>
                                        <Text style={[styles.timeBadgeText, { color: Colors.SUCCESS }]}>CHECKED IN</Text>
                                    </View>
                                </View>

                                <View style={styles.apptDivider} />

                                <View style={styles.detailsRow}>
                                    <Icon name="calendar-check" size={13} color={Colors.TEXT_SECONDARY} style={styles.detailIcon} />
                                    <Text style={styles.detailsText}>Scheduled: {formatDateTime(appt.dateTime)}</Text>
                                </View>

                                {appt.checkinTime && (
                                    <View style={styles.detailsRow}>
                                        <Icon name="user-clock" size={13} color={Colors.TEXT_SECONDARY} style={styles.detailIcon} />
                                        <Text style={styles.detailsText}>Checked in: {formatDateTime(appt.checkinTime)}</Text>
                                    </View>
                                )}

                                {appt.checkinLocation && (
                                    <View style={styles.detailsRow}>
                                        <Icon name="map-marked" size={13} color={Colors.TEXT_SECONDARY} style={styles.detailIcon} />
                                        <Text style={styles.detailsText}>
                                            Location: Lat {appt.checkinLocation.latitude.toFixed(4)}, Lng {appt.checkinLocation.longitude.toFixed(4)}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        ))}
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: Colors.BACKGROUND },
    scroll: { padding: 20, paddingBottom: 40 },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: Colors.DIVIDER,
    },
    topBarLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerInfo: {
        marginLeft: 12,
    },
    welcome: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
    },
    name: {
        fontSize: 18,
        fontWeight: '800',
        color: Colors.TEXT_PRIMARY,
    },
    occupation: {
        fontSize: 11,
        color: Colors.PRIMARY_DARK,
        fontWeight: '700',
        marginTop: 1,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: Colors.PRIMARY,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    avatarImg: {
        width: '100%',
        height: '100%',
    },
    avatarText: {
        color: Colors.WHITE,
        fontSize: 16,
        fontWeight: '800',
    },
    profileBtn: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: Colors.SURFACE,
        borderWidth: 1,
        borderColor: Colors.BORDER,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    statCard: {
        width: '48%',
        backgroundColor: Colors.SURFACE,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.BORDER,
        padding: 16,
    },
    statIcon: {
        marginBottom: 8,
    },
    statVal: {
        fontSize: 24,
        fontWeight: '900',
        color: Colors.TEXT_PRIMARY,
    },
    statLabel: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
        marginTop: 2,
    },
    banner: {
        backgroundColor: Colors.PRIMARY,
        borderRadius: 20,
        padding: 20,
        marginBottom: 24,
    },
    bannerBadge: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 20,
        paddingHorizontal: 8,
        paddingVertical: 3,
        alignSelf: 'flex-start',
        marginBottom: 10,
    },
    bannerBadgeText: {
        color: Colors.WHITE,
        fontSize: 9,
        fontWeight: '700',
        letterSpacing: 1.5,
    },
    bannerTitle: {
        color: Colors.WHITE,
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 6,
    },
    bannerSub: {
        color: 'rgba(255,255,255,0.85)',
        fontSize: 12,
        lineHeight: 18,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: Colors.TEXT_PRIMARY,
        marginBottom: 14,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    apptCard: {
        backgroundColor: Colors.SURFACE,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: Colors.BORDER,
        borderTopWidth: 4,
        borderTopColor: Colors.PRIMARY,
        padding: 16,
        marginBottom: 16,
    },
    apptCardCompleted: {
        borderTopColor: Colors.SUCCESS,
        opacity: 0.85,
    },
    apptHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    clientIconBox: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: Colors.PRIMARY_LIGHT,
        justifyContent: 'center',
        alignItems: 'center',
    },
    clientName: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.TEXT_PRIMARY,
    },
    clientPhone: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
        marginTop: 1,
    },
    timeBadge: {
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    timeBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#f59e0b',
    },
    apptDivider: {
        height: 1,
        backgroundColor: Colors.DIVIDER,
        marginVertical: 14,
    },
    detailsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    detailIcon: {
        width: 20,
        color: Colors.TEXT_SECONDARY,
    },
    detailsText: {
        flex: 1,
        fontSize: 13,
        color: Colors.TEXT_SECONDARY,
        lineHeight: 18,
    },
    checkinBtn: {
        backgroundColor: Colors.PRIMARY,
        borderRadius: 12,
        paddingVertical: 12,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        marginTop: 14,
    },
    checkinBtnText: {
        color: Colors.WHITE,
        fontSize: 14,
        fontWeight: '700',
    },
    emptyBox: {
        alignItems: 'center',
        paddingVertical: 40,
        backgroundColor: Colors.SURFACE,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: Colors.BORDER,
    },
    emptyText: {
        color: Colors.TEXT_SECONDARY,
        fontSize: 13,
        textAlign: 'center',
    },
    errorBox: {
        alignItems: 'center',
        paddingVertical: 30,
        backgroundColor: Colors.SURFACE,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: Colors.BORDER,
    },
    errorTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.TEXT_PRIMARY,
        marginBottom: 10,
    },
    retryBtn: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        backgroundColor: Colors.PRIMARY,
        borderRadius: 8,
    },
    retryText: {
        color: Colors.WHITE,
        fontSize: 12,
        fontWeight: '700',
    },
    safePending: {
        flex: 1,
        backgroundColor: Colors.BACKGROUND,
    },
    pendingContainerFull: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.BACKGROUND,
        padding: 24,
    },
    pendingImage: {
        width: 220,
        height: 220,
        marginBottom: 24,
    },
    badgePendingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(245, 158, 11, 0.08)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(245, 158, 11, 0.2)',
    },
    badgePendingText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#f59e0b',
    },
    pendingTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: Colors.TEXT_PRIMARY,
        marginBottom: 12,
        textAlign: 'center',
    },
    pendingSub: {
        fontSize: 14,
        color: Colors.TEXT_SECONDARY,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 12,
        paddingHorizontal: 16,
    },
    pendingSubSecondary: {
        fontSize: 13,
        color: Colors.TEXT_HINT,
        textAlign: 'center',
        lineHeight: 20,
        paddingHorizontal: 20,
    },
});

export default HomeScreen;
