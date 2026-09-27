'use strict';

const jwt = require('jsonwebtoken');
const OTP = require('../models/OTP');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const Employee = require('../models/Employee');
const { createError } = require('../middleware/errorHandler');
const { saveBase64Image } = require('../utils/uploadHelper');
const Appointment = require('../models/Appointment');
const Order = require('../models/Order');
const { fillVirtualAppointments } = require('../utils/appointmentHelper');

const generateOTP = () => {
    if (process.env.SEND_REAL_OTP !== 'true') {
        return '123456';
    }
    return String(Math.floor(100000 + Math.random() * 900000));
};

const signToken = (userId) =>
    jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '30d',
    });

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
            babies: req.user.babies || [],
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

        // Only show appointments that are assigned to an employee
        const assignedOnly = filledAppointments.filter(appt => appt.assignedEmployee != null);

        res.status(200).json({
            success: true,
            data: assignedOnly
        });
    } catch (err) {
        next(err);
    }
};

/**
 * POST /api/users/change-mobile/send-otp
 * Body: { newMobile }
 * Sends OTP to verify new mobile number
 */
const sendChangeMobileOtp = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { newMobile } = req.body;

        if (newMobile === req.user.mobile) {
            return res.status(400).json({
                success: false,
                message: 'New mobile number cannot be the same as your current mobile number',
            });
        }

        const existingUser = await User.findOne({ mobile: newMobile });
        const existingEmp = await Employee.findOne({ mobile: newMobile });
        if (existingUser || existingEmp) {
            return res.status(409).json({
                success: false,
                message: 'Mobile number is already registered to another account',
            });
        }

        await OTP.deleteMany({ mobile: newMobile, used: false });

        const otp = generateOTP();
        const expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES || '10', 10);

        await OTP.create({
            mobile: newMobile,
            otp,
            expiresAt: new Date(Date.now() + expiryMinutes * 60 * 1000),
        });

        console.log(`📱 [Change Mobile OTP] → ${newMobile}: ${otp}`);

        res.status(200).json({
            success: true,
            message: `OTP sent to +91 ${newMobile}`,
            ...(process.env.NODE_ENV === 'development' && { otp }),
        });
    } catch (err) {
        next(err);
    }
};

/**
 * POST /api/users/change-mobile/verify-otp
 * Body: { newMobile, otp }
 * Verifies OTP and updates user's mobile number
 */
const verifyChangeMobileOtp = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { newMobile, otp } = req.body;

        const otpRecord = await OTP.findOne({ mobile: newMobile, used: false }).sort({ createdAt: -1 });

        if (!otpRecord) {
            return res.status(400).json({ success: false, message: 'No active OTP found. Please request a new one.' });
        }

        if (new Date() > otpRecord.expiresAt) {
            await otpRecord.deleteOne();
            return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
        }

        if (otpRecord.attempts >= 5) {
            await otpRecord.deleteOne();
            return res.status(429).json({ success: false, message: 'Too many incorrect attempts. Please request a new OTP.' });
        }

        if (otpRecord.otp !== otp) {
            otpRecord.attempts += 1;
            await otpRecord.save();
            const remaining = 5 - otpRecord.attempts;
            return res.status(400).json({
                success: false,
                message: `Incorrect OTP. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`,
            });
        }

        await otpRecord.markUsed();

        let updatedUser;
        if (req.user.role === 'employee') {
            updatedUser = await Employee.findByIdAndUpdate(req.user._id, { mobile: newMobile }, { new: true });
        } else {
            updatedUser = await User.findByIdAndUpdate(req.user._id, { mobile: newMobile }, { new: true });
        }

        const token = signToken(updatedUser._id);

        res.status(200).json({
            success: true,
            message: 'Mobile number updated successfully',
            token,
            user: {
                id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                mobile: updatedUser.mobile,
                token,
                role: updatedUser.role,
            },
        });
    } catch (err) {
        next(err);
    }
};

/**
 * POST /api/users/babies
 * Body: { name, age?, dob?, gender? }
 */
const addBaby = async (req, res, next) => {
    try {
        const { name, age, dob, gender } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ success: false, message: 'Baby name is required' });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(440).json({ success: false, message: 'User not found' });
        }

        const newBaby = {
            name: name.trim(),
            age: age ? age.trim() : '',
            dob: dob ? dob.trim() : '',
            gender: gender || '',
        };

        user.babies.push(newBaby);
        await user.save();

        res.status(201).json({
            success: true,
            message: 'Baby details added successfully',
            babies: user.babies,
        });
    } catch (err) {
        next(err);
    }
};

/**
 * PUT /api/users/babies/:babyId
 * Body: { name, age?, dob?, gender? }
 */
const updateBaby = async (req, res, next) => {
    try {
        const { babyId } = req.params;
        const { name, age, dob, gender } = req.body;

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const baby = user.babies.id(babyId);
        if (!baby) {
            return res.status(404).json({ success: false, message: 'Baby details not found' });
        }

        if (name !== undefined) baby.name = name.trim();
        if (age !== undefined) baby.age = age.trim();
        if (dob !== undefined) baby.dob = dob.trim();
        if (gender !== undefined) baby.gender = gender;

        await user.save();

        res.status(200).json({
            success: true,
            message: 'Baby details updated successfully',
            babies: user.babies,
            baby,
        });
    } catch (err) {
        next(err);
    }
};

/**
 * DELETE /api/users/babies/:babyId
 */
const deleteBaby = async (req, res, next) => {
    try {
        const { babyId } = req.params;

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const babyIndex = user.babies.findIndex(b => b._id.toString() === babyId);
        if (babyIndex === -1) {
            return res.status(404).json({ success: false, message: 'Baby details not found' });
        }

        user.babies.splice(babyIndex, 1);
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Baby details deleted successfully',
            babies: user.babies,
        });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getProfile,
    updateProfile,
    getUserAppointments,
    sendChangeMobileOtp,
    verifyChangeMobileOtp,
    addBaby,
    updateBaby,
    deleteBaby,
};

