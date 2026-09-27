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
    footerBg: string;
    iconCircleBg: string;
    image: any;
    badge?: string;
    planName: string;
    planDetails: string;
    price: string;
    originalPrice: string;
    savings: string;
    features: string[];
}

const FEATURES_STRIP = [
    { icon: 'user-shield', label: 'Background\nVerified Staff' },
    { icon: 'hands-wash', label: 'Safe & Hygienic\nPractices' },
    { icon: 'headset', label: '24/7 Expert\nSupport' },
    { icon: 'ambulance', label: 'Emergency\nAssistance' },
];

const DEFAULT_PACKAGES: PackageCardItem[] = [
    {
        type: 'baby',
        title: 'Newborn Care',
        tagline: 'Professional nursing care for your baby\'s healthy start.',
        icon: 'baby',
        accentColor: '#FF176B',
        bgColor: '#FFF0F5',
        borderColor: '#FFDAEA',
        footerBg: '#FFEBF3',
        iconCircleBg: '#FFE4F0',
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
        accentColor: '#FF176B',
        bgColor: '#FFF0F5',
        borderColor: '#FFDAEA',
        footerBg: '#FFEBF3',
        iconCircleBg: '#FFE4F0',
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
        bgColor: '#F4F0FF',
        borderColor: '#DDD6FE',
        footerBg: '#EBE5FF',
        iconCircleBg: '#EBE5FF',
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

const mapIconName = (rawIcon: string, type: string): string => {
    let clean = (rawIcon || '').replace(/^fa-/, '').trim();
    if (!clean || clean === 'question' || clean === 'box' || clean === 'user-pregnant' || clean === 'hand-holding-heart') {
        if (type === 'baby') return 'baby';
        if (type === 'muma') return 'heart';
        if (type === 'mother') return 'moon';
    }
    return clean || 'heart';
};

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
                    const isNight = p.type === 'mother';
                    const isMuma = p.type === 'muma';

                    const fallbackImg = p.type === 'baby'
                        ? require('../../assets/post1.png')
                        : isMuma
                        ? require('../../assets/post2.png')
                        : require('../../assets/post3.png');

                    const cleanIcon = mapIconName(p.icon, p.type);

                    // Dynamic Title Mapping
                    let cleanTitle = p.title;
                    if (!cleanTitle || cleanTitle.includes('Mother Care') && !isMuma && !isNight) {
                        cleanTitle = 'Newborn Care';
                    } else if (p.type === 'baby') {
                        cleanTitle = 'Newborn Care';
                    } else if (isMuma) {
                        cleanTitle = 'Mother + Baby Bundle';
                    } else if (isNight) {
                        cleanTitle = 'Night Nursing';
                    }

                    return {
                        type: p.type as PackageType,
                        title: cleanTitle,
                        tagline: p.tagline || p.subtitle || '',
                        icon: cleanIcon,
                        accentColor: isNight ? '#5C54E5' : '#FF176B',
                        bgColor: isNight ? '#F4F0FF' : '#FFF0F5',
                        borderColor: isNight ? '#DDD6FE' : '#FFDAEA',
                        footerBg: isNight ? '#EBE5FF' : '#FFEBF3',
                        iconCircleBg: isNight ? '#EBE5FF' : '#FFE4F0',
                        image: fallbackImg,
                        badge: p.badge || month1.badge || (isMuma ? 'Most Popular' : undefined),
                        planName: month1.label || 'Monthly Plan',
                        planDetails: month1.visitInfo || (isNight ? '26 nights × 10 hours (260 hours)' : '26 visits × 3 hours (78 hours)'),
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
                            <Icon name="heart" size={14} color="#FF176B" solid />
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
                    <Icon name="check-circle" size={13} color="#FF176B" solid style={{ marginRight: 5 }} />
                    <Text style={styles.verifiedText}>Verified Nurses</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* ── Top Banner Image ── */}
                <Image
                    source={require('../../assets/banner.png')}
                    style={styles.heroBanner}
                    resizeMode="cover"
                />

                {/* ── Features Strip ── */}
                <View style={styles.featuresStrip}>
                    {FEATURES_STRIP.map((f, i) => (
                        <View key={f.label} style={[styles.featureItem, i < FEATURES_STRIP.length - 1 && styles.featureItemBorder]}>
                            <View style={styles.featureIconBox}>
                                <Icon name={f.icon} size={15} color="#FF176B" />
                            </View>
                            <Text style={styles.featureLabel}>{f.label}</Text>
                        </View>
                    ))}
                </View>

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
                                    <View style={[styles.popularBadge, { backgroundColor: pkg.accentColor }]}>
                                        <Icon name="crown" size={9} color="#FFF" style={{ marginRight: 4 }} />
                                        <Text style={styles.popularBadgeText}>{pkg.badge}</Text>
                                    </View>
                                )}

                                {isActive && (
                                    <View style={[styles.activeSubRibbon, { backgroundColor: pkg.accentColor }]}>
                                        <Icon name="check" size={10} color="#FFF" style={{ marginRight: 4 }} />
                                        <Text style={styles.activeSubRibbonText}>ACTIVE SUBSCRIPTION</Text>
                                    </View>
                                )}

                                {/* Top Main Section (Header + Checklist + Right Nurse Image) */}
                                <View style={styles.cardTopArea}>

                                    {/* Left Content Column */}
                                    <View style={styles.cardLeftCol}>
                                        {/* Icon + Title Header Row */}
                                        <View style={styles.cardTitleRow}>
                                            <View style={[styles.iconCircleBadge, { backgroundColor: pkg.iconCircleBg }]}>
                                                <Icon name={pkg.icon} size={24} color={pkg.accentColor} />
                                            </View>
                                            <View style={styles.titleTextWrapper}>
                                                <Text style={styles.cardTitleText}>{pkg.title}</Text>
                                                <Text style={styles.cardTaglineText}>{pkg.tagline}</Text>
                                            </View>
                                        </View>

                                        {/* Features Vertical Checklist */}
                                        <View style={styles.checklistGrid}>
                                            {pkg.features.map((feature, idx) => (
                                                <View key={idx} style={styles.checklistRow}>
                                                    <View style={[styles.checkCircleBadge, { backgroundColor: pkg.accentColor }]}>
                                                        <Icon name="check" size={9} color="#FFF" />
                                                    </View>
                                                    <Text style={styles.checkText}>{feature}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    </View>

                                    {/* Right Nurse Image (Positioned in Top Right) */}
                                    <View style={styles.rightImageWrapper}>
                                        <Image source={pkg.image} style={styles.nurseRightImage} resizeMode="cover" />
                                    </View>
                                </View>

                                {/* Price Footer Box */}
                                <View style={[styles.priceFooterBox, { backgroundColor: pkg.footerBg }]}>
                                    <View style={styles.priceFooterLeft}>
                                        <Text style={[styles.footerPlanTitle, { color: pkg.accentColor }]}>{pkg.planName}</Text>
                                        <Text style={styles.footerPlanSub}>{pkg.planDetails}</Text>
                                    </View>

                                    <View style={styles.priceFooterRight}>
                                        <Text style={styles.footerMainPrice}>{pkg.price}</Text>
                                        {!!pkg.originalPrice && (
                                            <View style={styles.footerMrpRow}>
                                                <Text style={styles.footerMrpText}>{pkg.originalPrice}</Text>
                                                <View style={[styles.savePillBadge, { backgroundColor: pkg.accentColor }]}>
                                                    <Text style={styles.savePillText}>{pkg.savings}</Text>
                                                </View>
                                            </View>
                                        )}
                                    </View>
                                </View>

                                {/* Full-Width Action Button Pill */}
                                <TouchableOpacity
                                    style={[styles.viewPlanButtonPill, { backgroundColor: pkg.accentColor }]}
                                    activeOpacity={0.88}
                                    onPress={() => navigation.navigate(Routes.PACKAGE_DETAIL, { packageType: pkg.type })}>
                                    <Text style={styles.viewPlanButtonText}>View Plan</Text>
                                    <Icon name="arrow-right" size={14} color="#FFF" style={{ marginLeft: 6 }} />
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
                    <Icon name="home" size={20} color="#FF176B" />
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
        backgroundColor: '#FF176B',
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
        backgroundColor: '#FFE4F0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 6,
    },
    brandTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#FF176B',
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
        backgroundColor: '#FFE4F0',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#FFDAEA',
    },
    verifiedText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#FF176B',
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 24,
    },
    heroBanner: {
        width: '100%',
        height: 180,
        borderRadius: 16,
        marginBottom: 12,
    },
    featuresStrip: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#EDF2F7',
        marginBottom: 16,
        paddingVertical: 10,
        paddingHorizontal: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 6,
        elevation: 1,
    },
    featureItem: {
        flex: 1,
        alignItems: 'center',
        gap: 4,
    },
    featureItemBorder: {
        borderRightWidth: 1,
        borderRightColor: '#EDF2F7',
    },
    featureIconBox: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: '#FFE4F0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    featureLabel: {
        fontSize: 9,
        fontWeight: '600',
        color: '#718096',
        textAlign: 'center',
        lineHeight: 12,
    },
    sectionHeader: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: '#1A1D36',
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

    // ── Package Card Styling (Matching Screenshot Exactly) ──────────────────────
    cardContainer: {
        borderRadius: 24,
        borderWidth: 1,
        padding: 16,
        position: 'relative',
        overflow: 'hidden',
        shadowColor: '#FF176B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 3,
    },
    popularBadge: {
        position: 'absolute',
        top: 0,
        left: 18,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderBottomLeftRadius: 10,
        borderBottomRightRadius: 10,
        zIndex: 10,
    },
    popularBadgeText: {
        color: '#FFFFFF',
        fontSize: 9,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    activeSubRibbon: {
        position: 'absolute',
        top: 0,
        right: 18,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderBottomLeftRadius: 10,
        borderBottomRightRadius: 10,
        zIndex: 10,
    },
    activeSubRibbonText: {
        color: '#FFFFFF',
        fontSize: 9,
        fontWeight: '800',
    },
    cardTopArea: {
        position: 'relative',
        minHeight: 160,
        marginBottom: 12,
        marginTop: 4,
    },
    cardLeftCol: {
        width: '62%',
        paddingRight: 6,
    },
    cardTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    iconCircleBadge: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    titleTextWrapper: {
        flex: 1,
    },
    cardTitleText: {
        fontSize: 18,
        fontWeight: '900',
        color: '#1A1D36',
    },
    cardTaglineText: {
        fontSize: 11,
        color: '#5C6079',
        lineHeight: 15,
        marginTop: 1,
    },
    checklistGrid: {
        gap: 6,
        marginTop: 4,
    },
    checklistRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    checkCircleBadge: {
        width: 16,
        height: 16,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    checkText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#2C2E4A',
    },
    rightImageWrapper: {
        position: 'absolute',
        right: -16,
        top: -16,
        width: 150,
        height: 185,
        borderTopRightRadius: 24,
        overflow: 'hidden',
    },
    nurseRightImage: {
        width: '100%',
        height: '100%',
    },

    // Footer Price Box
    priceFooterBox: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderRadius: 16,
        paddingHorizontal: 14,
        paddingVertical: 12,
        marginBottom: 12,
    },
    priceFooterLeft: {
        flex: 1,
    },
    footerPlanTitle: {
        fontSize: 15,
        fontWeight: '900',
    },
    footerPlanSub: {
        fontSize: 11,
        color: '#4A506B',
        marginTop: 2,
    },
    priceFooterRight: {
        alignItems: 'flex-end',
    },
    footerMainPrice: {
        fontSize: 22,
        fontWeight: '900',
        color: '#1A1D36',
    },
    footerMrpRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 2,
    },
    footerMrpText: {
        fontSize: 12,
        color: '#9498AB',
        textDecorationLine: 'line-through',
    },
    savePillBadge: {
        paddingHorizontal: 7,
        paddingVertical: 3,
        borderRadius: 10,
    },
    savePillText: {
        color: '#FFFFFF',
        fontSize: 9,
        fontWeight: '800',
    },

    // Button Pill
    viewPlanButtonPill: {
        height: 48,
        borderRadius: 24,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    viewPlanButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '800',
    },

    // Active Subscriptions
    activeSubsContainer: {
        marginBottom: 16,
    },
    activeSubsTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: '#1A1D36',
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
        fontSize: 14, fontWeight: '800', color: '#1A1D36',
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
        color: '#FF176B',
        fontWeight: '800',
    },
});
