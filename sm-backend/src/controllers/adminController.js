'use strict';

const User = require('../models/User');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Address = require('../models/Address');

/**
 * GET /api/admin/stats
 * Dashboard overview metrics and chart data aggregates.
 */
const getStats = async (req, res, next) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalOrders = await Order.countDocuments();
        const activeOrders = await Order.countDocuments({ status: 'active' });

        // Sum revenue of all successful payments
        const revenueAggregate = await Payment.aggregate([
            { $match: { status: 'success' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const totalRevenue = revenueAggregate.length > 0 ? revenueAggregate[0].total : 0;

        // Pending / Initiated payments count
        const pendingPayments = await Payment.countDocuments({ status: { $in: ['initiated', 'pending'] } });

        // Package type breakdown counts
        const packageBreakdown = await Order.aggregate([
            { $group: { _id: '$packageType', count: { $sum: 1 } } }
        ]);

        const packageStats = { mother: 0, baby: 0, muma: 0 };
        packageBreakdown.forEach(item => {
            if (packageStats[item._id] !== undefined) {
                packageStats[item._id] = item.count;
            }
        });

        // Monthly revenue trend (last 6 months)
        const monthlyTrend = await Payment.aggregate([
            { $match: { status: 'success' } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m', date: '$paidAt' } },
                    revenue: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } },
            { $limit: 6 }
        ]);

        // Recent Orders list (latest 5)
        const recentOrders = await Order.find()
            .populate('user', 'name mobile')
            .sort({ createdAt: -1 })
            .limit(5);

        // Recent Payments list (latest 5)
        const recentPayments = await Payment.find()
            .populate('user', 'name mobile')
            .sort({ createdAt: -1 })
            .limit(5);

        res.status(200).json({
            success: true,
            data: {
                metrics: {
                    totalUsers,
                    totalOrders,
                    activeOrders,
                    totalRevenue,
                    pendingPayments
                },
                packageStats,
                monthlyTrend,
                recentOrders,
                recentPayments
            }
        });
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/admin/users
 * Retrieve paginated, searchable user list.
 */
const getUsers = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const search = req.query.search || '';
        const role = req.query.role || '';
        const isVerified = req.query.isVerified || '';

        const query = {};

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { mobile: { $regex: search, $options: 'i' } }
            ];
        }

        if (role) {
            query.role = role;
        }

        if (isVerified) {
            query.isVerified = isVerified === 'true';
        }

        const total = await User.countDocuments(query);
        const users = await User.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        res.status(200).json({
            success: true,
            data: {
                users,
                pagination: {
                    total,
                    page,
                    limit,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (err) {
        next(err);
    }
};

/**
 * PUT /api/admin/users/:id
 * Update user details from Admin panel.
 */
const updateUser = async (req, res, next) => {
    try {
        const { name, email, mobile, role, isVerified } = req.body;
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (name !== undefined) user.name = name;
        if (email !== undefined) user.email = email;
        if (mobile !== undefined) user.mobile = mobile;
        if (role !== undefined) user.role = role;
        if (isVerified !== undefined) user.isVerified = isVerified;

        await user.save();

        res.status(200).json({
            success: true,
            message: 'User updated successfully',
            data: user
        });
    } catch (err) {
        next(err);
    }
};

/**
 * DELETE /api/admin/users/:id
 * Delete a user and clear cascade dependencies.
 */
const deleteUser = async (req, res, next) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Check if deleting self to prevent locking out
        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({ success: false, message: 'Self deletion is not allowed' });
        }

        await User.findByIdAndDelete(userId);
        await Address.deleteMany({ user: userId });
        await Order.deleteMany({ user: userId });
        await Payment.deleteMany({ user: userId });

        res.status(200).json({
            success: true,
            message: 'User and all associated data deleted successfully'
        });
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/admin/orders
 * Retrieve paginated, searchable order list.
 */
const getOrders = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const search = req.query.search || '';
        const status = req.query.status || '';
        const paymentStatus = req.query.paymentStatus || '';
        const packageType = req.query.packageType || '';

        const query = {};

        if (search) {
            if (search.match(/^[0-9a-fA-F]{24}$/)) {
                query._id = search;
            } else {
                query.$or = [
                    { transactionId: { $regex: search, $options: 'i' } },
                    { packageTitle: { $regex: search, $options: 'i' } }
                ];
            }
        }

        if (status) {
            query.status = status;
        }

        if (paymentStatus) {
            query.paymentStatus = paymentStatus;
        }

        if (packageType) {
            query.packageType = packageType;
        }

        const total = await Order.countDocuments(query);
        const orders = await Order.find(query)
            .populate('user', 'name email mobile')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        res.status(200).json({
            success: true,
            data: {
                orders,
                pagination: {
                    total,
                    page,
                    limit,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (err) {
        next(err);
    }
};

/**
 * PUT /api/admin/orders/:id
 * Update order status and details (active window parameters).
 */
const updateOrder = async (req, res, next) => {
    try {
        const { status, paymentStatus, activatedAt, expiresAt } = req.body;
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (status !== undefined) order.status = status;
        if (paymentStatus !== undefined) order.paymentStatus = paymentStatus;
        if (activatedAt !== undefined) order.activatedAt = activatedAt ? new Date(activatedAt) : null;
        if (expiresAt !== undefined) order.expiresAt = expiresAt ? new Date(expiresAt) : null;

        await order.save();

        res.status(200).json({
            success: true,
            message: 'Order updated successfully',
            data: order
        });
    } catch (err) {
        next(err);
    }
};

/**
 * DELETE /api/admin/orders/:id
 * Delete order.
 */
const deleteOrder = async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        await Order.findByIdAndDelete(req.params.id);
        // Delete related payments
        await Payment.deleteMany({ order: req.params.id });

        res.status(200).json({
            success: true,
            message: 'Order and associated payments deleted successfully'
        });
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/admin/payments
 * Retrieve paginated payment records.
 */
const getPayments = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const search = req.query.search || '';
        const status = req.query.status || '';

        const query = {};

        if (search) {
            if (search.match(/^[0-9a-fA-F]{24}$/)) {
                query.$or = [{ _id: search }, { order: search }, { user: search }];
            } else {
                query.$or = [
                    { transactionId: { $regex: search, $options: 'i' } },
                    { upiId: { $regex: search, $options: 'i' } },
                    { upiRef: { $regex: search, $options: 'i' } }
                ];
            }
        }

        if (status) {
            query.status = status;
        }

        const total = await Payment.countDocuments(query);
        const payments = await Payment.find(query)
            .populate('user', 'name email mobile')
            .populate('order', 'packageTitle planLabel price status')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        res.status(200).json({
            success: true,
            data: {
                payments,
                pagination: {
                    total,
                    page,
                    limit,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (err) {
        next(err);
    }
};

/**
 * PUT /api/admin/payments/:id
 * Update payment record status and cascade change to active orders.
 */
const updatePayment = async (req, res, next) => {
    try {
        const { status, amount, upiId, upiRef } = req.body;
        const payment = await Payment.findById(req.params.id);

        if (!payment) {
            return res.status(404).json({ success: false, message: 'Payment record not found' });
        }

        if (status !== undefined) payment.status = status;
        if (amount !== undefined) payment.amount = amount;
        if (upiId !== undefined) payment.upiId = upiId;
        if (upiRef !== undefined) payment.upiRef = upiRef;

        if (status === 'success' && !payment.paidAt) {
            payment.paidAt = new Date();
        }

        await payment.save();

        // Cascade success status to Order
        if (status === 'success') {
            const order = await Order.findById(payment.order);
            if (order && order.paymentStatus !== 'success') {
                order.paymentStatus = 'success';
                order.status = 'active';
                order.activatedAt = payment.paidAt || new Date();
                
                // Expiry calculation
                const months = order.planKey === '1month' ? 1 : order.planKey === '3month' ? 3 : 6;
                const expiry = new Date(order.activatedAt);
                expiry.setMonth(expiry.getMonth() + months);
                order.expiresAt = expiry;
                
                await order.save();
            }
        } else if (status === 'failed') {
            const order = await Order.findById(payment.order);
            if (order && order.paymentStatus !== 'failed') {
                order.paymentStatus = 'failed';
                await order.save();
            }
        }

        res.status(200).json({
            success: true,
            message: 'Payment updated successfully',
            data: payment
        });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getStats,
    getUsers,
    updateUser,
    deleteUser,
    getOrders,
    updateOrder,
    deleteOrder,
    getPayments,
    updatePayment
};
