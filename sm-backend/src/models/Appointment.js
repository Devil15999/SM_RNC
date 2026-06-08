'use strict';

const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
    {
        customerName: {
            type: String,
            required: [true, 'Customer name is required'],
            trim: true,
        },
        customerMobile: {
            type: String,
            required: [true, 'Customer mobile number is required'],
            trim: true,
        },
        customerAddress: {
            type: String,
            required: [true, 'Customer address is required'],
            trim: true,
        },
        dateTime: {
            type: Date,
            required: [true, 'Appointment date and time is required'],
        },
        details: {
            type: String,
            default: '',
        },
        status: {
            type: String,
            enum: ['pending', 'checked_in', 'completed'],
            default: 'pending',
        },
        assignedEmployee: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Employee',
            default: null,
        },
        otp: {
            type: String,
            required: true,
        },
        checkinLocation: {
            latitude: { type: Number, default: null },
            longitude: { type: Number, default: null },
        },
        checkinTime: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Appointment', appointmentSchema);
