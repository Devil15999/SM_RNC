'use strict';

const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
    {
        order: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order',
            required: true,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        transactionId: {
            type: String,
            required: true,
            unique: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        currency: {
            type: String,
            default: 'INR',
        },
        // UPI details
        upiId: {
            type: String,
            default: '',
        },
        upiRef: {
            type: String,
            default: '',
        },
        // Status lifecycle
        status: {
            type: String,
            enum: ['initiated', 'pending', 'success', 'failed', 'refunded'],
            default: 'initiated',
        },
        // Raw gateway response (for debugging / audit)
        gatewayResponse: {
            type: mongoose.Schema.Types.Mixed,
            default: null,
        },
        paidAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
