import React, { useState, useEffect, useCallback } from 'react';
import {
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Image,
    Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { RootStackParamList } from '../../types/navigation';
import { Colors } from '../../constants/theme';
import { useAppSelector } from '../../store';
import { Routes } from '../../constants/routes';
import { API_BASE_URL } from '../../config';

const { width: SW } = Dimensions.get('window');

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

type PackageType = 'mother' | 'baby' | 'muma';

interface PackageCardItem {
    type: PackageType;
    title: string;
    tagline: string;
    icon: string;
    accentColor: string;
    bgColor: string;
    borderColor: string;
    image: any;
    badge?: string;
    planName: string;
    planDetails: string;
    price: string;
    originalPrice: string;
    savings: string;
    features: string[];
}

const DEFAULT_PACKAGES: PackageCardItem[] = [
    {
        type: 'baby',
        title: 'Newborn Care',
        tagline: 'Professional nursing care for your baby\'s healthy start.',
        icon: 'baby',
        accentColor: '#E91E8A',
        bgColor: '#FFF0F6',
        borderColor: '#FFD6E8',
        image: require('../../assets/post1.png'),
        planName: 'Monthly Plan',
        planDetails: '26 visits × 3 hours (78 hours)',
        price: '₹ 24,999',
        originalPrice: '₹ 32,000',
        savings: 'Save 22%',
        features: [
            'Baby bathing & hygiene',
            'Feeding & burping support',
            'Sleep & routine guidance',
            'Growth & wellness monitoring',
        ],
    },
    {
        type: 'muma',
        title: 'Mother + Baby Bundle',
        tagline: 'Complete nursing care for both you and your baby.',
        icon: 'heart',
        accentColor: '#E91E8A',
        bgColor: '#FFF0F6',
        borderColor: '#FFD6E8',
        image: require('../../assets/post2.png'),
        badge: 'Most Popular',
        planName: 'Monthly Plan',
        planDetails: '26 visits × 3 hours (78 hours)',
        price: '₹ 34,999',
        originalPrice: '₹ 45,000',
        savings: 'Save 22%',
        features: [
            'All newborn care services',
            'All mother care services',
            'Breastfeeding support',
            'Recovery & wellness support',
        ],
    },
    {
        type: 'mother',
        title: 'Night Nursing',
        tagline: 'Overnight nursing support for peaceful nights.',
        icon: 'moon',
        accentColor: '#5C54E5',
        bgColor: '#F3F0FF',
        borderColor: '#DDD6FE',
        image: require('../../assets/post3.png'),
        planName: 'Monthly Plan',
        planDetails: '26 nights × 10 hours (260 hours)',
        price: '₹ 64,999',
        originalPrice: '₹ 80,000',
        savings: 'Save 19%',
        features: [
            'Overnight care (8–12 hours)',
            'Baby feeding & diaper support',
            'Sleep routine establishment',
            'Monitoring mother & baby',
        ],
    },
];

const HomeScreen: React.FC<Props> = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const user = useAppSelector(state => state.auth.user);

    const [packageList, setPackageList] = useState<PackageCardItem[]>(DEFAULT_PACKAGES);
    const [orders, setOrders] = useState<any[]>([]);

    const fetchPackages = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/packages`);
            const data = await res.json();
            if (res.ok && data.success && Array.isArray(data.data) && data.data.length > 0) {
                const formatted: PackageCardItem[] = data.data.map((p: any) => {
                    const month1 = p.plans?.['1month'] || {};
                    const fallbackImg = p.type === 'baby'
                        ? require('../../assets/post1.png')
                        : p.type === 'muma'
                        ? require('../../assets/post2.png')
                        : require('../../assets/post3.png');

                    return {
                        type: p.type as PackageType,
                        title: p.title || 'Care Package',
                        tagline: p.tagline || p.subtitle || '',
                        icon: (p.icon ?? '').replace(/^fa-/, ''),
                        accentColor: p.accentColor || (p.type === 'mother' ? '#5C54E5' : '#E91E8A'),
                        bgColor: p.type === 'mother' ? '#F3F0FF' : '#FFF0F6',
                        borderColor: p.type === 'mother' ? '#DDD6FE' : '#FFD6E8',
                        image: fallbackImg,
                        badge: p.badge || month1.badge || (p.type === 'muma' ? 'Most Popular' : undefined),
                        planName: month1.label || 'Monthly Plan',
                        planDetails: month1.visitInfo || (p.type === 'mother' ? '26 nights × 10 hours (260 hours)' : '26 visits × 3 hours (78 hours)'),
                        price: month1.price ? `₹ ${month1.price.toLocaleString('en-IN')}` : `₹ ${p.startingPrice?.toLocaleString('en-IN')}`,
                        originalPrice: month1.originalPrice ? `₹ ${month1.originalPrice.toLocaleString('en-IN')}` : '',
                        savings: month1.savings || 'Save 22%',
                        features: p.features && p.features.length > 0 ? p.features : (month1.features || []),
                    };
                });

                // Sort: baby, muma, mother
                const orderMap: Record<string, number> = { baby: 0, muma: 1, mother: 2 };
                formatted.sort((a, b) => (orderMap[a.type] ?? 99) - (orderMap[b.type] ?? 99));

                setPackageList(formatted);
            }
        } catch (err) {
            console.log('Error fetching packages in Home:', err);
        }
    }, []);

    const fetchOrders = useCallback(async () => {
        if (!user?.token) return;
        try {
            const res = await fetch(`${API_BASE_URL}/orders`, {
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setOrders(data.data || []);
            }
        } catch (err) {
            console.log('Error fetching orders in Home:', err);
        }
    }, [user?.token]);

    useEffect(() => {
        fetchPackages();
        const unsubscribe = navigation.addListener('focus', () => {
            fetchPackages();
            if (user?.token) fetchOrders();
        });
        return unsubscribe;
    }, [navigation, user?.token, fetchPackages, fetchOrders]);

    const activeSubscriptions = orders.filter(o =>
        o.status === 'active' &&
        (!o.expiresAt || new Date(o.expiresAt) > new Date())
    );

    return (
        <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

            {/* ── Top Header ── */}
            <View style={styles.topHeader}>
                <TouchableOpacity style={styles.headerIconButton} activeOpacity={0.7}>
                    <Icon name="bars" size={20} color="#2D3748" />
                </TouchableOpacity>

                <View style={styles.brandCenter}>
                    <View style={styles.brandRow}>
                        <View style={styles.brandIconCircle}>
                            <Icon name="heart" size={14} color="#E91E8A" solid />
                        </View>
                        <Text style={styles.brandTitle}>Second Muma</Text>
                    </View>
                    <Text style={styles.brandSubtitle}>Professional Nursing Care for Mother & Baby at Home</Text>
                </View>

                <TouchableOpacity style={styles.headerIconButton} activeOpacity={0.7}>
                    <Icon name="bell" size={20} color="#2D3748" />
                    <View style={styles.notificationDot} />
                </TouchableOpacity>
            </View>

            {/* ── Location & Verified Nurse Subbar ── */}
            <View style={styles.subBar}>
                <TouchableOpacity style={styles.locationSelector} activeOpacity={0.8}>
                    <Icon name="map-marker-alt" size={14} color="#2D3748" style={{ marginRight: 6 }} />
                    <Text style={styles.locationText}>Bangalore</Text>
                    <Icon name="chevron-down" size={11} color="#4A5568" style={{ marginLeft: 4 }} />
                </TouchableOpacity>

                <View style={styles.verifiedBadge}>
                    <Icon name="check-circle" size={13} color="#E91E8A" solid style={{ marginRight: 5 }} />
                    <Text style={styles.verifiedText}>Verified Nurses</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* ── Care Packages Title Section ── */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Our Care Packages</Text>
                    <Text style={styles.sectionSubtitle}>Choose the care you need for you and your little one.</Text>
                </View>

                {/* ── Active Subscriptions ── */}
                {activeSubscriptions.length > 0 && (
                    <View style={styles.activeSubsContainer}>
                        <Text style={styles.activeSubsTitle}>Your Active Subscriptions</Text>
                        {activeSubscriptions.map(sub => {
                            const expiryDate = sub.expiresAt
                                ? new Date(sub.expiresAt).toLocaleDateString('en-IN', {
                                    day: 'numeric', month: 'short', year: 'numeric'
                                })
                                : 'N/A';
                            const pkgColor = sub.accentColor || Colors.PRIMARY;
                            return (
                                <View key={sub._id} style={[styles.activeSubCard, { borderColor: pkgColor + '44' }]}>
                                    <View style={styles.activeSubHeader}>
                                        <View style={[styles.activeSubIconBox, { backgroundColor: pkgColor + '1A' }]}>
                                            <Icon name={sub.icon ? sub.icon.replace(/^fa-/, '') : 'box'} size={18} color={pkgColor} />
                                        </View>
                                        <View style={{ flex: 1, marginLeft: 12 }}>
                                            <Text style={styles.activeSubTitle}>{sub.packageTitle}</Text>
                                            <Text style={styles.activeSubPlan}>{sub.planLabel} Plan</Text>
                                        </View>
                                        <View style={[styles.activeStatusBadge, { backgroundColor: Colors.SUCCESS + '1A' }]}>
                                            <Text style={[styles.activeStatusText, { color: Colors.SUCCESS }]}>ACTIVE</Text>
                                        </View>
                                    </View>
                                    <View style={styles.activeSubDivider} />
                                    <View style={styles.activeSubFooter}>
                                        <Text style={styles.activeSubFooterLabel}>Expires on:</Text>
                                        <Text style={styles.activeSubFooterValue}>{expiryDate}</Text>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                )}

                {/* ── Packages List (Vertical Stack) ── */}
                <View style={styles.packageCardsList}>
                    {packageList.map((pkg) => {
                        const isActive = !!orders.find(o =>
                            o.packageType === pkg.type &&
                            o.status === 'active' &&
                            (!o.expiresAt || new Date(o.expiresAt) > new Date())
                        );

                        return (
                            <View
                                key={pkg.type}
                                style={[
                                    styles.cardContainer,
                                    { backgroundColor: pkg.bgColor, borderColor: pkg.borderColor },
                                    isActive && { borderWidth: 2, borderColor: pkg.accentColor },
                                ]}>

                                {/* Popular Badge */}
                                {pkg.badge && (
                                    <View style={styles.popularBadge}>
                                        <Icon name="crown" size={10} color="#FFF" style={{ marginRight: 4 }} />
                                        <Text style={styles.popularBadgeText}>{pkg.badge}</Text>
                                    </View>
                                )}

                                {isActive && (
                                    <View style={[styles.activeSubRibbon, { backgroundColor: pkg.accentColor }]}>
                                        <Icon name="check" size={10} color="#FFF" style={{ marginRight: 4 }} />
                                        <Text style={styles.activeSubRibbonText}>ACTIVE SUBSCRIPTION</Text>
                                    </View>
                                )}

                                {/* Card Header Row */}
                                <View style={styles.cardHeaderRow}>
                                    <View style={styles.cardHeaderLeft}>
                                        <View style={[styles.iconCircle, { backgroundColor: pkg.accentColor + '1E' }]}>
                                            <Icon name={pkg.icon} size={22} color={pkg.accentColor} />
                                        </View>
                                        <Text style={styles.cardTitle}>{pkg.title}</Text>
                                        <Text style={styles.cardTagline}>{pkg.tagline}</Text>
                                    </View>

                                    {/* Right Image */}
                                    <View style={styles.cardImageWrapper}>
                                        <Image source={pkg.image} style={styles.cardImage} resizeMode="cover" />
                                    </View>
                                </View>

                                {/* Features Checklist */}
                                <View style={styles.featuresGrid}>
                                    {pkg.features.map((feature, idx) => (
                                        <View key={idx} style={styles.featureRow}>
                                            <View style={[styles.checkCircle, { backgroundColor: pkg.accentColor }]}>
                                                <Icon name="check" size={10} color="#FFF" />
                                            </View>
                                            <Text style={styles.featureText}>{feature}</Text>
                                        </View>
                                    ))}
                                </View>

                                {/* Price Footer Box */}
                                <View style={styles.priceFooterBox}>
                                    <View style={styles.priceFooterLeft}>
                                        <Text style={[styles.planNameText, { color: pkg.accentColor }]}>{pkg.planName}</Text>
                                        <Text style={styles.planDetailsText}>{pkg.planDetails}</Text>
                                    </View>

                                    <View style={styles.priceFooterRight}>
                                        <Text style={styles.mainPriceText}>{pkg.price}</Text>
                                        {!!pkg.originalPrice && (
                                            <View style={styles.originalPriceRow}>
                                                <Text style={styles.originalPriceText}>{pkg.originalPrice}</Text>
                                                <View style={[styles.savePill, { backgroundColor: pkg.accentColor }]}>
                                                    <Text style={styles.savePillText}>{pkg.savings}</Text>
                                                </View>
                                            </View>
                                        )}
                                    </View>
                                </View>

                                {/* Full-Width Action Button */}
                                <TouchableOpacity
                                    style={[styles.viewPlanButton, { backgroundColor: pkg.accentColor }]}
                                    activeOpacity={0.88}
                                    onPress={() => navigation.navigate(Routes.PACKAGE_DETAIL, { packageType: pkg.type })}>
                                    <Text style={styles.viewPlanButtonText}>View Plan</Text>
                                    <Icon name="arrow-right" size={14} color="#FFF" style={{ marginLeft: 8 }} />
                                </TouchableOpacity>
                            </View>
                        );
                    })}
                </View>

                <View style={{ height: 16 }} />
            </ScrollView>

            {/* ── Bottom Navigation Bar ── */}
            <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, 8) }]}>
                <TouchableOpacity style={styles.navItem} activeOpacity={0.8}>
                    <Icon name="home" size={20} color="#E91E8A" />
                    <Text style={[styles.navLabel, styles.navLabelActive]}>Home</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.navItem}
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate(Routes.APPOINTMENTS)}>
                    <Icon name="calendar-alt" size={19} color="#718096" />
                    <Text style={styles.navLabel}>My Bookings</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.navItem}
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate(Routes.PACKAGE_DETAIL, { packageType: 'muma' })}>
                    <Icon name="heart" size={19} color="#718096" />
                    <Text style={styles.navLabel}>Packages</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.navItem}
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate(Routes.PROFILE)}>
                    <Icon name="user" size={19} color="#718096" />
                    <Text style={styles.navLabel}>Profile</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

export default HomeScreen;

// ── Styles ──────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    topHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F4F8',
    },
    headerIconButton: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: '#F7FAFC',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    notificationDot: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: '#E91E8A',
    },
    brandCenter: {
        alignItems: 'center',
    },
    brandRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    brandIconCircle: {
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: '#FFF0F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 6,
    },
    brandTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#E91E8A',
        letterSpacing: -0.3,
    },
    brandSubtitle: {
        fontSize: 9,
        fontWeight: '600',
        color: '#718096',
        marginTop: 1,
    },
    subBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#FFFFFF',
    },
    locationSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F7FAFC',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    locationText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#2D3748',
    },
    verifiedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF0F6',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#FFD6E8',
    },
    verifiedText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#E91E8A',
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 24,
    },
    sectionHeader: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: '#1A202C',
        letterSpacing: -0.3,
    },
    sectionSubtitle: {
        fontSize: 13,
        color: '#718096',
        marginTop: 3,
    },
    packageCardsList: {
        gap: 18,
    },
    cardContainer: {
        borderRadius: 20,
        borderWidth: 1,
        padding: 16,
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    popularBadge: {
        position: 'absolute',
        top: -10,
        left: 16,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E91E8A',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        zIndex: 10,
    },
    popularBadgeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    activeSubRibbon: {
        position: 'absolute',
        top: -10,
        right: 16,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
        zIndex: 10,
    },
    activeSubRibbonText: {
        color: '#FFFFFF',
        fontSize: 9,
        fontWeight: '800',
    },
    cardHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 14,
        marginTop: 4,
    },
    cardHeaderLeft: {
        flex: 1,
        paddingRight: 10,
    },
    iconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    cardTitle: {
        fontSize: 17,
        fontWeight: '900',
        color: '#1A202C',
        marginBottom: 4,
    },
    cardTagline: {
        fontSize: 11,
        color: '#718096',
        lineHeight: 16,
    },
    cardImageWrapper: {
        width: 105,
        height: 105,
        borderRadius: 16,
        overflow: 'hidden',
    },
    cardImage: {
        width: '100%',
        height: '100%',
    },
    featuresGrid: {
        marginBottom: 14,
        gap: 8,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    checkCircle: {
        width: 16,
        height: 16,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    featureText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#2D3748',
    },
    priceFooterBox: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    priceFooterLeft: {
        flex: 1,
    },
    planNameText: {
        fontSize: 13,
        fontWeight: '800',
    },
    planDetailsText: {
        fontSize: 10,
        color: '#718096',
        marginTop: 2,
    },
    priceFooterRight: {
        alignItems: 'flex-end',
    },
    mainPriceText: {
        fontSize: 18,
        fontWeight: '900',
        color: '#1A202C',
    },
    originalPriceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 2,
    },
    originalPriceText: {
        fontSize: 11,
        color: '#A0AEC0',
        textDecorationLine: 'line-through',
    },
    savePill: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    savePillText: {
        color: '#FFFFFF',
        fontSize: 9,
        fontWeight: '800',
    },
    viewPlanButton: {
        height: 44,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    viewPlanButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '800',
    },

    // Active Subscriptions
    activeSubsContainer: {
        marginBottom: 16,
    },
    activeSubsTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: '#1A202C',
        marginBottom: 8,
    },
    activeSubCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        padding: 12,
        borderWidth: 1.5,
        marginBottom: 8,
    },
    activeSubHeader: { flexDirection: 'row', alignItems: 'center' },
    activeSubIconBox: {
        width: 34, height: 34, borderRadius: 10,
        justifyContent: 'center', alignItems: 'center',
    },
    activeSubTitle: {
        fontSize: 14, fontWeight: '800', color: '#1A202C',
    },
    activeSubPlan: { fontSize: 11, color: '#718096', marginTop: 1 },
    activeStatusBadge: { paddingHorizontal: 6, paddingVertical: 3, borderRadius: 10 },
    activeStatusText: { fontSize: 9, fontWeight: '800' },
    activeSubDivider: { height: 1, backgroundColor: '#EDF2F7', marginVertical: 8 },
    activeSubFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    activeSubFooterLabel: { fontSize: 11, color: '#A0AEC0', fontWeight: '500' },
    activeSubFooterValue: { fontSize: 11, color: '#2D3748', fontWeight: '700' },

    // Bottom Navigation Bar
    bottomNav: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#EDF2F7',
        paddingTop: 8,
    },
    navItem: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    navLabel: {
        fontSize: 10,
        fontWeight: '600',
        color: '#718096',
        marginTop: 3,
    },
    navLabelActive: {
        color: '#E91E8A',
        fontWeight: '800',
    },
});
