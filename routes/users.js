const express = require('express');
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');
const db = require('../database');
const router = express.Router();

const { hashPassword, verifySuperAdmin} = require('../utils');


// Configure nodemailer transporter
const transporter = nodemailer.createTransport({
    service: 'gmail', // Use your email service (e.g., Gmail, SendGrid)
    auth: {
        user: process.env.EMAIL_USER, // Add to .env
        pass: process.env.EMAIL_PASS  // Add to .env
    }
});

// GET endpoint  to retrieve all users (restricted to root)
router.get('/users', verifySuperAdmin, (req, res) => {
    const query = 'SELECT id, UID, uname, fname, lname, email, phone, role FROM users WHERE role != "root"'; // Exclude root user from the list
    console.log('Executing query:', query);
    // Execute the query to fetch all users
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching users:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        // Map results to remove sensitive information
        const users = results.map(user => ({
            uname: user.uname,
            fname: user.fname,
            lname: user.lname,
            email: user.email,
            phone: user.phone,
            role: user.role
        }));
        res.json(users);
    });
});


// POST endpoint to create a new user (restricted to superadmin)
router.post('/users', verifySuperAdmin, async (req, res) => {
    console.log('Request body:', req.body);
    const { uname, fname, lname, email, phone, role, password } = req.body;

    if (!uname || !fname || !lname || !email || !phone || !role || !password) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    if (!['admin', 'superadmin'].includes(role)) {
        return res.status(400).json({ error: 'Role must be admin or superadmin' });
    }

    try {
        const hashedPassword = await hashPassword(password);
        const UID = uuidv4();
        const query = 'INSERT INTO users (UID, uname, fname, lname, email, phone, role, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
        const values = [UID, uname, fname, lname, email, phone, role, hashedPassword];

        db.query(query, values, async (err, result) => {
            if (err) {
                console.error('Error adding user:', err);
                return res.status(500).json({ error: 'Database error' });
            }

            // Send email with password
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'Your Ecco Clothing Account Credentials',
                text: `Hello ${uname} ${fname} ,\n\nYour account has been created.\n\nFullname: ${uname} ${fname} ${lname}\nPassword: ${password}\n\nPlease change your password after logging in.\n\nBest regards,\nEcco Clothing Team`
            };

            try {
                await transporter.sendMail(mailOptions);
                console.log(`Email sent to ${email}`);
                res.status(201).json({ message: 'User added and email sent', id: result.insertId, UID });
            } catch (emailErr) {
                console.error('Error sending email:', emailErr);
                res.status(201).json({ message: 'User added but failed to send email', id: result.insertId, UID });
            }
        });
    } catch (err) {
        console.error('Error hashing password:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

router.patch('/users/:id', verifySuperAdmin, async (req, res) => {
    console.log('Request Body: ', req.body);
    const {id} = req.params;
    const {uname, fname, lname, email, phone, password, role} = req.body;
    let hashedPassword;
    if (password) {
        hashedPassword = await hashPassword(password);
    }

    const fields = [];
    const values = [];

    if(uname){
        fields.push('uname = ?');
        values.push(uname);
    }
    if(fname){
        fields.push('fname = ?');
        values.push(fname);
    }
    if(lname){
        fields.push('lname = ?');
        values.push(lname);
    }
    if(email){
        fields.push('email = ?');
        values.push(email);
    }
    if(phone){
        fields.push('phone = ?');
        values.push(phone);
    }
    if(hashedPassword){
        fields.push('password = ?');
        values.push(hashedPassword);
    }
    if(role){
        fields.push('role = ?');
        values.push(role)
    }
    if (fields.length === 0) {
        return res.status(400).json({ error: 'No fields provided to update' });
    }

    const query = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
    values.push(id);

    db.query(query, values, (err, result) => {
        if (err) {
            console.error('Error updating user:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'user item not found' });
        }
        res.json({ message: 'user updated' });
    });

});


// DELETE endpoint to remove a user by UID (restricted to root)
router.delete('/users/:id', verifySuperAdmin, (req, res) => {
    const { id } = req.params;

    // Prevent deletion of root user
    const checkQuery = 'SELECT role FROM users WHERE id = ?';
    db.query(checkQuery, [id], (err, results) => {
        if (err) {
            console.error('Error checking user role:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        if (results[0].role === 'root') {
            return res.status(403).json({ error: 'Cannot delete root user' });
        }

        const deleteQuery = 'DELETE FROM users WHERE id = ?';
        db.query(deleteQuery, [id], (err, result) => {
            if (err) {
                console.error('Error deleting user:', err);
                return res.status(500).json({ error: 'Database error' });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'User not found' });
            }
            res.json({ message: 'User deleted' });
        });
    });
});

module.exports = router;
