'use strict';

const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {});
        console.log(`✅  MongoDB connected: ${conn.connection.host}`);

        // Sync / Seed packages database to match latest package catalog
        const Package = require('../models/Package');
        const { PACKAGES } = require('../data/packages');
        
        // Seed default packages catalogue if not already present in database
        for (const pkgData of Object.values(PACKAGES)) {
            await Package.findOneAndUpdate(
                { type: pkgData.type },
                { $setOnInsert: pkgData },
                { upsert: true, new: true }
            );
        }
        console.log('✅  Packages catalogue verified successfully!');

    } catch (err) {
        console.error('❌  MongoDB connection error:', err.message);
        process.exit(1);
    }
};

module.exports = connectDB;
