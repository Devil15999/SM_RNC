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

    // If it's already a URL, return it
    if (base64Data.startsWith('http://') || base64Data.startsWith('https://') || base64Data.startsWith('/uploads/')) {
        return base64Data;
    }

    try {
        // Match base64 regex to extract format and data
        const matches = base64Data.match(/^data:image\/([A-Za-z-+0-9]+);base64,(.+)$/);
        let extension = 'png';
        let buffer;

        if (matches && matches.length === 3) {
            extension = matches[1];
            buffer = Buffer.from(matches[2], 'base64');
        } else {
            // Assume it's a raw base64 string without header
            buffer = Buffer.from(base64Data, 'base64');
        }

        // Define upload paths
        // We'll place the uploads in the project root's 'public/uploads' directory
        const uploadsDir = path.join(__dirname, '..', '..', 'public', 'uploads', subDir);

        // Ensure directories exist
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        // Create a unique filename
        const filename = `${uuidv4()}.${extension}`;
        const filePath = path.join(uploadsDir, filename);

        // Write file
        fs.writeFileSync(filePath, buffer);

        // Return public path
        const relativeUrl = subDir ? `/uploads/${subDir}/${filename}` : `/uploads/${filename}`;
        return relativeUrl;
    } catch (err) {
        console.error('Error saving base64 image:', err);
        return '';
    }
};

module.exports = { saveBase64Image };
