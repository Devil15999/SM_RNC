'use strict';

const Package = require('../models/Package');

/**
 * GET /api/packages
 * Returns all packages (summary list — for the Home screen cards).
 */
const getAllPackages = async (req, res, next) => {
    try {
        const packages = await Package.find();
        const list = packages.map(p => ({
            type: p.type,
            title: p.title,
            tagline: p.tagline,
            icon: p.icon,
            accentColor: p.accentColor,
            startingPrice: p.startingPrice,
            features: p.features,
        }));
        res.status(200).json({ success: true, data: list });
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/packages/:type
 * Returns full detail of one package including all plans.
 * :type = 'mother' | 'baby' | 'muma'
 */
const getPackageByType = async (req, res, next) => {
    try {
        const { type } = req.params;
        const pkg = await Package.findOne({ type });

        if (!pkg) {
            return res.status(404).json({
                success: false,
                message: `Package '${type}' not found.`,
            });
        }

        res.status(200).json({ success: true, data: pkg });
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/packages/:type/plans/:planKey
 * Returns a single plan within a package.
 * :planKey = '1month' | '3month' | '6month'
 */
const getPlanByKey = async (req, res, next) => {
    try {
        const { type, planKey } = req.params;
        const pkg = await Package.findOne({ type });

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
                key: plan.key,
                label: plan.label,
                price: plan.price,
                originalPrice: plan.originalPrice,
                savings: plan.savings,
                badge: plan.badge,
                features: plan.features,
                packageType: type,
                packageTitle: pkg.title,
                icon: pkg.icon,
                accentColor: pkg.accentColor,
            },
        });
    } catch (err) {
        next(err);
    }
};

module.exports = { getAllPackages, getPackageByType, getPlanByKey };
