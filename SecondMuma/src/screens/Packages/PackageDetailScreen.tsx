import React, { useState, useEffect } from 'react';
import {
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { RootStackParamList } from '../../types/navigation';
import { Colors } from '../../constants/theme';
import { API_BASE_URL } from '../../config';

type Props = NativeStackScreenProps<RootStackParamList, 'PackageDetail'>;

// ── Package data ────────────────────────────────────────────────────────────────

type PlanKey = '1month' | '3month' | '6month';

interface Plan {
    label: string;
    price: number;
    originalPrice: number;
    savings: string;
    features: string[];
    badge?: string;
}

interface PackageInfo {
    title: string;
    subtitle: string;
    icon: string;
    accentColor: string;
    plans: Record<PlanKey, Plan>;
}

const PACKAGES: Record<string, PackageInfo> = {
    mother: {
        title: 'Mother Care',
        subtitle: 'Expert health support tailored for new & expecting mothers',
        icon: 'user-pregnant',
        accentColor: '#E91E8A',
        plans: {
            '1month': {
                label: '1 Month',
                price: 999,
                originalPrice: 1299,
                savings: 'Save ₹300',
                badge: undefined,
                features: [
                    '✅ Prenatal diet consultation',
                    '✅ 2 video consultations with OB-GYN',
                    '✅ Weekly health check reminders',
                    '✅ Postpartum recovery guide',
                    '✅ 24/7 chat support',
                ],
            },
            '3month': {
                label: '3 Months',
                price: 2499,
                originalPrice: 3897,
                savings: 'Save ₹1,398',
                badge: 'Most Popular',
                features: [
                    '✅ Everything in 1-Month plan',
                    '✅ 8 video consultations with OB-GYN',
                    '✅ Personalised nutrition plan',
                    '✅ Yoga & wellness sessions',
                    '✅ Mental health check-ins',
                    '✅ Emergency helpline access',
                ],
            },
            '6month': {
                label: '6 Months',
                price: 4499,
                originalPrice: 7794,
                savings: 'Save ₹3,295',
                badge: 'Best Value',
                features: [
                    '✅ Everything in 3-Month plan',
                    '✅ 20 video consultations with OB-GYN',
                    '✅ Home visit (1 per month)',
                    '✅ Lactation consultant support',
                    '✅ Dedicated care coordinator',
                    '✅ Lab report analysis',
                    '✅ Priority appointment booking',
                ],
            },
        },
    },
    baby: {
        title: 'Baby Care',
        subtitle: 'Complete new-born care & milestone tracking for your little one',
        icon: 'baby',
        accentColor: '#1FBDBD',
        plans: {
            '1month': {
                label: '1 Month',
                price: 799,
                originalPrice: 1099,
                savings: 'Save ₹300',
                badge: undefined,
                features: [
                    '✅ New-born vaccination schedule',
                    '✅ 2 paediatrician consultations',
                    '✅ Growth & weight tracking',
                    '✅ Sleep & feeding log',
                    '✅ 24/7 chat support',
                ],
            },
            '3month': {
                label: '3 Months',
                price: 1999,
                originalPrice: 3297,
                savings: 'Save ₹1,298',
                badge: 'Most Popular',
                features: [
                    '✅ Everything in 1-Month plan',
                    '✅ 8 paediatrician consultations',
                    '✅ Milestone development tracker',
                    '✅ Baby massage & activity guides',
                    '✅ Allergy & nutrition guidance',
                    '✅ Emergency helpline access',
                ],
            },
            '6month': {
                label: '6 Months',
                price: 3799,
                originalPrice: 6594,
                savings: 'Save ₹2,795',
                badge: 'Best Value',
                features: [
                    '✅ Everything in 3-Month plan',
                    '✅ 20 paediatrician consultations',
                    '✅ Home visit (1 per month)',
                    '✅ Developmental assessment report',
                    '✅ Speech & motor milestone alerts',
                    '✅ Dedicated baby care coordinator',
                    '✅ Priority appointment booking',
                ],
            },
        },
    },
    muma: {
        title: 'Muma Care',
        subtitle: 'The ultimate care bundle for both mother & baby together',
        icon: 'hand-holding-heart',
        accentColor: '#7B2D8B',
        plans: {
            '1month': {
                label: '1 Month',
                price: 1699,
                originalPrice: 2398,
                savings: 'Save ₹699',
                badge: undefined,
                features: [
                    '✅ Full Mother Care – 1 Month',
                    '✅ Full Baby Care – 1 Month',
                    '✅ Joint family health report',
                    '✅ 24/7 chat support',
                    '✅ Exclusive Muma app dashboard',
                ],
            },
            '3month': {
                label: '3 Months',
                price: 3999,
                originalPrice: 6194,
                savings: 'Save ₹2,195',
                badge: 'Most Popular',
                features: [
                    '✅ Full Mother Care – 3 Months',
                    '✅ Full Baby Care – 3 Months',
                    '✅ Combined health progress reports',
                    '✅ Family yoga & wellness sessions',
                    '✅ Mental health & bonding guide',
                    '✅ Emergency helpline access',
                ],
            },
            '6month': {
                label: '6 Months',
                price: 7499,
                originalPrice: 14388,
                savings: 'Save ₹6,889',
                badge: 'Best Value',
                features: [
                    '✅ Full Mother Care – 6 Months',
                    '✅ Full Baby Care – 6 Months',
                    '✅ 2 home visits per month',
                    '✅ Dedicated family care coordinator',
                    '✅ Monthly family health analytics',
                    '✅ Lab report analysis for both',
                    '✅ Priority booking & concierge support',
                ],
            },
        },
    },
};

const PLAN_KEYS: PlanKey[] = ['1month', '3month', '6month'];

// ── Component ───────────────────────────────────────────────────────────────────

const PackageDetailScreen: React.FC<Props> = ({ navigation, route }) => {
    const { packageType } = route.params;
    const [fetchedPkg, setFetchedPkg] = useState<PackageInfo | null>(null);
    const [selectedPlan, setSelectedPlan] = useState<PlanKey>('3month');

    useEffect(() => {
        let isMounted = true;
        const fetchPackageDetail = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/packages/${packageType}`);
                const data = await res.json();
                if (res.ok && data.success && isMounted) {
                    const fetched = data.data;
                    const cleaned: PackageInfo = {
                        title: fetched.title,
                        subtitle: fetched.subtitle || fetched.tagline || '',
                        icon: fetched.icon.replace(/^fa-/, ''),
                        accentColor: fetched.accentColor,
                        plans: fetched.plans,
                    };
                    setFetchedPkg(cleaned);
                }
            } catch (err) {
                console.log('Error fetching package detail:', err);
            }
        };
        fetchPackageDetail();
        return () => { isMounted = false; };
    }, [packageType]);

    const pkg = fetchedPkg || PACKAGES[packageType];
    const plan = pkg.plans[selectedPlan];
    const accent = pkg.accentColor;

    const insets = useSafeAreaInsets();

    return (
        <View style={styles.safe}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            {/* Header */}
            <View style={[styles.header, { backgroundColor: accent, paddingTop: insets.top }]}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Icon name="chevron-left" size={20} color={Colors.WHITE} />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Icon name={pkg.icon} size={42} color={Colors.WHITE} style={{ marginBottom: 10 }} />
                    <Text style={styles.headerTitle}>{pkg.title}</Text>
                    <Text style={styles.headerSubtitle}>{pkg.subtitle}</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {/* Plan Selector Tabs */}
                <Text style={styles.sectionLabel}>Choose Your Plan</Text>
                <View style={styles.tabRow}>
                    {PLAN_KEYS.map(key => {
                        const isActive = selectedPlan === key;
                        const hasBadge = pkg.plans[key].badge;
                        return (
                            <TouchableOpacity
                                key={key}
                                style={[
                                    styles.tab,
                                    isActive && { backgroundColor: accent, borderColor: accent },
                                ]}
                                onPress={() => setSelectedPlan(key)}
                                activeOpacity={0.8}>
                                {hasBadge && (
                                    <View style={[styles.tabBadge, { backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : accent }]}>
                                        <Text style={styles.tabBadgeText}>{hasBadge}</Text>
                                    </View>
                                )}
                                <Text
                                    style={[
                                        styles.tabLabel,
                                        isActive && styles.tabLabelActive,
                                    ]}>
                                    {pkg.plans[key].label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Pricing Card */}
                <View style={[styles.pricingCard, { borderColor: accent + '44' }]}>
                    {/* Savings ribbon */}
                    <View style={[styles.savingsTag, { backgroundColor: accent + '1A' }]}>
                        <Text style={[styles.savingsText, { color: accent }]}>
                            <Icon name="gift" size={12} color={accent} /> {plan.savings}
                        </Text>
                    </View>

                    <View style={styles.priceRow}>
                        <Text style={[styles.priceCurrency, { color: accent }]}>₹</Text>
                        <Text style={[styles.priceAmount, { color: accent }]}>
                            {plan.price.toLocaleString('en-IN')}
                        </Text>
                        <Text style={styles.priceDuration}>/{plan.label.toLowerCase()}</Text>
                    </View>

                    <Text style={styles.originalPrice}>
                        MRP <Text style={styles.strikethrough}>₹{plan.originalPrice.toLocaleString('en-IN')}</Text>
                    </Text>

                    <View style={styles.divider} />

                    {/* Features */}
                    <Text style={styles.featuresTitle}>What's included</Text>
                    {plan.features.map((f, i) => {
                        const cleanFeature = f.replace(/^✅\s*/, '');
                        return (
                            <View key={i} style={styles.featureRow}>
                                <Icon name="check-circle" size={14} color={accent} style={styles.featureIcon} />
                                <Text style={styles.featureText}>{cleanFeature}</Text>
                            </View>
                        );
                    })}
                </View>

                {/* Guarantee strip */}
                <View style={styles.guarantee}>
                    <Text style={styles.guaranteeText}>
                        <Icon name="shield-alt" size={12} color="#276749" /> 30-day money-back guarantee · No hidden charges
                    </Text>
                </View>

                <TouchableOpacity
                    style={[styles.ctaBtn, { backgroundColor: accent }]}
                    activeOpacity={0.85}
                    onPress={() => {
                        navigation.navigate('Checkout', {
                            packageType,
                            packageTitle: pkg.title,
                            planKey: selectedPlan,
                            planLabel: plan.label,
                            price: plan.price,
                            icon: pkg.icon,
                            accentColor: accent,
                        });
                    }}>
                    <Text style={styles.ctaText}>Get {plan.label} Plan</Text>
                </TouchableOpacity>

                <Text style={styles.footerNote}>
                    Secure payment · Cancel anytime · Instant activation
                </Text>
            </ScrollView>
        </View>
    );
};

// ── Styles ──────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: Colors.BACKGROUND },

    // Header
    header: {
        paddingBottom: 24,
        paddingHorizontal: 20,
    },
    backBtn: { paddingTop: 12, paddingBottom: 4, alignSelf: 'flex-start' },
    backText: { color: 'rgba(255,255,255,0.85)', fontSize: 15, fontWeight: '500' },
    headerContent: { alignItems: 'center', paddingTop: 8 },
    headerEmoji: { fontSize: 48, marginBottom: 8 },
    headerTitle: {
        fontSize: 26,
        fontWeight: '900',
        color: Colors.WHITE,
        marginBottom: 6,
        textAlign: 'center',
    },
    headerSubtitle: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.8)',
        textAlign: 'center',
        lineHeight: 20,
        paddingHorizontal: 12,
    },

    // Scroll
    scroll: {
        paddingHorizontal: 20,
        paddingTop: 24,
        paddingBottom: 48,
    },

    sectionLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: Colors.TEXT_SECONDARY,
        textTransform: 'uppercase',
        letterSpacing: 1.2,
        marginBottom: 12,
    },

    // Tabs
    tabRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 24,
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 14,
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: Colors.BORDER,
        backgroundColor: Colors.SURFACE,
        overflow: 'hidden',
    },
    tabBadge: {
        borderRadius: 6,
        paddingHorizontal: 6,
        paddingVertical: 2,
        marginBottom: 4,
    },
    tabBadgeText: {
        color: Colors.WHITE,
        fontSize: 8,
        fontWeight: '700',
        letterSpacing: 0.5,
        textAlign: 'center',
    },
    tabLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.TEXT_SECONDARY,
    },
    tabLabelActive: {
        color: Colors.WHITE,
    },

    // Pricing card
    pricingCard: {
        backgroundColor: Colors.SURFACE,
        borderRadius: 20,
        padding: 22,
        borderWidth: 1.5,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 4,
    },
    savingsTag: {
        alignSelf: 'flex-start',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 5,
        marginBottom: 16,
    },
    savingsText: {
        fontSize: 12,
        fontWeight: '700',
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginBottom: 4,
    },
    priceCurrency: {
        fontSize: 22,
        fontWeight: '800',
        marginBottom: 4,
        marginRight: 2,
    },
    priceAmount: {
        fontSize: 52,
        fontWeight: '900',
        lineHeight: 58,
    },
    priceDuration: {
        fontSize: 14,
        color: Colors.TEXT_HINT,
        marginBottom: 8,
        marginLeft: 4,
    },
    originalPrice: {
        fontSize: 13,
        color: Colors.TEXT_HINT,
        marginBottom: 18,
    },
    strikethrough: {
        textDecorationLine: 'line-through',
    },
    divider: {
        height: 1,
        backgroundColor: Colors.DIVIDER,
        marginBottom: 18,
    },
    featuresTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.TEXT_SECONDARY,
        textTransform: 'uppercase',
        letterSpacing: 0.9,
        marginBottom: 12,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    featureIcon: {
        marginRight: 10,
    },
    featureText: {
        fontSize: 14,
        color: Colors.TEXT_PRIMARY,
        flex: 1,
        lineHeight: 20,
    },

    // Guarantee
    guarantee: {
        backgroundColor: '#F0FFF4',
        borderRadius: 12,
        paddingVertical: 10,
        paddingHorizontal: 14,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#C6F6D5',
    },
    guaranteeText: {
        color: '#276749',
        fontSize: 12,
        fontWeight: '500',
        textAlign: 'center',
    },

    // CTA
    ctaBtn: {
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 14,
        elevation: 8,
        marginBottom: 14,
    },
    ctaText: {
        color: Colors.WHITE,
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 0.3,
    },

    footerNote: {
        textAlign: 'center',
        color: Colors.TEXT_HINT,
        fontSize: 11,
        lineHeight: 18,
    },
});

export default PackageDetailScreen;
