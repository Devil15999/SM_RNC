'use strict';

const mongoose = require('mongoose');

const pincodeRequestSchema = new mongoose.Schema({
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: false 
    },
    mobile: { 
        type: String, 
        required: [true, 'Mobile number is required'], 
        trim: true,
        match: [/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number']
    },
    pincode: { 
        type: String, 
        required: [true, 'Pincode is required'], 
        trim: true,
        match: [/^\d{6}$/, 'Enter a valid 6-digit pincode']
    }
}, { timestamps: true });

module.exports = mongoose.model('PincodeRequest', pincodeRequestSchema);
