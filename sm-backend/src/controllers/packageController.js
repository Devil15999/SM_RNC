'use strict';

const Package = require('../models/Package');
const ServiceablePincode = require('../models/ServiceablePincode');
const PincodeRequest = require('../models/PincodeRequest');

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

/**
 * POST /api/packages/check-pincode
 * Body: { pincode, mobile, userId }
 * Check if a pincode is serviceable. If not, capture the request lead.
 */
const checkPincode = async (req, res, next) => {
    try {
        const { pincode, mobile, userId } = req.body;
        if (!pincode || pincode.length !== 6) {
            return res.status(400).json({ success: false, message: 'Invalid 6-digit pincode.' });
        }
        if (!mobile || mobile.length !== 10) {
            return res.status(400).json({ success: false, message: 'Invalid 10-digit mobile number is required to request service.' });
        }

        const isServiceable = await ServiceablePincode.findOne({ pincode: pincode.trim() });
        if (isServiceable) {
            return res.status(200).json({ success: true, serviceable: true, message: 'Service is available in your area.' });
        }

        // Capture non-serviceable lead
        await PincodeRequest.create({
            pincode: pincode.trim(),
            mobile: mobile.trim(),
            user: userId || null
        });

        res.status(200).json({
            success: true,
            serviceable: false,
            message: 'Request to this service in your area has been sent. Currently enjoy the other available services.'
        });
    } catch (err) {
        next(err);
    }
};

module.exports = { getAllPackages, getPackageByType, getPlanByKey, checkPincode };
