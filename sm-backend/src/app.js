'use strict';

require('dotenv').config();

const express    = require('express');
const cors       = require('cors');
const morgan     = require('morgan');
const rateLimit  = require('express-rate-limit');


const connectDB        = require('./config/db');
const { errorHandler } = require('./middleware/errorHandler');

// ── Route imports ──────────────────────────────────────────────────────────────
const authRoutes     = require('./routes/auth');
const userRoutes     = require('./routes/users');
const packageRoutes  = require('./routes/packages');
const addressRoutes  = require('./routes/addresses');
const orderRoutes    = require('./routes/orders');
const paymentRoutes  = require('./routes/payments');
const adminRoutes    = require('./routes/admin');
const employeeRoutes = require('./routes/employee');

// ── Connect to DB ──────────────────────────────────────────────────────────────
connectDB();

const app = express();

// ── Global middleware ──────────────────────────────────────────────────────────

// CORS — allow React Native app (in dev: any origin)
app.use(
    cors({
        origin: '*',          // Tighten this in production to your app domain
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    })
);

// Request logging
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// JSON body parser (10 mb limit)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));


// ── Rate limiter (global) ──────────────────────────────────────────────────────
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests — please try again later' },
});
app.use('/api', limiter);

// Stricter limiter for OTP endpoints
const otpLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,  // 10 minutes
    max: 5,                     // max 5 OTP sends per 10 min per IP
    message: { success: false, message: 'Too many OTP requests — try again after 10 minutes' },
});
app.use('/api/auth/send-otp', otpLimiter);
app.use('/api/auth/resend-otp', otpLimiter);

// ── Health check ───────────────────────────────────────────────────────────────
app.get('/health', (_req, res) =>
    res.status(200).json({
        success: true,
        message: 'SecondMuma API is running 🚀',
        env: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
    })
);

// ── API Routes ─────────────────────────────────────────────────────────────────
app.use('/api/auth',      authRoutes);
app.use('/api/users',     userRoutes);
app.use('/api/packages',  packageRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/orders',    orderRoutes);
app.use('/api/payments',  paymentRoutes);
app.use('/api/admin',     adminRoutes);
app.use('/api/employee',  employeeRoutes);


// ── 404 handler ────────────────────────────────────────────────────────────────
app.use((_req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
});

// ── Global error handler (must be last) ───────────────────────────────────────
app.use(errorHandler);

// ── Start server ───────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`\n🚀  SecondMuma API running on http://localhost:${PORT}`);
    console.log(`🌿  Environment : ${process.env.NODE_ENV || 'development'}`);
    console.log(`📋  Health check: http://localhost:${PORT}/health\n`);
});

module.exports = app;
