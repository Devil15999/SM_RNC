'use strict';

const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const Employee = require('../models/Employee');
const OTP = require('../models/OTP');
const { createError } = require('../middleware/errorHandler');
const { saveBase64Image } = require('../utils/uploadHelper');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const generateOTP = () => {
    // In dev mode always return 123456 so you can test without an SMS gateway
    if (process.env.SEND_REAL_OTP !== 'true') {
        return '123456';
    }
    return String(Math.floor(100000 + Math.random() * 900000));
};

const signToken = (userId) =>
    jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '30d',
    });

const sendOTPViaSMS = async (mobile, otp) => {
    // TODO: Integrate a real SMS gateway (Twilio / MSG91 / Fast2SMS) here.
    // For now we just log the OTP to the console.
    console.log(`📱 [OTP] → ${mobile}: ${otp}`);
};

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * POST /api/auth/send-otp
 * Body: { mobile: "9876543210" }
 *
 * Sends a 6-digit OTP to the given mobile number.
 * Works for both login (user exists) and pre-registration (new user).
 */
const sendOtp = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { mobile } = req.body;

        // Invalidate any previous unused OTPs for this mobile
        await OTP.deleteMany({ mobile, used: false });

        const otp = generateOTP();
        const expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES || '10', 10);

        await OTP.create({
            mobile,
            otp,
            expiresAt: new Date(Date.now() + expiryMinutes * 60 * 1000),
        });

        await sendOTPViaSMS(mobile, otp);

        res.status(200).json({
            success: true,
            message: `OTP sent to +91 ${mobile}`,
            // Expose OTP only in development
            ...(process.env.NODE_ENV === 'development' && { otp }),
        });
    } catch (err) {
        next(err);
    }
};

/**
 * POST /api/auth/register
 * Body: { name, email, mobile }
 *
 * Creates (or finds) the user record, then sends an OTP.
 * The JWT is issued after OTP verification, not here.
 */
const register = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { name, email, mobile } = req.body;

        // Check if mobile is already registered and verified
        const existing = await User.findOne({ mobile });
        if (existing && existing.isVerified) {
            return res.status(409).json({
                success: false,
                message: 'Mobile number already registered. Please log in instead.',
            });
        }

        // Upsert: create the user shell (unverified) or update details
        await User.findOneAndUpdate(
            { mobile },
            { name: name.trim(), email: email.trim().toLowerCase(), mobile },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        // Send OTP
        await OTP.deleteMany({ mobile, used: false });
        const otp = generateOTP();
        const expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES || '10', 10);
        await OTP.create({
            mobile,
            otp,
            expiresAt: new Date(Date.now() + expiryMinutes * 60 * 1000),
        });
        await sendOTPViaSMS(mobile, otp);

        res.status(200).json({
            success: true,
            message: `OTP sent to +91 ${mobile}. Please verify to complete registration.`,
            ...(process.env.NODE_ENV === 'development' && { otp }),
        });
    } catch (err) {
        next(err);
    }
};

/**
 * POST /api/auth/verify-otp
 * Body: { mobile, otp, name?, email? }
 *
 * Verifies the OTP and returns a JWT + user object.
 * Used for both Login and Register flows.
 */
const verifyOtp = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { mobile, otp } = req.body;

        const otpRecord = await OTP.findOne({ mobile, used: false }).sort({ createdAt: -1 });

        if (!otpRecord) {
            return res.status(400).json({ success: false, message: 'No active OTP found. Please request a new one.' });
        }

        // Check expiry
        if (new Date() > otpRecord.expiresAt) {
            await otpRecord.deleteOne();
            return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
        }

        // Max attempts guard (prevent brute-force)
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

        // OTP matched — mark used
        await otpRecord.markUsed();

        // Find or create the user (checking Employee first, then User)
        let user = await Employee.findOne({ mobile });
        if (!user) {
            user = await User.findOne({ mobile });
            if (!user) {
                user = await User.create({ mobile });
            }
        }
        user.isVerified = true;
        await user.save();

        const token = signToken(user._id);

        res.status(200).json({
            success: true,
            message: 'OTP verified successfully',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                mobile: user.mobile,
                token,
                role: user.role,
                occupation: user.occupation,
                address: user.address,
                permanentAddress: user.permanentAddress,
                userPhoto: user.userPhoto,
                isVerifiedEmployee: user.isVerifiedEmployee,
                aadharNumber: user.aadharNumber,
            },
        });
    } catch (err) {
        next(err);
    }
};

