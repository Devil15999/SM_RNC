'use strict';

const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema(
    {
        mobile: {
            type: String,
            required: true,
            trim: true,
        },
        otp: {
            type: String,
            required: true,
        },
        expiresAt: {
            type: Date,
            required: true,
        },
        used: {
            type: Boolean,
            default: false,
        },
        // How many times the user attempted to verify this OTP
        attempts: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

// Auto-delete expired OTPs from MongoDB
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Mark OTP as used and save
otpSchema.methods.markUsed = function () {
    this.used = true;
    return this.save();
};

module.exports = mongoose.model('OTP', otpSchema);
