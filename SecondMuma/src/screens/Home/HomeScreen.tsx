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
    RefreshControl,
    ImageBackground,
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
        title: 'Baby Care',
        tagline: 'Gentle, expert newborn nursing care for your baby\'s healthy growth.',
        icon: 'baby',
        accentColor: '#FF176B',
        bgColor: '#FFF0F5',
        borderColor: '#FFDAEA',
        footerBg: '#FFEBF3',
        iconCircleBg: '#FFE4F0',
        image: require('../../assets/post1.png'),
        planName: '1 Month Plan',
        planDetails: '26 visits × 3 hours (78 hours)',
        price: '₹ 24,999',
        originalPrice: '₹ 32,000',
        savings: 'Save 22%',
        features: [
            'Hygiene care, bathing & cord care',
            'Feeding, burping & colic relief',
            'Sleep routine & bedtime support',
            'Growth & milestone tracking',
        ],
    },
    {
        type: 'mother',
        title: 'Mother Care',
        tagline: 'Specialized postpartum recovery & nursing care for new mothers.',
        icon: 'female',
        accentColor: '#5C54E5',
        bgColor: '#F4F0FF',
        borderColor: '#DDD6FE',
        footerBg: '#EBE5FF',
        iconCircleBg: '#EBE5FF',
        image: require('../../assets/post3.png'),
        planName: '1 Month Plan',
        planDetails: '26 visits × 3 hours (78 hours)',
        price: '₹ 34,999',
        originalPrice: '₹ 45,000',
        savings: 'Save 22%',
        features: [
            'Postpartum recovery & healing assistance',
            'Breastfeeding & lactation support',
            'Nutritional guidance & meal assistance',
            'Emotional wellness & vital monitoring',
        ],
    },
    {
        type: 'muma',
        title: 'Mother + Baby Care',
        tagline: 'Complete dual nursing care bundle for both mother & newborn baby.',
        icon: 'heart',
        accentColor: '#FF176B',
        bgColor: '#FFF0F5',
        borderColor: '#FFDAEA',
        footerBg: '#FFEBF3',
        iconCircleBg: '#FFE4F0',
        image: require('../../assets/post2.png'),
        planName: '1 Month Plan',
        planDetails: '26 visits × 3 hours (78 hours)',
        price: '₹ 49,999',
        originalPrice: '₹ 65,000',
        savings: 'Save 23%',
        features: [
            'All essential Baby Care services',
            'All specialized Mother Care services',
            'Lactation & breastfeeding assistance',
            'Postpartum recovery & routine planning',
        ],
    },
];

const mapIconName = (rawIcon: string, type: string): string => {
    let clean = (rawIcon || '').replace(/^fa-/, '').trim();
    if (!clean || clean === 'question' || clean === 'box' || clean === 'user-pregnant' || clean === 'hand-holding-heart' || clean === 'moon') {
        if (type === 'mother') return 'female';
        if (type === 'baby') return 'baby';
        if (type === 'muma') return 'heart';
    }
    return clean || 'heart';
};

