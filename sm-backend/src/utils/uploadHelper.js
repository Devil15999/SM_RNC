'use strict';

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

/**
 * Saves a base64 encoded image string to the uploads directory.
 * @param {string} base64Data - The base64 data string (can include data:image/png;base64,... header).
 * @param {string} subDir - Optional subfolder inside uploads (e.g. 'aadhar', 'avatars').
 * @returns {string} The public URL path of the saved file (e.g. '/uploads/aadhar/uuid.png').
 */
const saveBase64Image = (base64Data, subDir = '') => {
    if (!base64Data) return '';

    // If it's already a URL or relative path or Base64 data URI, return it
    if (
        base64Data.startsWith('http://') || 
        base64Data.startsWith('https://') || 
        base64Data.startsWith('/uploads/') ||
        base64Data.startsWith('data:image/')
    ) {
        return base64Data;
    }

    try {
        // Check if it is a complete base64 data URI
        const matches = base64Data.match(/^data:image\/([A-Za-z-+0-9]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
            return base64Data;
        }

        // Otherwise, assume raw base64 string and prepend standard png data URI header
        return `data:image/png;base64,${base64Data}`;
    } catch (err) {
        console.error('Error processing base64 image:', err);
        return base64Data;
    }
};

module.exports = { saveBase64Image };