/**
 * POST /api/auth/logout
 * Protected – just a semantic endpoint (JWT is stateless; client drops the token).
 */
const logout = async (req, res) => {
    res.status(200).json({ success: true, message: 'Logged out successfully' });
};

/**
 * POST /api/auth/resend-otp
 * Body: { mobile }
 */
const resendOtp = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { mobile } = req.body;

        await OTP.deleteMany({ mobile, used: false });
        const otp = generateOTP();
        const expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES || '10', 10);
        await OTP.create({
            mobile,
            otp,
            expiresAt: new Date(Date.now() + expiryMinutes * 60 * 1000),
        });
        await sendOTPViaSMS(mobile, otp);

        res.status(200).json({
            success: true,
            message: `OTP resent to +91 ${mobile}`,
            ...(process.env.NODE_ENV === 'development' && { otp }),
        });
    } catch (err) {
        next(err);
    }
};

/**
 * POST /api/auth/admin-login
 * Body: { identifier, password }
 *
 * Verifies admin credentials (email or mobile + password) and returns a JWT.
 */
const adminLogin = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { identifier, password } = req.body;
        if (!identifier || !password) {
            return res.status(400).json({ success: false, message: 'Identifier and password are required' });
        }
        
        const trimmedIdentifier = identifier.trim();
        const query = trimmedIdentifier.includes('@')
            ? { email: trimmedIdentifier.toLowerCase() }
            : { mobile: trimmedIdentifier };

        const user = await User.findOne(query).select('+password');

        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        if (user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Access denied: Not an administrator' });
        }

        if (!user.password) {
            return res.status(401).json({ success: false, message: 'Password is not set for this admin account' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const token = signToken(user._id);

        res.status(200).json({
            success: true,
            message: 'Logged in successfully',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                mobile: user.mobile,
                role: user.role
            }
        });
    } catch (err) {
        next(err);
    }
};

/**
 * POST /api/auth/employee/register
 * Body: { name, email, mobile, password, address, occupation, aadharNumber, aadharPhoto, userPhoto, certificatesPhoto }
 */
const employeeRegister = async (req, res, next) => {
    try {
        const { name, email, mobile, password, address, permanentAddress, occupation, aadharNumber, aadharPhoto, userPhoto, certificatesPhoto } = req.body;

        if (!mobile || !password || !name || !email || !permanentAddress || !occupation || !aadharNumber || !aadharPhoto || !userPhoto) {
            return res.status(400).json({ success: false, message: 'All mandatory fields (including Permanent Address) and photos are required' });
        }

        // Check if employee already exists
        const existing = await Employee.findOne({ mobile });
        if (existing && existing.isVerified) {
            return res.status(409).json({
                success: false,
                message: 'Mobile number already registered. Please log in.',
            });
        }

        // Process images for DB storage as base64 data URIs
        const aadharPhotoUrl = saveBase64Image(aadharPhoto, 'aadhar');
        const userPhotoUrl = saveBase64Image(userPhoto, 'avatars');

        // certificatesPhoto may be sent as an array of up to 3 base64 strings
        let certificatesPhotoUrls = [];
        if (Array.isArray(certificatesPhoto)) {
            certificatesPhotoUrls = certificatesPhoto
                .slice(0, 3)
                .filter(Boolean)
                .map(img => saveBase64Image(img, 'certificates'));
        } else if (certificatesPhoto) {
            // Legacy: single string fallback
            certificatesPhotoUrls = [saveBase64Image(certificatesPhoto, 'certificates')];
        }

        // Upsert or create employee shell
        const employeeData = {
            name: name.trim(),
            email: email.trim().toLowerCase(),
            mobile,
            password, // Pre-save hook will hash this!
            role: 'employee',
            occupation: occupation.trim(),
            address: address ? address.trim() : '',
            permanentAddress: permanentAddress.trim(),
            aadharNumber: aadharNumber.trim(),
            aadharPhoto: aadharPhotoUrl,
            userPhoto: userPhotoUrl,
            certificatesPhoto: certificatesPhotoUrls,
            isVerifiedEmployee: false, // Must be approved by admin
            isVerified: false // Mobile OTP verification pending
        };

        let user = await Employee.findOne({ mobile });
        if (user) {
            user.name = name.trim();
            user.email = email.trim().toLowerCase();
            user.password = password;
            user.role = 'employee';
            user.occupation = occupation.trim();
            user.address = address ? address.trim() : '';
            user.permanentAddress = permanentAddress.trim();
            user.aadharNumber = aadharNumber.trim();
            user.aadharPhoto = aadharPhotoUrl;
            user.userPhoto = userPhotoUrl;
            user.certificatesPhoto = certificatesPhotoUrls;
            user.isVerifiedEmployee = false;
            user.isVerified = false;
            await user.save();
        } else {
            await Employee.create(employeeData);
        }

        // Send OTP
        await OTP.deleteMany({ mobile, used: false });
        const otp = generateOTP();
        const expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES || '10', 10);
        await OTP.create({
            mobile,
            otp,
            expiresAt: new Date(Date.now() + expiryMinutes * 60 * 1000),
        });
        await sendOTPViaSMS(mobile, otp);

        res.status(200).json({
            success: true,
            message: `OTP sent to +91 ${mobile}. Please verify to complete registration.`,
            ...(process.env.NODE_ENV === 'development' && { otp }),
        });
    } catch (err) {
        next(err);
    }
};

