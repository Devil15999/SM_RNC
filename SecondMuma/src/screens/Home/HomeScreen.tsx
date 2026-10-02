import React, { memo, useCallback, useMemo, useState } from 'react';
import {
    Dimensions,
    Image,
    ImageSourcePropType,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { RootStackParamList } from '../../types/navigation';
import { Colors } from '../../constants/theme';
import { useAppSelector } from '../../store';
import { Routes } from '../../constants/routes';
import { API_BASE_URL } from '../../config';
import { OrderDetailModal } from '../../components/OrderDetailModal';

// ── Types ───────────────────────────────────────────────────────────────────────

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
    iconCircleBg: string;
    image: ImageSourcePropType;
    planName: string;
    planDetails: string;
    price: string;
    originalPrice: string;
    savings: string;
    features: string[];
}

interface ApiPlan {
    label?: string;
    visitInfo?: string;
    price?: number;
    originalPrice?: number;
    savings?: string;
    features?: string[];
}

interface ApiPackage {
    type: PackageType;
    title?: string;
    tagline?: string;
    subtitle?: string;
    icon?: string;
    accentColor?: string;
    backgroundImage?: string;
    image?: string;
    startingPrice?: number;
    features?: string[];
    plans?: { '1month'?: ApiPlan };
}

interface Order {
    _id: string;
    status: string;
    expiresAt?: string;
    packageType: PackageType;
    packageTitle: string;
    planLabel: string;
    accentColor?: string;
    icon?: string;
}

// ── Constants ───────────────────────────────────────────────────────────────────

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCREEN_PADDING = 16;
const CARD_WIDTH = SCREEN_WIDTH - SCREEN_PADDING * 2;

// banner2.png is 1672 × 941. Keep this in sync if the asset is ever replaced.
const BANNER_SOURCE = require('../../assets/banner2.png');
const BANNER_ASPECT_RATIO = 1672 / 941;

const PACKAGE_IMAGES: Record<PackageType, ImageSourcePropType> = {
    baby: require('../../assets/post1.png'),
    mother: require('../../assets/post3.png'),
    muma: require('../../assets/post2.png'),
};

const DEFAULT_AVATAR = require('../../assets/user.png');

// Local palette. Move these into constants/theme.ts when convenient.
const PINK = '#FF176B';
const INDIGO = '#5C54E5';
const TEXT_DARK = '#1A1D36';
const TEXT_MUTED = '#718096';
const BORDER_LIGHT = '#EDF2F7';
const PINK_SOFT = '#FFE4F0';
const PINK_BORDER = '#FFDAEA';

const DEFAULT_ACCENT: Record<PackageType, string> = {
    baby: PINK,
    mother: INDIGO,
    muma: PINK,
};

const DEFAULT_TITLES: Record<PackageType, string> = {
    baby: 'Baby Care',
    mother: 'Mother Care',
    muma: 'Mother + Baby Care',
};

const DEFAULT_ICONS: Record<PackageType, string> = {
    baby: 'baby',
    mother: 'female',
    muma: 'heart',
};

const PACKAGE_SORT_ORDER: Record<PackageType, number> = { baby: 0, mother: 1, muma: 2 };

const PLACEHOLDER_ICONS = new Set(['', 'question', 'box', 'user-pregnant', 'hand-holding-heart', 'moon']);

const DEFAULT_PLAN_NAME = '1 Month Plan';
const DEFAULT_PLAN_DETAILS = '26 visits × 3 hours (78 hours)';

const FEATURE_LABELS: Record<string, string> = {
    'Postpartum recovery & healing assistance': 'Postpartum recovery & healing',
    'Nutritional guidance & meal assistance': 'Nutritional & meal assistance',
    'Emotional wellness & vital monitoring': 'Emotional wellness & monitoring',
    'Post-caesarean & perineal wound care': 'Post-caesarean & wound care',
    'Gentle massage & sleep relaxation': 'Massage & sleep relaxation',
    'Hygiene care, bathing & cord care': 'Baby bathing & hygiene care',
    'Feeding, burping & colic relief': 'Feeding & burping support',
    'Sleep routine & bedtime support': 'Sleep & routine guidance',
    'Growth & milestone tracking': 'Growth & wellness monitoring',
    'Sanitation of baby gear & bottles': 'Sanitation of bottles & gear',
    'All specialized Mother Care services': 'Specialized Mother Care',
    'All essential Baby Care services': 'Essential Baby Care services',
    'Dual nurse coordination for mother & baby': 'Dual nurse coordination',
    'Lactation, feeding & bonding guidance': 'Lactation & feeding guidance',
    'Comprehensive daily health reports': 'Daily health reports & updates',
};

