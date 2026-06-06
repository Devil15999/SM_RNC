'use strict';

const { PACKAGES, PACKAGE_TYPES } = require('../data/packages');

/**
 * GET /api/packages
 * Returns all packages (summary list — for the Home screen cards).
 */
const getAllPackages = (req, res) => {
    const list = PACKAGE_TYPES.map(type => {
        const p = PACKAGES[type];
        return {
            type: p.type,
            title: p.title,
            tagline: p.tagline,
            emoji: p.emoji,
            accentColor: p.accentColor,
            startingPrice: p.startingPrice,
            features: p.features,
        };
    });
    res.status(200).json({ success: true, data: list });
};

/**
 * GET /api/packages/:type
 * Returns full detail of one package including all plans.
 * :type = 'mother' | 'baby' | 'muma'
 */
const getPackageByType = (req, res) => {
    const { type } = req.params;
    const pkg = PACKAGES[type];

    if (!pkg) {
        return res.status(404).json({
            success: false,
            message: `Package '${type}' not found. Valid types: ${PACKAGE_TYPES.join(', ')}`,
        });
    }

    res.status(200).json({ success: true, data: pkg });
};

/**
 * GET /api/packages/:type/plans/:planKey
 * Returns a single plan within a package.
 * :planKey = '1month' | '3month' | '6month'
 */
const getPlanByKey = (req, res) => {
    const { type, planKey } = req.params;
    const pkg = PACKAGES[type];

    if (!pkg) {
        return res.status(404).json({ success: false, message: `Package '${type}' not found` });
    }

    const plan = pkg.plans[planKey];
    if (!plan) {
        return res.status(404).json({ success: false, message: `Plan '${planKey}' not found in package '${type}'` });
    }

    res.status(200).json({
        success: true,
        data: {
            ...plan,
            packageType: type,
            packageTitle: pkg.title,
            emoji: pkg.emoji,
            accentColor: pkg.accentColor,
        },
    });
};

module.exports = { getAllPackages, getPackageByType, getPlanByKey };
