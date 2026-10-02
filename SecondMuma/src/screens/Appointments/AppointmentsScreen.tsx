import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootStackParamList } from '../../types/navigation';
import { Colors } from '../../constants/theme';
import { useAppSelector } from '../../store';
import { API_BASE_URL } from '../../config';

const APPOINTMENTS_CACHE_KEY = 'cached_user_appointments';

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

const getLocalDateString = (dateInput: Date | string): string => {
    if (!dateInput) return '';
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const formatSelectedDateHeader = (dateStr: string): string => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    const todayStr = getLocalDateString(new Date());

    const formatted = d.toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });

    if (dateStr === todayStr) {
        return `Today (${formatted})`;
    }
    return formatted;
};

const AppointmentsScreen: React.FC<Props> = ({ navigation }) => {
    const token = useAppSelector(state => state.auth.user?.token);

    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [fetchError, setFetchError] = useState(false);
    const [isCacheLoaded, setIsCacheLoaded] = useState(false);

    const todayStr = getLocalDateString(new Date());
    const [selectedDate, setSelectedDate] = useState<string>(todayStr);
    const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
    const [expandedCardIds, setExpandedCardIds] = useState<Set<string>>(new Set());

    // 1. Load cached appointments immediately on mount
    useEffect(() => {
        let isMounted = true;
        const loadCache = async () => {
            try {
                const cached = await AsyncStorage.getItem(APPOINTMENTS_CACHE_KEY);
                if (cached && isMounted) {
                    const parsed = JSON.parse(cached);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        setAppointments(parsed);
                        setIsLoading(false); // Instantly render cached appointments!
                    }
                }
            } catch (e) {
                console.log('Error loading cached appointments:', e);
            } finally {
                if (isMounted) setIsCacheLoaded(true);
            }
        };
        loadCache();
        return () => { isMounted = false; };
    }, []);

    const toggleExpandCard = (id: string) => {
        setExpandedCardIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    // 2. Fetch fresh data from backend
    const fetchAppointments = useCallback(async (isSilent = false) => {
        if (!token) return;
        if (!isSilent && appointments.length === 0) {
            setFetchError(false);
        }
        try {
            const res = await fetch(`${API_BASE_URL}/users/appointments`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await res.json();
            if (res.ok && data.success) {
                const appts = data.data || [];
                setAppointments(appts);
                setFetchError(false);
                AsyncStorage.setItem(APPOINTMENTS_CACHE_KEY, JSON.stringify(appts)).catch(() => {});
            } else {
                if (appointments.length === 0) setFetchError(true);
            }
        } catch {
            if (appointments.length === 0) setFetchError(true);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [token, appointments.length]);

    useEffect(() => {
        if (isCacheLoaded) {
            fetchAppointments(appointments.length > 0);
        }
    }, [isCacheLoaded, token]);

    const onRefresh = () => {
        setIsRefreshing(true);
        fetchAppointments(true);
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

    // Counts of appointments per date
    const appointmentCounts = useMemo(() => {
        const countsMap = new Map<string, number>();
        appointments.forEach(appt => {
            if (appt.dateTime) {
                const dateStr = getLocalDateString(appt.dateTime);
                if (dateStr) {
                    countsMap.set(dateStr, (countsMap.get(dateStr) || 0) + 1);
                }
            }
        });
        return countsMap;
    }, [appointments]);

    // Calendar grid calculation
    const calendarGrid = useMemo(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();

        const firstDayIndex = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const days: Array<{
            dayNumber: number;
            dateString: string;
            isCurrentMonth: boolean;
            isToday: boolean;
            appointmentCount: number;
        }> = [];

        // Previous month padding
        const prevMonthDays = new Date(year, month, 0).getDate();
        for (let i = firstDayIndex - 1; i >= 0; i--) {
            const dayNum = prevMonthDays - i;
            const prevDate = new Date(year, month - 1, dayNum);
            const dateString = getLocalDateString(prevDate);
            days.push({
                dayNumber: dayNum,
                dateString,
                isCurrentMonth: false,
                isToday: dateString === todayStr,
                appointmentCount: appointmentCounts.get(dateString) || 0,
            });
        }

        // Current month
        for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
            const dateObj = new Date(year, month, dayNum);
            const dateString = getLocalDateString(dateObj);
            days.push({
                dayNumber: dayNum,
                dateString,
                isCurrentMonth: true,
                isToday: dateString === todayStr,
                appointmentCount: appointmentCounts.get(dateString) || 0,
            });
        }

        // Next month padding up to multiple of 7
        const totalSlots = Math.ceil(days.length / 7) * 7;
        const nextPaddingCount = totalSlots - days.length;
        for (let dayNum = 1; dayNum <= nextPaddingCount; dayNum++) {
            const nextDate = new Date(year, month + 1, dayNum);
            const dateString = getLocalDateString(nextDate);
            days.push({
                dayNumber: dayNum,
                dateString,
                isCurrentMonth: false,
                isToday: dateString === todayStr,
                appointmentCount: appointmentCounts.get(dateString) || 0,
            });
        }

        return days;
    }, [currentMonth, appointmentCounts, todayStr]);

    const handlePrevMonth = () => {
        setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    };

    const handleJumpToToday = () => {
        const now = new Date();
        setCurrentMonth(now);
        setSelectedDate(getLocalDateString(now));
    };

    // Filter appointments for selected date
    const selectedDateAppts = useMemo(() => {
        return appointments.filter(a => getLocalDateString(a.dateTime) === selectedDate);
    }, [appointments, selectedDate]);

    const renderApptCard = (appt: Appointment) => {
        const isCompleted = appt.status === 'completed';
        const isCheckedIn = appt.status === 'checked_in';
        const isTodayAppt = getLocalDateString(appt.dateTime) === todayStr;
        const isExpanded = expandedCardIds.has(appt._id);

        return (
            <View key={appt._id} style={[styles.apptCard, isCompleted && styles.pastCard]}>
                <View style={styles.apptHeader}>
                    <View style={isCompleted ? styles.badgeCompletedContainer : styles.badgePendingContainer}>
                        <Text style={isCompleted ? styles.badgeCompletedText : styles.badgePendingText}>
                            {isCompleted ? 'COMPLETED' : isCheckedIn ? 'IN PROGRESS' : 'PENDING'}
                        </Text>
                    </View>
                    <Text style={styles.dateTimeText}>{formatDateTime(appt.dateTime)}</Text>
                </View>

                {/* Show OTP only for today's active/pending/in progress appointment */}
                {isTodayAppt && !isCompleted && (
                    <View style={styles.otpBox}>
                        <View style={styles.otpLeft}>
                            <Icon name="key" size={15} color={Colors.PRIMARY} style={{ marginRight: 10 }} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.otpLabel}>Daily Check-in OTP</Text>
                                <Text style={styles.otpSubText}>Share this with your caregiver at check-in</Text>
                            </View>
                        </View>
                        <View style={styles.otpBadgeContainer}>
                            <Text style={styles.otpVal}>{appt.otp}</Text>
                        </View>
                    </View>
                )}

                {isCompleted && appt.checkinTime && (
                    <View style={styles.completedRow}>
                        <Icon name="clock" size={12} color={Colors.TEXT_SECONDARY} style={{ marginRight: 8 }} />
                        <Text style={styles.completedTimeText}>
                            Checked In at: {formatDateTime(appt.checkinTime)}
                        </Text>
                    </View>
                )}

                {appt.assignedEmployee ? (
                    <View style={isCompleted ? styles.caregiverContainerPast : styles.caregiverContainer}>
                        {!isCompleted && <Text style={styles.subTitle}>Assigned Caregiver</Text>}
                        <View style={styles.caregiverInfo}>
                            {appt.assignedEmployee.userPhoto ? (
                                <Image
                                    source={{ uri: getImageUrl(appt.assignedEmployee.userPhoto) || undefined }}
                                    style={[styles.caregiverAvatar, isCompleted && { opacity: 0.8 }]}
                                />
                            ) : (
                                <Image
                                    source={require('../../assets/user.png')}
                                    style={[styles.caregiverAvatar, isCompleted && { opacity: 0.8 }]}
                                />
                            )}
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text style={isCompleted ? styles.caregiverNamePast : styles.caregiverName}>{appt.assignedEmployee.name}</Text>
                                <Text style={styles.caregiverSub}>{appt.assignedEmployee.occupation}</Text>
                                {!isCompleted && (
                                    <Text style={styles.caregiverPhone}>
                                        <Icon name="phone" size={10} color={Colors.TEXT_SECONDARY} /> +91 {appt.assignedEmployee.mobile}
                                    </Text>
                                )}
                            </View>
                        </View>
                    </View>
                ) : (
                    !isCompleted && (
                        <View style={styles.unassignedContainer}>
                            <Icon name="info-circle" size={14} color={Colors.TEXT_SECONDARY} style={{ marginRight: 8 }} />
                            <Text style={styles.unassignedText}>Caregiver assignment is pending</Text>
                        </View>
                    )
                )}

                {/* Collapsible Address & Package Details */}
                {isExpanded && (
                    <View style={styles.expandedContent}>
                        <View style={styles.addressContainer}>
                            <Icon name="map-marker-alt" size={12} color={Colors.PRIMARY} style={styles.addressIcon} />
                            <Text style={appt.customerAddress ? styles.addressText : styles.unassignedText}>
                                {appt.customerAddress || 'No address specified'}
                            </Text>
                        </View>

                        {appt.details ? (
                            <View style={styles.detailsContainer}>
                                <Icon name="align-left" size={12} color={Colors.PRIMARY} style={styles.addressIcon} />
                                <Text style={styles.detailsText}>{appt.details}</Text>
                            </View>
                        ) : null}
                    </View>
                )}

                {/* Expand / Collapse Button */}
                <TouchableOpacity
                    style={styles.expandToggleBtn}
                    onPress={() => toggleExpandCard(appt._id)}
                    activeOpacity={0.7}
                >
                    <Text style={styles.expandToggleText}>
                        {isExpanded ? 'Hide Details' : 'View Address & Details'}
                    </Text>
                    <Icon
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={11}
                        color={Colors.PRIMARY}
                        style={{ marginLeft: 6 }}
                    />
                </TouchableOpacity>
            </View>
        );
    };

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
                {/* Interactive Calendar Card (always visible by default) */}
                <View style={styles.calendarCard}>
                    <View style={styles.calendarHeader}>
                        <TouchableOpacity style={styles.monthNavBtn} onPress={handlePrevMonth} activeOpacity={0.7}>
                            <Icon name="chevron-left" size={14} color={Colors.TEXT_PRIMARY} />
                        </TouchableOpacity>

                        <View style={styles.monthTitleContainer}>
                            <Text style={styles.monthTitleText}>
                                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                            </Text>
                            {selectedDate !== todayStr && (
                                <TouchableOpacity style={styles.todayPill} onPress={handleJumpToToday} activeOpacity={0.7}>
                                    <Text style={styles.todayPillText}>Today</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        <TouchableOpacity style={styles.monthNavBtn} onPress={handleNextMonth} activeOpacity={0.7}>
                            <Icon name="chevron-right" size={14} color={Colors.TEXT_PRIMARY} />
                        </TouchableOpacity>
                    </View>

                    {/* Days of week header */}
                    <View style={styles.weekDaysRow}>
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, index) => (
                            <Text key={index} style={styles.weekDayText}>{d}</Text>
                        ))}
                    </View>

                    {/* Calendar Days Grid */}
                    <View style={styles.daysGrid}>
                        {calendarGrid.map((item, index) => {
                            const isSelected = item.dateString === selectedDate;
                            return (
                                <TouchableOpacity
                                    key={index}
                                    style={styles.dayCell}
                                    onPress={() => {
                                        setSelectedDate(item.dateString);
                                        if (!item.isCurrentMonth) {
                                            const [y, m] = item.dateString.split('-').map(Number);
                                            setCurrentMonth(new Date(y, m - 1, 1));
                                        }
                                    }}
                                    activeOpacity={0.7}
                                >
                                    <View style={[
                                        styles.dayNumberContainer,
                                        isSelected && styles.daySelectedContainer,
                                        item.isToday && !isSelected && styles.dayTodayContainer
                                    ]}>
                                        <Text style={[
                                            styles.dayNumberText,
                                            !item.isCurrentMonth && styles.dayOutsideText,
                                            item.isToday && !isSelected && styles.dayTodayText,
                                            isSelected && styles.daySelectedText
                                        ]}>
                                            {item.dayNumber}
                                        </Text>
                                    </View>

                                    {item.appointmentCount > 0 && (
                                        <View style={styles.dotsRow}>
                                            {Array.from({ length: Math.min(item.appointmentCount, 3) }).map((_, dotIdx) => (
                                                <View
                                                    key={dotIdx}
                                                    style={[
                                                        styles.apptDot,
                                                        isSelected && styles.apptDotSelected,
                                                        dotIdx > 0 && { marginLeft: 3 }
                                                    ]}
                                                />
                                            ))}
                                        </View>
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {/* Selected Date Appointments Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                        Schedule for {formatSelectedDateHeader(selectedDate)}
                    </Text>

                    {isLoading && appointments.length === 0 ? (
                        <View style={styles.emptyBox}>
                            <ActivityIndicator size="small" color={Colors.PRIMARY} style={{ marginBottom: 10 }} />
                            <Text style={styles.emptyText}>Loading appointments...</Text>
                        </View>
                    ) : fetchError && appointments.length === 0 ? (
                        <View style={styles.errorBox}>
                            <Icon name="wifi" size={32} color={Colors.BORDER} style={{ marginBottom: 12 }} />
                            <Text style={styles.errorTitle}>Failed to load appointments</Text>
                            <Text style={styles.errorSub}>Please check your connection and try again.</Text>
                            <TouchableOpacity style={styles.retryBtn} onPress={() => fetchAppointments(false)} activeOpacity={0.8}>
                                <Text style={styles.retryText}>Retry</Text>
                            </TouchableOpacity>
                        </View>
                    ) : selectedDateAppts.length > 0 ? (
                        selectedDateAppts.map(renderApptCard)
                    ) : (
                        <View style={styles.emptyBox}>
                            <Icon name="calendar-day" size={36} color={Colors.BORDER} style={{ marginBottom: 12 }} />
                            <Text style={styles.emptyTitle}>No Appointment Scheduled</Text>
                            <Text style={styles.emptyText}>
                                There are no sessions scheduled for this date. Tapping dates with a pink dot shows scheduled sessions.
                            </Text>
                        </View>
                    )}
                </View>
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
    calendarCard: {
        backgroundColor: Colors.WHITE,
        borderRadius: 20,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: Colors.BORDER,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    calendarHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
        paddingHorizontal: 4,
    },
    monthNavBtn: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: 'rgba(0, 0, 0, 0.04)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    monthTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    monthTitleText: {
        fontSize: 16,
        fontWeight: '800',
        color: Colors.TEXT_PRIMARY,
        marginRight: 8,
    },
    todayPill: {
        backgroundColor: 'rgba(255, 23, 107, 0.1)',
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 12,
    },
    todayPillText: {
        fontSize: 11,
        fontWeight: '700',
        color: Colors.PRIMARY,
    },
    weekDaysRow: {
        flexDirection: 'row',
        marginBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0, 0, 0, 0.05)',
        paddingBottom: 8,
    },
    weekDayText: {
        flex: 1,
        textAlign: 'center',
        fontSize: 12,
        fontWeight: '700',
        color: Colors.TEXT_SECONDARY,
        textTransform: 'uppercase',
    },
    daysGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    dayCell: {
        width: `${100 / 7}%`,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 2,
    },
    dayNumberContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    daySelectedContainer: {
        backgroundColor: Colors.PRIMARY,
    },
    dayTodayContainer: {
        borderWidth: 1.5,
        borderColor: Colors.PRIMARY,
        backgroundColor: 'rgba(255, 23, 107, 0.08)',
    },
    dayNumberText: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.TEXT_PRIMARY,
    },
    dayOutsideText: {
        color: '#CBD5E0',
    },
    dayTodayText: {
        color: Colors.PRIMARY,
        fontWeight: '800',
    },
    daySelectedText: {
        color: Colors.WHITE,
        fontWeight: '800',
    },
    dotsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute',
        bottom: 3,
    },
    apptDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: Colors.PRIMARY,
    },
    apptDotSelected: {
        backgroundColor: Colors.PRIMARY,
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
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: Colors.PRIMARY_LIGHT,
        borderRadius: 14,
        padding: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 23, 107, 0.15)',
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
        fontSize: 10.5,
        color: Colors.TEXT_SECONDARY,
        marginTop: 2,
        lineHeight: 14,
    },
    otpBadgeContainer: {
        backgroundColor: Colors.WHITE,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(255, 23, 107, 0.2)',
        shadowColor: Colors.PRIMARY,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
        elevation: 1,
    },
    otpVal: {
        fontSize: 18,
        fontWeight: '900',
        color: Colors.PRIMARY,
        letterSpacing: 1.5,
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
    expandedContent: {
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0, 0, 0, 0.05)',
        marginTop: 4,
    },
    expandToggleBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 10,
        marginTop: 8,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0, 0, 0, 0.05)',
    },
    expandToggleText: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.PRIMARY,
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
        paddingVertical: 40,
        paddingHorizontal: 20,
        backgroundColor: Colors.SURFACE,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: Colors.BORDER,
        marginTop: 10,
    },
    emptyTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.TEXT_PRIMARY,
        marginBottom: 4,
    },
    emptyText: {
        color: Colors.TEXT_SECONDARY,
        fontSize: 12.5,
        textAlign: 'center',
        lineHeight: 18,
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