const DEFAULT_PACKAGES: PackageCardItem[] = [
    {
        type: 'baby',
        title: 'Baby Care',
        tagline: "Gentle, expert newborn nursing care for your baby's healthy growth.",
        icon: 'baby',
        accentColor: PINK,
        bgColor: '#FFF0F5',
        borderColor: PINK_BORDER,
        iconCircleBg: PINK_SOFT,
        image: PACKAGE_IMAGES.baby,
        planName: DEFAULT_PLAN_NAME,
        planDetails: DEFAULT_PLAN_DETAILS,
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
        accentColor: INDIGO,
        bgColor: '#F4F0FF',
        borderColor: '#DDD6FE',
        iconCircleBg: '#EBE5FF',
        image: PACKAGE_IMAGES.mother,
        planName: DEFAULT_PLAN_NAME,
        planDetails: DEFAULT_PLAN_DETAILS,
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
        accentColor: PINK,
        bgColor: '#FFF0F5',
        borderColor: PINK_BORDER,
        iconCircleBg: PINK_SOFT,
        image: PACKAGE_IMAGES.muma,
        planName: DEFAULT_PLAN_NAME,
        planDetails: DEFAULT_PLAN_DETAILS,
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

// ── Helpers ─────────────────────────────────────────────────────────────────────

const hexToRgba = (hex: string | undefined, alpha: number): string => {
    const fallback = `rgba(233, 30, 138, ${alpha})`;
    if (!hex) return fallback;

    let cleanHex = hex.replace('#', '').trim();
    if (cleanHex.length === 3) {
        cleanHex = cleanHex
            .split('')
            .map(c => c + c)
            .join('');
    }

    const num = parseInt(cleanHex, 16);
    if (Number.isNaN(num) || cleanHex.length !== 6) return fallback;

    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const mapIconName = (rawIcon: string | undefined, type: PackageType): string => {
    const clean = (rawIcon ?? '').replace(/^fa-/, '').trim();
    return PLACEHOLDER_ICONS.has(clean) ? DEFAULT_ICONS[type] : clean;
};

const cleanFeature = (feature: string): string => FEATURE_LABELS[feature] ?? feature;

const formatPrice = (amount?: number): string =>
    amount != null ? `₹ ${amount.toLocaleString('en-IN')}` : '';

const resolveImage = (remote: string | undefined, type: PackageType): ImageSourcePropType => {
    if (!remote) return PACKAGE_IMAGES[type];
    const isAbsolute = remote.startsWith('data:') || remote.startsWith('http');
    return { uri: isAbsolute ? remote : `${API_BASE_URL.replace('/api', '')}${remote}` };
};

const isOrderActive = (order: Order): boolean =>
    order.status === 'active' && (!order.expiresAt || new Date(order.expiresAt) > new Date());

const mapApiPackage = (p: ApiPackage): PackageCardItem => {
    const month1 = p.plans?.['1month'] ?? {};
    const accentColor = p.accentColor || DEFAULT_ACCENT[p.type];

    return {
        type: p.type,
        title: p.title || DEFAULT_TITLES[p.type],
        tagline: p.tagline || p.subtitle || '',
        icon: mapIconName(p.icon, p.type),
        accentColor,
        bgColor: hexToRgba(accentColor, 0.05),
        borderColor: hexToRgba(accentColor, 0.2),
        iconCircleBg: hexToRgba(accentColor, 0.12),
        image: resolveImage(p.backgroundImage || p.image, p.type),
        planName: month1.label || DEFAULT_PLAN_NAME,
        planDetails: month1.visitInfo || DEFAULT_PLAN_DETAILS,
        price: formatPrice(month1.price ?? p.startingPrice),
        originalPrice: formatPrice(month1.originalPrice),
        savings: month1.savings || 'Save 22%',
        features: p.features?.length ? p.features : month1.features ?? [],
    };
};

// ── Components ──────────────────────────────────────────────────────────────────

interface PackageCardProps {
    pkg: PackageCardItem;
    isActive: boolean;
    onPress: (type: PackageType) => void;
}

const PackageCard = memo(({ pkg, isActive, onPress }: PackageCardProps) => (
    <TouchableOpacity
        activeOpacity={0.92}
        onPress={() => onPress(pkg.type)}
        style={[
            styles.cardContainer,
            { backgroundColor: pkg.bgColor, borderColor: pkg.borderColor },
            isActive && { borderWidth: 2, borderColor: pkg.accentColor },
        ]}>
        {isActive && (
            <View style={[styles.activeSubRibbon, { backgroundColor: pkg.accentColor }]}>
                <Icon name="check" size={10} color={Colors.WHITE} style={styles.ribbonIcon} />
                <Text style={styles.activeSubRibbonText}>ACTIVE SUBSCRIPTION</Text>
            </View>
        )}

        <View style={styles.cardTopArea}>
            <Image source={pkg.image} style={styles.cardHeroImage} resizeMode="cover" />

            <View style={styles.cardLeftCol}>
                <View style={styles.cardTitleRow}>
                    <View style={[styles.iconCircleBadge, { backgroundColor: pkg.iconCircleBg }]}>
                        <Icon name={pkg.icon} size={18} color={pkg.accentColor} />
                    </View>
                    <View style={styles.titleTextWrapper}>
                        <Text style={styles.cardTitleText} numberOfLines={1} maxFontSizeMultiplier={1.25}>
                            {pkg.title}
                        </Text>
                        <Text style={styles.cardTaglineText} numberOfLines={2} maxFontSizeMultiplier={1.2}>
                            {pkg.tagline}
                        </Text>
                    </View>
                </View>

                <View style={styles.checklistGrid}>
                    {pkg.features.slice(0, 4).map(feature => (
                        <View key={feature} style={styles.checklistRow}>
                            <View style={[styles.checkCircleBadge, { backgroundColor: pkg.accentColor }]}>
                                <Icon name="check" size={8} color={Colors.WHITE} />
                            </View>
                            <Text style={styles.checkText} numberOfLines={1} maxFontSizeMultiplier={1.2}>
                                {cleanFeature(feature)}
                            </Text>
                        </View>
                    ))}
                </View>
            </View>
        </View>

        <View style={styles.priceFooterBox}>
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

        {/* Plain View: the whole card is already pressable, avoids nested touchables */}
        <View style={[styles.viewPlanButtonPill, { backgroundColor: pkg.accentColor }]}>
            <Text style={styles.viewPlanButtonText}>View Plan</Text>
            <Icon name="arrow-right" size={14} color={Colors.WHITE} style={styles.buttonIcon} />
        </View>
    </TouchableOpacity>
));

interface ActiveSubscriptionCardProps {
    order: Order;
    onPress: (order: Order) => void;
}

const ActiveSubscriptionCard = memo(({ order, onPress }: ActiveSubscriptionCardProps) => {
    const expiryDate = order.expiresAt
        ? new Date(order.expiresAt).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        })
        : 'N/A';
    const color = order.accentColor || Colors.PRIMARY;

    return (
        <TouchableOpacity
            style={[styles.activeSubCard, { borderColor: `${color}44` }]}
            activeOpacity={0.88}
            onPress={() => onPress(order)}>
            <View style={styles.activeSubHeader}>
                <View style={[styles.activeSubIconBox, { backgroundColor: `${color}1A` }]}>
                    <Icon name={order.icon ? order.icon.replace(/^fa-/, '') : 'box'} size={18} color={color} />
                </View>
                <View style={styles.activeSubTextWrapper}>
                    <Text style={styles.activeSubTitle}>{order.packageTitle}</Text>
                    <Text style={styles.activeSubPlan}>{order.planLabel} Plan</Text>
                </View>
                <View style={[styles.activeStatusBadge, { backgroundColor: `${Colors.SUCCESS}1A` }]}>
                    <Text style={[styles.activeStatusText, { color: Colors.SUCCESS }]}>ACTIVE</Text>
                </View>
            </View>
            <View style={styles.activeSubDivider} />
            <View style={styles.activeSubFooter}>
                <Text style={styles.activeSubFooterLabel}>
                    Expires on: <Text style={styles.activeSubFooterValue}>{expiryDate}</Text>
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: color, marginRight: 4 }}>Details</Text>
                    <Icon name="chevron-right" size={10} color={color} />
                </View>
            </View>
        </TouchableOpacity>
    );
});

