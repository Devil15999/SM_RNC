'use strict';

require('dotenv').config();
const mongoose = require('mongoose');
const Package = require('../models/Package');
const { PACKAGES } = require('../data/packages');

const syncPackages = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected!');

        console.log('Updating Package collection with updated Mother Care, Baby Care, and Mother + Baby Care data...');
        for (const pkgData of Object.values(PACKAGES)) {
            const updated = await Package.findOneAndUpdate(
                { type: pkgData.type },
                { $set: pkgData },
                { upsert: true, new: true }
            );
            console.log(`✅ Synced package: ${updated.type} -> ${updated.title}`);
        }

        console.log('Package database collection successfully updated! 🎉');
        await mongoose.connection.close();
        process.exit(0);
    } catch (err) {
        console.error('Error syncing package DB:', err);
        process.exit(1);
    }
};

syncPackages();
