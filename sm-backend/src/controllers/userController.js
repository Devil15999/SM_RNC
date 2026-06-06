'use strict';

const { validationResult } = require('express-validator');
const User = require('../models/User');
const { createError } = require('../middleware/errorHandler');

/**
 * GET /api/users/profile
 * Returns the authenticated user's profile.
 */
const getProfile = async (req, res, next) => {
    try {
        res.status(200).json({
            success: true,
            user: {
                id: req.user._id,
                name: req.user.name,
                email: req.user.email,
                mobile: req.user.mobile,
                avatar: req.user.avatar,
                isVerified: req.user.isVerified,
                createdAt: req.user.createdAt,
            },
        });
    } catch (err) {
        next(err);
    }
};

/**
 * PUT /api/users/profile
 * Body: { name?, email?, avatar? }
 * Updates the authenticated user's profile.
 */
const updateProfile = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { name, email, avatar } = req.body;
        const updates = {};
        if (name !== undefined) updates.name = name.trim();
        if (email !== undefined) updates.email = email.trim().toLowerCase();
        if (avatar !== undefined) updates.avatar = avatar;

        const user = await User.findByIdAndUpdate(req.user._id, updates, {
            new: true,
            runValidators: true,
        });

        res.status(200).json({
            success: true,
            message: 'Profile updated',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                mobile: user.mobile,
                avatar: user.avatar,
            },
        });
    } catch (err) {
        next(err);
    }
};

module.exports = { getProfile, updateProfile };
