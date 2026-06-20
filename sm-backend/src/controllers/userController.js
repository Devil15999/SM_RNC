'use strict';

const { validationResult } = require('express-validator');
const User = require('../models/User');
const Employee = require('../models/Employee');
const { createError } = require('../middleware/errorHandler');
const { saveBase64Image } = require('../utils/uploadHelper');
const Appointment = require('../models/Appointment');
const Order = require('../models/Order');
const { fillVirtualAppointments } = require('../utils/appointmentHelper');

/**
 * GET /api/users/profile
 * Returns the authenticated user's profile.
 */
const getProfile = async (req, res, next) => {
    try {
        const userObj = {
            id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            mobile: req.user.mobile,
            avatar: req.user.avatar,
            role: req.user.role,
            isVerified: req.user.isVerified,
            createdAt: req.user.createdAt,
        };

        if (req.user.role === 'employee') {
            userObj.occupation = req.user.occupation;
            userObj.address = req.user.address;
            userObj.permanentAddress = req.user.permanentAddress;
            userObj.aadharNumber = req.user.aadharNumber;
            userObj.isVerifiedEmployee = req.user.isVerifiedEmployee;
            userObj.userPhoto = req.user.userPhoto;
            userObj.aadharPhoto = req.user.aadharPhoto;
            userObj.certificatesPhoto = req.user.certificatesPhoto;
        }

        res.status(200).json({
            success: true,
            user: userObj,
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

        const { name, email, avatar, address, permanentAddress, userPhoto, certificatesPhoto } = req.body;
        const updates = {};
        if (name !== undefined) updates.name = name.trim();
        if (email !== undefined) updates.email = email.trim().toLowerCase();
        if (avatar !== undefined) updates.avatar = avatar;
        if (address !== undefined) updates.address = address.trim();
        if (permanentAddress !== undefined) updates.permanentAddress = permanentAddress.trim();

        // Photo updates (employees only)
        if (userPhoto !== undefined) {
            updates.userPhoto = saveBase64Image(userPhoto, 'avatars');
        }
        if (certificatesPhoto !== undefined && Array.isArray(certificatesPhoto)) {
            updates.certificatesPhoto = certificatesPhoto
                .slice(0, 3)
                .filter(Boolean)
                .map(img => saveBase64Image(img, 'certificates'));
        }

        let updatedUser;
        if (req.user.role === 'employee') {
            updatedUser = await Employee.findByIdAndUpdate(req.user._id, updates, {
                new: true,
                runValidators: true,
            });
        } else {
            updatedUser = await User.findByIdAndUpdate(req.user._id, updates, {
                new: true,
                runValidators: true,
            });
        }

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: 'Profile not found' });
        }

        const responseUser = {
            id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            mobile: updatedUser.mobile,
            avatar: updatedUser.avatar,
            role: updatedUser.role,
        };

        if (updatedUser.role === 'employee') {
            responseUser.address = updatedUser.address;
            responseUser.permanentAddress = updatedUser.permanentAddress;
            responseUser.occupation = updatedUser.occupation;
            responseUser.isVerifiedEmployee = updatedUser.isVerifiedEmployee;
            responseUser.userPhoto = updatedUser.userPhoto;
            responseUser.aadharNumber = updatedUser.aadharNumber;
            responseUser.certificatesPhoto = updatedUser.certificatesPhoto;
        }

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            user: responseUser,
        });
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/users/appointments
 * Retrieves appointments for the authenticated customer based on mobile number
 */
const getUserAppointments = async (req, res, next) => {
    try {
        const appointments = await Appointment.find({ customerMobile: req.user.mobile })
            .populate('assignedEmployee', 'name email mobile occupation userPhoto')
            .sort({ dateTime: -1 });

        const filledAppointments = await fillVirtualAppointments(appointments);

        res.status(200).json({
            success: true,
            data: filledAppointments
        });
    } catch (err) {
        next(err);
    }
};

module.exports = { getProfile, updateProfile, getUserAppointments };