/**
 * POST /api/auth/employee/login
 * Body: { mobile, password }
 */
const employeeLogin = async (req, res, next) => {
    try {
        const { mobile, password } = req.body;
        if (!mobile || !password) {
            return res.status(400).json({ success: false, message: 'Mobile and password are required' });
        }

        const user = await Employee.findOne({ mobile }).select('+password');
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        if (user.role !== 'employee') {
            return res.status(403).json({ success: false, message: 'Access denied: Not an employee account' });
        }

        // Check if mobile OTP was verified
        if (!user.isVerified) {
            return res.status(403).json({ success: false, message: 'Mobile number not verified' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const token = signToken(user._id);

        res.status(200).json({
            success: true,
            message: 'Logged in successfully',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                mobile: user.mobile,
                role: user.role,
                occupation: user.occupation,
                address: user.address,
                permanentAddress: user.permanentAddress,
                userPhoto: user.userPhoto,
                isVerifiedEmployee: user.isVerifiedEmployee
            }
        });
    } catch (err) {
        next(err);
    }
};

/**
 * POST /api/auth/employee/forgot-password
 * Body: { mobile }
 */
const employeeForgotPassword = async (req, res, next) => {
    try {
        const { mobile } = req.body;
        if (!mobile) {
            return res.status(400).json({ success: false, message: 'Mobile number is required' });
        }

        const user = await Employee.findOne({ mobile });
        if (!user) {
            return res.status(404).json({ success: false, message: 'No employee account found with this mobile number' });
        }

        // Send OTP
        await OTP.deleteMany({ mobile, used: false });
        const otp = generateOTP();
        const expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES || '10', 10);
        await OTP.create({
            mobile,
            otp,
            expiresAt: new Date(Date.now() + expiryMinutes * 60 * 1000),
        });
        await sendOTPViaSMS(mobile, otp);

        res.status(200).json({
            success: true,
            message: `OTP sent to +91 ${mobile}`,
            ...(process.env.NODE_ENV === 'development' && { otp }),
        });
    } catch (err) {
        next(err);
    }
};

/**
 * POST /api/auth/employee/reset-password
 * Body: { mobile, otp, newPassword }
 */
const employeeResetPassword = async (req, res, next) => {
    try {
        const { mobile, otp, newPassword } = req.body;
        if (!mobile || !otp || !newPassword) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        // Verify OTP
        const otpRecord = await OTP.findOne({ mobile, used: false }).sort({ createdAt: -1 });
        if (!otpRecord) {
            return res.status(400).json({ success: false, message: 'No active OTP found. Please request a new one.' });
        }

        if (new Date() > otpRecord.expiresAt) {
            await otpRecord.deleteOne();
            return res.status(400).json({ success: false, message: 'OTP has expired.' });
        }

        if (otpRecord.otp !== otp) {
            return res.status(400).json({ success: false, message: 'Incorrect OTP.' });
        }

        await otpRecord.markUsed();

        const user = await Employee.findOne({ mobile });
        if (!user) {
            return res.status(404).json({ success: false, message: 'Employee not found.' });
        }

        user.password = newPassword;
        user.isVerified = true; // Mark verified if it wasn't
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Password reset successfully. Please log in with your new password.',
        });
    } catch (err) {
        next(err);
    }
};

module.exports = { sendOtp, register, verifyOtp, logout, resendOtp, adminLogin, employeeRegister, employeeLogin, employeeForgotPassword, employeeResetPassword };
