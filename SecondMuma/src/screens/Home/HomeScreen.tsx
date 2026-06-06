import React from 'react';
import {
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { Colors } from '../../constants/theme';
import { useAppDispatch, useAppSelector, logout } from '../../store';
import { Routes } from '../../constants/routes';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

// ── Package data ────────────────────────────────────────────────────────────────

type PackageType = 'mother' | 'baby' | 'muma';

interface PackageCard {
    type: PackageType;
    title: string;
    tagline: string;
    emoji: string;
    accentColor: string;
    startingPrice: string;
    features: string[];
}

const PACKAGE_CARDS: PackageCard[] = [
    {
        type: 'mother',
        title: 'Mother Care',
        tagline: 'Expert support for expecting & new mothers',
        emoji: '🤰',
        accentColor: '#E91E8A',
        startingPrice: '₹999',
        features: ['OB-GYN Consultations', 'Nutrition Plans', 'Postpartum Recovery'],
    },
    {
        type: 'baby',
        title: 'Baby Care',
        tagline: 'Complete new-born care & milestone tracking',
        emoji: '👶',
        accentColor: '#1FBDBD',
        startingPrice: '₹799',
        features: ['Paediatrician Consultations', 'Vaccination Schedule', 'Growth Tracking'],
    },
    {
        type: 'muma',
        title: 'Muma Care',
        tagline: 'The ultimate bundle for mother & baby together',
        emoji: '💝',
        accentColor: '#7B2D8B',
        startingPrice: '₹1,699',
        features: ['Mother + Baby Combined', 'Family Health Reports', 'Home Visits'],
    },
];

// ── Component ───────────────────────────────────────────────────────────────────

const HomeScreen: React.FC<Props> = ({ navigation }) => {
    const dispatch = useAppDispatch();
    const user = useAppSelector(state => state.auth.user);

    const handleLogout = () => {
        dispatch(logout());
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    };

    const initials = (user?.name ?? 'U')
        .split(' ')
        .map(w => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    return (
        <SafeAreaView style={styles.safe}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.BACKGROUND} />
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {/* Top Bar */}
                <View style={styles.topBar}>
                    <View>
                        <Text style={styles.welcome}>Good day 👋</Text>
                        <Text style={styles.name}>{user?.name ?? 'User'}</Text>
                    </View>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{initials}</Text>
                    </View>
                </View>

                {/* Hero banner */}
                <View style={styles.heroBanner}>
                    <View style={styles.heroBadge}>
                        <Text style={styles.heroBadgeText}>BABY CARE</Text>
                    </View>
                    <Text style={styles.heroTitle}>Your baby's health,{'\n'}our top priority 💛</Text>
                    <Text style={styles.heroSub}>Track, monitor &amp; care — all in one place</Text>
                </View>

                {/* ── Packages Section ── */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Our Care Packages</Text>
                    <Text style={styles.sectionSub}>Choose a plan that works best for you</Text>
                </View>

                {PACKAGE_CARDS.map(pkg => (
                    <TouchableOpacity
                        key={pkg.type}
                        style={[styles.pkgCard, { borderTopColor: pkg.accentColor }]}
                        activeOpacity={0.82}
                        onPress={() =>
                            navigation.navigate(Routes.PACKAGE_DETAIL, { packageType: pkg.type })
                        }>
                        {/* Card Header */}
                        <View style={styles.pkgCardHeader}>
                            <View style={[styles.pkgEmojiBox, { backgroundColor: pkg.accentColor + '18' }]}>
                                <Text style={styles.pkgEmoji}>{pkg.emoji}</Text>
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
                                    style={[styles.pkgPill, { backgroundColor: pkg.accentColor + '14', borderColor: pkg.accentColor + '33' }]}>
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
                                <Text style={styles.pkgCtaText}>View Plans →</Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                ))}

                {/* Info Card */}
                <View style={styles.card}>
                    <Text style={styles.cardHeader}>Account Details</Text>
                    <View style={styles.cardRow}>
                        <Text style={styles.cardLabel}>Mobile</Text>
                        <Text style={styles.cardValue}>+91 {user?.mobile ?? '—'}</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.cardRow}>
                        <Text style={styles.cardLabel}>User ID</Text>
                        <Text style={styles.cardValue}>{user?.id ?? '—'}</Text>
                    </View>
                </View>

                {/* Quick Actions */}
                <Text style={styles.quickTitle}>Quick Actions</Text>
                <View style={styles.tileGrid}>
                    {[
                        { label: 'Profile', emoji: '👤' },
                        { label: 'Baby Tracker', emoji: '🍼' },
                        { label: 'Appointments', emoji: '📅' },
                        { label: 'Support', emoji: '💬' },
                    ].map(item => (
                        <TouchableOpacity key={item.label} style={styles.tile} activeOpacity={0.75}>
                            <Text style={styles.tileEmoji}>{item.emoji}</Text>
                            <Text style={styles.tileText}>{item.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Logout */}
                <TouchableOpacity
                    style={styles.logoutBtn}
                    onPress={handleLogout}
                    activeOpacity={0.8}>
                    <Text style={styles.logoutText}>Sign Out</Text>
                </TouchableOpacity>
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

    // Package cards
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
    pkgEmojiBox: {
        width: 52,
        height: 52,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    pkgEmoji: { fontSize: 26 },
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

    // Footer
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

    // Account card
    card: {
        backgroundColor: Colors.SURFACE,
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
        marginTop: 4,
        borderWidth: 1,
        borderColor: Colors.BORDER,
    },
    cardHeader: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.TEXT_SECONDARY,
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    cardRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 4,
    },
    cardLabel: { color: Colors.TEXT_HINT, fontSize: 13 },
    cardValue: { color: Colors.TEXT_PRIMARY, fontSize: 14, fontWeight: '600' },
    divider: {
        height: 1,
        backgroundColor: Colors.DIVIDER,
        marginVertical: 10,
    },

    // Quick actions
    quickTitle: {
        color: Colors.TEXT_SECONDARY,
        fontSize: 12,
        fontWeight: '700',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    tileGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 32,
    },
    tile: {
        width: '47%',
        backgroundColor: Colors.SURFACE,
        borderRadius: 16,
        paddingVertical: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.BORDER,
    },
    tileEmoji: { fontSize: 26, marginBottom: 8 },
    tileText: {
        color: Colors.TEXT_PRIMARY,
        fontSize: 13,
        fontWeight: '600',
    },

    // Logout
    logoutBtn: {
        height: 50,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: Colors.ERROR,
        backgroundColor: '#FFF5F5',
    },
    logoutText: {
        color: Colors.ERROR,
        fontSize: 15,
        fontWeight: '700',
    },
});

export default HomeScreen;
