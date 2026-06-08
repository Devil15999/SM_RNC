import React, { useState, useEffect, useCallback } from 'react';
import {
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { RootStackParamList } from '../../types/navigation';
import { Colors } from '../../constants/theme';
import { useAppSelector } from '../../store';
import { Routes } from '../../constants/routes';
import { API_BASE_URL } from '../../config';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

// ── Types ────────────────────────────────────────────────────────────────────────

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

// ── Component ───────────────────────────────────────────────────────────────────

const HomeScreen: React.FC<Props> = ({ navigation }) => {
    const user = useAppSelector(state => state.auth.user);

    const [packages, setPackages] = useState<PackageCard[]>([]);
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

    useEffect(() => {
        fetchPackages();
    }, [fetchPackages]);

    const initials = (user?.name ?? 'U')
        .split(' ')
        .map(w => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    // ── Package card skeleton ────────────────────────────────────────────────────
    const PackageSkeleton = () => (
        <View style={styles.skeletonCard}>
            <View style={styles.skeletonRow}>
                <View style={styles.skeletonIcon} />
                <View style={styles.skeletonLines}>
                    <View style={[styles.skeletonLine, { width: '60%' }]} />
                    <View style={[styles.skeletonLine, { width: '85%', marginTop: 6 }]} />
                </View>
            </View>
            <View style={styles.skeletonPills}>
                {[1, 2, 3].map(i => (
                    <View key={i} style={styles.skeletonPill} />
                ))}
            </View>
            <View style={[styles.skeletonLine, { width: '40%', marginTop: 8 }]} />
        </View>
    );

    return (
        <SafeAreaView style={styles.safe}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.BACKGROUND} />
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

                {/* Top Bar */}
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
                        onPress={() => navigation.navigate(Routes.PROFILE)}
                    >
                        <Text style={styles.avatarText}>{initials}</Text>
                    </TouchableOpacity>
                </View>

                {/* Hero banner */}
                <View style={styles.heroBanner}>
                    <View style={styles.heroBadge}>
                        <Text style={styles.heroBadgeText}>SECOND MUMA</Text>
                    </View>
                    <Text style={styles.heroTitle}>
                        Your baby's health,{'\n'}our top priority <Icon name="heart" size={18} color="#FFD54F" solid />
                    </Text>
                    <Text style={styles.heroSub}>Track, monitor & care — all in one place</Text>
                </View>

                {/* ── Packages Section ── */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Our Care Packages</Text>
                    <Text style={styles.sectionSub}>Choose a plan that works best for you</Text>
                </View>

                {/* Loading skeletons */}
                {isLoading && (
                    <>
                        <PackageSkeleton />
                        <PackageSkeleton />
                        <PackageSkeleton />
                    </>
                )}

                {/* Fetch error */}
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

                {/* BE package cards */}
                {!isLoading && !fetchError && packages.map(pkg => (
                    <TouchableOpacity
                        key={pkg.type}
                        style={[styles.pkgCard, { borderTopColor: pkg.accentColor }]}
                        activeOpacity={0.82}
                        onPress={() =>
                            navigation.navigate(Routes.PACKAGE_DETAIL, { packageType: pkg.type })
                        }>

                        {/* Card Header */}
                        <View style={styles.pkgCardHeader}>
                            <View style={[styles.pkgIconBox, { backgroundColor: pkg.accentColor + '18' }]}>
                                <Icon name={pkg.icon} size={22} color={pkg.accentColor} />
                            </View>
                            <View style={styles.pkgTitleBlock}>
                                <Text style={styles.pkgTitle}>{pkg.title}</Text>
                                <Text style={styles.pkgTagline}>{pkg.tagline}</Text>
                            </View>
                        </View>

                        {/* Feature pills */}
                        <View style={styles.pkgFeatures}>
                            {pkg.features.map(f => (
                                <View
                                    key={f}
                                    style={[styles.pkgPill, {
                                        backgroundColor: pkg.accentColor + '14',
                                        borderColor: pkg.accentColor + '33',
                                    }]}>
                                    <Text style={[styles.pkgPillText, { color: pkg.accentColor }]}>{f}</Text>
                                </View>
                            ))}
                        </View>

                        {/* Footer */}
                        <View style={styles.pkgFooter}>
                            <View>
                                <Text style={styles.pkgFrom}>Starting from</Text>
                                <Text style={[styles.pkgPrice, { color: pkg.accentColor }]}>
                                    {pkg.startingPrice}
                                    <Text style={styles.pkgPriceSuffix}>/month</Text>
                                </Text>
                            </View>
                            <View style={[styles.pkgCta, { backgroundColor: pkg.accentColor }]}>
                                <Text style={styles.pkgCtaText}>View Plans</Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                ))}

            </ScrollView>
        </SafeAreaView>
    );
};

// ── Styles ──────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: Colors.BACKGROUND },
    scroll: { padding: 20, paddingBottom: 48 },

    // Top bar
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        marginTop: 4,
    },
    welcome: { color: Colors.TEXT_SECONDARY, fontSize: 13 },
    name: {
        color: Colors.TEXT_PRIMARY,
        fontSize: 20,
        fontWeight: '800',
        marginTop: 2,
    },
    avatar: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: Colors.PRIMARY,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: Colors.PRIMARY,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    avatarText: { color: Colors.WHITE, fontSize: 16, fontWeight: '800' },

    // Hero
    heroBanner: {
        backgroundColor: Colors.PRIMARY,
        borderRadius: 20,
        padding: 22,
        marginBottom: 28,
        shadowColor: Colors.PRIMARY,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 14,
        elevation: 8,
    },
    heroBadge: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 4,
        alignSelf: 'flex-start',
        marginBottom: 12,
    },
    heroBadgeText: {
        color: Colors.WHITE,
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 1.5,
    },
    heroTitle: {
        color: Colors.WHITE,
        fontSize: 20,
        fontWeight: '800',
        lineHeight: 28,
        marginBottom: 6,
    },
    heroSub: {
        color: 'rgba(255,255,255,0.75)',
        fontSize: 12,
    },

    // Section header
    sectionHeader: { marginBottom: 16 },
    sectionTitle: {
        color: Colors.TEXT_PRIMARY,
        fontSize: 18,
        fontWeight: '800',
    },
    sectionSub: {
        color: Colors.TEXT_SECONDARY,
        fontSize: 13,
        marginTop: 3,
    },

    // ── Skeleton loader ──────────────────────────────────────────────────────────
    skeletonCard: {
        backgroundColor: Colors.SURFACE,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: Colors.BORDER,
        borderTopWidth: 4,
        borderTopColor: Colors.DIVIDER,
        padding: 18,
        marginBottom: 16,
    },
    skeletonRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
        gap: 12,
    },
    skeletonIcon: {
        width: 52,
        height: 52,
        borderRadius: 16,
        backgroundColor: Colors.DIVIDER,
    },
    skeletonLines: { flex: 1 },
    skeletonLine: {
        height: 12,
        borderRadius: 6,
        backgroundColor: Colors.DIVIDER,
    },
    skeletonPills: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 14,
    },
    skeletonPill: {
        height: 22,
        width: 90,
        borderRadius: 20,
        backgroundColor: Colors.DIVIDER,
    },

    // ── Error state ──────────────────────────────────────────────────────────────
    errorBox: {
        alignItems: 'center',
        paddingVertical: 48,
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

    // ── Package cards ────────────────────────────────────────────────────────────
    pkgCard: {
        backgroundColor: Colors.SURFACE,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: Colors.BORDER,
        borderTopWidth: 4,
        padding: 18,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.07,
        shadowRadius: 10,
        elevation: 3,
    },
    pkgCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
        gap: 12,
    },
    pkgIconBox: {
        width: 52,
        height: 52,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    pkgTitleBlock: { flex: 1 },
    pkgTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: Colors.TEXT_PRIMARY,
        marginBottom: 3,
    },
    pkgTagline: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
        lineHeight: 18,
    },

    // Feature pills
    pkgFeatures: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginBottom: 16,
    },
    pkgPill: {
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderWidth: 1,
    },
    pkgPillText: {
        fontSize: 11,
        fontWeight: '600',
    },

    // Card footer
    pkgFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: Colors.DIVIDER,
        paddingTop: 14,
    },
    pkgFrom: { color: Colors.TEXT_HINT, fontSize: 11 },
    pkgPrice: {
        fontSize: 22,
        fontWeight: '900',
        marginTop: 1,
    },
    pkgPriceSuffix: {
        fontSize: 13,
        fontWeight: '500',
        color: Colors.TEXT_HINT,
    },
    pkgCta: {
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    pkgCtaText: {
        color: Colors.WHITE,
        fontSize: 13,
        fontWeight: '700',
    },
});

export default HomeScreen;
