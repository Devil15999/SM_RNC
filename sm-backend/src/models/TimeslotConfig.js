'use strict';

const mongoose = require('mongoose');

const timeslotConfigSchema = new mongoose.Schema(
    {
        slot: {
            type: String,
            required: true,
            enum: ['morning', 'afternoon', 'evening'],
            unique: true,
        },
        times: {
            type: [String],
            default: [],
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('TimeslotConfig', timeslotConfigSchema);
