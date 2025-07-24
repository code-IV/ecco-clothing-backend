const express = require('express');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const db = require('../database');
const router = express.Router();

const { verifyUser} = require('../utils');



// POST endpoint to add a new clothing item
router.post('/clothes', verifyUser, (req, res) => {
    console.log('Request body:', req.body);
    const {name, media, colors, sizes, price, categories, description, material } = req.body;
    const UID = uuidv4();

    // Validate required fields
    if (!UID || !name || !media || !colors || !sizes || !price || !categories) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    if (!Array.isArray(media) || !Array.isArray(colors) || !Array.isArray(sizes) ||
        !Array.isArray(price) || !Array.isArray(categories)) {
        return res.status(400).json({ error: 'Media, colors, sizes, price, and categories must be arrays' });
    }
    // if (material && !Object.isObject(material)) {
    //     return res.status(400).json({ error: 'Material must be an array' });
    // }

    const query = 'INSERT INTO clothes (UID, name, media, colors, sizes, price, categories, description, material) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
    const values = [
        UID,
        name,
        JSON.stringify(media),
        JSON.stringify(colors),
        JSON.stringify(sizes),
        JSON.stringify(price),
        JSON.stringify(categories),
        description,
        material ? JSON.stringify(material) : null
    ];
    db.query(query, values, (err, result) => {
        if (err) {
            console.error('Error adding clothing item:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.status(201).json({ message: 'Clothing item added', id: result.insertId });
    });
});

// PATCH endpoint to update a clothing item by UID
router.patch('/clothes/:id', verifyUser, (req, res) => {
    console.log('Request body:', req.body);
    const { id } = req.params;
    const { name, media, colors, sizes, price, categories, description, material } = req.body;

    // Build dynamic query for fields provided
    const fields = [];
    const values = [];

    if (name) {
        fields.push('name = ?');
        values.push(name);
    }
    if (media) {
        fields.push('media = ?');
        values.push(JSON.stringify(media));
    }
    if (colors) {
        fields.push('colors = ?');
        values.push(JSON.stringify(colors));
    }
    if (sizes) {
        fields.push('sizes = ?');
        values.push(JSON.stringify(sizes));
    }
    if (price) {
        fields.push('price = ?');
        values.push(JSON.stringify(price));
    }
    if (categories) {
        fields.push('categories = ?');
        values.push(JSON.stringify(categories));
    }
    if (description !== undefined) {
        fields.push('description = ?');
        values.push(description);
    }
    if (material !== undefined) {
        fields.push('material = ?');
        values.push(material ? JSON.stringify(material) : null);
    }

    if (fields.length === 0) {
        return res.status(400).json({ error: 'No fields provided to update' });
    }

    const query = `UPDATE clothes SET ${fields.join(', ')} WHERE id = ?`;
    values.push(id);

    db.query(query, values, (err, result) => {
        if (err) {
            console.error('Error updating clothing item:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Clothing item not found' });
        }
        res.json({ message: 'Clothing item updated' });
    });
});

// DELETE endpoint to remove a clothing item by id (restricted to root)
router.delete('/clothes/:id', verifyUser, (req, res) => {
    const { id } = req.params;

    const query = 'DELETE FROM clothes WHERE id = ?';
    db.query(query, [id], (err, result) => {
        if (err) {
            console.error('Error deleting clothing item:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Clothing item not found' });
        }
        res.json({ message: 'Clothing item deleted' });
    });
});



module.exports = router;
