'use strict';

const express = require('express');
const { getTimeslots } = require('../controllers/timeslotsController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Allow authenticated users to fetch timeslots
router.get('/', protect, getTimeslots);

module.exports = router;
