'use strict';

const { validationResult } = require('express-validator');
const Address = require('../models/Address');
const { createError } = require('../middleware/errorHandler');

/**
 * POST /api/addresses
 * Creates a new address for the logged-in user.
 */
const createAddress = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { fullName, mobile, flatNo, street, city, state, pincode, isDefault } = req.body;

        // If marked as default, unset other defaults for this user
        if (isDefault) {
            await Address.updateMany({ user: req.user._id }, { isDefault: false });
        }

        const address = await Address.create({
            user: req.user._id,
            fullName, mobile, flatNo, street, city, state, pincode,
            isDefault: isDefault || false,
        });

        res.status(201).json({ success: true, message: 'Address saved', data: address });
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/addresses
 * Returns all saved addresses for the logged-in user.
 */
const getAddresses = async (req, res, next) => {
    try {
        const addresses = await Address.find({ user: req.user._id }).sort({ isDefault: -1, createdAt: -1 });
        res.status(200).json({ success: true, count: addresses.length, data: addresses });
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/addresses/:id
 * Returns a single address (must belong to the logged-in user).
 */
const getAddress = async (req, res, next) => {
    try {
        const address = await Address.findOne({ _id: req.params.id, user: req.user._id });
        if (!address) {
            return res.status(404).json({ success: false, message: 'Address not found' });
        }
        res.status(200).json({ success: true, data: address });
    } catch (err) {
        next(err);
    }
};

/**
 * PUT /api/addresses/:id
 * Updates an address (must belong to the logged-in user).
 */
const updateAddress = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { fullName, mobile, flatNo, street, city, state, pincode, isDefault } = req.body;

        if (isDefault) {
            await Address.updateMany({ user: req.user._id }, { isDefault: false });
        }

        const address = await Address.findOneAndUpdate(
            { _id: req.params.id, user: req.user._id },
            { fullName, mobile, flatNo, street, city, state, pincode, isDefault },
            { new: true, runValidators: true }
        );

        if (!address) {
            return res.status(404).json({ success: false, message: 'Address not found' });
        }

        res.status(200).json({ success: true, message: 'Address updated', data: address });
    } catch (err) {
        next(err);
    }
};

/**
 * DELETE /api/addresses/:id
 * Deletes an address (must belong to the logged-in user).
 */
const deleteAddress = async (req, res, next) => {
    try {
        const address = await Address.findOneAndDelete({ _id: req.params.id, user: req.user._id });
        if (!address) {
            return res.status(404).json({ success: false, message: 'Address not found' });
        }
        res.status(200).json({ success: true, message: 'Address deleted' });
    } catch (err) {
        next(err);
    }
};

module.exports = { createAddress, getAddresses, getAddress, updateAddress, deleteAddress };
