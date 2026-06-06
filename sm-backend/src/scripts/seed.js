'use strict';

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const OTP = require('../models/OTP');
const Address = require('../models/Address');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const { PACKAGES } = require('../data/packages');

const seedDB = async () => {
    try {
        console.log('Connecting to MongoDB Atlas...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected!');

        console.log('Clearing database collections...');
        await User.deleteMany({});
        await OTP.deleteMany({});
        await Address.deleteMany({});
        await Order.deleteMany({});
        await Payment.deleteMany({});
        console.log('Collections cleared.');

        // 1. Create Users
        console.log('Seeding users...');
        const adminUser = await User.create({
            name: 'Admin Muma',
            email: 'admin@secondmuma.com',
            mobile: '9999999999',
            isVerified: true,
            role: 'admin',
            password: 'admin123'
        });

        const user1 = await User.create({
            name: 'Priya Sharma',
            email: 'priya@example.com',
            mobile: '9876543210',
            isVerified: true,
            role: 'user'
        });

        const user2 = await User.create({
            name: 'Amit Patel',
            email: 'amit@example.com',
            mobile: '9123456789',
            isVerified: true,
            role: 'user'
        });

        const user3 = await User.create({
            name: 'Sneha Reddy',
            email: 'sneha@example.com',
            mobile: '8888888888',
            isVerified: true,
            role: 'user'
        });

        const user4 = await User.create({
            name: 'Rohan Das',
            email: 'rohan@example.com',
            mobile: '7777777777',
            isVerified: false,
            role: 'user'
        });

        console.log('Users seeded!');

        // 2. Create Addresses
        console.log('Seeding addresses...');
        const addrPriya = await Address.create({
            user: user1._id,
            fullName: 'Priya Sharma',
            mobile: '9876543210',
            flatNo: '42B, Block A',
            street: 'MG Road, Landmark: Metro Stn',
            city: 'Bengaluru',
            state: 'Karnataka',
            pincode: '560001',
            isDefault: true
        });

        const addrAmit = await Address.create({
            user: user2._id,
            fullName: 'Amit Patel',
            mobile: '9123456789',
            flatNo: '102, Shanti Kunj',
            street: 'Link Road',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400053',
            isDefault: true
        });
        console.log('Addresses seeded!');

        // 3. Create Orders
        console.log('Seeding orders...');
        const ordersData = [
            {
                // Active order - Priya
                user: user1._id,
                packageType: 'mother',
                packageTitle: PACKAGES.mother.title,
                planKey: '3month',
                planLabel: PACKAGES.mother.plans['3month'].label,
                price: PACKAGES.mother.plans['3month'].price,
                emoji: PACKAGES.mother.emoji,
                accentColor: PACKAGES.mother.accentColor,
                address: {
                    fullName: addrPriya.fullName,
                    mobile: addrPriya.mobile,
                    flatNo: addrPriya.flatNo,
                    street: addrPriya.street,
                    city: addrPriya.city,
                    state: addrPriya.state,
                    pincode: addrPriya.pincode
                },
                paymentStatus: 'success',
                transactionId: 'TXN-SHARMAPRIYA-1714000000000',
                status: 'active',
                activatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
                expiresAt: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000) // expires in 75 days
            },
            {
                // Completed order - Amit
                user: user2._id,
                packageType: 'baby',
                packageTitle: PACKAGES.baby.title,
                planKey: '1month',
                planLabel: PACKAGES.baby.plans['1month'].label,
                price: PACKAGES.baby.plans['1month'].price,
                emoji: PACKAGES.baby.emoji,
                accentColor: PACKAGES.baby.accentColor,
                address: {
                    fullName: addrAmit.fullName,
                    mobile: addrAmit.mobile,
                    flatNo: addrAmit.flatNo,
                    street: addrAmit.street,
                    city: addrAmit.city,
                    state: addrAmit.state,
                    pincode: addrAmit.pincode
                },
                paymentStatus: 'success',
                transactionId: 'TXN-PATELAMIT-1711000000000',
                status: 'completed',
                activatedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
                expiresAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) // expired 15 days ago
            },
            {
                // Pending order - Sneha
                user: user3._id,
                packageType: 'muma',
                packageTitle: PACKAGES.muma.title,
                planKey: '6month',
                planLabel: PACKAGES.muma.plans['6month'].label,
                price: PACKAGES.muma.plans['6month'].price,
                emoji: PACKAGES.muma.emoji,
                accentColor: PACKAGES.muma.accentColor,
                address: {
                    fullName: 'Sneha Reddy',
                    mobile: '8888888888',
                    flatNo: 'Block 4, 301',
                    street: 'Hitech City Road',
                    city: 'Hyderabad',
                    state: 'Telangana',
                    pincode: '500081'
                },
                paymentStatus: 'pending',
                transactionId: 'TXN-REDDYSNEHA-1715000000000',
                status: 'created',
                activatedAt: null,
                expiresAt: null
            },
            {
                // Cancelled order - Rohan
                user: user4._id,
                packageType: 'baby',
                packageTitle: PACKAGES.baby.title,
                planKey: '1month',
                planLabel: PACKAGES.baby.plans['1month'].label,
                price: PACKAGES.baby.plans['1month'].price,
                emoji: PACKAGES.baby.emoji,
                accentColor: PACKAGES.baby.accentColor,
                address: {
                    fullName: 'Rohan Das',
                    mobile: '7777777777',
                    flatNo: 'G-12, Green Park',
                    street: 'South Ext',
                    city: 'Delhi',
                    state: 'Delhi',
                    pincode: '110016'
                },
                paymentStatus: 'failed',
                transactionId: null,
                status: 'cancelled',
                activatedAt: null,
                expiresAt: null
            }
        ];

        const [ordPriya, ordAmit, ordSneha, ordRohan] = await Order.insertMany(ordersData);
        console.log('Orders seeded!');

        // 4. Create Payments
        console.log('Seeding payments...');
        const paymentsData = [
            {
                order: ordPriya._id,
                user: user1._id,
                transactionId: 'TXN-SHARMAPRIYA-1714000000000',
                amount: ordPriya.price,
                status: 'success',
                upiId: 'priya@okhdfc',
                upiRef: '123456789012',
                paidAt: ordPriya.activatedAt
            },
            {
                order: ordAmit._id,
                user: user2._id,
                transactionId: 'TXN-PATELAMIT-1711000000000',
                amount: ordAmit.price,
                status: 'success',
                upiId: 'amit@okaxis',
                upiRef: '987654321098',
                paidAt: ordAmit.activatedAt
            },
            {
                order: ordSneha._id,
                user: user3._id,
                transactionId: 'TXN-REDDYSNEHA-1715000000000',
                amount: ordSneha.price,
                status: 'initiated',
                upiId: 'sneha@okicici',
                upiRef: '',
                paidAt: null
            }
        ];

        await Payment.insertMany(paymentsData);
        console.log('Payments seeded!');

        console.log('Database seeding successfully completed! 🎉');
        await mongoose.connection.close();
        process.exit(0);
    } catch (err) {
        console.error('Error seeding DB:', err);
        process.exit(1);
    }
};

seedDB();
