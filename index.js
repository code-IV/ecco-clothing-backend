//-/index.js
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('./database');
const app = express();
const port = 3000;

// Middleware to parse JSON request bodies
app.use(express.json());

// Home route
app.get('/', (req, res) => {
  res.send('Hello, Clothing Brand API!');
});


// GET endpoint to retrieve all clothes
app.get('/api/clothes', (req, res) => {
    const query = 'SELECT * FROM clothes';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching clothes:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        // Parse JSON fields
        const parsedResults = results.map(item => ({
            ...item,
            media: JSON.parse(item.media),
            colors: JSON.parse(item.colors),
            sizes: JSON.parse(item.sizes),
            price: JSON.parse(item.price),
            categories: JSON.parse(item.categories),
            material: item.material ? JSON.parse(item.material) : null
        }));
        res.json(parsedResults);
    });
});

// POST endpoint to add a new clothing item
app.post('/api/clothes', (req, res) => {
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
app.patch('/api/clothes/:id', (req, res) => {
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


app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});