'use strict';

const Appointment = require('../models/Appointment');
const Order = require('../models/Order');

/**
 * GET /api/employee/appointments
 * Retrieves all appointments assigned to the logged-in employee
 */
const getAppointments = async (req, res, next) => {
    try {
        const appointments = await Appointment.find({ assignedEmployee: req.user._id })
            .sort({ dateTime: 1 });

        // Filter out pending appointments where the subscription is expired or inactive
        const filteredAppointments = [];
        for (const appt of appointments) {
            if (appt.status === 'pending') {
                const orderIdMatch = appt.details && appt.details.match(/Order ID:\s*([a-f\d]{24})/i);
                if (orderIdMatch) {
                    const orderId = orderIdMatch[1];
                    const order = await Order.findById(orderId);
                    if (!order || order.status !== 'active') {
                        // Skip if order is not active
                        continue;
                    }
                    const now = new Date();
                    if (order.expiresAt && new Date(order.expiresAt) <= now) {
                        // Skip if subscription is expired
                        continue;
                    }
                }
            }
            filteredAppointments.push(appt);
        }

        res.status(200).json({
            success: true,
            data: filteredAppointments
        });
    } catch (err) {
        next(err);
    }
};

/**
 * POST /api/employee/appointments/:id/checkin
 * Body: { otp, latitude, longitude }
 */
const checkinAppointment = async (req, res, next) => {
    try {
        const { otp, latitude, longitude } = req.body;
        const appointmentId = req.params.id;

        if (!otp) {
            return res.status(400).json({ success: false, message: 'Customer verification OTP is required' });
        }

        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) {
            return res.status(404).json({ success: false, message: 'Appointment not found' });
        }

        // Verify assignment
        if (!appointment.assignedEmployee || appointment.assignedEmployee.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'You are not assigned to this appointment' });
        }

        // Check if already checked in
        if (appointment.status !== 'pending') {
            return res.status(400).json({ success: false, message: `Appointment is already ${appointment.status}` });
        }

        // Check OTP
        if (appointment.otp !== otp.trim()) {
            return res.status(400).json({ success: false, message: 'Incorrect OTP' });
        }

        // Update appointment
        appointment.status = 'checked_in';
        appointment.checkinLocation = {
            latitude: latitude || 0,
            longitude: longitude || 0
        };
        appointment.checkinTime = new Date();
        await appointment.save();

        res.status(200).json({
            success: true,
            message: 'Checked in successfully! Location captured.',
            data: appointment
        });
    } catch (err) {
        next(err);
    }
};

/**
 * POST /api/employee/appointments/:id/complete
 * Mark appointment as completed
 */
const completeAppointment = async (req, res, next) => {
    try {
        const appointmentId = req.params.id;

        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) {
            return res.status(404).json({ success: false, message: 'Appointment not found' });
        }

        // Verify assignment
        if (!appointment.assignedEmployee || appointment.assignedEmployee.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'You are not assigned to this appointment' });
        }

        // Check if status is checked_in
        if (appointment.status !== 'checked_in') {
            return res.status(400).json({ success: false, message: `Appointment status must be checked_in to complete it (current status: ${appointment.status})` });
        }

        // Update appointment status to completed
        appointment.status = 'completed';
        await appointment.save();

        // Daily Check-in Cloning logic
        try {
            const orderIdMatch = appointment.details && appointment.details.match(/Order ID:\s*([a-f\d]{24})/i);
            if (orderIdMatch) {
                const orderId = orderIdMatch[1];
                const order = await Order.findById(orderId);
                if (order && order.status === 'active') {
                    const tomorrow = new Date(appointment.dateTime);
                    tomorrow.setDate(tomorrow.getDate() + 1);

                    const expiresAt = order.expiresAt ? new Date(order.expiresAt) : null;
                    if (!expiresAt || expiresAt > tomorrow) {
                        const todayEnd = new Date();
                        todayEnd.setHours(23, 59, 59, 999);

                        // Check if a future pending appointment already exists for this order
                        const existingFuturePending = await Appointment.findOne({
                            details: { $regex: orderId, $options: 'i' },
                            status: 'pending',
                            dateTime: { $gt: todayEnd }
                        });

                        if (!existingFuturePending) {
                            // Generate new random 6-digit OTP
                            const newOtp = String(Math.floor(100000 + Math.random() * 900000));

                            // Clone the appointment for tomorrow
                            await Appointment.create({
                                customerName: appointment.customerName,
                                customerMobile: appointment.customerMobile,
                                customerAddress: appointment.customerAddress,
                                dateTime: tomorrow,
                                details: appointment.details,
                                assignedEmployee: appointment.assignedEmployee,
                                otp: newOtp,
                                status: 'pending'
                            });
                        }
                    }
                }
            }
        } catch (cloneErr) {
            console.error('Error cloning appointment for tomorrow:', cloneErr);
        }

        res.status(200).json({
            success: true,
            message: 'Appointment completed successfully!',
            data: appointment
        });
    } catch (err) {
        next(err);
    }
};

module.exports = { getAppointments, checkinAppointment, completeAppointment };

