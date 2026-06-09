'use strict';

const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        // Package details
        packageType: {
            type: String,
            required: true,
            enum: ['mother', 'baby', 'muma'],
        },
        packageTitle: {
            type: String,
            required: true,
        },
        planKey: {
            type: String,
            required: true,
            enum: ['1month', '3month', '6month'],
        },
        planLabel: {
            type: String,
            required: true,
        },
        price: {
            type: Number,
            required: true,
        },
        icon: {
            type: String,
            default: '',
        },
        accentColor: {
            type: String,
            default: '#E91E8A',
        },
        // Delivery / Billing address (snapshot at time of order)
        address: {
            fullName: { type: String, required: true },
            mobile:   { type: String, required: true },
            flatNo:   { type: String, required: true },
            street:   { type: String, required: true },
            city:     { type: String, required: true },
            state:    { type: String, required: true },
            pincode:  { type: String, required: true },
        },
        // Booking / Appointment Details
        motherName: {
            type: String,
            default: '',
        },
        motherAge: {
            type: String,
            default: '',
        },
        babyName: {
            type: String,
            default: '',
        },
        babyAge: {
            type: String,
            default: '',
        },
        startDate: {
            type: Date,
            default: null,
        },
        timeSlot: {
            type: String,
            enum: ['morning', 'afternoon', 'evening', ''],
            default: '',
        },
        selectedTime: {
            type: String,
            default: '',
        },
        // Payment
        paymentStatus: {
            type: String,
            enum: ['pending', 'processing', 'success', 'failed', 'refunded'],
            default: 'pending',
        },
        transactionId: {
            type: String,
            default: null,
        },
        // Subscription window
        activatedAt: {
            type: Date,
            default: null,
        },
        expiresAt: {
            type: Date,
            default: null,
        },
        // Overall order status
        status: {
            type: String,
            enum: ['created', 'active', 'completed', 'cancelled'],
            default: 'created',
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
