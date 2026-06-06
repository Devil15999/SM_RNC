'use strict';

const express = require('express');
const { body } = require('express-validator');
const { createOrder, getOrders, getOrder, cancelOrder } = require('../controllers/orderController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All order routes are protected
router.use(protect);

const addressBodyValidators = [
    body('address.fullName').trim().notEmpty().withMessage('Full name is required'),
    body('address.mobile').trim().matches(/^\d{10}$/).withMessage('Enter a valid 10-digit mobile'),
    body('address.flatNo').trim().notEmpty().withMessage('Flat/House No is required'),
    body('address.street').trim().notEmpty().withMessage('Street/Locality is required'),
    body('address.city').trim().notEmpty().withMessage('City is required'),
    body('address.state').trim().notEmpty().withMessage('State is required'),
    body('address.pincode').trim().matches(/^\d{6}$/).withMessage('Enter a valid 6-digit pincode'),
];

/**
 * @route   POST /api/orders
 * @desc    Create a new order (from Checkout screen)
 */
router.post(
    '/',
    [
        body('packageType').isIn(['mother', 'baby', 'muma']).withMessage('Invalid package type'),
        body('planKey').isIn(['1month', '3month', '6month']).withMessage('Invalid plan key'),
        ...addressBodyValidators,
    ],
    createOrder
);

/**
 * @route   GET /api/orders
 * @desc    Get all orders for the logged-in user
 */
router.get('/', getOrders);

/**
 * @route   GET /api/orders/:id
 * @desc    Get a single order
 */
router.get('/:id', getOrder);

/**
 * @route   PATCH /api/orders/:id/cancel
 * @desc    Cancel an order (only if status is 'created')
 */
router.patch('/:id/cancel', cancelOrder);

module.exports = router;
