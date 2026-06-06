'use strict';

const { validationResult } = require('express-validator');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const { PACKAGES } = require('../data/packages');
const { createError } = require('../middleware/errorHandler');

// ─── Helper: compute subscription window ─────────────────────────────────────
const getExpiryDate = (planKey) => {
    const months = planKey === '1month' ? 1 : planKey === '3month' ? 3 : 6;
    const d = new Date();
    d.setMonth(d.getMonth() + months);
    return d;
};

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * POST /api/orders
 * Body: { packageType, planKey, address: { fullName, mobile, flatNo, street, city, state, pincode } }
 *
 * Creates an order (status: 'created', paymentStatus: 'pending').
 * Call POST /api/payments/initiate next to start the UPI payment.
 */
const createOrder = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { packageType, planKey, address } = req.body;

        const pkg = PACKAGES[packageType];
        if (!pkg) {
            return res.status(400).json({ success: false, message: `Invalid packageType: ${packageType}` });
        }
        const plan = pkg.plans[planKey];
        if (!plan) {
            return res.status(400).json({ success: false, message: `Invalid planKey: ${planKey}` });
        }

        const order = await Order.create({
            user: req.user._id,
            packageType,
            packageTitle: pkg.title,
            planKey,
            planLabel: plan.label,
            price: plan.price,
            emoji: pkg.emoji,
            accentColor: pkg.accentColor,
            address,
        });

        res.status(201).json({
            success: true,
            message: 'Order created. Proceed to payment.',
            data: order,
        });
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/orders
 * Returns all orders for the logged-in user (newest first).
 */
const getOrders = async (req, res, next) => {
    try {
        const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: orders.length, data: orders });
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/orders/:id
 * Returns a single order (must belong to the logged-in user).
 */
const getOrder = async (req, res, next) => {
    try {
        const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        res.status(200).json({ success: true, data: order });
    } catch (err) {
        next(err);
    }
};

/**
 * PATCH /api/orders/:id/cancel
 * Cancels an order if it is still in 'created' state.
 */
const cancelOrder = async (req, res, next) => {
    try {
        const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        if (order.status !== 'created') {
            return res.status(400).json({
                success: false,
                message: `Cannot cancel an order with status '${order.status}'`,
            });
        }
        order.status = 'cancelled';
        await order.save();
        res.status(200).json({ success: true, message: 'Order cancelled', data: order });
    } catch (err) {
        next(err);
    }
};

module.exports = { createOrder, getOrders, getOrder, cancelOrder };
