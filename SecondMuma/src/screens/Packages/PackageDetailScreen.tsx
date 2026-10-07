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

const DEFAULT_ICONS_LIST: Record<string, Array<{ icon: string; label: string }>> = {
    baby: [
        { icon: 'baby', label: 'Baby\nCare' },
        { icon: 'hands-wash', label: 'Bathing\n& Hygiene' },
        { icon: 'cookie-bite', label: 'Feeding\nSupport' },
        { icon: 'moon', label: 'Sleep\nGuidance' },
        { icon: 'heartbeat', label: 'Growth\nTracking' },
    ],
    mother: [
        { icon: 'female', label: 'Mother\nCare' },
        { icon: 'spa', label: 'Recovery\nSupport' },
        { icon: 'prescription-bottle', label: 'Lactation\nSupport' },
        { icon: 'heartbeat', label: 'Health\nMonitor' },
        { icon: 'book-open', label: 'Wellness\nGuidance' },
    ],
    muma: [
        { icon: 'baby', label: 'Baby\nCare' },
        { icon: 'female', label: 'Mother\nCare' },
        { icon: 'spa', label: 'Recovery\nSupport' },
        { icon: 'prescription-bottle', label: 'Feeding\nSupport' },
        { icon: 'book-open', label: 'Guidance\n& Updates' },
    ],
};

const createInitialPackageInfo = (type: string): PackageDetailInfo => {
    const isBaby = type === 'baby';
    const isMother = type === 'mother';
    const title = isBaby ? 'Baby Care' : isMother ? 'Mother Care' : 'Mother + Baby Care';
    const accentColor = isMother ? '#5C54E5' : '#E91E8A';
    const icon = isBaby ? 'baby' : isMother ? 'female' : 'heart';

    return {
        type,
        title,
        subtitle: `Specialized ${title.toLowerCase()} service provided at home.`,
        icon,
        accentColor,
        mainImage: null,
        gallery: [],
        iconsList: DEFAULT_ICONS_LIST[type] || DEFAULT_ICONS_LIST.muma,
        includedCol1: [],
        includedCol2: [],
        plans: {
            '1month': {
                key: '1month',
                label: '1 Month Plan',
                subtitle: '',
                price: 0,
                originalPrice: 0,
                savings: '',
            },
            '3month': {
                key: '3month',
                label: '2 Months Plan',
                subtitle: '',
                price: 0,
                originalPrice: 0,
                savings: '',
                badge: 'Most Popular',
            },
            '6month': {
                key: '6month',
                label: '3 Months Plan',
                subtitle: '',
                price: 0,
                originalPrice: 0,
                savings: '',
            },
        },
    };
};

const PackageDetailScreen: React.FC<Props> = ({ navigation, route }) => {
    const insets = useSafeAreaInsets();
    const { packageType } = route.params;

    const [pkgData, setPkgData] = useState<PackageDetailInfo>(() => createInitialPackageInfo(packageType));
    const [selectedPlanKey, setSelectedPlanKey] = useState<PlanKey>('1month');
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [isFavorite, setIsFavorite] = useState(false);

    const fetchPackageDetail = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/packages/${packageType}`);
            const data = await res.json();
            if (res.ok && data.success && data.data) {
                const fetched = data.data;
                const baseInfo = createInitialPackageInfo(packageType);

                const apiPlans: Record<PlanKey, PlanDetail> = { ...baseInfo.plans };

                if (fetched.plans) {
                    (['1month', '3month', '6month'] as PlanKey[]).forEach(k => {
                        if (fetched.plans[k]) {
                            const p = fetched.plans[k];

                            // Dynamic visit count & hours format from backend
                            let visitSubtitle = p.visitInfo || p.subtitle;
                            if (!visitSubtitle || (p.visitCount && p.hoursPerVisit)) {
                                const vCount = p.visitCount || (k === '1month' ? 26 : k === '3month' ? 52 : 78);
                                const vHours = p.hoursPerVisit || 3;
                                visitSubtitle = `${vCount} visits × ${vHours} hours (${vCount * vHours} hours)`;
                            }

                            const origPrice = p.originalPrice ?? apiPlans[k]?.originalPrice ?? 0;
                            const actPrice = p.price ?? apiPlans[k]?.price ?? 0;
                            let savingsText = p.savings || apiPlans[k]?.savings || '';
                            if (!savingsText && origPrice > actPrice && origPrice > 0) {
                                const pct = Math.round(((origPrice - actPrice) / origPrice) * 100);
                                savingsText = `Save ${pct}%`;
                            }

                            apiPlans[k] = {
                                key: k,
                                label: p.label || apiPlans[k]?.label || (k === '1month' ? '1 Month Plan' : k === '3month' ? '2 Months Plan' : '3 Months Plan'),
                                subtitle: visitSubtitle || apiPlans[k]?.subtitle || '',
                                price: actPrice,
                                originalPrice: origPrice,
                                savings: savingsText,
                                badge: p.badge !== undefined ? p.badge : apiPlans[k]?.badge,
                            };
                        }
                    });
                }

                // If package has features, split into 2 columns
                let col1: string[] = [];
                let col2: string[] = [];
                if (Array.isArray(fetched.features) && fetched.features.length > 0) {
                    const half = Math.ceil(fetched.features.length / 2);
                    col1 = fetched.features.slice(0, half);
                    col2 = fetched.features.slice(half);
                }

                const cleanTitle = fetched.title || baseInfo.title;

                const rawImagesList: string[] = Array.isArray(fetched.images) && fetched.images.length > 0
                    ? fetched.images
                    : (fetched.backgroundImage || fetched.image ? [fetched.backgroundImage || fetched.image] : []);

                const remoteGallery = rawImagesList
                    .filter((imgStr): imgStr is string => typeof imgStr === 'string' && imgStr.trim().length > 0)
                    .map(imgStr => ({
                        uri: imgStr.startsWith('data:') || imgStr.startsWith('http') ? imgStr : `${API_BASE_URL.replace('/api', '')}${imgStr}`
                    }));

                const heroImg = remoteGallery.length > 0 ? remoteGallery[0] : null;
                const galleryList = remoteGallery;

                setPkgData({
                    ...baseInfo,
                    title: cleanTitle,
                    subtitle: fetched.subtitle || fetched.tagline || baseInfo.subtitle,
                    badge: fetched.badge !== undefined ? fetched.badge : baseInfo.badge,
                    icon: (fetched.icon ?? baseInfo.icon).replace(/^fa-/, ''),
                    accentColor: fetched.accentColor || baseInfo.accentColor,
                    mainImage: heroImg,
                    gallery: galleryList,
                    includedCol1: col1.length ? col1 : baseInfo.includedCol1,
                    includedCol2: col2.length ? col2 : baseInfo.includedCol2,
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
                {(pkg.gallery[selectedImageIndex] || pkg.mainImage) ? (
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
                ) : null}

                {/* Thumbnails Strip */}
                {pkg.gallery && pkg.gallery.length > 1 ? (
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
                ) : null}

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
