'use strict';

const { v4: uuidv4 } = require('uuid');
const { validationResult } = require('express-validator');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const { createError } = require('../middleware/errorHandler');

// ─── Helper: derive months from plan key ─────────────────────────────────────
const planToMonths = { '1month': 1, '3month': 3, '6month': 6 };

const getExpiryDate = (startDate, planKey) => {
    const months = planToMonths[planKey] || 1;
    const d = new Date(startDate);
    d.setMonth(d.getMonth() + months);
    return d;
};

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * POST /api/payments/initiate
 * Body: { orderId }
 *
 * Creates a Payment record and returns the UPI deep-link UPI that the
 * mobile app passes to Linking.openURL().
 */
const initiatePayment = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { orderId } = req.body;

        const order = await Order.findOne({ _id: orderId, user: req.user._id });
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        if (order.paymentStatus === 'success') {
            return res.status(400).json({ success: false, message: 'Order is already paid' });
        }

        const transactionId = `TXN-${uuidv4().split('-')[0].toUpperCase()}-${Date.now()}`;
        const merchantUpiId = process.env.UPI_MERCHANT_ID || 'secondmuma@upi';
        const merchantName  = encodeURIComponent(process.env.UPI_MERCHANT_NAME || 'SecondMuma');

        const upiUri = `upi://pay?pa=${merchantUpiId}&pn=${merchantName}&tr=${transactionId}&am=${order.price.toFixed(2)}&cu=INR`;

        // Create payment record
        const payment = await Payment.create({
            order: order._id,
            user: req.user._id,
            transactionId,
            amount: order.price,
            upiId: merchantUpiId,
            status: 'initiated',
        });

        // Update order with transactionId and set status to processing
        order.transactionId = transactionId;
        order.paymentStatus = 'processing';
        await order.save();

        res.status(200).json({
            success: true,
            message: 'Payment initiated',
            data: {
                paymentId: payment._id,
                transactionId,
                upiUri,
                amount: order.price,
                orderId: order._id,
            },
        });
    } catch (err) {
        next(err);
    }
};

/**
 * POST /api/payments/verify
 * Body: { transactionId, upiRef?, status: 'success' | 'failed' }
 *
 * In production this would be called by the UPI gateway webhook.
 * In development the mobile app can call it directly to simulate success/failure.
 */
const verifyPayment = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { transactionId, upiRef, status } = req.body;

        const payment = await Payment.findOne({ transactionId });
        if (!payment) {
            return res.status(404).json({ success: false, message: 'Payment record not found' });
        }

        if (payment.status === 'success') {
            return res.status(400).json({ success: false, message: 'Payment already verified as successful' });
        }

        const order = await Order.findById(payment.order);

        if (status === 'success') {
            payment.status = 'success';
            payment.upiRef = upiRef || '';
            payment.paidAt = new Date();
            await payment.save();

            order.paymentStatus = 'success';
            order.status = 'active';
            
            const start = new Date();
            start.setHours(0, 0, 0, 0);
            order.activatedAt = start;
            
            const expiry = getExpiryDate(start, order.planKey);
            expiry.setHours(0, 0, 0, 0);
            order.expiresAt = expiry;
            
            await order.save();

            return res.status(200).json({
                success: true,
                message: 'Payment verified – subscription activated!',
                data: {
                    transactionId,
                    orderId: order._id,
                    activatedAt: order.activatedAt,
                    expiresAt: order.expiresAt,
                },
            });
        }

        // Failed
        payment.status = 'failed';
        await payment.save();
        order.paymentStatus = 'failed';
        await order.save();

        res.status(200).json({ success: true, message: 'Payment marked as failed', data: { transactionId } });
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/payments/:transactionId
 * Returns the status of a payment by transaction ID.
 * Protected — user can only fetch their own payments.
 */
const getPaymentStatus = async (req, res, next) => {
    try {
        const payment = await Payment.findOne({
            transactionId: req.params.transactionId,
            user: req.user._id,
        }).populate('order', 'packageTitle planLabel price status');

        if (!payment) {
            return res.status(404).json({ success: false, message: 'Payment not found' });
        }

        res.status(200).json({
            success: true,
            data: {
                transactionId: payment.transactionId,
                status: payment.status,
                amount: payment.amount,
                paidAt: payment.paidAt,
                order: payment.order,
            },
        });
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/payments
 * Returns all payments for the logged-in user.
 */
const getPayments = async (req, res, next) => {
    try {
        const payments = await Payment.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .populate('order', 'packageTitle planLabel price status');

        res.status(200).json({ success: true, count: payments.length, data: payments });
    } catch (err) {
        next(err);
    }
};

module.exports = { initiatePayment, verifyPayment, getPaymentStatus, getPayments };
