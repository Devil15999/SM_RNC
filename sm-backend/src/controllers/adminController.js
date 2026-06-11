'use strict';

const User = require('../models/User');
const Employee = require('../models/Employee');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Address = require('../models/Address');
const Package = require('../models/Package');
const Appointment = require('../models/Appointment');
const TimeslotConfig = require('../models/TimeslotConfig');
const ServiceablePincode = require('../models/ServiceablePincode');
const PincodeRequest = require('../models/PincodeRequest');

/**
 * GET /api/admin/stats
 * Dashboard overview metrics and chart data aggregates.
 */
const getStats = async (req, res, next) => {
    try {
        const totalUsers = await User.countDocuments({ role: 'user' });
        const totalEmployees = await Employee.countDocuments();
        const totalAppointments = await Appointment.countDocuments();
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
                    totalEmployees,
                    totalAppointments,
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
        const {
            status,
            paymentStatus,
            activatedAt,
            expiresAt,
            motherName,
            motherAge,
            babyName,
            babyAge,
            startDate,
            timeSlot,
            selectedTime
        } = req.body;
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (status !== undefined) {
            if (status === 'active' && order.status !== 'active') {
                if (!activatedAt && !order.activatedAt) {
                    const start = new Date();
                    start.setHours(0, 0, 0, 0);
                    order.activatedAt = start;
                }
                if (!expiresAt && !order.expiresAt) {
                    const baseDate = order.activatedAt || new Date();
                    baseDate.setHours(0, 0, 0, 0);
                    const months = order.planKey === '1month' ? 1 : order.planKey === '3month' ? 3 : 6;
                    const expiry = new Date(baseDate);
                    expiry.setMonth(expiry.getMonth() + months);
                    expiry.setHours(0, 0, 0, 0);
                    order.expiresAt = expiry;
                }
            }
            order.status = status;
        }
        if (paymentStatus !== undefined) order.paymentStatus = paymentStatus;
        if (activatedAt !== undefined) {
            if (activatedAt) {
                const start = new Date(activatedAt);
                start.setHours(0, 0, 0, 0);
                order.activatedAt = start;
            } else {
                order.activatedAt = null;
            }
        }
        if (expiresAt !== undefined) {
            if (expiresAt) {
                const expiry = new Date(expiresAt);
                expiry.setHours(0, 0, 0, 0);
                order.expiresAt = expiry;
            } else {
                order.expiresAt = null;
            }
        }
        
        if (motherName !== undefined) order.motherName = motherName;
        if (motherAge !== undefined) order.motherAge = motherAge;
        if (babyName !== undefined) order.babyName = babyName;
        if (babyAge !== undefined) order.babyAge = babyAge;
        if (startDate !== undefined) order.startDate = startDate ? new Date(startDate) : null;
        if (timeSlot !== undefined) order.timeSlot = timeSlot;
        if (selectedTime !== undefined) order.selectedTime = selectedTime;

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
                
                const start = new Date(payment.paidAt || new Date());
                start.setHours(0, 0, 0, 0);
                order.activatedAt = start;
                
                // Expiry calculation
                const months = order.planKey === '1month' ? 1 : order.planKey === '3month' ? 3 : 6;
                const expiry = new Date(order.activatedAt);
                expiry.setMonth(expiry.getMonth() + months);
                expiry.setHours(0, 0, 0, 0);
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

/**
 * GET /api/admin/packages
 * Retrieve all packages.
 */
const getAdminPackages = async (req, res, next) => {
    try {
        const packages = await Package.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: packages.length, data: packages });
    } catch (err) {
        next(err);
    }
};

/**
 * POST /api/admin/packages
 * Create a new package.
 */
const createPackage = async (req, res, next) => {
    try {
        const { type, title, subtitle, tagline, icon, accentColor, startingPrice, features, plans } = req.body;

        if (!type || !title || !icon || !accentColor || startingPrice === undefined) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        const existing = await Package.findOne({ type });
        if (existing) {
            return res.status(400).json({ success: false, message: `Package type '${type}' already exists` });
        }

        const pkg = await Package.create({
            type,
            title,
            subtitle: subtitle || '',
            tagline: tagline || '',
            icon,
            accentColor,
            startingPrice,
            features: features || [],
            plans: plans || {}
        });

        res.status(201).json({ success: true, message: 'Package created successfully', data: pkg });
    } catch (err) {
        next(err);
    }
};

/**
 * PUT /api/admin/packages/:id
 * Update an existing package.
 */
const updatePackage = async (req, res, next) => {
    try {
        const { type, title, subtitle, tagline, icon, accentColor, startingPrice, features, plans } = req.body;
        const pkg = await Package.findById(req.params.id);

        if (!pkg) {
            return res.status(404).json({ success: false, message: 'Package not found' });
        }

        if (type !== undefined) pkg.type = type;
        if (title !== undefined) pkg.title = title;
        if (subtitle !== undefined) pkg.subtitle = subtitle;
        if (tagline !== undefined) pkg.tagline = tagline;
        if (icon !== undefined) pkg.icon = icon;
        if (accentColor !== undefined) pkg.accentColor = accentColor;
        if (startingPrice !== undefined) pkg.startingPrice = startingPrice;
        if (features !== undefined) pkg.features = features;
        if (plans !== undefined) pkg.plans = plans;

        await pkg.save();

        res.status(200).json({ success: true, message: 'Package updated successfully', data: pkg });
    } catch (err) {
        next(err);
    }
};

