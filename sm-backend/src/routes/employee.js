'use strict';

const express = require('express');
const { getAppointments, checkinAppointment, completeAppointment } = require('../controllers/employeeController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Middleware to restrict access to employees only
const employeeOnly = (req, res, next) => {
    if (req.user && req.user.role === 'employee') {
        next();
    } else {
        return res.status(403).json({ success: false, message: 'Access denied: Employees only' });
    }
};

// Protect all routes below
router.use(protect, employeeOnly);

/**
 * @route   GET /api/employee/appointments
 * @desc    Get appointments assigned to logged-in employee
 * @access  Private (Employee)
 */
router.get('/appointments', getAppointments);

/**
 * @route   POST /api/employee/appointments/:id/checkin
 * @desc    Verify customer OTP and check-in with GPS location
 * @access  Private (Employee)
 */
router.post('/appointments/:id/checkin', checkinAppointment);

/**
 * @route   POST /api/employee/appointments/:id/complete
 * @desc    Mark appointment as completed
 * @access  Private (Employee)
 */
router.post('/appointments/:id/complete', completeAppointment);

module.exports = router;
