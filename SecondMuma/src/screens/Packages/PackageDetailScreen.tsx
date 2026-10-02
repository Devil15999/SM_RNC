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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { RootStackParamList } from '../../types/navigation';
import { Routes } from '../../constants/routes';
import { API_BASE_URL } from '../../config';

const { width: SW } = Dimensions.get('window');

type Props = NativeStackScreenProps<RootStackParamList, 'PackageDetail'>;

type PlanKey = '1month' | '3month' | '6month';

interface PlanDetail {
    key: PlanKey;
    label: string;
    subtitle: string;
    price: number;
    originalPrice: number;
    savings: string;
    badge?: string;
}

interface PackageDetailInfo {
    type: string;
    title: string;
    subtitle: string;
    badge?: string;
    icon: string;
    accentColor: string;
    mainImage: any;
    gallery: any[];
    iconsList: Array<{ icon: string; label: string }>;
    includedCol1: string[];
    includedCol2: string[];
    plans: Record<PlanKey, PlanDetail>;
}

const DEFAULT_PACKAGES: Record<string, PackageDetailInfo> = {
    baby: {
        type: 'baby',
        title: 'Baby Care',
        subtitle: 'Comprehensive newborn care, bathing, feeding routines, milestone tracking, and gentle attention.',
        icon: 'baby',
        accentColor: '#E91E8A',
        mainImage: require('../../assets/post1.png'),
        gallery: [
            require('../../assets/post1.png'),
            require('../../assets/post2.png'),
            require('../../assets/post3.png'),
            require('../../assets/post1.png'),
            require('../../assets/post2.png'),
        ],
        iconsList: [
            { icon: 'baby', label: 'Baby\nCare' },
            { icon: 'hands-wash', label: 'Bathing\n& Hygiene' },
            { icon: 'cookie-bite', label: 'Feeding\nSupport' },
            { icon: 'moon', label: 'Sleep\nGuidance' },
            { icon: 'heartbeat', label: 'Growth\nTracking' },
        ],
        includedCol1: [
            'Hygiene care, bathing & cord care',
            'Feeding, burping & colic relief',
            'Sleep routine & bedtime support',
            'Growth & milestone tracking',
        ],
        includedCol2: [
            'Sanitation of baby gear & bottles',
            'Pediatric checkup assistance',
            'Vaccination schedule support',
            'Dedicated certified baby nurse',
        ],
        plans: {
            '1month': {
                key: '1month',
                label: '1 Month Plan',
                subtitle: '26 visits × 3 hours (78 hours)',
                price: 24999,
                originalPrice: 32000,
                savings: 'Save 22%',
            },
            '3month': {
                key: '3month',
                label: '2 Months Plan',
                subtitle: '52 visits × 3 hours (156 hours)',
                price: 46999,
                originalPrice: 64000,
                savings: 'Save 27%',
                badge: 'Most Popular',
            },
            '6month': {
                key: '6month',
                label: '3 Months Plan',
                subtitle: '78 visits × 3 hours (234 hours)',
                price: 67999,
                originalPrice: 96000,
                savings: 'Save 29%',
            },
        },
    },
    mother: {
        type: 'mother',
        title: 'Mother Care',
        subtitle: 'Dedicated postpartum recovery support, lactation assistance, and physical wellness for new mothers.',
        icon: 'female',
        accentColor: '#5C54E5',
        mainImage: require('../../assets/post3.png'),
        gallery: [
            require('../../assets/post3.png'),
            require('../../assets/post1.png'),
            require('../../assets/post2.png'),
            require('../../assets/post3.png'),
            require('../../assets/post1.png'),
        ],
        iconsList: [
            { icon: 'female', label: 'Mother\nCare' },
            { icon: 'spa', label: 'Recovery\nSupport' },
            { icon: 'prescription-bottle', label: 'Lactation\nSupport' },
            { icon: 'heartbeat', label: 'Health\nMonitor' },
            { icon: 'book-open', label: 'Wellness\nGuidance' },
        ],
        includedCol1: [
            'Postpartum recovery assistance',
            'Breastfeeding & lactation support',
            'Nutritional guidance & meal help',
            'Emotional wellness & vitals log',
        ],
        includedCol2: [
            'Post-caesarean & wound care',
            'Gentle massage & relaxation',
            'Consultation & progress updates',
            'Dedicated care coordinator',
        ],
        plans: {
            '1month': {
                key: '1month',
                label: '1 Month Plan',
                subtitle: '26 visits × 3 hours (78 hours)',
                price: 34999,
                originalPrice: 45000,
                savings: 'Save 22%',
            },
            '3month': {
                key: '3month',
                label: '2 Months Plan',
                subtitle: '52 visits × 3 hours (156 hours)',
                price: 64999,
                originalPrice: 90000,
                savings: 'Save 28%',
                badge: 'Most Popular',
            },
            '6month': {
                key: '6month',
                label: '3 Months Plan',
                subtitle: '78 visits × 3 hours (234 hours)',
                price: 89999,
                originalPrice: 135000,
                savings: 'Save 33%',
            },
        },
    },
    muma: {
        type: 'muma',
        title: 'Mother + Baby Care',
        subtitle: 'The ultimate 360° care bundle providing dual dedicated support for both mother\'s recovery and baby\'s healthy start.',
        icon: 'heart',
        accentColor: '#E91E8A',
        mainImage: require('../../assets/post2.png'),
        gallery: [
            require('../../assets/post2.png'),
            require('../../assets/post1.png'),
            require('../../assets/post3.png'),
            require('../../assets/post2.png'),
            require('../../assets/post1.png'),
        ],
        iconsList: [
            { icon: 'baby', label: 'Baby\nCare' },
            { icon: 'female', label: 'Mother\nCare' },
            { icon: 'spa', label: 'Recovery\nSupport' },
            { icon: 'prescription-bottle', label: 'Feeding\nSupport' },
            { icon: 'book-open', label: 'Guidance\n& Updates' },
        ],
        includedCol1: [
            'All essential Baby Care services',
            'All specialized Mother Care services',
            'Lactation & breastfeeding assistance',
            'Postpartum recovery & routine planning',
        ],
        includedCol2: [
            'Dual nurse care coordination',
            'Daily vitals & progress logs',
            '24/7 dedicated support team',
            'Comprehensive care reports',
        ],
        plans: {
            '1month': {
                key: '1month',
                label: '1 Month Plan',
                subtitle: '26 visits × 3 hours (78 hours)',
                price: 49999,
                originalPrice: 65000,
                savings: 'Save 23%',
                badge: 'Most Popular',
            },
            '3month': {
                key: '3month',
                label: '2 Months Plan',
                subtitle: '52 visits × 3 hours (156 hours)',
                price: 89999,
                originalPrice: 120000,
                savings: 'Save 25%',
            },
            '6month': {
                key: '6month',
                label: '3 Months Plan',
                subtitle: '78 visits × 3 hours (234 hours)',
                price: 129999,
                originalPrice: 180000,
                savings: 'Save 28%',
            },
        },
    },
};

