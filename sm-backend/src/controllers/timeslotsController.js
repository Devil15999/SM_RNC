'use strict';

const TimeslotConfig = require('../models/TimeslotConfig');

// Helper: Seed default slots if not in DB
const seedDefaultTimeslots = async () => {
    const defaults = [
        { slot: 'morning', times: ['08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM'] },
        { slot: 'afternoon', times: ['12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM'] },
        { slot: 'evening', times: ['04:00 PM', '05:00 PM', '06:00 PM', '07:00 PM'] }
    ];
    for (const item of defaults) {
        const existing = await TimeslotConfig.findOne({ slot: item.slot });
        if (!existing) {
            await TimeslotConfig.create(item);
        }
    }
};

/**
 * GET /api/timeslots
 * Fetch all slot times configuration (seeded if empty).
 */
const getTimeslots = async (req, res, next) => {
    try {
        await seedDefaultTimeslots();
        const slots = await TimeslotConfig.find();
        
        // Format as a simple object for easy consumption on client: { morning: [...], afternoon: [...], evening: [...] }
        const formatted = { morning: [], afternoon: [], evening: [] };
        slots.forEach(s => {
            if (formatted[s.slot] !== undefined) {
                formatted[s.slot] = s.times;
            }
        });

        res.status(200).json({
            success: true,
            data: formatted
        });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getTimeslots,
    seedDefaultTimeslots
};
