'use strict';

const express = require('express');
const { protect, admin } = require('../middleware/auth');
const {
    getStats,
    getUsers,
    updateUser,
    deleteUser,
    getOrders,
    updateOrder,
    deleteOrder,
    getPayments,
    updatePayment
} = require('../controllers/adminController');

const router = express.Router();

// Apply protect & admin middlewares to all admin routes
router.use(protect, admin);

/**
 * @route   GET /api/admin/stats
 * @desc    Get dashboard stats
 * @access  Private (Admin)
 */
router.get('/stats', getStats);

/**
 * @route   GET /api/admin/users
 * @desc    Get paginated users
 * @access  Private (Admin)
 */
router.get('/users', getUsers);

/**
 * @route   PUT /api/admin/users/:id
 * @desc    Update user details
 * @access  Private (Admin)
 */
router.put('/users/:id', updateUser);

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Delete user and cascade details
 * @access  Private (Admin)
 */
router.delete('/users/:id', deleteUser);

/**
 * @route   GET /api/admin/orders
 * @desc    Get paginated orders
 * @access  Private (Admin)
 */
router.get('/orders', getOrders);

/**
 * @route   PUT /api/admin/orders/:id
 * @desc    Update order details
 * @access  Private (Admin)
 */
router.put('/orders/:id', updateOrder);

/**
 * @route   DELETE /api/admin/orders/:id
 * @desc    Delete order
 * @access  Private (Admin)
 */
router.delete('/orders/:id', deleteOrder);

/**
 * @route   GET /api/admin/payments
 * @desc    Get paginated payments
 * @access  Private (Admin)
 */
router.get('/payments', getPayments);

/**
 * @route   PUT /api/admin/payments/:id
 * @desc    Update payment status
 * @access  Private (Admin)
 */
router.put('/payments/:id', updatePayment);

module.exports = router;
