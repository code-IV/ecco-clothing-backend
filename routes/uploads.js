const express = require('express');
const multer = require('multer');
const fs = require('fs').promises;
const path = require('path');
const router = express.Router();
require('dotenv').config();

const { verifyUser } = require('../utils');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// GET endpoint to list all uploaded files
router.get('/uploads', (req, res) => {
    const uploadsDir = path.join(__dirname, '../uploads');
    fs.readdir(uploadsDir)
        .then(files => {
            const fileDetails = files.map(file => ({
                filename: file,
                url: `/uploads/${file}`,
                path: path.join('uploads', file)
            }));
            res.json(fileDetails);
        })
        .catch(err => {
            console.error('Error reading uploads directory:', err);
            res.status(500).json({ error: 'Server error' });
        });
});

// DELETE endpoint to remove a specific uploaded file (restricted to user)
router.delete('/uploads/:filename', verifyUser, async (req, res) => {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../uploads', filename);

    try {
        await fs.access(filePath); // Check if file exists
        await fs.unlink(filePath); // Delete the file
        res.json({ message: 'File deleted successfully' });
    } catch (err) {
        if (err.code === 'ENOENT') {
            res.status(404).json({ error: 'File not found' });
        } else {
            console.error('Error deleting file:', err);
            res.status(500).json({ error: 'Server error' });
        }
    }
});

module.exports = router;