const cleanFeature = (feat: string): string => {
    return feat
        .replace('Postpartum recovery & healing assistance', 'Postpartum recovery & healing')
        .replace('Breastfeeding & lactation support', 'Breastfeeding & lactation support')
        .replace('Nutritional guidance & meal assistance', 'Nutritional & meal assistance')
        .replace('Emotional wellness & vital monitoring', 'Emotional wellness & monitoring')
        .replace('Post-caesarean & perineal wound care', 'Post-caesarean & wound care')
        .replace('Gentle massage & sleep relaxation', 'Massage & sleep relaxation')
        .replace('Hygiene care, bathing & cord care', 'Baby bathing & hygiene care')
        .replace('Feeding, burping & colic relief', 'Feeding & burping support')
        .replace('Sleep routine & bedtime support', 'Sleep & routine guidance')
        .replace('Growth & milestone tracking', 'Growth & wellness monitoring')
        .replace('Sanitation of baby gear & bottles', 'Sanitation of bottles & gear')
        .replace('All specialized Mother Care services', 'Specialized Mother Care')
        .replace('All essential Baby Care services', 'Essential Baby Care services')
        .replace('Dual nurse coordination for mother & baby', 'Dual nurse coordination')
        .replace('Lactation, feeding & bonding guidance', 'Lactation & feeding guidance')
        .replace('Comprehensive daily health reports', 'Daily health reports & updates');
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
                    const isMother = p.type === 'mother';
                    const isMuma = p.type === 'muma';

                    const defaultImg = isMuma
                        ? require('../../assets/post2.png')
                        : isMother
                            ? require('../../assets/post3.png')
                            : require('../../assets/post1.png');

                    const remoteImg = p.backgroundImage || p.image;
                    const cardImage = remoteImg
                        ? { uri: remoteImg.startsWith('data:') || remoteImg.startsWith('http') ? remoteImg : `${API_BASE_URL.replace('/api', '')}${remoteImg}` }
                        : defaultImg;

                    const cleanIcon = mapIconName(p.icon, p.type);

                    // Dynamic Title Mapping
                    const defaultTitle = isMother ? 'Mother Care' : isMuma ? 'Mother + Baby Care' : 'Baby Care';
                    const cleanTitle = p.title || defaultTitle;

                    return {
                        type: p.type as PackageType,
                        title: cleanTitle,
                        tagline: p.tagline || p.subtitle || '',
                        icon: cleanIcon,
                        accentColor: isMother ? '#5C54E5' : '#FF176B',
                        bgColor: isMother ? '#F4F0FF' : '#FFF0F5',
                        borderColor: isMother ? '#DDD6FE' : '#FFDAEA',
                        footerBg: isMother ? '#EBE5FF' : '#FFEBF3',
                        iconCircleBg: isMother ? '#EBE5FF' : '#FFE4F0',
                        image: cardImage,
                        badge: p.badge || month1.badge || undefined,
                        planName: month1.label || '1 Month Plan',
                        planDetails: month1.visitInfo || '26 visits × 3 hours (78 hours)',
                        price: month1.price ? `₹ ${month1.price.toLocaleString('en-IN')}` : `₹ ${p.startingPrice?.toLocaleString('en-IN')}`,
                        originalPrice: month1.originalPrice ? `₹ ${month1.originalPrice.toLocaleString('en-IN')}` : '',
                        savings: month1.savings || 'Save 22%',
                        features: p.features && p.features.length > 0 ? p.features : (month1.features || []),
                    };
                });

                // Sort order: baby, mother, muma
                const orderMap: Record<string, number> = { baby: 0, mother: 1, muma: 2 };
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

    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            await fetchPackages();
            if (user?.token) {
                await fetchOrders();
            }
        } finally {
            setRefreshing(false);
        }
    }, [fetchPackages, fetchOrders, user?.token]);

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

            {/* ── Top Bar ── */}
            <View style={styles.topBar}>
                <View>
                    <Text style={styles.welcome}>
                        Good day <Icon name="hand-peace" size={14} color="#FFD54F" solid />
                    </Text>
                    <Text style={styles.name}>{user?.name ?? 'User'}</Text>
                </View>
                <TouchableOpacity
                    style={styles.avatar}
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate(Routes.PROFILE)}>
                    {user?.avatar ? (
                        <Image
                            source={{ uri: user.avatar }}
                            style={{ width: '100%', height: '100%', borderRadius: 19 }}
                        />
                    ) : (
                        <Image
                            source={require('../../assets/user.png')}
                            style={{ width: '100%', height: '100%', tintColor: Colors.WHITE }}
                        />
                    )}
                </TouchableOpacity>
            </View>

            {/* ── Location & Verified Nurse Subbar ── */}
            <View style={styles.subBar}>
                <TouchableOpacity style={styles.locationSelector} activeOpacity={0.8}>
                    <Icon name="map-marker-alt" size={14} color="#2D3748" style={{ marginRight: 6 }} />
                    <Text style={styles.locationText}>Bangalore</Text>
                    {/* <Icon name="chevron-down" size={11} color="#4A5568" style={{ marginLeft: 4 }} /> */}
                </TouchableOpacity>

                <View style={styles.verifiedBadge}>
                    <Icon name="check-circle" size={13} color="#FF176B" solid style={{ marginRight: 5 }} />
                    <Text style={styles.verifiedText}>Verified Nurses</Text>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[Colors.PRIMARY]}
                        tintColor={Colors.PRIMARY}
                    />
                }>

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
                            <TouchableOpacity
                                key={pkg.type}
                                activeOpacity={0.92}
                                onPress={() => navigation.navigate(Routes.PACKAGE_DETAIL, { packageType: pkg.type })}
                                style={[
                                    styles.cardContainer,
                                    { backgroundColor: pkg.bgColor, borderColor: pkg.borderColor },
                                    isActive && { borderWidth: 2, borderColor: pkg.accentColor },
                                ]}>


                                {isActive && (
                                    <View style={[styles.activeSubRibbon, { backgroundColor: pkg.accentColor }]}>
                                        <Icon name="check" size={10} color="#FFF" style={{ marginRight: 4 }} />
                                        <Text style={styles.activeSubRibbonText}>ACTIVE SUBSCRIPTION</Text>
                                    </View>
                                )}

                                {/* Top Main Section matching Screenshot 1 */}
                                <View style={styles.cardTopArea}>
                                    {/* Right Hero Image (2:1 aspect ratio banner matching post1, post2, post3) */}
                                    <Image
                                        source={pkg.image}
                                        style={styles.cardHeroImage}
                                        resizeMode="cover"
                                    />

                                    {/* Left Content Column */}
                                    <View style={styles.cardLeftCol}>
                                        {/* Icon + Title Header Row */}
                                        <View style={styles.cardTitleRow}>
                                            <View style={[styles.iconCircleBadge, { backgroundColor: pkg.iconCircleBg }]}>
                                                <Icon name={pkg.icon} size={18} color={pkg.accentColor} />
                                            </View>
                                            <View style={styles.titleTextWrapper}>
                                                <Text style={styles.cardTitleText} numberOfLines={1} maxFontSizeMultiplier={1.25}>{pkg.title}</Text>
                                                <Text style={styles.cardTaglineText} numberOfLines={2} maxFontSizeMultiplier={1.2}>{pkg.tagline}</Text>
                                            </View>
                                        </View>

                                        {/* Features Vertical Checklist (Top 4 Core Features) */}
                                        <View style={styles.checklistGrid}>
                                            {pkg.features.slice(0, 4).map((feature, idx) => (
                                                <View key={idx} style={styles.checklistRow}>
                                                    <View style={[styles.checkCircleBadge, { backgroundColor: pkg.accentColor }]}>
                                                        <Icon name="check" size={8} color="#FFF" />
                                                    </View>
                                                    <Text style={styles.checkText} numberOfLines={1} maxFontSizeMultiplier={1.2}>{cleanFeature(feature)}</Text>
                                                </View>
                                            ))}
                                        </View>
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
                            </TouchableOpacity>
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
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
    },
    welcome: { color: '#718096', fontSize: 13 },
    name: {
        color: '#1A1D36',
        fontSize: 20,
        fontWeight: '800',
        marginTop: 2,
    },
    avatar: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: '#FF176B',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#FF176B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
        padding: 4,
        overflow: 'hidden',
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
        borderWidth: 1.5,
        padding: 16,
        position: 'relative',
        overflow: 'hidden',
        shadowColor: '#FF176B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
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
        minHeight: 155,
        marginBottom: 8,
        marginTop: 2,
    },
    cardHeroImage: {
        position: 'absolute',
        top: -16,
        right: -16,
        width: SW - 32,
        height: Math.round((SW - 32) * 0.5),
        borderTopRightRadius: 24,
    },
    cardLeftCol: {
        width: '64%',
        paddingRight: 4,
        zIndex: 2,
    },
    cardTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 3,
    },
    iconCircleBadge: {
        width: 38,
        height: 38,
        borderRadius: 19,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    titleTextWrapper: {
        flex: 1,
    },
    cardTitleText: {
        fontSize: 17,
        fontWeight: '800',
        color: '#1A1D36',
    },
    cardTaglineText: {
        fontSize: 10.5,
        color: '#4A5568',
        lineHeight: 14,
        marginTop: 1,
    },
    checklistGrid: {
        gap: 3,
        marginTop: 4,
    },
    checklistRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 1,
    },
    checkCircleBadge: {
        width: 14,
        height: 14,
        borderRadius: 7,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 7,
    },
    checkText: {
        flex: 1,
        fontSize: 11,
        fontWeight: '600',
        color: '#1E293B',
        lineHeight: 14,
    },

    // Footer Price Box
    priceFooterBox: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderRadius: 16,
        paddingHorizontal: 14,
        paddingVertical: 10,
        marginBottom: 10,
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
