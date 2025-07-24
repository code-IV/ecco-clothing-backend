const bcrypt = require('bcrypt');
const db = require('./database');
const initializeRootUser = () => {
    const rootUser = {
        UID: 'root',
        uname: 'root',
        fname: 'user',
        lname: 'Admin',
        email: 'root@ecco.com',
        phone: '1234567890',
        password: 'root',
        role: 'root'
    };
    // Hash the password
    bcrypt.hash(rootUser.password, 10, (err, hashedPassword) => {
        if (err) {
            console.error('Error hashing password:', err);
            process.exit(1);
        }

        // Check if a root user already exists
        const query = 'SELECT * FROM users WHERE role = "root"';
        db.query(query, (err, results) => {
            if (err) {
                console.error('Error checking for root user:', err);
                process.exit(1);
            }
            if (results.length === 0) {
                const insertQuery = 'INSERT INTO users (UID, uname, fname, lname, email, phone, role, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
                db.query(insertQuery, [rootUser.UID, rootUser.uname, rootUser.fname, rootUser.lname, rootUser.email, rootUser.phone, rootUser.role, hashedPassword], (err) => {
                    if (err) {
                        console.error('Error creating root user:', err);
                        process.exit(1);
                    }
                    console.log('Root user created:', { ...rootUser, password: '[hidden]' });
                    db.end();
                });
            } else {
                console.log('Root user already exists');
                db.end();
            }
        });
    });
};

// Call initialization
initializeRootUser();