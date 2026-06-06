'use strict';

const express = require('express');
const { body } = require('express-validator');
const { createAddress, getAddresses, getAddress, updateAddress, deleteAddress } = require('../controllers/addressController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All address routes are protected
router.use(protect);

const addressValidators = [
    body('fullName').trim().notEmpty().withMessage('Full name is required'),
    body('mobile').trim().matches(/^\d{10}$/).withMessage('Enter a valid 10-digit mobile'),
    body('flatNo').trim().notEmpty().withMessage('Flat/House No is required'),
    body('street').trim().notEmpty().withMessage('Street/Locality is required'),
    body('city').trim().notEmpty().withMessage('City is required'),
    body('state').trim().notEmpty().withMessage('State is required'),
    body('pincode').trim().matches(/^\d{6}$/).withMessage('Enter a valid 6-digit pincode'),
];

/**
 * @route   POST /api/addresses
 * @desc    Save a new address
 */
router.post('/', addressValidators, createAddress);

/**
 * @route   GET /api/addresses
 * @desc    Get all addresses for the logged-in user
 */
router.get('/', getAddresses);

/**
 * @route   GET /api/addresses/:id
 * @desc    Get a single address
 */
router.get('/:id', getAddress);

/**
 * @route   PUT /api/addresses/:id
 * @desc    Update an address
 */
router.put('/:id', addressValidators, updateAddress);

/**
 * @route   DELETE /api/addresses/:id
 * @desc    Delete an address
 */
router.delete('/:id', deleteAddress);

module.exports = router;
