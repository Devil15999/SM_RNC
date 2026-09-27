'use strict';

const express = require('express');
const { body } = require('express-validator');
const { getProfile, updateProfile, getUserAppointments, sendChangeMobileOtp, verifyChangeMobileOtp, addBaby, updateBaby, deleteBaby } = require('../controllers/userController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All user routes are protected
router.use(protect);

/**
 * @route   GET /api/users/profile
 * @desc    Get authenticated user's profile
 * @access  Protected
 */
router.get('/profile', getProfile);

/**
 * @route   GET /api/users/appointments
 * @desc    Get authenticated user's appointments list
 * @access  Protected
 */
router.get('/appointments', getUserAppointments);

/**
 * @route   PUT /api/users/profile
 * @desc    Update authenticated user's profile
 * @access  Protected
 */
router.put(
    '/profile',
    [
        body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
        body('email').optional().trim().isEmail().withMessage('Enter a valid email'),
        body('avatar').optional().isURL().withMessage('Avatar must be a valid URL'),
    ],
    updateProfile
);

/**
 * @route   POST /api/users/change-mobile/send-otp
 * @desc    Send OTP to new mobile number
 * @access  Protected
 */
router.post(
    '/change-mobile/send-otp',
    [
        body('newMobile')
            .trim()
            .matches(/^[6-9]\d{9}$/)
            .withMessage('Enter a valid 10-digit Indian mobile number'),
    ],
    sendChangeMobileOtp
);

/**
 * @route   POST /api/users/change-mobile/verify-otp
 * @desc    Verify OTP and update user's mobile number
 * @access  Protected
 */
router.post(
    '/change-mobile/verify-otp',
    [
        body('newMobile')
            .trim()
            .matches(/^[6-9]\d{9}$/)
            .withMessage('Enter a valid 10-digit Indian mobile number'),
        body('otp')
            .isLength({ min: 6, max: 6 })
            .isNumeric()
            .withMessage('OTP must be exactly 6 digits'),
    ],
    verifyChangeMobileOtp
);

/**
 * @route   POST /api/users/babies
 * @desc    Add baby details
 * @access  Protected
 */
router.post(
    '/babies',
    [body('name').trim().notEmpty().withMessage('Baby name is required')],
    addBaby
);

/**
 * @route   PUT /api/users/babies/:babyId
 * @desc    Edit baby details
 * @access  Protected
 */
router.put(
    '/babies/:babyId',
    [body('name').optional().trim().notEmpty().withMessage('Baby name cannot be empty')],
    updateBaby
);

/**
 * @route   DELETE /api/users/babies/:babyId
 * @desc    Delete baby details
 * @access  Protected
 */
router.delete('/babies/:babyId', deleteBaby);

module.exports = router;
