import React, { useState, useEffect, useCallback } from 'react';
import {
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ActivityIndicator,
    RefreshControl,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { RootStackParamList } from '../../types/navigation';
import { Colors } from '../../constants/theme';
import { Routes } from '../../constants/routes';
import { useAppSelector } from '../../store';
import { API_BASE_URL } from '../../config';

type Props = NativeStackScreenProps<RootStackParamList, 'Appointments'>;

interface Employee {
    _id: string;
    name: string;
    email: string;
    mobile: string;
    occupation: string;
    userPhoto?: string;
}

interface Appointment {
    _id: string;
    customerName: string;
    customerMobile: string;
    customerAddress: string;
    dateTime: string;
    details?: string;
    status: 'pending' | 'checked_in' | 'completed';
    otp: string;
    assignedEmployee: Employee | null;
    checkinTime?: string;
    checkinLocation?: {
        latitude: number;
        longitude: number;
    };
}

const getImageUrl = (photoPath: string | undefined | null) => {
    if (!photoPath) return null;
    if (photoPath.startsWith('data:image/') || photoPath.startsWith('http://') || photoPath.startsWith('https://')) {
        return photoPath;
    }
    return `${API_BASE_URL.replace('/api', '')}${photoPath}`;
};

const AppointmentsScreen: React.FC<Props> = ({ navigation }) => {
    const token = useAppSelector(state => state.auth.user?.token);

    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [fetchError, setFetchError] = useState(false);

    const fetchAppointments = useCallback(async () => {
        if (!token) return;
        setFetchError(false);
        try {
            const res = await fetch(`${API_BASE_URL}/users/appointments`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
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
        fetchAppointments();
    }, [fetchAppointments]);

    const onRefresh = () => {
        setIsRefreshing(true);
        fetchAppointments();
    };

    const formatDateTime = (dateStr: string) => {
        if (!dateStr) return '—';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return '—';

        const day = d.getDate();
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const month = months[d.getMonth()];

        let hours = d.getHours();
        const minutes = d.getMinutes();
        const ampm = hours >= 12 ? 'pm' : 'am';
        hours = hours % 12;
        hours = hours ? hours : 12;
        const minStr = minutes < 10 ? '0' + minutes : minutes;

        return `${day} ${month}, ${hours}:${minStr} ${ampm}`;
    };

    const activeAppts = appointments.filter(a => a.status === 'pending' || a.status === 'checked_in');
    const pastAppts = appointments.filter(a => a.status === 'completed');

    return (
        <SafeAreaView style={styles.safe}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.BACKGROUND} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Icon name="chevron-left" size={18} color={Colors.TEXT_SECONDARY} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Appointments</Text>
                <View style={styles.backBtnPlaceholder} />
            </View>

            <ScrollView
                contentContainerStyle={styles.scroll}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[Colors.PRIMARY]} />
                }
            >
                {isLoading && (
                    <ActivityIndicator size="large" color={Colors.PRIMARY} style={{ marginVertical: 40 }} />
                )}

                {!isLoading && fetchError && (
                    <View style={styles.errorBox}>
                        <Icon name="wifi" size={32} color={Colors.BORDER} style={{ marginBottom: 12 }} />
                        <Text style={styles.errorTitle}>Failed to load appointments</Text>
                        <Text style={styles.errorSub}>Please check your connection and try again.</Text>
                        <TouchableOpacity style={styles.retryBtn} onPress={fetchAppointments} activeOpacity={0.8}>
                            <Text style={styles.retryText}>Retry</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {!isLoading && !fetchError && appointments.length === 0 && (
                    <View style={styles.emptyBox}>
                        <Icon name="calendar-check" size={40} color={Colors.BORDER} style={{ marginBottom: 12 }} />
                        <Text style={styles.emptyText}>No appointments scheduled yet.</Text>
                    </View>
                )}

                {/* Active Appointments */}
                {!isLoading && !fetchError && activeAppts.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Active Schedules ({activeAppts.length})</Text>
                        {activeAppts.map(appt => (
                            <View key={appt._id} style={styles.apptCard}>
                                <View style={styles.apptHeader}>
                                    <View style={styles.badgePendingContainer}>
                                        <Text style={styles.badgePendingText}>
                                            {appt.status === 'checked_in' ? 'IN PROGRESS' : 'PENDING'}
                                        </Text>
                                    </View>
                                    <Text style={styles.dateTimeText}>{formatDateTime(appt.dateTime)}</Text>
                                </View>

                                {/* OTP Display Box */}
                                <View style={styles.otpBox}>
                                    <View style={styles.otpLeft}>
                                        <Icon name="key" size={16} color={Colors.PRIMARY} style={{ marginRight: 10 }} />
                                        <View>
                                            <Text style={styles.otpLabel}>Daily Check-in OTP</Text>
                                            <Text style={styles.otpSubText}>Share this with your caregiver at check-in</Text>
                                        </View>
                                    </View>
                                    <Text style={styles.otpVal}>{appt.otp}</Text>
                                </View>

                                {/* Assigned Caregiver details */}
                                {appt.assignedEmployee ? (
                                    <View style={styles.caregiverContainer}>
                                        <Text style={styles.subTitle}>Assigned Caregiver</Text>
                                        <View style={styles.caregiverInfo}>
                                            {appt.assignedEmployee.userPhoto ? (
                                                <Image
                                                    source={{ uri: getImageUrl(appt.assignedEmployee.userPhoto) || undefined }}
                                                    style={styles.caregiverAvatar}
                                                />
                                            ) : (
                                                <Image
                                                    source={require('../../assets/user.png')}
                                                    style={styles.caregiverAvatar}
                                                />
                                            )}
                                            <View style={{ flex: 1, marginLeft: 12 }}>
                                                <Text style={styles.caregiverName}>{appt.assignedEmployee.name}</Text>
                                                <Text style={styles.caregiverSub}>{appt.assignedEmployee.occupation}</Text>
                                                <Text style={styles.caregiverPhone}>
                                                    <Icon name="phone" size={10} color={Colors.TEXT_SECONDARY} /> +91 {appt.assignedEmployee.mobile}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                ) : (
                                    <View style={styles.unassignedContainer}>
                                        <Icon name="info-circle" size={14} color={Colors.TEXT_SECONDARY} style={{ marginRight: 8 }} />
                                        <Text style={styles.unassignedText}>Caregiver assignment is pending</Text>
                                    </View>
                                )}

                                {/* Service address */}
                                <View style={styles.addressContainer}>
                                    <Icon name="map-marker-alt" size={12} color={Colors.TEXT_SECONDARY} style={styles.addressIcon} />
                                    <Text style={appt.customerAddress ? styles.addressText : styles.unassignedText}>
                                        {appt.customerAddress || 'No address specified'}
                                    </Text>
                                </View>

                                {appt.details ? (
                                    <View style={styles.detailsContainer}>
                                        <Icon name="align-left" size={12} color={Colors.TEXT_SECONDARY} style={styles.addressIcon} />
                                        <Text style={styles.detailsText}>{appt.details}</Text>
                                    </View>
                                ) : null}
                            </View>
                        ))}
                    </View>
                )}

                {/* Past/History Appointments */}
                {!isLoading && !fetchError && pastAppts.length > 0 && (
                    <View style={[styles.section, { marginTop: 24 }]}>
                        <Text style={styles.sectionTitle}>Completed History ({pastAppts.length})</Text>
                        {pastAppts.map(appt => (
                            <View key={appt._id} style={[styles.apptCard, styles.pastCard]}>
                                <View style={styles.apptHeader}>
                                    <View style={styles.badgeCompletedContainer}>
                                        <Text style={styles.badgeCompletedText}>COMPLETED</Text>
                                    </View>
                                    <Text style={styles.dateTimeText}>{formatDateTime(appt.dateTime)}</Text>
                                </View>

                                {appt.checkinTime && (
                                    <View style={styles.completedRow}>
                                        <Icon name="clock" size={12} color={Colors.TEXT_SECONDARY} style={{ marginRight: 8 }} />
                                        <Text style={styles.completedTimeText}>
                                            Checked In at: {formatDateTime(appt.checkinTime)}
                                        </Text>
                                    </View>
                                )}

                                {/* Assigned Caregiver details */}
                                {appt.assignedEmployee && (
                                    <View style={styles.caregiverContainerPast}>
                                        <View style={styles.caregiverInfo}>
                                            {appt.assignedEmployee.userPhoto ? (
                                                <Image
                                                    source={{ uri: getImageUrl(appt.assignedEmployee.userPhoto) || undefined }}
                                                    style={[styles.caregiverAvatar, { opacity: 0.8 }]}
                                                />
                                            ) : (
                                                <Image
                                                    source={require('../../assets/user.png')}
                                                    style={[styles.caregiverAvatar, { opacity: 0.8 }]}
                                                />
                                            )}
                                            <View style={{ flex: 1, marginLeft: 12 }}>
                                                <Text style={styles.caregiverNamePast}>{appt.assignedEmployee.name}</Text>
                                                <Text style={styles.caregiverSub}>{appt.assignedEmployee.occupation}</Text>
                                            </View>
                                        </View>
                                    </View>
                                )}
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>
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
    headerTitle: { fontSize: 17, fontWeight: '700', color: Colors.TEXT_PRIMARY },
    backBtnPlaceholder: { width: 30 },
    scroll: {
        padding: 20,
        paddingBottom: 40,
        flexGrow: 1,
    },
    section: {
        width: '100%',
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: Colors.TEXT_PRIMARY,
        marginBottom: 14,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
    },
    apptCard: {
        backgroundColor: Colors.WHITE,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.BORDER,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    pastCard: {
        opacity: 0.85,
    },
    apptHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    badgePendingContainer: {
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    badgePendingText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#f59e0b',
        letterSpacing: 0.5,
    },
    badgeCompletedContainer: {
        backgroundColor: 'rgba(39, 174, 96, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    badgeCompletedText: {
        fontSize: 10,
        fontWeight: '800',
        color: Colors.SUCCESS,
        letterSpacing: 0.5,
    },
    dateTimeText: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.TEXT_PRIMARY,
    },
    otpBox: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: Colors.PRIMARY_LIGHT,
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: Colors.BORDER,
        marginBottom: 14,
    },
    otpLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 10,
    },
    otpLabel: {
        fontSize: 13,
        fontWeight: '800',
        color: Colors.TEXT_PRIMARY,
    },
    otpSubText: {
        fontSize: 10,
        color: Colors.TEXT_SECONDARY,
        marginTop: 1,
    },
    otpVal: {
        fontSize: 20,
        fontWeight: '900',
        color: Colors.PRIMARY,
        letterSpacing: 1,
    },
    caregiverContainer: {
        borderTopWidth: 1,
        borderTopColor: Colors.DIVIDER,
        paddingTop: 12,
        marginBottom: 12,
    },
    caregiverContainerPast: {
        borderTopWidth: 1,
        borderTopColor: Colors.DIVIDER,
        paddingTop: 12,
    },
    subTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.TEXT_SECONDARY,
        marginBottom: 8,
    },
    caregiverInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    caregiverAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.PRIMARY_LIGHT,
    },
    caregiverName: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.TEXT_PRIMARY,
    },
    caregiverNamePast: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.TEXT_SECONDARY,
    },
    caregiverSub: {
        fontSize: 11,
        color: Colors.PRIMARY_DARK,
        fontWeight: '700',
        marginTop: 1,
    },
    caregiverPhone: {
        fontSize: 11,
        color: Colors.TEXT_SECONDARY,
        marginTop: 3,
    },
    unassignedContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.SURFACE,
        borderRadius: 10,
        padding: 10,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: Colors.BORDER,
    },
    unassignedText: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
        fontStyle: 'italic',
    },
    addressContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    addressIcon: {
        marginTop: 3,
        marginRight: 8,
        width: 14,
        textAlign: 'center',
    },
    addressText: {
        flex: 1,
        fontSize: 12.5,
        color: Colors.TEXT_SECONDARY,
        lineHeight: 18,
    },
    detailsContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        borderTopWidth: 1,
        borderTopColor: Colors.DIVIDER,
        paddingTop: 10,
        marginTop: 4,
    },
    detailsText: {
        flex: 1,
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
        lineHeight: 18,
    },
    completedRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    completedTimeText: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
        fontWeight: '600',
    },
    emptyBox: {
        alignItems: 'center',
        paddingVertical: 60,
        backgroundColor: Colors.SURFACE,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: Colors.BORDER,
        marginTop: 20,
    },
    emptyText: {
        color: Colors.TEXT_SECONDARY,
        fontSize: 13.5,
        textAlign: 'center',
    },
    errorBox: {
        alignItems: 'center',
        paddingVertical: 50,
        backgroundColor: Colors.SURFACE,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: Colors.BORDER,
        marginTop: 20,
    },
    errorTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.TEXT_PRIMARY,
        marginBottom: 4,
    },
    errorSub: {
        fontSize: 13,
        color: Colors.TEXT_SECONDARY,
        marginBottom: 20,
    },
    retryBtn: {
        paddingHorizontal: 28,
        paddingVertical: 10,
        backgroundColor: Colors.PRIMARY,
        borderRadius: 12,
    },
    retryText: {
        color: Colors.WHITE,
        fontSize: 13,
        fontWeight: '700',
    },
});

export default AppointmentsScreen;
