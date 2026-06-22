import React, { useState, useEffect, useCallback } from 'react';
import {
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Image,
    Linking,
    Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
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

interface PackageCard {
    type: PackageType;
    title: string;
    tagline: string;
    icon: string;
    accentColor: string;
    startingPrice: string;
    features: string[];
}

const FEATURES_STRIP = [
    { icon: 'user-shield', label: 'Background\nVerified Staff' },
    { icon: 'hands-wash', label: 'Safe & Hygienic\nPractices' },
    { icon: 'headset', label: '24/7 Expert\nSupport' },
    { icon: 'ambulance', label: 'Emergency\nAssistance' },
];

const SPECIALITIES = [
    { icon: 'baby', label: 'Baby Massage\nTherapy', color: '#E91E8A' },
    { icon: 'heart', label: 'Postpartum\nRecovery', color: '#7b2d8b' },
    { icon: 'tint', label: 'Lactation\nSupport', color: '#E91E8A' },
    { icon: 'apple-alt', label: 'Nutrition\nCounselling', color: '#27AE60' },
    { icon: 'moon', label: 'Sleep & Growth\nGuidance', color: '#FF9800' },
];

const GRADIENT: [string, string] = ['#e91e8a', '#7b2d8b'];

// ── Component ───────────────────────────────────────────────────────────────────

const HomeScreen: React.FC<Props> = ({ navigation }) => {
    const user = useAppSelector(state => state.auth.user);

    const [packages, setPackages] = useState<PackageCard[]>([]);
    const [orders, setOrders] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [fetchError, setFetchError] = useState(false);

    const fetchPackages = useCallback(async () => {
        setIsLoading(true);
        setFetchError(false);
        try {
            const res = await fetch(`${API_BASE_URL}/packages`);
            const data = await res.json();
            if (res.ok && data.success) {
                const formatted: PackageCard[] = data.data.map((p: any) => ({
                    type: p.type as PackageType,
                    title: p.title,
                    tagline: p.tagline,
                    icon: (p.icon ?? '').replace(/^fa-/, ''),
                    accentColor: p.accentColor,
                    startingPrice: `₹${p.startingPrice}`,
                    features: p.features ?? [],
                }));
                setPackages(formatted);
            } else {
                setFetchError(true);
            }
        } catch {
            setFetchError(true);
        } finally {
            setIsLoading(false);
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
    }, [fetchPackages]);

    useEffect(() => {
        if (!user?.token) return;
        fetchOrders();
        const unsubscribe = navigation.addListener('focus', () => {
            fetchOrders();
        });
        return unsubscribe;
    }, [navigation, user?.token, fetchOrders]);

    const activeSubscriptions = orders.filter(o =>
        o.status === 'active' &&
        (!o.expiresAt || new Date(o.expiresAt) > new Date())
    );

    // ── Skeleton ────────────────────────────────────────────────────────────────
    const PackageSkeleton = () => (
        <View style={styles.skeletonCard}>
            <View style={styles.skeletonIconCircle} />
            <View style={[styles.skeletonLine, { width: '60%', marginTop: 12 }]} />
            <View style={[styles.skeletonLine, { width: '85%', marginTop: 8 }]} />
            <View style={styles.skeletonPills}>
                {[1, 2].map(i => <View key={i} style={styles.skeletonPill} />)}
            </View>
            <View style={[styles.skeletonLine, { width: '50%', marginTop: 12 }]} />
            <View style={[styles.skeletonLine, { width: '70%', marginTop: 6, height: 36, borderRadius: 10 }]} />
        </View>
    );

    return (
        <SafeAreaView style={styles.safe}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.BACKGROUND} />

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

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
                                style={{ width: '100%', height: '100%', borderRadius: 23 }}
                            />
                        ) : (
                            <Image
                                source={require('../../assets/user.png')}
                                style={{ width: '100%', height: '100%', tintColor: Colors.WHITE }}
                            />
                        )}
                    </TouchableOpacity>
                </View>

                {/* ── Banner Image ── */}
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
                                <Icon name={f.icon} size={15} color={Colors.PRIMARY} />
                            </View>
                            <Text style={styles.featureLabel}>{f.label}</Text>
                        </View>
                    ))}
                </View>

                {/* ── Active Subscriptions ── */}
                {activeSubscriptions.length > 0 && (
                    <View style={styles.activeSubsContainer}>
                        <Text style={styles.sectionTitle}>Your Active Subscriptions</Text>
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

                {/* ── Packages Section ── */}
                <View style={styles.packagesSectionHeader}>
                    <Text style={styles.packagesSectionTitle}>Our Care Packages</Text>
                    <View style={styles.titleUnderline} />
                    <Text style={styles.packagesSectionSub}>Choose a plan that works best for you</Text>
                </View>

                {/* Skeletons */}
                {isLoading && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pkgsRow}>
                        <PackageSkeleton />
                        <PackageSkeleton />
                        <PackageSkeleton />
                    </ScrollView>
                )}

                {/* Error */}
                {!isLoading && fetchError && (
                    <View style={styles.errorBox}>
                        <Icon name="wifi" size={32} color={Colors.BORDER} style={{ marginBottom: 12 }} />
                        <Text style={styles.errorTitle}>Couldn't load packages</Text>
                        <Text style={styles.errorSub}>Check your connection and try again</Text>
                        <TouchableOpacity style={styles.retryBtn} onPress={fetchPackages} activeOpacity={0.8}>
                            <Text style={styles.retryText}>Retry</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Horizontal package cards */}
                {!isLoading && !fetchError && (
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.pkgsRow}>
                        {packages.map(pkg => {
                            const isActive = !!orders.find(o =>
                                o.packageType === pkg.type &&
                                o.status === 'active' &&
                                (!o.expiresAt || new Date(o.expiresAt) > new Date())
                            );
                            return (
                                <TouchableOpacity
                                    key={pkg.type}
                                    style={[styles.pkgCard, isActive && { borderColor: pkg.accentColor, borderWidth: 2 }]}
                                    activeOpacity={0.85}
                                    onPress={() => navigation.navigate(Routes.PACKAGE_DETAIL, { packageType: pkg.type })}>

                                    {isActive && (
                                        <View style={[styles.pkgActiveBadge, { backgroundColor: pkg.accentColor }]}>
                                            <Icon name="check-circle" size={9} color="#fff" style={{ marginRight: 3 }} />
                                            <Text style={styles.pkgActiveBadgeText}>ACTIVE</Text>
                                        </View>
                                    )}

                                    {/* Icon circle */}
                                    <View style={[styles.pkgIconCircle, { backgroundColor: pkg.accentColor + '18' }]}>
                                        <Icon name={pkg.icon} size={30} color={pkg.accentColor} />
                                    </View>

                                    <Text style={styles.pkgTitle}>{pkg.title}</Text>
                                    <Text style={styles.pkgTagline}>{pkg.tagline}</Text>

                                    {/* Feature pills */}
                                    <View style={styles.pkgFeaturesList}>
                                        {pkg.features.slice(0, 3).map(f => (
                                            <View
                                                key={f}
                                                style={[styles.pkgPill, {
                                                    borderColor: pkg.accentColor + '55',
                                                    backgroundColor: pkg.accentColor + '12',
                                                }]}>
                                                <Text style={[styles.pkgPillText, { color: pkg.accentColor }]}>{f}</Text>
                                            </View>
                                        ))}
                                    </View>

                                    <View style={styles.pkgPriceBlock}>
                                        <Text style={styles.pkgFrom}>Starting from</Text>
                                        <Text style={[styles.pkgPrice, { color: pkg.accentColor }]}>
                                            {pkg.startingPrice}
                                            <Text style={styles.pkgPriceSuffix}>/month</Text>
                                        </Text>
                                    </View>

                                    <TouchableOpacity
                                        style={[styles.pkgViewBtn, { backgroundColor: pkg.accentColor }]}
                                        activeOpacity={0.85}
                                        onPress={() => navigation.navigate(Routes.PACKAGE_DETAIL, { packageType: pkg.type })}>
                                        <Text style={styles.pkgViewBtnText}>View Plans</Text>
                                    </TouchableOpacity>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                )}

                {/* ── Testimonial Section ── */}
                {/* <View style={styles.testimonialSection}>
                    <Text style={styles.testimonialTitle}>
                        Loved by Thousands of Moms{'  '}
                        <Icon name="heart" size={14} color={Colors.PRIMARY} solid />
                    </Text>
                    <View style={styles.testimonialCard}>
                        <View style={styles.starsRow}>
                            {[1, 2, 3, 4, 5].map(i => (
                                <Icon key={i} name="star" size={13} color="#FFD700" solid style={{ marginRight: 2 }} />
                            ))}
                        </View>
                        <Text style={styles.testimonialText}>
                            "Second Mamma's care experts were amazing! The baby massage & mother care sessions made a huge difference."
                        </Text>
                        <Text style={styles.testimonialAuthor}>– Priya S., Bangalore</Text>
                    </View>
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Icon name="users" size={22} color={Colors.PRIMARY} />
                            <Text style={styles.statNum}>10,000+</Text>
                            <Text style={styles.statLabel}>Happy Families</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Icon name="user-md" size={22} color={Colors.PRIMARY} />
                            <Text style={styles.statNum}>50+</Text>
                            <Text style={styles.statLabel}>Care Experts</Text>
                        </View>
                    </View>
                </View> */}

                {/* ── Specialities ── */}
                <Text style={styles.specialitiesTitle}>Our Specialities</Text>
                <View style={styles.specialitiesRow}>
                    {SPECIALITIES.map(sp => (
                        <View key={sp.label} style={styles.specialityItem}>
                            <View style={[styles.specialityIconBox, { backgroundColor: sp.color + '18' }]}>
                                <Icon name={sp.icon} size={20} color={sp.color} />
                            </View>
                            <Text style={styles.specialityLabel}>{sp.label}</Text>
                        </View>
                    ))}
                </View>

                <View style={{ height: 32 }} />
            </ScrollView>

        </SafeAreaView>
    );
};

// ── Styles ──────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: Colors.BACKGROUND },



    scroll: { paddingBottom: 20 },

    // ── Top Bar ──────────────────────────────────────────────────────────────────
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 14,
        backgroundColor: Colors.WHITE,
    },
    welcome: { color: Colors.TEXT_SECONDARY, fontSize: 13 },
    name: {
        color: Colors.TEXT_PRIMARY,
        fontSize: 20,
        fontWeight: '800',
        marginTop: 2,
    },
    avatar: {
        width: 30,
        height: 30,
        borderRadius: 19,
        backgroundColor: Colors.PRIMARY,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: Colors.PRIMARY,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
        padding: 4,
        overflow: 'hidden',
    },

    // ── Banner ───────────────────────────────────────────────────────────────────
    heroBanner: {
        width: '100%',
        height: 200,
        borderRadius: 0,
        marginBottom: 0,
    },

    // ── Hero Section ─────────────────────────────────────────────────────────────
    heroSection: {
        backgroundColor: Colors.WHITE,
        paddingTop: 18,
        paddingBottom: 0,
        paddingHorizontal: 16,
        overflow: 'hidden',
    },
    trustBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF0F8',
        alignSelf: 'flex-start',
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 4,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#FFD6EE',
    },
    trustText: {
        fontSize: 11,
        fontWeight: '600',
        color: Colors.PRIMARY,
    },
    heroContent: {
        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    heroLeft: {
        flex: 1,
        paddingRight: 8,
        paddingBottom: 16,
    },
    heroHeading1: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.TEXT_PRIMARY,
        lineHeight: 24,
    },
    heroHeading2: {
        fontSize: 22,
        fontWeight: '900',
        color: Colors.PRIMARY,
        lineHeight: 30,
        marginBottom: 8,
    },
    heroBody: {
        fontSize: 11,
        color: Colors.TEXT_SECONDARY,
        lineHeight: 17,
        marginBottom: 12,
    },
    miniTrustRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 14,
    },
    miniTrust: {
        alignItems: 'center',
        gap: 4,
    },
    miniTrustText: {
        fontSize: 9,
        color: Colors.TEXT_SECONDARY,
        textAlign: 'center',
        fontWeight: '600',
        lineHeight: 13,
    },
    heroCtas: {
        flexDirection: 'row',
        gap: 8,
        flexWrap: 'wrap',
    },
    ctaPrimary: {
        borderRadius: 22,
        overflow: 'hidden',
    },
    ctaPrimaryInner: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 9,
    },
    ctaPrimaryText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
    },
    ctaSecondary: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 22,
        borderWidth: 1.5,
        borderColor: Colors.PRIMARY,
        paddingHorizontal: 14,
        paddingVertical: 9,
        backgroundColor: Colors.WHITE,
    },
    ctaSecondaryText: {
        color: Colors.PRIMARY,
        fontSize: 12,
        fontWeight: '700',
    },
    heroImage: {
        width: SW * 0.38,
        height: 240,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
    },

    // ── Features Strip ───────────────────────────────────────────────────────────
    featuresStrip: {
        flexDirection: 'row',
        backgroundColor: Colors.WHITE,
        borderTopWidth: 1,
        borderTopColor: Colors.BORDER,
        borderBottomWidth: 1,
        borderBottomColor: Colors.BORDER,
        marginTop: 0,
        marginBottom: 20,
        paddingVertical: 12,
        paddingHorizontal: 8,
    },
    featureItem: {
        flex: 1,
        alignItems: 'center',
        gap: 6,
    },
    featureItemBorder: {
        borderRightWidth: 1,
        borderRightColor: Colors.BORDER,
    },
    featureIconBox: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: '#FFF0F8',
        justifyContent: 'center',
        alignItems: 'center',
    },
    featureLabel: {
        fontSize: 9,
        fontWeight: '600',
        color: Colors.TEXT_SECONDARY,
        textAlign: 'center',
        lineHeight: 13,
    },

    // ── Packages Section ─────────────────────────────────────────────────────────
    packagesSectionHeader: {
        alignItems: 'center',
        marginBottom: 20,
        paddingHorizontal: 16,
    },
    packagesSectionTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: Colors.TEXT_PRIMARY,
        textAlign: 'center',
    },
    titleUnderline: {
        width: 32,
        height: 3,
        borderRadius: 2,
        backgroundColor: Colors.PRIMARY,
        marginTop: 6,
        marginBottom: 6,
    },
    packagesSectionSub: {
        fontSize: 13,
        color: Colors.TEXT_SECONDARY,
        textAlign: 'center',
    },
    pkgsRow: {
        paddingHorizontal: 16,
        gap: 14,
        paddingBottom: 4,
    },
    pkgCard: {
        width: SW * 0.58,
        backgroundColor: Colors.WHITE,
        borderRadius: 18,
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.BORDER,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.07,
        shadowRadius: 10,
        elevation: 3,
    },
    pkgActiveBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-end',
        paddingHorizontal: 7,
        paddingVertical: 3,
        borderRadius: 10,
        marginBottom: 6,
    },
    pkgActiveBadgeText: {
        color: '#fff',
        fontSize: 8,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    pkgIconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        alignSelf: 'center',
    },
    pkgTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: Colors.TEXT_PRIMARY,
        marginBottom: 4,
        textAlign: 'center',
    },
    pkgTagline: {
        fontSize: 11,
        color: Colors.TEXT_SECONDARY,
        lineHeight: 16,
        textAlign: 'center',
        marginBottom: 12,
    },
    pkgFeaturesList: {
        gap: 6,
        marginBottom: 14,
    },
    pkgPill: {
        borderRadius: 20,
        borderWidth: 1,
        paddingHorizontal: 10,
        paddingVertical: 4,
        alignSelf: 'flex-start',
    },
    pkgPillText: {
        fontSize: 10,
        fontWeight: '600',
    },
    pkgPriceBlock: { marginBottom: 12 },
    pkgFrom: { color: Colors.TEXT_HINT, fontSize: 10, fontWeight: '500' },
    pkgPrice: {
        fontSize: 20,
        fontWeight: '900',
        marginTop: 2,
    },
    pkgPriceSuffix: {
        fontSize: 12,
        fontWeight: '500',
        color: Colors.TEXT_HINT,
    },
    pkgViewBtn: {
        borderRadius: 12,
        paddingVertical: 10,
        alignItems: 'center',
    },
    pkgViewBtnText: {
        color: Colors.WHITE,
        fontSize: 13,
        fontWeight: '700',
    },

    // ── Testimonial ──────────────────────────────────────────────────────────────
    testimonialSection: {
        marginHorizontal: 16,
        marginTop: 24,
        backgroundColor: '#FFF5FB',
        borderRadius: 18,
        padding: 18,
        borderWidth: 1,
        borderColor: '#FFCCEE',
        marginBottom: 24,
    },
    testimonialTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: Colors.TEXT_PRIMARY,
        marginBottom: 14,
    },
    testimonialCard: {
        backgroundColor: Colors.WHITE,
        borderRadius: 14,
        padding: 14,
        marginBottom: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
    },
    starsRow: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    testimonialText: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
        lineHeight: 18,
        fontStyle: 'italic',
        marginBottom: 6,
    },
    testimonialAuthor: {
        fontSize: 11,
        fontWeight: '700',
        color: Colors.PRIMARY,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
        gap: 4,
    },
    statNum: {
        fontSize: 18,
        fontWeight: '900',
        color: Colors.TEXT_PRIMARY,
    },
    statLabel: {
        fontSize: 11,
        color: Colors.TEXT_SECONDARY,
        fontWeight: '500',
    },
    statDivider: {
        width: 1,
        height: 44,
        backgroundColor: Colors.BORDER,
        marginHorizontal: 16,
    },

    // ── Specialities ─────────────────────────────────────────────────────────────
    specialitiesTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: Colors.TEXT_PRIMARY,
        paddingHorizontal: 16,
        marginBottom: 14,
        marginTop: 20,
    },
    specialitiesRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 16,
        gap: 12,
        marginBottom: 8,
    },
    specialityItem: {
        alignItems: 'center',
        width: 80,
    },
    specialityIconBox: {
        width: 52,
        height: 52,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    specialityLabel: {
        fontSize: 10,
        color: Colors.TEXT_SECONDARY,
        textAlign: 'center',
        fontWeight: '600',
        lineHeight: 14,
    },

    // ── Skeletons ────────────────────────────────────────────────────────────────
    skeletonCard: {
        width: SW * 0.58,
        backgroundColor: Colors.WHITE,
        borderRadius: 18,
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.BORDER,
    },
    skeletonIconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: Colors.DIVIDER,
        alignSelf: 'center',
    },
    skeletonLine: {
        height: 12,
        borderRadius: 6,
        backgroundColor: Colors.DIVIDER,
    },
    skeletonPills: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 12,
    },
    skeletonPill: {
        height: 22,
        width: 80,
        borderRadius: 20,
        backgroundColor: Colors.DIVIDER,
    },

    // ── Error state ──────────────────────────────────────────────────────────────
    errorBox: {
        alignItems: 'center',
        paddingVertical: 48,
        marginHorizontal: 16,
        backgroundColor: Colors.SURFACE,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: Colors.BORDER,
        marginBottom: 16,
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

    // ── Active Subscriptions ─────────────────────────────────────────────────────
    sectionTitle: {
        color: Colors.TEXT_PRIMARY,
        fontSize: 17,
        fontWeight: '800',
        marginBottom: 10,
    },
    activeSubsContainer: {
        marginBottom: 24,
        paddingHorizontal: 16,
    },
    activeSubCard: {
        backgroundColor: Colors.WHITE,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1.5,
        marginTop: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    activeSubHeader: { flexDirection: 'row', alignItems: 'center' },
    activeSubIconBox: {
        width: 40, height: 40, borderRadius: 12,
        justifyContent: 'center', alignItems: 'center',
    },
    activeSubTitle: {
        fontSize: 15, fontWeight: '800', color: Colors.TEXT_PRIMARY,
    },
    activeSubPlan: { fontSize: 12, color: Colors.TEXT_SECONDARY, marginTop: 1 },
    activeStatusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
    activeStatusText: { fontSize: 10, fontWeight: '800' },
    activeSubDivider: { height: 1, backgroundColor: Colors.DIVIDER, marginVertical: 12 },
    activeSubFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    activeSubFooterLabel: { fontSize: 12, color: Colors.TEXT_HINT, fontWeight: '500' },
    activeSubFooterValue: { fontSize: 12, color: Colors.TEXT_PRIMARY, fontWeight: '700' },


});

export default HomeScreen;
