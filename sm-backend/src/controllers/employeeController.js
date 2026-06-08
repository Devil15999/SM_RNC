'use strict';

const Appointment = require('../models/Appointment');

/**
 * GET /api/employee/appointments
 * Retrieves all appointments assigned to the logged-in employee
 */
const getAppointments = async (req, res, next) => {
    try {
        const appointments = await Appointment.find({ assignedEmployee: req.user._id })
            .sort({ dateTime: 1 });

        res.status(200).json({
            success: true,
            data: appointments
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

module.exports = { getAppointments, checkinAppointment };
