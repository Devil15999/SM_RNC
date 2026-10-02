import React from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { Colors } from '../constants/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface OrderDetailModalData {
    _id: string;
    packageTitle?: string;
    packageType?: string;
    planLabel?: string;
    planKey?: string;
    price?: number;
    status?: string;
    paymentStatus?: string;
    activatedAt?: string;
    expiresAt?: string;
    createdAt?: string;
    accentColor?: string;
    icon?: string;
    motherName?: string;
    motherAge?: string | number;
    babyName?: string;
    babyAge?: string | number;
    startDate?: string;
    timeSlot?: string;
    selectedTime?: string;
    address?: {
        fullName?: string;
        mobile?: string;
        flatNo?: string;
        street?: string;
        city?: string;
        state?: string;
        pincode?: string;
    };
}

interface Props {
    visible: boolean;
    order: OrderDetailModalData | null;
    onClose: () => void;
    onGoToBookings?: () => void;
}

export const OrderDetailModal: React.FC<Props> = ({
    visible,
    order,
    onClose,
    onGoToBookings,
}) => {
    const insets = useSafeAreaInsets();

    if (!order) return null;

    const accentColor = order.accentColor || Colors.PRIMARY;
    const isCompleted = order.status === 'completed';
    const isActive = order.status === 'active';
    const isCancelled = order.status === 'cancelled';

    const statusBg = isActive
        ? '#E6F4EA'
        : isCompleted
        ? '#E8F0FE'
        : isCancelled
        ? '#FCE8E6'
        : '#FEF7E0';

    const statusTextColor = isActive
        ? '#137333'
        : isCompleted
        ? '#1A73E8'
        : isCancelled
        ? '#C5221F'
        : '#B06000';

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return null;
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return null;
        return d.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const formattedCreatedDate = formatDate(order.createdAt) || 'N/A';
    const formattedActivatedDate = formatDate(order.activatedAt);
    const formattedExpiryDate = formatDate(order.expiresAt);
    const formattedStartDate = formatDate(order.startDate);

    const fullAddress = order.address
        ? [
              order.address.flatNo,
              order.address.street,
              order.address.city,
              order.address.state,
              order.address.pincode,
          ]
              .filter(Boolean)
              .join(', ')
        : null;

    const iconName = order.icon ? order.icon.replace(/^fa-/, '') : 'box';

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <TouchableOpacity
                style={styles.overlay}
                activeOpacity={1}
                onPress={onClose}
            >
                <TouchableOpacity
                    style={[
                        styles.contentBox,
                        { paddingBottom: Math.max(insets.bottom, 16) + 12 },
                    ]}
                    activeOpacity={1}
                    onPress={e => e.stopPropagation()}
                >
                    {/* Handle bar */}
                    <View style={styles.handleBar} />

                    {/* Modal Header */}
                    <View style={styles.headerRow}>
                        <View style={styles.headerLeft}>
                            <View
                                style={[
                                    styles.iconBox,
                                    { backgroundColor: `${accentColor}1A` },
                                ]}
                            >
                                <Icon name={iconName} size={18} color={accentColor} />
                            </View>
                            <View style={styles.headerTextCol}>
                                <Text style={styles.packageTitle}>
                                    {order.packageTitle || 'Care Package'}
                                </Text>
                                <Text style={styles.planLabel}>
                                    {order.planLabel || 'Subscription'}
                                </Text>
                            </View>
                        </View>

                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
                                <Text style={[styles.statusText, { color: statusTextColor }]}>
                                    {(order.status || 'PENDING').toUpperCase()}
                                </Text>
                            </View>
                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={onClose}
                                activeOpacity={0.7}
                            >
                                <Icon name="times" size={16} color={Colors.TEXT_SECONDARY} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        style={styles.scrollArea}
                    >
                        {/* Order Summary Box */}
                        <View style={styles.sectionCard}>
                            <Text style={styles.sectionHeading}>Order Summary</Text>

                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Order ID</Text>
                                <Text style={styles.infoValueMonospace}>
                                    #{order._id ? order._id.slice(-8).toUpperCase() : 'N/A'}
                                </Text>
                            </View>

                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Order Date</Text>
                                <Text style={styles.infoValue}>{formattedCreatedDate}</Text>
                            </View>

                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Payment Status</Text>
                                <View style={styles.paymentBadge}>
                                    <Icon
                                        name="check-circle"
                                        size={11}
                                        color={Colors.SUCCESS}
                                        solid
                                        style={{ marginRight: 4 }}
                                    />
                                    <Text style={styles.paymentText}>
                                        {(order.paymentStatus || 'success').toUpperCase()}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Total Price</Text>
                                <Text style={[styles.priceValue, { color: accentColor }]}>
                                    ₹{order.price != null ? order.price.toLocaleString('en-IN') : '—'}
                                </Text>
                            </View>
                        </View>

                        {/* Validity Dates (if active/activated) */}
                        {(formattedActivatedDate || formattedExpiryDate) && (
                            <View style={styles.sectionCard}>
                                <Text style={styles.sectionHeading}>Subscription Window</Text>
                                {formattedActivatedDate && (
                                    <View style={styles.infoRow}>
                                        <Text style={styles.infoLabel}>Activated On</Text>
                                        <Text style={styles.infoValue}>{formattedActivatedDate}</Text>
                                    </View>
                                )}
                                {formattedExpiryDate && (
                                    <View style={styles.infoRow}>
                                        <Text style={styles.infoLabel}>Expires On</Text>
                                        <Text style={styles.infoValueBold}>{formattedExpiryDate}</Text>
                                    </View>
                                )}
                            </View>
                        )}

                        {/* Customer / Care Specs */}
                        {(order.motherName || order.babyName || formattedStartDate || order.timeSlot) && (
                            <View style={styles.sectionCard}>
                                <Text style={styles.sectionHeading}>Care & Schedule Details</Text>
                                {order.motherName ? (
                                    <View style={styles.infoRow}>
                                        <Text style={styles.infoLabel}>Mother</Text>
                                        <Text style={styles.infoValue}>
                                            {order.motherName} {order.motherAge ? `(${order.motherAge} yrs)` : ''}
                                        </Text>
                                    </View>
                                ) : null}
                                {order.babyName ? (
                                    <View style={styles.infoRow}>
                                        <Text style={styles.infoLabel}>Baby</Text>
                                        <Text style={styles.infoValue}>
                                            {order.babyName} {order.babyAge ? `(${order.babyAge} mo/yrs)` : ''}
                                        </Text>
                                    </View>
                                ) : null}
                                {formattedStartDate ? (
                                    <View style={styles.infoRow}>
                                        <Text style={styles.infoLabel}>Preferred Start</Text>
                                        <Text style={styles.infoValue}>{formattedStartDate}</Text>
                                    </View>
                                ) : null}
                                {order.timeSlot || order.selectedTime ? (
                                    <View style={styles.infoRow}>
                                        <Text style={styles.infoLabel}>Preferred Time</Text>
                                        <Text style={styles.infoValue}>
                                            {order.timeSlot || ''} {order.selectedTime ? `(${order.selectedTime})` : ''}
                                        </Text>
                                    </View>
                                ) : null}
                            </View>
                        )}

                        {/* Delivery Address */}
                        {order.address && (
                            <View style={styles.sectionCard}>
                                <Text style={styles.sectionHeading}>Delivery Address</Text>
                                {order.address.fullName && (
                                    <Text style={styles.addressName}>
                                        {order.address.fullName}
                                    </Text>
                                )}
                                {order.address.mobile && (
                                    <Text style={styles.addressPhone}>
                                        <Icon name="phone-alt" size={11} color={Colors.TEXT_SECONDARY} /> +91 {order.address.mobile}
                                    </Text>
                                )}
                                {fullAddress && (
                                    <View style={styles.addressRow}>
                                        <Icon name="map-marker-alt" size={13} color={accentColor} style={{ marginRight: 8, marginTop: 2 }} />
                                        <Text style={styles.addressText}>{fullAddress}</Text>
                                    </View>
                                )}
                            </View>
                        )}
                    </ScrollView>

                    {/* Footer Actions */}
                    <View style={styles.modalFooter}>
                        {onGoToBookings && isActive && (
                            <TouchableOpacity
                                style={[styles.actionBtn, { backgroundColor: accentColor }]}
                                activeOpacity={0.85}
                                onPress={() => {
                                    onClose();
                                    onGoToBookings();
                                }}
                            >
                                <Icon name="calendar-alt" size={14} color="#FFF" style={{ marginRight: 8 }} />
                                <Text style={styles.actionBtnText}>View Bookings & Nurse</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            style={styles.closeOutlineBtn}
                            activeOpacity={0.8}
                            onPress={onClose}
                        >
                            <Text style={styles.closeOutlineText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.55)',
        justifyContent: 'flex-end',
    },
    contentBox: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: SCREEN_HEIGHT * 0.85,
        paddingHorizontal: 20,
        paddingTop: 12,
    },
    handleBar: {
        width: 38,
        height: 4,
        backgroundColor: '#E2E8F0',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 12,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#EDF2F7',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 10,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    headerTextCol: {
        flex: 1,
    },
    packageTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: '#1A1D36',
    },
    planLabel: {
        fontSize: 12,
        color: '#718096',
        marginTop: 1,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        marginRight: 8,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '800',
    },
    closeButton: {
        padding: 6,
    },
    scrollArea: {
        marginTop: 12,
        marginBottom: 8,
    },
    sectionCard: {
        backgroundColor: '#F8FAFC',
        borderRadius: 14,
        padding: 14,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    sectionHeading: {
        fontSize: 13,
        fontWeight: '800',
        color: '#1A1D36',
        marginBottom: 10,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 4,
    },
    infoLabel: {
        fontSize: 12.5,
        color: '#64748B',
    },
    infoValue: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1E293B',
    },
    infoValueBold: {
        fontSize: 13,
        fontWeight: '800',
        color: '#1E293B',
    },
    infoValueMonospace: {
        fontSize: 12,
        fontWeight: '700',
        color: '#475569',
        letterSpacing: 0.5,
    },
    priceValue: {
        fontSize: 16,
        fontWeight: '900',
    },
    paymentBadge: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    paymentText: {
        fontSize: 11,
        fontWeight: '800',
        color: Colors.SUCCESS,
    },
    addressName: {
        fontSize: 13.5,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 2,
    },
    addressPhone: {
        fontSize: 12,
        color: '#64748B',
        marginBottom: 6,
    },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginTop: 2,
    },
    addressText: {
        flex: 1,
        fontSize: 12.5,
        color: '#334155',
        lineHeight: 18,
    },
    modalFooter: {
        gap: 8,
        marginTop: 8,
    },
    actionBtn: {
        height: 44,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionBtnText: {
        color: '#FFFFFF',
        fontSize: 13.5,
        fontWeight: '700',
    },
    closeOutlineBtn: {
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
    },
    closeOutlineText: {
        color: '#475569',
        fontSize: 13,
        fontWeight: '600',
    },
});
