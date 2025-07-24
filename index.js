const express = require('express');
const db = require('./database');
const path = require('path');
const fs = require('fs');
const clothesRouter = require('./routes/clothes');
const usersRouter = require('./routes/users');
const authRouter = require('./routes/auth');
const uploadsRouter = require('./routes/uploads');
const app = express();
const port = 3000;

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// Middleware to parse JSON request bodies
app.use(express.json());

// Mount routers
app.use('/api', clothesRouter);
app.use('/api', usersRouter);
app.use('/api', authRouter);
app.use('/api', uploadsRouter);
app.use('/uploads', express.static('uploads'));

// GET endpoint to retrieve all clothes
app.get('/api/clothes', (req, res) => {
    const query = 'SELECT * FROM clothes';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching clothes:', err);
            return res.status(500).json({ error: 'Database error' });
        }
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

app.get('/', (req, res) => {
    res.send('Hello, Ecco Clothing Brand API!');
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});