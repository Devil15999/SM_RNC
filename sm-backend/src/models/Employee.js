'use strict';

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const employeeSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            trim: true,
            default: '',
        },
        email: {
            type: String,
            lowercase: true,
            trim: true,
            default: '',
        },
        mobile: {
            type: String,
            required: [true, 'Mobile number is required'],
            unique: true,
            trim: true,
            match: [/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'],
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
        role: {
            type: String,
            default: 'employee',
        },
        password: {
            type: String,
            select: false,
        },
        occupation: {
            type: String,
            default: '',
        },
        address: {
            type: String,
            default: '',
        },
        permanentAddress: {
            type: String,
            required: [true, 'Permanent address is required'],
            trim: true,
        },
        aadharNumber: {
            type: String,
            default: '',
        },
        aadharPhoto: {
            type: String,
            default: '',
        },
        userPhoto: {
            type: String,
            default: '',
        },
        certificatesPhoto: {
            type: String,
            default: '',
        },
        isVerifiedEmployee: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

// Hash password before saving if it is modified
employeeSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) {
        next(err);
    }
});

// Compare password candidate with hashed password
employeeSchema.methods.comparePassword = async function (candidatePassword) {
    if (!this.password) return false;
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Employee', employeeSchema);
