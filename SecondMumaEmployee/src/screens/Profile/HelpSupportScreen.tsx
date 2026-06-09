import React, { useState } from 'react';
import {
    Alert,
    Linking,
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

type Props = NativeStackScreenProps<RootStackParamList, 'HelpSupport'>;

interface FAQItem {
    question: string;
    answer: string;
}

const EMPLOYEE_FAQS: FAQItem[] = [
    {
        question: 'How do I check-in for an appointment?',
        answer: 'Navigate to the Home screen, tap on your scheduled appointment, and click the "Check-in" button when you arrive at the client location.',
    },
    {
        question: 'How and when are payouts processed?',
        answer: 'Payouts are calculated weekly based on your completed care shifts and are credited directly to your registered bank account every Monday.',
    },
    {
        question: 'What if the customer is not home when I arrive?',
        answer: 'Wait for 15 minutes, attempt to call the customer via the app, and if they are still unreachable, contact the admin supervisor immediately using the helpline.',
    },
    {
        question: 'How do I submit my profile certificates?',
        answer: 'Go to your Profile tab, click the edit icon on the Certificates card, select up to 3 document images, and click "Upload Certificates" for administrator review.',
    },
    {
        question: 'Can I cancel or swap a scheduled shift?',
        answer: 'Shift adjustments must be requested at least 24 hours in advance. Please call support directly to coordinate scheduling changes.',
    },
];

const HelpSupportScreen: React.FC<Props> = ({ navigation }) => {
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

    const toggleFAQ = (index: number) => {
        setExpandedIndex(expandedIndex === index ? null : index);
    };

    const handleCallSupport = async () => {
        const url = 'tel:+918080808080';
        try {
            const canOpen = await Linking.canOpenURL(url);
            if (canOpen) {
                await Linking.openURL(url);
            } else {
                Alert.alert('Error', 'Unable to initiate phone call on this device.');
            }
        } catch (err) {
            console.log('Error opening dialer:', err);
            Alert.alert('Error', 'Failed to open dialer.');
        }
    };

    const handleEmailSupport = async () => {
        const url = 'mailto:partnersupport@mumacare.com?subject=Partner%20Support%20Request';
        try {
            const canOpen = await Linking.canOpenURL(url);
            if (canOpen) {
                await Linking.openURL(url);
            } else {
                Alert.alert('Error', 'No email app configured on this device.');
            }
        } catch (err) {
            console.log('Error opening mail:', err);
            Alert.alert('Error', 'Failed to open mail app.');
        }
    };

    return (
        <SafeAreaView style={styles.safe}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.BACKGROUND} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Icon name="chevron-left" size={18} color={Colors.TEXT_SECONDARY} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Partner Help & Support</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {/* Intro Banner */}
                <View style={styles.banner}>
                    <Icon name="user-shield" size={40} color={Colors.PRIMARY} style={{ marginBottom: 12 }} />
                    <Text style={styles.bannerTitle}>Partner Support Center</Text>
                    <Text style={styles.bannerSubtitle}>
                        Need help with schedules, check-ins, or payouts? Contact supervisor support or browse professional FAQs below.
                    </Text>
                </View>

                {/* Contact Cards */}
                <Text style={styles.sectionTitle}>Support Channels</Text>
                <View style={styles.contactRow}>
                    <TouchableOpacity style={styles.contactCard} onPress={handleCallSupport} activeOpacity={0.85}>
                        <View style={[styles.iconBox, { backgroundColor: 'rgba(31, 189, 189, 0.08)' }]}>
                            <Icon name="phone-alt" size={18} color={Colors.PRIMARY} />
                        </View>
                        <Text style={styles.contactLabel}>Call Supervisor</Text>
                        <Text style={styles.contactValue}>+91 80808 08080</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.contactCard} onPress={handleEmailSupport} activeOpacity={0.85}>
                        <View style={[styles.iconBox, { backgroundColor: 'rgba(123, 45, 139, 0.08)' }]}>
                            <Icon name="envelope" size={18} color="#7B2D8B" />
                        </View>
                        <Text style={styles.contactLabel}>Email Partner Support</Text>
                        <Text style={styles.contactValue}>partnersupport@mumacare.com</Text>
                    </TouchableOpacity>
                </View>

                {/* FAQs Section */}
                <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
                {EMPLOYEE_FAQS.map((faq, index) => {
                    const isExpanded = expandedIndex === index;
                    return (
                        <View key={index} style={[styles.faqCard, isExpanded && styles.faqCardExpanded]}>
                            <TouchableOpacity
                                style={styles.faqHeader}
                                onPress={() => toggleFAQ(index)}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.faqQuestion, isExpanded && styles.faqQuestionActive]}>
                                    {faq.question}
                                </Text>
                                <Icon
                                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                                    size={14}
                                    color={isExpanded ? Colors.PRIMARY : Colors.TEXT_SECONDARY}
                                />
                            </TouchableOpacity>
                            {isExpanded && (
                                <View style={styles.faqAnswerContainer}>
                                    <Text style={styles.faqAnswer}>{faq.answer}</Text>
                                </View>
                            )}
                        </View>
                    );
                })}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: Colors.BACKGROUND,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: Colors.BORDER,
    },
    backBtn: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: Colors.TEXT_PRIMARY,
    },
    scroll: {
        padding: 20,
        paddingBottom: 40,
    },
    banner: {
        backgroundColor: Colors.SURFACE,
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.BORDER,
        marginBottom: 24,
    },
    bannerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: Colors.TEXT_PRIMARY,
        marginBottom: 6,
    },
    bannerSubtitle: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
        textAlign: 'center',
        lineHeight: 18,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: Colors.PRIMARY,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 14,
        marginTop: 8,
    },
    contactRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    contactCard: {
        flex: 1,
        backgroundColor: Colors.WHITE,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.BORDER,
        alignItems: 'center',
        shadowColor: Colors.SHADOW,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    contactLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: Colors.TEXT_SECONDARY,
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.3,
        textAlign: 'center',
    },
    contactValue: {
        fontSize: 12,
        fontWeight: '800',
        color: Colors.TEXT_PRIMARY,
        textAlign: 'center',
    },
    faqCard: {
        backgroundColor: Colors.WHITE,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: Colors.BORDER,
        marginBottom: 10,
        overflow: 'hidden',
    },
    faqCardExpanded: {
        borderColor: Colors.PRIMARY_MID,
        shadowColor: Colors.SHADOW,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 3,
    },
    faqHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    faqQuestion: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.TEXT_PRIMARY,
        flex: 1,
        marginRight: 12,
    },
    faqQuestionActive: {
        color: Colors.PRIMARY,
    },
    faqAnswerContainer: {
        paddingHorizontal: 16,
        paddingBottom: 16,
        borderTopWidth: 1,
        borderTopColor: Colors.DIVIDER,
    },
    faqAnswer: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
        lineHeight: 18,
        marginTop: 10,
    },
});

export default HelpSupportScreen;
