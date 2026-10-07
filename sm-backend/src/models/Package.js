'use strict';

const mongoose = require('mongoose');

const PlanSchema = new mongoose.Schema({
    key: { type: String, required: true },
    label: { type: String, required: true },
    visitCount: { type: Number, default: 26 },
    hoursPerVisit: { type: Number, default: 3 },
    visitInfo: { type: String },
    price: { type: Number, required: true },
    originalPrice: { type: Number, required: true },
    savings: { type: String },
    badge: { type: String, default: null },
    features: [{ type: String }]
}, { _id: false });

const PackageSchema = new mongoose.Schema({
    type: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    subtitle: { type: String, required: true },
    tagline: { type: String, required: true },
    icon: { type: String, required: true },
    accentColor: { type: String, required: true },
    startingPrice: { type: Number, required: true },
    image: { type: String, default: '' },
    backgroundImage: { type: String, default: '' },
    images: [{ type: String }],
    badge: { type: String, default: null },
    features: [{ type: String }],
    plans: {
        '1month': { type: PlanSchema, required: true },
        '3month': { type: PlanSchema, required: true },
        '6month': { type: PlanSchema, required: true }
    }
}, { timestamps: true });

module.exports = mongoose.model('Package', PackageSchema);
