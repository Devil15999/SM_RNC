'use strict';

const Order = require('../models/Order');
const crypto = require('crypto');

// Generate a deterministic 6-digit OTP
const getDeterministicOtp = (orderId, dateStr) => {
    const hash = crypto.createHash('sha256')
        .update(`${orderId}-${dateStr}-secondmuma-otp-secret`)
        .digest('hex');
    const num = parseInt(hash.substring(0, 8), 16);
    return String(100000 + (num % 900000));
};

const getLocalDateKey = (d) => {
    const date = new Date(d);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Fills in virtual appointments for any active subscription order linked to the appointments.
 */
const fillVirtualAppointments = async (appointments) => {
    const filteredAppointments = [];
    const orderTemplates = {}; // orderId -> { order, apptTemplate }

    // First filter out invalid pending ones (e.g. inactive subscriptions)
    for (const appt of appointments) {
        const orderIdMatch = appt.details && appt.details.match(/Order ID:\s*([a-f\d]{24})/i);
        let isValid = true;

        if (orderIdMatch) {
            const orderId = orderIdMatch[1];
            const order = await Order.findById(orderId);
            if (order) {
                if (order.status !== 'active') {
                    if (appt.status === 'pending') {
                        isValid = false; // Filter out inactive pending appointments
                    }
                } else {
                    // Order is active, save template for virtual appointments
                    if (!orderTemplates[orderId]) {
                        orderTemplates[orderId] = {
                            order,
                            apptTemplate: appt
                        };
                    }
                }
            }
        }

        if (isValid) {
            filteredAppointments.push(appt);
        }
    }

    const finalAppointmentsMap = new Map();

    // Map existing real appointments by orderId and date string
    for (const appt of filteredAppointments) {
        const orderIdMatch = appt.details && appt.details.match(/Order ID:\s*([a-f\d]{24})/i);
        const orderId = orderIdMatch ? orderIdMatch[1] : 'no-order';
        const dateKey = getLocalDateKey(appt.dateTime);
        const key = `${orderId}-${dateKey}`;
        
        if (!finalAppointmentsMap.has(key)) {
            finalAppointmentsMap.set(key, appt.toObject ? appt.toObject() : appt);
        }
    }

    // Generate virtual appointments
    for (const orderId of Object.keys(orderTemplates)) {
        const { order, apptTemplate } = orderTemplates[orderId];
        
        const startDate = new Date(order.activatedAt || order.createdAt);
        let endDate = order.expiresAt ? new Date(order.expiresAt) : null;
        if (!endDate) {
            const months = order.planKey === '6month' ? 6 : (order.planKey === '3month' ? 3 : 1);
            endDate = new Date(startDate);
            endDate.setMonth(endDate.getMonth() + months);
        }

        const current = new Date(startDate);
        const endMidnight = new Date(endDate);
        endMidnight.setHours(23, 59, 59, 999);

        while (current <= endMidnight) {
            const dateKey = getLocalDateKey(current);
            const key = `${orderId}-${dateKey}`;

            if (!finalAppointmentsMap.has(key)) {
                const apptTime = new Date(apptTemplate.dateTime);
                const virtualDateTime = new Date(current);
                virtualDateTime.setHours(
                    apptTime.getHours(),
                    apptTime.getMinutes(),
                    apptTime.getSeconds(),
                    apptTime.getMilliseconds()
                );

                const deterministicOtp = getDeterministicOtp(orderId, dateKey);

                const virtualAppt = {
                    _id: `virtual-${orderId}-${dateKey}`,
                    customerName: apptTemplate.customerName,
                    customerMobile: apptTemplate.customerMobile,
                    customerAddress: apptTemplate.customerAddress,
                    dateTime: virtualDateTime,
                    details: apptTemplate.details,
                    status: 'pending',
                    otp: deterministicOtp,
                    assignedEmployee: apptTemplate.assignedEmployee,
                    isVirtual: true
                };

                finalAppointmentsMap.set(key, virtualAppt);
            }

            current.setDate(current.getDate() + 1);
        }
    }

    return Array.from(finalAppointmentsMap.values());
};

module.exports = {
    getDeterministicOtp,
    getLocalDateKey,
    fillVirtualAppointments
};
