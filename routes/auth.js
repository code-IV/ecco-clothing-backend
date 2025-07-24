const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../database');
const { hashPassword, verifyUser } = require('../utils'); // Import verifyUser middleware
const router = express.Router();

require('dotenv').config(); // Load .env variables
const JWT_SECRET = process.env.JWT_SECRET;

// POST endpoint to login and generate JWT
router.post('/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Missing email or password' });
    }

    const query = 'SELECT * FROM users WHERE email = ?';
    db.query(query, [email], (err, results) => {
        if (err) {
            console.error('Error fetching user:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        if (results.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const user = results[0];
        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) {
                console.error('Error comparing passwords:', err);
                return res.status(500).json({ error: 'Server error' });
            }
            if (!isMatch) {
                return res.status(401).json({ error: 'Invalid email or password' });
            }

            const token = jwt.sign(
                { id: user.id, UID: user.UID, email: user.email, role: user.role },
                JWT_SECRET,
                { expiresIn: '1h' }
            );
            res.json({ message: 'Login successful', token });
        });
    });
});

// POST endpoint to update own password (authenticated user only)
router.post('/users/update', verifyUser, async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!oldPassword || !newPassword) {
        return res.status(400).json({ error: 'Missing oldPassword or newPassword' });
    }

    try {
        // Fetch user to verify old password
        const query = 'SELECT password FROM users WHERE id = ?';
        db.query(query, [userId], async (err, results) => {
            if (err) {
                console.error('Error fetching user:', err);
                return res.status(500).json({ error: 'Database error' });
            }
            if (results.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }

            const isMatch = await bcrypt.compare(oldPassword, results[0].password);
            if (!isMatch) {
                return res.status(401).json({ error: 'Invalid old password' });
            }

            // Hash new password
            const hashedNewPassword = await hashPassword(newPassword);

            // Update password
            const updateQuery = 'UPDATE users SET password = ? WHERE id = ?';
            db.query(updateQuery, [hashedNewPassword, userId], (err, result) => {
                if (err) {
                    console.error('Error updating password:', err);
                    return res.status(500).json({ error: 'Database error' });
                }
                if (result.affectedRows === 0) {
                    return res.status(404).json({ error: 'User not found' });
                }
                res.json({ message: 'Password updated successfully' });
            });
        });
    } catch (err) {
        console.error('Error processing password update:', err);
        res.status(500).json({ error: 'Server error' });
    }
});



module.exports = router;
