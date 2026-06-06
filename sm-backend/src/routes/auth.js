'use strict';

const express = require('express');
const { body } = require('express-validator');
const { sendOtp, register, verifyOtp, logout, resendOtp, adminLogin } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Validators
const mobileValidator = body('mobile')
    .trim()
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Enter a valid 10-digit Indian mobile number');

const otpValidator = body('otp')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be exactly 6 digits')
    .isNumeric()
    .withMessage('OTP must contain only digits');

/**
 * @route   POST /api/auth/send-otp
 * @desc    Send OTP to mobile (login flow)
 * @access  Public
 */
router.post('/send-otp', [mobileValidator], sendOtp);

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user and send OTP
 * @access  Public
 */
router.post(
    '/register',
    [
        body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
        body('email').trim().isEmail().withMessage('Enter a valid email address'),
        mobileValidator,
    ],
    register
);

/**
 * @route   POST /api/auth/verify-otp
 * @desc    Verify OTP — returns JWT + user (login & register share this)
 * @access  Public
 */
router.post('/verify-otp', [mobileValidator, otpValidator], verifyOtp);

/**
 * @route   POST /api/auth/resend-otp
 * @desc    Resend a fresh OTP to mobile
 * @access  Public
 */
router.post('/resend-otp', [mobileValidator], resendOtp);

/**
 * @route   POST /api/auth/admin-login
 * @desc    Login admin using email or mobile and password
 * @access  Public
 */
router.post(
    '/admin-login',
    [
        body('identifier').trim().notEmpty().withMessage('Email or mobile number is required'),
        body('password').notEmpty().withMessage('Password is required')
    ],
    adminLogin
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout (semantic; client must discard the JWT)
 * @access  Protected
 */
router.post('/logout', protect, logout);

module.exports = router;
