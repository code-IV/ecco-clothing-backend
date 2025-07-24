const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

require('dotenv').config(); // Load .env variables
const JWT_SECRET = process.env.JWT_SECRET;

const hashPassword = (password) => {
    return new Promise((resolve, reject) => {
        bcrypt.hash(password, 10, (err, hashedPassword) => {
            if (err) {
                reject(new Error('Error hashing password'));
            } else {
                resolve(hashedPassword);
            }
        });
    });
};

// Middleware to verify JWT and check root role
const verifyRoot = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.role !== 'root') {
            return res.status(403).json({ error: 'Only root user can perform this action' });
        }
        req.user = decoded;
        next();
    } catch (err) {
        console.error('JWT verification error:', err);
        res.status(401).json({ error: 'Invalid token' });
    }
};

const verifySuperAdmin = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.role !== 'superadmin' && decoded.role !== 'root') {
            return res.status(403).json({ error: 'Only superadmin can perform this action' });
        }
        req.user = decoded;
        next();
    } catch (err) {
        console.error('JWT verification error:', err);
        res.status(401).json({ error: 'Invalid token' });
    }
};

const verifyUser = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        console.error('JWT verification error:', err);
        res.status(401).json({ error: 'Invalid token' });
    }
};

module.exports = { hashPassword, verifyRoot, verifySuperAdmin, verifyUser };