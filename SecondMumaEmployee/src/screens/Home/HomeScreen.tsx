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

const getImageUrl = (photoPath: string | undefined | null) => {
    if (!photoPath) return null;
    if (photoPath.startsWith('data:image/') || photoPath.startsWith('http://') || photoPath.startsWith('https://')) {
        return photoPath;
    }
    return `${API_BASE_URL.replace('/api', '')}${photoPath}`;
};

const HomeScreen: React.FC<Props> = ({ navigation }) => {
    const dispatch = useAppDispatch();
    const { user, token } = useAppSelector(state => state.auth);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [activeTab, setActiveTab] = useState<'today' | 'my_appointments'>('today');
    const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});
    const [isCalendarExpanded, setIsCalendarExpanded] = useState(false);
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

    const handleCompleteAppointment = async (appointmentId: string) => {
        Alert.alert(
            'Complete Appointment',
            'Are you sure you want to mark this appointment as completed?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Yes, Complete',
                    onPress: async () => {
                        try {
                            const res = await fetch(`${API_BASE_URL}/employee/appointments/${appointmentId}/complete`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    Authorization: `Bearer ${token}`,
                                },
                            });
                            const data = await res.json();
                            if (res.ok && data.success) {
                                Alert.alert('Success', 'Appointment marked as completed.');
                                fetchAppointments();
                            } else {
                                Alert.alert('Error', data.message || 'Failed to complete appointment.');
                            }
                        } catch (err) {
                            Alert.alert('Error', 'Network error. Failed to complete appointment.');
                        }
                    }
                }
            ]
        );
    };

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

    const isSameDate = (dateStr: string, targetDate: Date) => {
        if (!dateStr) return false;
        const d = new Date(dateStr);
        return d.getDate() === targetDate.getDate() &&
               d.getMonth() === targetDate.getMonth() &&
               d.getFullYear() === targetDate.getFullYear();
    };

    const isDateToday = (dateStr: string) => {
        if (!dateStr) return false;
        const d = new Date(dateStr);
        const t = new Date();
        return d.getDate() === t.getDate() &&
               d.getMonth() === t.getMonth() &&
               d.getFullYear() === t.getFullYear();
    };

    const isFutureDate = (dateStr: string) => {
        if (!dateStr) return false;
        const d = new Date(dateStr);
        d.setHours(0, 0, 0, 0);
        const t = new Date();
        t.setHours(0, 0, 0, 0);
        return d > t;
    };

    const getDaysInMonthGrid = (monthDate: Date) => {
        const year = monthDate.getFullYear();
        const month = monthDate.getMonth();
        
        const firstDay = new Date(year, month, 1);
        const startDayOfWeek = firstDay.getDay(); // 0 is Sunday
        const daysCount = new Date(year, month + 1, 0).getDate();
        
        const grid: (Date | null)[] = [];
        for (let i = 0; i < startDayOfWeek; i++) {
            grid.push(null);
        }
        for (let d = 1; d <= daysCount; d++) {
            grid.push(new Date(year, month, d));
        }
        return grid;
    };

    const hasAppointmentOnDate = (date: Date) => {
        return appointments.some(appt => {
            const d = new Date(appt.dateTime);
            return d.getDate() === date.getDate() &&
                   d.getMonth() === date.getMonth() &&
                   d.getFullYear() === date.getFullYear();
        });
    };

    const toggleCard = (id: string) => {
        setExpandedCards(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const filteredAppointments = appointments.filter(appt => {
        if (activeTab === 'today') {
            return isSameDate(appt.dateTime, selectedDate) || (appt.checkinTime && isSameDate(appt.checkinTime, selectedDate));
        }
        return true;
    });

    const sortedAppointments = [...filteredAppointments].sort((a, b) => {
        const statusWeight = {
            pending: 1,
            checked_in: 2,
            completed: 3
        };
        const wA = statusWeight[a.status] || 99;
        const wB = statusWeight[b.status] || 99;
        if (wA !== wB) return wA - wB;
        
        const tA = new Date(a.checkinTime || a.dateTime).getTime();
        const tB = new Date(b.checkinTime || b.dateTime).getTime();
        if (a.status === 'pending') {
            return new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime();
        } else {
            return tB - tA;
        }
    });

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
                                source={{ uri: getImageUrl(user.userPhoto) || undefined }} 
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

                {/* Tabs & Calendar Toggle Row */}
                <View style={styles.tabsRowContainer}>
                    <View style={[styles.tabContainer, { flex: 1, marginBottom: 0 }]}>
                        <TouchableOpacity
                            style={[styles.tabButton, activeTab === 'today' && styles.tabButtonActive]}
                            activeOpacity={0.8}
                            onPress={() => setActiveTab('today')}
                        >
                            <Icon name="calendar-day" size={14} color={activeTab === 'today' ? Colors.WHITE : Colors.TEXT_SECONDARY} style={{ marginRight: 8 }} />
                            <Text style={[styles.tabButtonText, activeTab === 'today' && styles.tabButtonTextActive]}>Today</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tabButton, activeTab === 'my_appointments' && styles.tabButtonActive]}
                            activeOpacity={0.8}
                            onPress={() => setActiveTab('my_appointments')}
                        >
                            <Icon name="list" size={14} color={activeTab === 'my_appointments' ? Colors.WHITE : Colors.TEXT_SECONDARY} style={{ marginRight: 8 }} />
                            <Text style={[styles.tabButtonText, activeTab === 'my_appointments' && styles.tabButtonTextActive]}>My Appointments</Text>
                        </TouchableOpacity>
                    </View>

                    {activeTab === 'today' && (
                        <TouchableOpacity
                            style={[styles.tabCalendarIconBtn, isCalendarExpanded && styles.tabCalendarIconBtnActive]}
                            onPress={() => setIsCalendarExpanded(!isCalendarExpanded)}
                            activeOpacity={0.7}
                        >
                            <Icon name="calendar-alt" size={16} color={isCalendarExpanded ? Colors.WHITE : Colors.PRIMARY} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Custom Calendar view (Only visible in 'Today' tab when expanded) */}
                {activeTab === 'today' && isCalendarExpanded && (
                    <View style={styles.calendarCard}>
                        {/* Calendar Month Header */}
                        <View style={styles.calendarHeader}>
                            <TouchableOpacity 
                                onPress={() => {
                                    const prev = new Date(currentMonth);
                                    prev.setMonth(prev.getMonth() - 1);
                                    setCurrentMonth(prev);
                                }}
                                style={styles.chevronBtn}
                            >
                                <Icon name="chevron-left" size={14} color={Colors.TEXT_PRIMARY} />
                            </TouchableOpacity>
                            <Text style={styles.monthText}>
                                {currentMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                            </Text>
                            <TouchableOpacity 
                                onPress={() => {
                                    const next = new Date(currentMonth);
                                    next.setMonth(next.getMonth() + 1);
                                    setCurrentMonth(next);
                                }}
                                style={styles.chevronBtn}
                            >
                                <Icon name="chevron-right" size={14} color={Colors.TEXT_PRIMARY} />
                            </TouchableOpacity>
                        </View>

                        {/* Week days row */}
                        <View style={styles.weekDaysRow}>
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                <Text key={day} style={styles.weekDayText}>{day.slice(0, 2)}</Text>
                            ))}
                        </View>

                        {/* Days Grid */}
                        <View style={styles.daysGrid}>
                            {getDaysInMonthGrid(currentMonth).map((day, index) => {
                                if (!day) {
                                    return <View key={`empty-${index}`} style={styles.dayCell} />;
                                }

                                const isSelected = day.getDate() === selectedDate.getDate() &&
                                                   day.getMonth() === selectedDate.getMonth() &&
                                                   day.getFullYear() === selectedDate.getFullYear();
                                
                                const todayDate = new Date();
                                const isToday = day.getDate() === todayDate.getDate() &&
                                                day.getMonth() === todayDate.getMonth() &&
                                                day.getFullYear() === todayDate.getFullYear();

                                const hasAppt = hasAppointmentOnDate(day);

                                return (
                                    <TouchableOpacity
                                        key={day.toISOString()}
                                        style={[
                                            styles.dayCell,
                                            isSelected && styles.selectedDayCell,
                                            isToday && !isSelected && styles.todayDayCell,
                                        ]}
                                        activeOpacity={0.8}
                                        onPress={() => {
                                            setSelectedDate(day);
                                        }}
                                    >
                                        <Text style={[
                                            styles.dayText,
                                            isSelected && styles.selectedDayText,
                                            isToday && styles.todayDayText,
                                        ]}>
                                            {day.getDate()}
                                        </Text>
                                        {hasAppt && (
                                            <View style={[
                                                styles.dotIndicator,
                                                isSelected && styles.selectedDotIndicator
                                            ]} />
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                )}

                {/* Section Title */}
                <Text style={styles.sectionTitle}>
                    {activeTab === 'today' 
                        ? `Schedule for ${selectedDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}` 
                        : "My Appointments"} ({sortedAppointments.length})
                </Text>

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

                {!isLoading && !fetchError && sortedAppointments.length === 0 && (
                    <View style={styles.emptyBox}>
                        <Icon name="calendar-check" size={36} color={Colors.TEXT_HINT} style={{ marginBottom: 12 }} />
                        <Text style={styles.emptyText}>
                            {activeTab === 'today' 
                                ? "No appointments scheduled for this date." 
                                : "No appointments assigned to you."}
                        </Text>
                    </View>
                )}

                {!isLoading && !fetchError && sortedAppointments.map(appt => {
                    const isCompleted = appt.status === 'completed';
                    const isCheckedIn = appt.status === 'checked_in';
                    const isPending = appt.status === 'pending';
                    const isFuture = isPending && isFutureDate(appt.dateTime);
                    const isExpanded = !!expandedCards[appt._id];

                    return (
                        <View key={appt._id} style={[styles.apptCard, isCompleted && styles.apptCardCompleted]}>
                            {/* Clickable Header for collapsing/expanding */}
                            <TouchableOpacity
                                activeOpacity={0.7}
                                onPress={() => toggleCard(appt._id)}
                                style={styles.cardHeaderToggle}
                            >
                                <View style={styles.apptHeader}>
                                    <View style={[styles.clientIconBox, !isPending && { backgroundColor: 'rgba(39, 174, 96, 0.1)' }]}>
                                        <Icon 
                                            name={isPending ? "user" : (isCompleted ? "check" : "user-clock")} 
                                            size={14} 
                                            color={isPending ? Colors.PRIMARY : Colors.SUCCESS} 
                                        />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.clientName}>{appt.customerName}</Text>
                                        <Text style={styles.clientPhone}>{appt.customerMobile}</Text>
                                        <Text style={styles.clientTimeMuted}>{formatDateTime(appt.dateTime)}</Text>
                                    </View>
                                    <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
                                        <View style={[
                                            styles.timeBadge,
                                            isCompleted 
                                                ? { backgroundColor: 'rgba(39, 174, 96, 0.12)' }
                                                : (isCheckedIn ? { backgroundColor: 'rgba(245, 158, 11, 0.1)' } : { backgroundColor: 'rgba(245, 158, 11, 0.1)' }),
                                            { marginBottom: 6 }
                                        ]}>
                                            <Text style={[
                                                styles.timeBadgeText,
                                                isCompleted 
                                                    ? { color: Colors.SUCCESS }
                                                    : { color: '#f59e0b' }
                                            ]}>
                                                {appt.status === 'checked_in' ? 'IN PROGRESS' : appt.status.toUpperCase()}
                                            </Text>
                                        </View>
                                        <Icon name={isExpanded ? "chevron-up" : "chevron-down"} size={12} color={Colors.TEXT_SECONDARY} />
                                    </View>
                                </View>
                            </TouchableOpacity>

                            {/* Expanded Details Content */}
                            {isExpanded && (
                                <View style={styles.expandedContent}>
                                    <View style={styles.apptDivider} />

                                    <View style={styles.detailsRow}>
                                        <Icon name="clock" size={13} color={Colors.TEXT_SECONDARY} style={styles.detailIcon} />
                                        <Text style={styles.detailsText}>Scheduled: {formatDateTime(appt.dateTime)}</Text>
                                    </View>

                                    {appt.checkinTime && (
                                        <View style={styles.detailsRow}>
                                            <Icon name="user-clock" size={13} color={Colors.TEXT_SECONDARY} style={styles.detailIcon} />
                                            <Text style={styles.detailsText}>Checked in: {formatDateTime(appt.checkinTime)}</Text>
                                        </View>
                                    )}

                                    <View style={styles.detailsRow}>
                                        <Icon name="map-marker-alt" size={13} color={Colors.TEXT_SECONDARY} style={styles.detailIcon} />
                                        <Text style={[styles.detailsText, { fontWeight: '600' }]}>{appt.customerAddress}</Text>
                                    </View>

                                    {appt.checkinLocation && appt.checkinLocation.latitude != null && appt.checkinLocation.longitude != null && (
                                        <View style={styles.detailsRow}>
                                            <Icon name="map-marked" size={13} color={Colors.TEXT_SECONDARY} style={styles.detailIcon} />
                                            <Text style={styles.detailsText}>
                                                Coordinates: Lat {appt.checkinLocation.latitude.toFixed(5)}, Lng {appt.checkinLocation.longitude.toFixed(5)}
                                            </Text>
                                        </View>
                                    )}

                                    {appt.details ? (
                                        <View style={[styles.detailsRow, { alignItems: 'flex-start' }]}>
                                            <Icon name="align-left" size={13} color={Colors.TEXT_SECONDARY} style={[styles.detailIcon, { marginTop: 3 }]} />
                                            <Text style={styles.detailsText}>{appt.details}</Text>
                                        </View>
                                    ) : null}

                                    {isPending && (
                                        <TouchableOpacity
                                            style={[styles.checkinBtn, isFuture && styles.checkinBtnDisabled]}
                                            activeOpacity={isFuture ? 1 : 0.8}
                                            onPress={() => {
                                                if (isFuture) {
                                                    Alert.alert(
                                                        'Future Appointment',
                                                        'You cannot check in for appointments scheduled on future dates.'
                                                    );
                                                    return;
                                                }
                                                navigation.navigate(Routes.CHECKIN, {
                                                    appointmentId: appt._id,
                                                    customerName: appt.customerName,
                                                    customerMobile: appt.customerMobile,
                                                });
                                            }}
                                        >
                                            <Icon name="key" size={14} color={Colors.WHITE} style={{ marginRight: 8 }} />
                                            <Text style={styles.checkinBtnText}>Check In with Customer OTP</Text>
                                        </TouchableOpacity>
                                    )}

                                    {isCheckedIn && (
                                        <TouchableOpacity
                                            style={styles.completeBtn}
                                            activeOpacity={0.8}
                                            onPress={() => handleCompleteAppointment(appt._id)}
                                        >
                                            <Icon name="check-double" size={14} color={Colors.WHITE} style={{ marginRight: 8 }} />
                                            <Text style={styles.completeBtnText}>Mark as Completed</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            )}
                        </View>
                    );
                })}
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
    completeBtn: {
        backgroundColor: Colors.SUCCESS,
        borderRadius: 12,
        paddingVertical: 12,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        marginTop: 14,
    },
    completeBtnText: {
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
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: Colors.PRIMARY_LIGHT,
        borderRadius: 12,
        padding: 4,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: Colors.BORDER,
    },
    tabButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 8,
    },
    tabButtonActive: {
        backgroundColor: Colors.PRIMARY,
    },
    tabButtonText: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.TEXT_SECONDARY,
    },
    tabButtonTextActive: {
        color: Colors.WHITE,
    },
    tabsRowContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        gap: 10,
    },
    tabCalendarIconBtn: {
        width: 44,
        height: 44,
        backgroundColor: Colors.PRIMARY_LIGHT,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.BORDER,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tabCalendarIconBtnActive: {
        backgroundColor: Colors.PRIMARY,
        borderColor: Colors.PRIMARY,
    },
    calendarCard: {
        backgroundColor: Colors.SURFACE,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: Colors.BORDER,
        padding: 16,
        marginBottom: 20,
    },
    calendarHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    chevronBtn: {
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 16,
        backgroundColor: Colors.PRIMARY_LIGHT,
    },
    monthText: {
        fontSize: 16,
        fontWeight: '800',
        color: Colors.TEXT_PRIMARY,
    },
    weekDaysRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    weekDayText: {
        width: `${100 / 7}%`,
        textAlign: 'center',
        fontSize: 12,
        fontWeight: '700',
        color: Colors.TEXT_SECONDARY,
    },
    daysGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    dayCell: {
        width: `${100 / 7}%`,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 2,
        borderRadius: 20,
    },
    dayText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.TEXT_PRIMARY,
    },
    selectedDayCell: {
        backgroundColor: Colors.PRIMARY,
    },
    selectedDayText: {
        color: Colors.WHITE,
        fontWeight: '700',
    },
    todayDayCell: {
        borderWidth: 1.5,
        borderColor: Colors.PRIMARY,
    },
    todayDayText: {
        color: Colors.PRIMARY,
        fontWeight: '700',
    },
    dotIndicator: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: Colors.PRIMARY,
        marginTop: 2,
    },
    selectedDotIndicator: {
        backgroundColor: Colors.WHITE,
    },
    cardHeaderToggle: {
        width: '100%',
    },
    clientTimeMuted: {
        fontSize: 12,
        color: Colors.TEXT_HINT,
        marginTop: 3,
    },
    expandedContent: {
        marginTop: 0,
        paddingBottom: 4,
    },
    checkinBtnDisabled: {
        backgroundColor: Colors.DISABLED,
    },
});

export default HomeScreen;
