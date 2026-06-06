'use strict';

const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {});
        console.log(`✅  MongoDB connected: ${conn.connection.host}`);

        // Auto-seed packages if database is empty
        const Package = require('../models/Package');
        const { PACKAGES } = require('../data/packages');
        
        // If legacy schema with emoji exists, clear it for migration
        const sample = await Package.findOne();
        if (sample && sample.toObject().hasOwnProperty('emoji')) {
            console.log('⚠️  Legacy package schema (emoji) detected. Dropping collection...');
            await Package.deleteMany({});
        }

        const count = await Package.countDocuments();
        if (count === 0) {
            console.log('🌿 Seeding packages database from packages catalog file...');
            const docs = Object.values(PACKAGES);
            await Package.insertMany(docs);
            console.log('✅  Packages database seeded successfully!');
        }
    } catch (err) {
        console.error('❌  MongoDB connection error:', err.message);
        process.exit(1);
    }
};

module.exports = connectDB;
