'use strict';

const express = require('express');
const { body } = require('express-validator');
const { getProfile, updateProfile } = require('../controllers/userController');
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

module.exports = router;
