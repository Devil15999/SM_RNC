'use strict';

const express = require('express');
const { getAllPackages, getPackageByType, getPlanByKey, checkPincode } = require('../controllers/packageController');

const router = express.Router();

/**
 * @route   GET /api/packages
 * @desc    Get all packages (summary list — for Home screen)
 * @access  Public
 */
router.get('/', getAllPackages);

/**
 * @route   GET /api/packages/:type
 * @desc    Get full package detail with all plans
 * @access  Public
 * @param   type  mother | baby | muma
 */
router.get('/:type', getPackageByType);

/**
 * @route   GET /api/packages/:type/plans/:planKey
 * @desc    Get a single plan within a package
 * @access  Public
 * @param   type     mother | baby | muma
 * @param   planKey  1month | 3month | 6month
 */
router.get('/:type/plans/:planKey', getPlanByKey);

/**
 * @route   POST /api/packages/check-pincode
 * @desc    Verify pincode and log request leads if not serviceable
 * @access  Public
 */
router.post('/check-pincode', checkPincode);

module.exports = router;
