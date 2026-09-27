'use strict';

/**
 * Package catalogue — single source of truth shared by the API.
 * Matches the data used in the React Native app exactly.
 */
const PACKAGES = {
    baby: {
        type: 'baby',
        title: 'Newborn Care',
        subtitle: 'Professional nursing care for your baby\'s healthy start.',
        tagline: 'Professional nursing care for your baby\'s healthy start.',
        icon: 'fa-baby',
        accentColor: '#E91E8A',
        startingPrice: 24999,
        features: [
            'Baby bathing & hygiene',
            'Feeding & burping support',
            'Sleep & routine guidance',
            'Growth & wellness monitoring',
        ],
        plans: {
            '1month': {
                key: '1month',
                label: 'Monthly Plan',
                visitInfo: '26 visits × 3 hours (78 hours)',
                price: 24999,
                originalPrice: 32000,
                savings: 'Save 22%',
                badge: null,
                features: [
                    'Baby bathing & hygiene',
                    'Feeding & burping support',
                    'Sleep & routine guidance',
                    'Growth & wellness monitoring',
                ],
            },
            '3month': {
                key: '3month',
                label: '3 Months Plan',
                visitInfo: '78 visits × 3 hours (234 hours)',
                price: 69999,
                originalPrice: 96000,
                savings: 'Save 27%',
                badge: 'Most Popular',
                features: [
                    'Everything in Monthly Plan',
                    'Milestone development tracking',
                    'Vaccination & pediatric assistance',
                    'Dedicated baby care coordinator',
                ],
            },
            '6month': {
                key: '6month',
                label: '6 Months Plan',
                visitInfo: '156 visits × 3 hours (468 hours)',
                price: 129999,
                originalPrice: 192000,
                savings: 'Save 32%',
                badge: 'Best Value',
                features: [
                    'Everything in 3-Month Plan',
                    'Full pediatric monitoring',
                    'Solid feeding transition support',
                    'Priority nurse allocation',
                ],
            },
        },
    },
    muma: {
        type: 'muma',
        title: 'Mother + Baby Bundle',
        subtitle: 'Complete nursing care for both you and your baby at the comfort of your home.',
        tagline: 'Complete nursing care for both you and your baby.',
        icon: 'fa-heart',
        accentColor: '#E91E8A',
        startingPrice: 34999,
        badge: 'Most Popular',
        features: [
            'All newborn care services',
            'All mother care services',
            'Breastfeeding support',
            'Recovery & wellness support',
        ],
        plans: {
            '1month': {
                key: '1month',
                label: '1 Month Plan',
                visitInfo: '26 visits × 3 hours (78 hours)',
                price: 34999,
                originalPrice: 45000,
                savings: 'Save 22%',
                badge: 'Most Popular',
                features: [
                    'All newborn care services',
                    'Daily routine & care planning',
                    'All mother care services',
                    'Emotional support & guidance',
                    'Breastfeeding support',
                    'Regular progress updates',
                    'Mother\'s recovery support',
                    'Dedicated nurse (subject to availability)',
                ],
            },
            '3month': {
                key: '3month',
                label: '2 Months Plan',
                visitInfo: '52 visits × 3 hours (156 hours)',
                price: 64999,
                originalPrice: 90000,
                savings: 'Save 28%',
                badge: null,
                features: [
                    'Everything in 1 Month Plan',
                    'Extended mother recovery support',
                    'Lactation consultant check-ins',
                    'Bonding & sleep routine development',
                ],
            },
            '6month': {
                key: '6month',
                label: '3 Months Plan',
                visitInfo: '78 visits × 3 hours (234 hours)',
                price: 89999,
                originalPrice: 135000,
                savings: 'Save 33%',
                badge: null,
                features: [
                    'Everything in 2 Months Plan',
                    'Comprehensive wellness tracking',
                    'Dedicated care coordinator',
                    '24/7 priority emergency support',
                ],
            },
        },
    },
    mother: {
        type: 'mother',
        title: 'Night Nursing',
        subtitle: 'Overnight nursing support for peaceful nights.',
        tagline: 'Overnight nursing support for peaceful nights.',
        icon: 'fa-moon',
        accentColor: '#6C5CE7',
        startingPrice: 64999,
        features: [
            'Overnight care (8–12 hours)',
            'Baby feeding & diaper support',
            'Sleep routine establishment',
            'Monitoring mother & baby',
        ],
        plans: {
            '1month': {
                key: '1month',
                label: 'Monthly Plan',
                visitInfo: '26 nights × 10 hours (260 hours)',
                price: 64999,
                originalPrice: 80000,
                savings: 'Save 19%',
                badge: null,
                features: [
                    'Overnight care (8–12 hours)',
                    'Baby feeding & diaper support',
                    'Sleep routine establishment',
                    'Monitoring mother & baby',
                ],
            },
            '3month': {
                key: '3month',
                label: '3 Months Plan',
                visitInfo: '78 nights × 10 hours (780 hours)',
                price: 179999,
                originalPrice: 240000,
                savings: 'Save 25%',
                badge: 'Most Popular',
                features: [
                    'Everything in Monthly Plan',
                    'Complete sleep training',
                    'Night shift nurse assignment',
                    'Constant vital monitoring',
                ],
            },
            '6month': {
                key: '6month',
                label: '6 Months Plan',
                visitInfo: '156 nights × 10 hours (1560 hours)',
                price: 339999,
                originalPrice: 480000,
                savings: 'Save 29%',
                badge: 'Best Value',
                features: [
                    'Everything in 3 Months Plan',
                    'Dedicated night nursing team',
                    'Concierge health reports',
                ],
            },
        },
    },
};

const PLAN_KEYS = ['1month', '3month', '6month'];
const PACKAGE_TYPES = Object.keys(PACKAGES);

module.exports = { PACKAGES, PLAN_KEYS, PACKAGE_TYPES };
