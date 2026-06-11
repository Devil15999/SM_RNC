'use strict';

const mongoose = require('mongoose');

const serviceablePincodeSchema = new mongoose.Schema({
    pincode: { 
        type: String, 
        required: [true, 'Pincode is required'], 
        unique: true, 
        trim: true,
        match: [/^\d{6}$/, 'Enter a valid 6-digit pincode']
    }
}, { timestamps: true });

module.exports = mongoose.model('ServiceablePincode', serviceablePincodeSchema);
