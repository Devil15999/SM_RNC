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
    updatePayment,
    getAdminPackages,
    createPackage,
    updatePackage,
    deletePackage
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

/**
 * @route   GET /api/admin/packages
 * @desc    Get all packages
 * @access  Private (Admin)
 */
router.get('/packages', getAdminPackages);

/**
 * @route   POST /api/admin/packages
 * @desc    Create a new package
 * @access  Private (Admin)
 */
router.post('/packages', createPackage);

/**
 * @route   PUT /api/admin/packages/:id
 * @desc    Update package details
 * @access  Private (Admin)
 */
router.put('/packages/:id', updatePackage);

/**
 * @route   DELETE /api/admin/packages/:id
 * @desc    Delete package
 * @access  Private (Admin)
 */
router.delete('/packages/:id', deletePackage);

module.exports = router;