const PackageDetailScreen: React.FC<Props> = ({ navigation, route }) => {
    const insets = useSafeAreaInsets();
    const { packageType } = route.params;

    const [pkgData, setPkgData] = useState<PackageDetailInfo>(DEFAULT_PACKAGES[packageType] || DEFAULT_PACKAGES.muma);
    const [selectedPlanKey, setSelectedPlanKey] = useState<PlanKey>('1month');
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [isFavorite, setIsFavorite] = useState(false);

    const fetchPackageDetail = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/packages/${packageType}`);
            const data = await res.json();
            if (res.ok && data.success && data.data) {
                const fetched = data.data;
                const baseDefault = DEFAULT_PACKAGES[packageType] || DEFAULT_PACKAGES.muma;

                const apiPlans: Record<PlanKey, PlanDetail> = { ...baseDefault.plans };

                if (fetched.plans) {
                    (['1month', '3month', '6month'] as PlanKey[]).forEach(k => {
                        if (fetched.plans[k]) {
                            const p = fetched.plans[k];
                            apiPlans[k] = {
                                key: k,
                                label: p.label || apiPlans[k].label,
                                subtitle: p.visitInfo || p.subtitle || apiPlans[k].subtitle,
                                price: p.price ?? apiPlans[k].price,
                                originalPrice: p.originalPrice ?? apiPlans[k].originalPrice,
                                savings: p.savings || apiPlans[k].savings,
                                badge: p.badge !== undefined ? p.badge : apiPlans[k].badge,
                            };
                        }
                    });
                }

                // If package has features, split into 2 columns
                let col1 = baseDefault.includedCol1;
                let col2 = baseDefault.includedCol2;
                if (Array.isArray(fetched.features) && fetched.features.length > 0) {
                    const half = Math.ceil(fetched.features.length / 2);
                    col1 = fetched.features.slice(0, half);
                    col2 = fetched.features.slice(half);
                }

                const cleanTitle = fetched.title || baseDefault.title;

                const rawImagesList: string[] = Array.isArray(fetched.images) && fetched.images.length > 0
                    ? fetched.images
                    : (fetched.backgroundImage || fetched.image ? [fetched.backgroundImage || fetched.image] : []);

                const remoteGallery = rawImagesList.map(imgStr => ({
                    uri: imgStr.startsWith('data:') || imgStr.startsWith('http') ? imgStr : `${API_BASE_URL.replace('/api', '')}${imgStr}`
                }));

                const heroImg = remoteGallery.length > 0 ? remoteGallery[0] : baseDefault.mainImage;
                const galleryList = remoteGallery.length > 0 ? remoteGallery : baseDefault.gallery;

                setPkgData({
                    ...baseDefault,
                    title: cleanTitle,
                    subtitle: fetched.subtitle || fetched.tagline || baseDefault.subtitle,
                    badge: fetched.badge !== undefined ? fetched.badge : baseDefault.badge,
                    icon: (fetched.icon ?? baseDefault.icon).replace(/^fa-/, ''),
                    accentColor: fetched.accentColor || baseDefault.accentColor,
                    mainImage: heroImg,
                    gallery: galleryList,
                    includedCol1: col1,
                    includedCol2: col2,
                    plans: apiPlans,
                });
            }
        } catch (err) {
            console.log('Error fetching package detail:', err);
        }
    }, [packageType]);

    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            await fetchPackageDetail();
        } finally {
            setRefreshing(false);
        }
    }, [fetchPackageDetail]);

    useEffect(() => {
        fetchPackageDetail();
    }, [fetchPackageDetail]);

    const pkg = pkgData;
    const currentPlan = pkg.plans[selectedPlanKey];

    const handleBookNow = () => {
        navigation.navigate(Routes.CHECKOUT, {
            packageType: pkg.type as any,
            packageTitle: pkg.title,
            planKey: currentPlan.key,
            planLabel: currentPlan.label,
            price: currentPlan.price,
            icon: pkg.icon,
            accentColor: pkg.accentColor,
        });
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

            {/* ── Top Header ── */}
            <View style={[styles.topNavHeader, { paddingTop: Math.max(insets.top, 10) }]}>
                <TouchableOpacity style={styles.navBackButton} onPress={() => navigation.goBack()} activeOpacity={0.7}>
                    <Icon name="chevron-left" size={18} color="#2D3748" />
                </TouchableOpacity>

                <Text style={styles.navHeaderTitle}>{pkg.title}</Text>

                <View style={{ width: 36 }} />
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#E91E8A']}
                        tintColor="#E91E8A"
                    />
                }>

                {/* ── Hero Image & Gallery ── */}
                <View style={styles.heroWrapper}>
                    <Image
                        source={pkg.gallery[selectedImageIndex] || pkg.mainImage}
                        style={styles.heroBannerImage}
                        resizeMode="cover"
                    />

                    {/* Heart Floating Button */}
                    <TouchableOpacity
                        style={styles.favoriteButton}
                        activeOpacity={0.8}
                        onPress={() => setIsFavorite(!isFavorite)}>
                        <Icon name="heart" size={18} color="#E91E8A" solid={isFavorite} />
                    </TouchableOpacity>
                </View>

                {/* Thumbnails Strip */}
                <View style={styles.thumbnailsRow}>
                    {pkg.gallery.map((img, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.thumbnailBox,
                                selectedImageIndex === index && { borderColor: '#E91E8A', borderWidth: 2 },
                            ]}
                            activeOpacity={0.8}
                            onPress={() => setSelectedImageIndex(index)}>
                            <Image source={img} style={styles.thumbnailImg} resizeMode="cover" />
                        </TouchableOpacity>
                    ))}
                </View>

                {/* ── Package Title & Badge Header ── */}
                <View style={styles.titleSection}>
                    <View style={styles.titleRow}>
                        <View style={styles.titleIconCircle}>
                            <Icon name={pkg.icon} size={18} color="#E91E8A" solid />
                        </View>
                        <Text style={styles.pkgTitleText}>{pkg.title}</Text>
                    </View>

                    <Text style={styles.pkgSubtitleText}>{pkg.subtitle}</Text>
                </View>

                {/* ── Feature Icons Row (5 Circle Buttons) ── */}
                <View style={styles.iconsRowContainer}>
                    {pkg.iconsList.map((item, i) => (
                        <View key={i} style={styles.iconCategoryItem}>
                            <View style={styles.categoryIconCircle}>
                                <Icon name={item.icon} size={20} color="#E91E8A" />
                            </View>
                            <Text style={styles.categoryIconLabel}>{item.label}</Text>
                        </View>
                    ))}
                </View>

                {/* ── What's Included Section ── */}
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionHeading}>What's Included</Text>

                    <View style={styles.includedGrid}>
                        {/* Column 1 */}
                        <View style={styles.includedCol}>
                            {pkg.includedCol1.map((feat, idx) => (
                                <View key={idx} style={styles.includedRow}>
                                    <View style={styles.checkBadgeCircle}>
                                        <Icon name="check" size={10} color="#FFF" />
                                    </View>
                                    <Text style={styles.includedText}>{feat}</Text>
                                </View>
                            ))}
                        </View>

                        {/* Column 2 */}
                        <View style={styles.includedCol}>
                            {pkg.includedCol2.map((feat, idx) => (
                                <View key={idx} style={styles.includedRow}>
                                    <View style={styles.checkBadgeCircle}>
                                        <Icon name="check" size={10} color="#FFF" />
                                    </View>
                                    <Text style={styles.includedText}>{feat}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                </View>

                {/* ── Plan & Pricing Section ── */}
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionHeading}>Plan & Pricing</Text>

                    <View style={styles.plansList}>
                        {(['1month', '3month', '6month'] as PlanKey[]).map((planKey) => {
                            const plan = pkg.plans[planKey];
                            if (!plan) return null;
                            const isSelected = selectedPlanKey === planKey;

                            return (
                                <TouchableOpacity
                                    key={planKey}
                                    style={[
                                        styles.planCard,
                                        isSelected && styles.planCardSelected,
                                    ]}
                                    activeOpacity={0.88}
                                    onPress={() => setSelectedPlanKey(planKey)}>

                                    <View style={styles.planCardLeft}>
                                        {/* Radio Circle */}
                                        <View style={[styles.radioOuterCircle, isSelected && styles.radioOuterSelected]}>
                                            {isSelected && <View style={styles.radioInnerCircle} />}
                                        </View>

                                        <View style={{ flex: 1, marginLeft: 12 }}>
                                            <View style={styles.planTitleBadgeRow}>
                                                <Text style={[styles.planTitleText, isSelected && { color: '#E91E8A' }]}>
                                                    {plan.label}
                                                </Text>
                                                {plan.badge && (
                                                    <Text style={styles.planHighlightBadge}> ({plan.badge})</Text>
                                                )}
                                            </View>

                                            <View style={styles.planSubRow}>
                                                <Text style={styles.planSubtitleText}>{plan.subtitle}</Text>
                                                {!!plan.savings && (
                                                    <View style={styles.discountBadgePill}>
                                                        <Text style={styles.discountBadgeText}>{plan.savings}</Text>
                                                    </View>
                                                )}
                                            </View>
                                        </View>
                                    </View>

                                    <View style={styles.planCardRight}>
                                        <Text style={styles.planPriceText}>₹ {plan.price.toLocaleString('en-IN')}</Text>
                                        {!!plan.originalPrice && (
                                            <Text style={styles.planMrpText}>₹ {plan.originalPrice.toLocaleString('en-IN')}</Text>
                                        )}
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {/* ── Why Choose Second Muma? ── */}
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionHeading}>Why Choose Second Muma?</Text>

                    <View style={styles.whyChooseRow}>
                        <View style={styles.whyItem}>
                            <View style={styles.whyIconCircle}>
                                <Icon name="user-shield" size={18} color="#E91E8A" />
                            </View>
                            <Text style={styles.whyText}>Verified & Trained Nurses</Text>
                        </View>

                        <View style={styles.whyItem}>
                            <View style={styles.whyIconCircle}>
                                <Icon name="home" size={18} color="#E91E8A" />
                            </View>
                            <Text style={styles.whyText}>Safe & Hygienic Care at Home</Text>
                        </View>

                        <View style={styles.whyItem}>
                            <View style={styles.whyIconCircle}>
                                <Icon name="heart" size={18} color="#E91E8A" />
                            </View>
                            <Text style={styles.whyText}>Trusted by Families</Text>
                        </View>

                        <View style={styles.whyItem}>
                            <View style={styles.whyIconCircle}>
                                <Icon name="users" size={18} color="#E91E8A" />
                            </View>
                            <Text style={styles.whyText}>Personalized Care Plan</Text>
                        </View>
                    </View>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* ── Sticky Bottom Action Footer ── */}
            <View style={[styles.bottomFooterBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
                <TouchableOpacity
                    style={styles.bookNowBtn}
                    activeOpacity={0.88}
                    onPress={handleBookNow}>
                    <Text style={styles.bookNowBtnText}>Book Now</Text>
                    <Icon name="arrow-right" size={15} color="#FFF" style={{ marginLeft: 8 }} />
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default PackageDetailScreen;

// ── Styles ──────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    topNavHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F4F8',
    },
    navBackButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F7FAFC',
        justifyContent: 'center',
        alignItems: 'center',
    },
    navHeaderTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: '#1A202C',
    },
    scrollContent: {
        paddingBottom: 110,
    },

    // Hero Banner & Gallery
    heroWrapper: {
        position: 'relative',
        width: SW,
        height: 220,
    },
    heroBannerImage: {
        width: '100%',
        height: '100%',
    },
    favoriteButton: {
        position: 'absolute',
        top: 14,
        right: 16,
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 4,
    },
    thumbnailsRow: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 8,
        backgroundColor: '#FFFFFF',
    },
    thumbnailBox: {
        flex: 1,
        height: 52,
        borderRadius: 10,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    thumbnailImg: {
        width: '100%',
        height: '100%',
    },

    // Title & Badge Section
    titleSection: {
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 12,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        marginBottom: 6,
    },
    titleIconCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#FFF0F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    pkgTitleText: {
        fontSize: 20,
        fontWeight: '900',
        color: '#1A202C',
        marginRight: 8,
    },
    popularBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E91E8A',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
    },
    popularBadgeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '800',
    },
    pkgSubtitleText: {
        fontSize: 12,
        color: '#718096',
        lineHeight: 18,
    },

    // Feature Icons Row
    iconsRowContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingHorizontal: 12,
        paddingVertical: 14,
        backgroundColor: '#FFF8FA',
        marginVertical: 10,
    },
    iconCategoryItem: {
        alignItems: 'center',
        flex: 1,
    },
    categoryIconCircle: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FFD6E8',
        marginBottom: 6,
    },
    categoryIconLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: '#2D3748',
        textAlign: 'center',
        lineHeight: 13,
    },

    // Sections
    sectionContainer: {
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    sectionHeading: {
        fontSize: 17,
        fontWeight: '900',
        color: '#E91E8A',
        marginBottom: 12,
    },
    includedGrid: {
        flexDirection: 'row',
        gap: 12,
    },
    includedCol: {
        flex: 1,
        gap: 10,
    },
    includedRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    checkBadgeCircle: {
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#E91E8A',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 6,
    },
    includedText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#2D3748',
        flex: 1,
        lineHeight: 15,
    },

    // Plan & Pricing
    plansList: {
        gap: 10,
    },
    planCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 14,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        backgroundColor: '#FFFFFF',
    },
    planCardSelected: {
        borderColor: '#E91E8A',
        backgroundColor: '#FFF0F6',
    },
    planCardLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    radioOuterCircle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#CBD5E0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioOuterSelected: {
        borderColor: '#E91E8A',
    },
    radioInnerCircle: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#E91E8A',
    },
    planTitleBadgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    planTitleText: {
        fontSize: 14,
        fontWeight: '900',
        color: '#1A202C',
    },
    planHighlightBadge: {
        fontSize: 11,
        fontWeight: '700',
        color: '#E91E8A',
    },
    planSubRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 3,
        flexWrap: 'wrap',
    },
    planSubtitleText: {
        fontSize: 10,
        color: '#718096',
    },
    discountBadgePill: {
        backgroundColor: '#E91E8A',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    discountBadgeText: {
        color: '#FFFFFF',
        fontSize: 9,
        fontWeight: '800',
    },
    planCardRight: {
        alignItems: 'flex-end',
    },
    planPriceText: {
        fontSize: 17,
        fontWeight: '900',
        color: '#1A202C',
    },
    planMrpText: {
        fontSize: 11,
        color: '#A0AEC0',
        textDecorationLine: 'line-through',
        marginTop: 1,
    },

    // Why Choose
    whyChooseRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 10,
    },
    whyItem: {
        alignItems: 'center',
        flex: 1,
        paddingHorizontal: 4,
    },
    whyIconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#FFF0F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#FFD6E8',
    },
    whyText: {
        fontSize: 9,
        fontWeight: '700',
        color: '#2D3748',
        textAlign: 'center',
        lineHeight: 13,
    },

    // Bottom Action Footer
    bottomFooterBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#EDF2F7',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 8,
    },
    bookNowBtn: {
        height: 50,
        borderRadius: 25,
        backgroundColor: '#E91E8A',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    bookNowBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: 0.3,
    },
});