/**
 * DELETE /api/admin/packages/:id
 * Delete a package.
 */
const deletePackage = async (req, res, next) => {
    try {
        const pkg = await Package.findById(req.params.id);
        if (!pkg) {
            return res.status(404).json({ success: false, message: 'Package not found' });
        }

        await Package.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: 'Package deleted successfully' });
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/admin/employees
 * List all employees with filters.
 */
const getEmployees = async (req, res, next) => {
    try {
        const { search, isVerifiedEmployee } = req.query;
        let filter = {};

        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { mobile: { $regex: search, $options: 'i' } }
            ];
        }

        if (isVerifiedEmployee !== undefined && isVerifiedEmployee !== '') {
            filter.isVerifiedEmployee = isVerifiedEmployee === 'true';
        }

        const employees = await Employee.find(filter).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: employees });
    } catch (err) {
        next(err);
    }
};

/**
 * PUT /api/admin/employees/:id/approve
 * Approve/Verify an employee.
 */
const approveEmployee = async (req, res, next) => {
    try {
        const { isVerifiedEmployee } = req.body;
        const employee = await Employee.findById(req.params.id);

        if (!employee) {
            return res.status(404).json({ success: false, message: 'Employee not found' });
        }

        employee.isVerifiedEmployee = isVerifiedEmployee !== undefined ? isVerifiedEmployee : true;
        if (employee.isVerifiedEmployee) {
            employee.isVerified = true;
        }
        await employee.save();

        res.status(200).json({
            success: true,
            message: `Employee approval status updated to ${employee.isVerifiedEmployee}`,
            data: employee
        });
    } catch (err) {
        next(err);
    }
};

/**
 * DELETE /api/admin/employees/:id
 * Delete an employee and clear assignment in appointments.
 */
const deleteEmployee = async (req, res, next) => {
    try {
        const employeeId = req.params.id;
        const employee = await Employee.findById(employeeId);

        if (!employee) {
            return res.status(404).json({ success: false, message: 'Employee not found' });
        }

        await Employee.findByIdAndDelete(employeeId);
        // Unassign from appointments
        await Appointment.updateMany(
            { assignedEmployee: employeeId },
            { $set: { assignedEmployee: null } }
        );

        res.status(200).json({
            success: true,
            message: 'Employee deleted successfully and unassigned from appointments'
        });
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/admin/appointments
 * Retrieve all appointments.
 */
const getAdminAppointments = async (req, res, next) => {
    try {
        const { search, status } = req.query;
        let filter = {};

        if (status) {
            filter.status = status;
        }

        if (search) {
            const matchedEmployees = await Employee.find({
                name: { $regex: search, $options: 'i' }
            }).select('_id');
            const employeeIds = matchedEmployees.map(e => e._id);

            filter.$or = [
                { customerName: { $regex: search, $options: 'i' } },
                { customerMobile: { $regex: search, $options: 'i' } },
                { assignedEmployee: { $in: employeeIds } }
            ];
        }

        const appointments = await Appointment.find(filter)
            .populate('assignedEmployee', 'name email mobile occupation userPhoto')
            .sort({ dateTime: -1 });

        res.status(200).json({ success: true, data: appointments });
    } catch (err) {
        next(err);
    }
};

/**
 * POST /api/admin/appointments
 * Create and assign an appointment. Generates a random 6-digit OTP.
 */
const createAppointment = async (req, res, next) => {
    try {
        const { customerName, customerMobile, customerAddress, dateTime, details, assignedEmployee } = req.body;

        if (!customerName || !customerMobile || !customerAddress || !dateTime) {
            return res.status(400).json({ success: false, message: 'Required fields missing' });
        }

        if (assignedEmployee) {
            const employee = await Employee.findById(assignedEmployee);
            if (!employee) {
                return res.status(400).json({ success: false, message: 'Assigned user must be an employee' });
            }
            if (!employee.isVerifiedEmployee) {
                return res.status(400).json({ success: false, message: 'Assigned employee is not approved yet' });
            }
        }

        const otp = String(Math.floor(100000 + Math.random() * 900000));

        const appointment = await Appointment.create({
            customerName,
            customerMobile,
            customerAddress,
            dateTime,
            details: details || '',
            assignedEmployee: assignedEmployee || null,
            otp,
            status: 'pending'
        });

        res.status(201).json({ success: true, message: 'Appointment created and assigned successfully', data: appointment });
    } catch (err) {
        next(err);
    }
};

/**
 * PUT /api/admin/appointments/:id
 * Update appointment details.
 */
const updateAppointment = async (req, res, next) => {
    try {
        const { customerName, customerMobile, customerAddress, dateTime, details, assignedEmployee, status } = req.body;
        const appointment = await Appointment.findById(req.params.id);

        if (!appointment) {
            return res.status(404).json({ success: false, message: 'Appointment not found' });
        }

        if (customerName !== undefined) appointment.customerName = customerName;
        if (customerMobile !== undefined) appointment.customerMobile = customerMobile;
        if (customerAddress !== undefined) appointment.customerAddress = customerAddress;
        if (dateTime !== undefined) appointment.dateTime = dateTime;
        if (details !== undefined) appointment.details = details;
        if (status !== undefined) appointment.status = status;

        if (assignedEmployee !== undefined) {
            if (assignedEmployee) {
                const employee = await Employee.findById(assignedEmployee);
                if (!employee) {
                    return res.status(400).json({ success: false, message: 'Assigned user must be an employee' });
                }
                appointment.assignedEmployee = assignedEmployee;
            } else {
                appointment.assignedEmployee = null;
            }
        }

        await appointment.save();
        res.status(200).json({ success: true, message: 'Appointment updated successfully', data: appointment });
    } catch (err) {
        next(err);
    }
};

/**
 * DELETE /api/admin/appointments/:id
 * Delete appointment.
 */
const deleteAppointment = async (req, res, next) => {
    try {
        const appointment = await Appointment.findById(req.params.id);
        if (!appointment) {
            return res.status(404).json({ success: false, message: 'Appointment not found' });
        }

        await Appointment.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: 'Appointment deleted successfully' });
    } catch (err) {
        next(err);
    }
};

