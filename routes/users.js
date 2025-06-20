const express = require('express');
const router = express.Router();
const db = require('../db');

//FOR MY REFERENCE
// interface Exercise {
//     id: number;
//     description: string;
//     duration: number;
//     date: string;
// }

// interface User {
//     id: number;
//     username: string;
// }

// interface UserExerciseLog extends User {
//     logs: Exercise[];
//     count: number;
// }


// GET /api/users – Get all users
router.get('/api/users', (req, res) => {
    const query = `SELECT id, username FROM users`;

    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error', details: err.message });
        res.json(rows);
    });
});

// POST /api/users – create new user
router.post('/api/users', (req, res) => {
    const { username } = req.body;

    if (!username) {
        return res.status(400).json({ error: 'Username is required' });
    }

    const insertQuery = `INSERT INTO users (username) VALUES (?)`;

    db.run(insertQuery, [username], function (err) {
        if (err) {
            return res.status(500).json({ error: 'Failed to create user', details: err.message });
        }

        res.json({
            id: this.lastID,
            username,
        });
    });
});

// POST /api/users/:_id/exercises – Add exercise
router.post('/api/users/:_id/exercises', (req, res) => {
    const userId = req.params._id;
    const { description, duration, date } = req.body;

    // Validation
    if (!description || typeof description !== 'string') {
        return res.status(400).json({ error: 'Description is required and must be a string' });
    }

    if (!duration || isNaN(parseInt(duration))) {
        return res.status(400).json({ error: 'Duration is required and must be an integer' });
    }

    // Use current date if not provided
    const exerciseDate = date ? new Date(date) : new Date();
    if (isNaN(exerciseDate)) {
        return res.status(400).json({ error: 'Date format is invalid (expected YYYY-MM-DD)' });
    }

    const formattedDate = exerciseDate.toISOString().split('T')[0];

    // Check if user exists
    db.get(`SELECT * FROM users WHERE id = ?`, [userId], (err, user) => {
        if (err) return res.status(500).json({ error: 'Database error', details: err.message });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Insert exercise
        const insertQuery = `
      INSERT INTO exercises (user_id, description, duration, date)
      VALUES (?, ?, ?, ?)
    `;

        db.run(insertQuery, [userId, description, parseInt(duration), formattedDate], function (err) {
            if (err) return res.status(500).json({ error: 'Failed to add exercise', details: err.message });

            res.json({
                userId: parseInt(userId),
                exerciseId: this.lastID,
                description,
                duration: parseInt(duration),
                date: formattedDate,
            });
        });
    });
});

router.get('/api/users/:_id/logs', (req, res) => {
    const userId = req.params._id;
    const { from, to, limit } = req.query;

    // Fetch the user
    const getUserQuery = `SELECT id, username FROM users WHERE id = ?`;

    db.get(getUserQuery, [userId], (err, user) => {
        if (err) return res.status(500).json({ error: 'Database error', details: err.message });
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Build dynamic query based on optional filters
        let query = `
      SELECT id, description, duration, date
      FROM exercises
      WHERE user_id = ?
    `;
        const params = [userId];

        if (from) {
            query += ` AND date >= ?`;
            params.push(from);
        }

        if (to) {
            query += ` AND date <= ?`;
            params.push(to);
        }

        query += ` ORDER BY date DESC`;

        if (limit && !isNaN(parseInt(limit))) {
            query += ` LIMIT ?`;
            params.push(parseInt(limit));
        }

        // Fetch filtered exercises
        db.all(query, params, (err, rows) => {
            if (err) return res.status(500).json({ error: 'Failed to fetch exercises', details: err.message });

            const logs = rows.map(row => ({
                id: row.id,
                description: row.description,
                duration: row.duration,
                date: new Date(row.date).toISOString().split('T')[0],
            }));

            const response = {
                id: user.id,
                username: user.username,
                logs,
                count: logs.length,
            };

            res.json(response);
        });
    });
});


module.exports = router;
