'use strict';

const express = require('express');
const { body } = require('express-validator');
const { initiatePayment, verifyPayment, getPaymentStatus, getPayments } = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All payment routes are protected
router.use(protect);

/**
 * @route   POST /api/payments/initiate
 * @desc    Initiate a UPI payment for an order — returns the upiUri deep-link
 * @body    { orderId }
 */
router.post(
    '/initiate',
    [body('orderId').notEmpty().withMessage('orderId is required')],
    initiatePayment
);

/**
 * @route   POST /api/payments/verify
 * @desc    Verify / confirm a payment (called after UPI app returns or via webhook)
 * @body    { transactionId, upiRef?, status: 'success' | 'failed' }
 */
router.post(
    '/verify',
    [
        body('transactionId').notEmpty().withMessage('transactionId is required'),
        body('status').isIn(['success', 'failed']).withMessage("status must be 'success' or 'failed'"),
    ],
    verifyPayment
);

/**
 * @route   GET /api/payments
 * @desc    Get all payments for the logged-in user
 */
router.get('/', getPayments);

/**
 * @route   GET /api/payments/:transactionId
 * @desc    Get payment status by transaction ID
 */
router.get('/:transactionId', getPaymentStatus);

module.exports = router;