const seedDefaultTimeslotsLocal = async () => {
    const defaults = [
        { slot: 'morning', times: ['08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM'] },
        { slot: 'afternoon', times: ['12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM'] },
        { slot: 'evening', times: ['04:00 PM', '05:00 PM', '06:00 PM', '07:00 PM'] }
    ];
    for (const item of defaults) {
        const existing = await TimeslotConfig.findOne({ slot: item.slot });
        if (!existing) {
            await TimeslotConfig.create(item);
        }
    }
};

/**
 * GET /api/admin/timeslots
 * Fetch timeslot configurations
 */
const getAdminTimeslots = async (req, res, next) => {
    try {
        await seedDefaultTimeslotsLocal();
        const slots = await TimeslotConfig.find().sort({ slot: 1 });
        res.status(200).json({ success: true, data: slots });
    } catch (err) {
        next(err);
    }
};

/**
 * PUT /api/admin/timeslots
 * Update timeslot configuration for a slot
 */
const updateAdminTimeslots = async (req, res, next) => {
    try {
        const { slot, times } = req.body;
        if (!slot || !times) {
            return res.status(400).json({ success: false, message: 'Missing slot or times array' });
        }

        let config = await TimeslotConfig.findOne({ slot });
        if (!config) {
            config = new TimeslotConfig({ slot, times });
        } else {
            config.times = times;
        }

        await config.save();
        res.status(200).json({ success: true, message: 'Timeslot configuration updated successfully', data: config });
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/admin/pincodes
 * Returns all serviceable pincodes.
 */
const getServiceablePincodes = async (req, res, next) => {
    try {
        const pincodes = await ServiceablePincode.find().sort({ pincode: 1 });
        res.status(200).json({ success: true, data: pincodes });
    } catch (err) {
        next(err);
    }
};

/**
 * POST /api/admin/pincodes
 * Adds a new serviceable pincode.
 */
const createServiceablePincode = async (req, res, next) => {
    try {
        const { pincode } = req.body;
        if (!pincode || pincode.length !== 6) {
            return res.status(400).json({ success: false, message: 'Invalid pincode. Must be 6 digits.' });
        }
        
        // Check if it already exists
        const existing = await ServiceablePincode.findOne({ pincode });
        if (existing) {
            return res.status(400).json({ success: false, message: 'Pincode is already registered as serviceable' });
        }

        const newPin = await ServiceablePincode.create({ pincode });
        res.status(201).json({ success: true, message: 'Pincode added successfully', data: newPin });
    } catch (err) {
        next(err);
    }
};

/**
 * DELETE /api/admin/pincodes/:id
 * Removes a serviceable pincode.
 */
const deleteServiceablePincode = async (req, res, next) => {
    try {
        const pin = await ServiceablePincode.findByIdAndDelete(req.params.id);
        if (!pin) {
            return res.status(404).json({ success: false, message: 'Pincode not found' });
        }
        res.status(200).json({ success: true, message: 'Pincode removed successfully' });
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/admin/pincode-requests
 * Returns all captured user pincode requests (leads).
 */
const getPincodeRequests = async (req, res, next) => {
    try {
        const requests = await PincodeRequest.find()
            .populate('user', 'name email mobile')
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: requests });
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
    updatePayment,
    getAdminPackages,
    createPackage,
    updatePackage,
    deletePackage,
    getEmployees,
    approveEmployee,
    deleteEmployee,
    getAdminAppointments,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    getAdminTimeslots,
    updateAdminTimeslots,
    getServiceablePincodes,
    createServiceablePincode,
    deleteServiceablePincode,
    getPincodeRequests
};