// ── Screen ──────────────────────────────────────────────────────────────────────

const HomeScreen: React.FC<Props> = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const user = useAppSelector(state => state.auth.user);
    const token = user?.token;

    const [packageList, setPackageList] = useState<PackageCardItem[]>(DEFAULT_PACKAGES);
    const [orders, setOrders] = useState<Order[]>([]);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    const fetchPackages = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/packages`);
            const data = await res.json();
            if (res.ok && data.success && Array.isArray(data.data) && data.data.length > 0) {
                const formatted = (data.data as ApiPackage[])
                    .map(mapApiPackage)
                    .sort((a, b) => (PACKAGE_SORT_ORDER[a.type] ?? 99) - (PACKAGE_SORT_ORDER[b.type] ?? 99));
                setPackageList(formatted);
            }
        } catch (err) {
            console.warn('Error fetching packages in Home:', err);
        }
    }, []);

    const fetchOrders = useCallback(async () => {
        if (!token) return;
        try {
            const res = await fetch(`${API_BASE_URL}/orders`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setOrders(data.data ?? []);
            }
        } catch (err) {
            console.warn('Error fetching orders in Home:', err);
        }
    }, [token]);

    // Runs on first focus and every time the screen regains focus.
    useFocusEffect(
        useCallback(() => {
            fetchPackages();
            fetchOrders();
        }, [fetchPackages, fetchOrders]),
    );

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            await Promise.all([fetchPackages(), fetchOrders()]);
        } finally {
            setRefreshing(false);
        }
    }, [fetchPackages, fetchOrders]);

    const activeSubscriptions = useMemo(() => orders.filter(isOrderActive), [orders]);
    const activePackageTypes = useMemo(
        () => new Set(activeSubscriptions.map(o => o.packageType)),
        [activeSubscriptions],
    );

    const openPackage = useCallback(
        (packageType: PackageType) => navigation.navigate(Routes.PACKAGE_DETAIL, { packageType }),
        [navigation],
    );

    return (
        <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

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
                        <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
                    ) : (
                        <Image source={DEFAULT_AVATAR} style={styles.avatarPlaceholder} />
                    )}
                </TouchableOpacity>
            </View>

            {/* ── Location & Verified Nurse Subbar ── */}
            <View style={styles.subBar}>
                <TouchableOpacity style={styles.locationSelector} activeOpacity={0.8}>
                    <Icon name="map-marker-alt" size={14} color="#2D3748" style={styles.locationIcon} />
                    <Text style={styles.locationText}>Bangalore</Text>
                </TouchableOpacity>

                <View style={styles.verifiedBadge}>
                    <Icon name="check-circle" size={13} color={PINK} solid style={styles.verifiedIcon} />
                    <Text style={styles.verifiedText}>Verified Nurses</Text>
                </View>
            </View>

            <ScrollView
                style={styles.flex}
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
                {/* ── Banner (height derived from the image's real aspect ratio) ── */}
                <View style={{ width: '100%', height: 230, backgroundColor: 'red' }}>
                    <Image source={BANNER_SOURCE} style={styles.heroBanner} resizeMode="stretch" />
                </View>

                {/* ── Care Packages Title ── */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Our Care Packages</Text>
                    <Text style={styles.sectionSubtitle}>
                        Choose the care you need for you and your little one.
                    </Text>
                </View>

                {/* ── Active Subscriptions ── */}
                {activeSubscriptions.length > 0 && (
                    <View style={styles.activeSubsContainer}>
                        <Text style={styles.activeSubsTitle}>Your Active Subscriptions</Text>
                        {activeSubscriptions.map(order => (
                            <ActiveSubscriptionCard key={order._id} order={order} onPress={setSelectedOrder} />
                        ))}
                    </View>
                )}

                {/* ── Packages List ── */}
                <View style={styles.packageCardsList}>
                    {packageList.map(pkg => (
                        <PackageCard
                            key={pkg.type}
                            pkg={pkg}
                            isActive={activePackageTypes.has(pkg.type)}
                            onPress={openPackage}
                        />
                    ))}
                </View>
            </ScrollView>

            {/* ── Bottom Navigation Bar ── */}
            <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, 8) }]}>
                <TouchableOpacity style={styles.navItem} activeOpacity={0.8}>
                    <Icon name="home" size={20} color={PINK} />
                    <Text style={[styles.navLabel, styles.navLabelActive]}>Home</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.navItem}
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate(Routes.APPOINTMENTS)}>
                    <Icon name="calendar-alt" size={19} color={TEXT_MUTED} />
                    <Text style={styles.navLabel}>My Bookings</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.navItem} activeOpacity={0.8} onPress={() => openPackage('muma')}>
                    <Icon name="heart" size={19} color={TEXT_MUTED} />
                    <Text style={styles.navLabel}>Packages</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.navItem}
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate(Routes.PROFILE)}>
                    <Icon name="user" size={19} color={TEXT_MUTED} />
                    <Text style={styles.navLabel}>Profile</Text>
                </TouchableOpacity>
            </View>

            {/* ── Order Detail Modal ── */}
            <OrderDetailModal
                visible={!!selectedOrder}
                order={selectedOrder}
                onClose={() => setSelectedOrder(null)}
                onGoToBookings={() => navigation.navigate(Routes.APPOINTMENTS)}
            />
        </SafeAreaView>
    );
};

export default HomeScreen;

// ── Styles ──────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    flex: { flex: 1, marginRight: 4 },
    safe: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },

    // Top bar
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SCREEN_PADDING,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
    },
    welcome: { color: TEXT_MUTED, fontSize: 13 },
    name: {
        color: TEXT_DARK,
        fontSize: 20,
        fontWeight: '800',
        marginTop: 2,
    },
    avatar: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: PINK,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: PINK,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
        padding: 4,
        overflow: 'hidden',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        borderRadius: 19,
    },
    avatarPlaceholder: {
        width: '100%',
        height: '100%',
        tintColor: Colors.WHITE,
    },

    // Sub bar
    subBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SCREEN_PADDING,
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
    locationIcon: { marginRight: 6 },
    locationText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#2D3748',
    },
    verifiedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: PINK_SOFT,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: PINK_BORDER,
    },
    verifiedIcon: { marginRight: 5 },
    verifiedText: {
        fontSize: 11,
        fontWeight: '700',
        color: PINK,
    },

    // Scroll area
    scrollContent: {
        paddingHorizontal: SCREEN_PADDING,
        paddingTop: 8,
        paddingBottom: 16,
    },
    heroBanner: {
        width: '100%',
        height: '100%',
        // aspectRatio: BANNER_ASPECT_RATIO,
        // borderRadius: 16,
        // marginBottom: 14,
    },
    sectionHeader: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: TEXT_DARK,
        letterSpacing: -0.3,
    },
    sectionSubtitle: {
        fontSize: 13,
        color: TEXT_MUTED,
        marginTop: 3,
    },
    packageCardsList: {
        gap: 18,
    },

    // Package card
    cardContainer: {
        borderRadius: 24,
        borderWidth: 1.5,
        overflow: 'hidden',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
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
    ribbonIcon: { marginRight: 4 },
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
        marginLeft: 8,
    },
    cardHeroImage: {
        position: 'absolute',
        top: -16,
        right: 0,
        width: CARD_WIDTH,
        height: Math.round(CARD_WIDTH * 0.5),
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
        color: TEXT_DARK,
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

    // Price footer
    priceFooterBox: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
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
        color: TEXT_DARK,
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

    // Button pill
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
    buttonIcon: { marginLeft: 6 },

    // Active subscriptions
    activeSubsContainer: {
        marginBottom: 16,
    },
    activeSubsTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: TEXT_DARK,
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
        width: 34,
        height: 34,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    activeSubTextWrapper: { flex: 1, marginLeft: 12 },
    activeSubTitle: { fontSize: 14, fontWeight: '800', color: TEXT_DARK },
    activeSubPlan: { fontSize: 11, color: TEXT_MUTED, marginTop: 1 },
    activeStatusBadge: { paddingHorizontal: 6, paddingVertical: 3, borderRadius: 10 },
    activeStatusText: { fontSize: 9, fontWeight: '800' },
    activeSubDivider: { height: 1, backgroundColor: BORDER_LIGHT, marginVertical: 8 },
    activeSubFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    activeSubFooterLabel: { fontSize: 11, color: '#A0AEC0', fontWeight: '500' },
    activeSubFooterValue: { fontSize: 11, color: '#2D3748', fontWeight: '700' },

    // Bottom navigation
    bottomNav: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: BORDER_LIGHT,
        paddingTop: 8,
    },
    navItem: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    navLabel: {
        fontSize: 10,
        fontWeight: '600',
        color: TEXT_MUTED,
        marginTop: 3,
    },
    navLabelActive: {
        color: PINK,
        fontWeight: '800',
    },
});