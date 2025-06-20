const db = require('../db');
const express = require('express');
const { get } = require('../routes/users');
const router = express.Router();

const getUsers = async (req, res) => {
    const query = `SELECT id, username FROM users`;

    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error', details: err.message });
        res.json(rows);
    });
}

const createUser = async (req, res) => {
    const { username } = req.body;

    if (!username) {
        return res.status(400).json({ error: 'Username is required' });
    }

    if (!username || typeof username !== 'string' || /^\d+$/.test(username.trim())) {
        return res.status(400).json({ error: 'username is required and must be a string' });
    }

    const insertQuery = `INSERT INTO users (username) VALUES (?)`;

    db.run(insertQuery, [username], function (err) {
        if (err) {
            return res.status(500).json({ error: 'Failed to create user check db connection, and backend server', details: err.message });
        }

        res.json({
            id: this.lastID,
            username,
        });
    });
}

const getSingleUser = async (req, res) => {
    const userId = parseInt(req.params.id);

    if (isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
    }

    const query = `SELECT id, username FROM users WHERE id = ?`;

    db.get(query, [userId], (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'Database error', details: err.message });
        }

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user); // {id, username }
    });
}

const addExercise = async (req, res) => {
    const userId = parseInt(req.params._id);

    if (!/^\d+$/.test(userId)) {
        return res.status(400).json({ error: 'userId must be a valid number' });
    }

    const { description, duration, date } = req.body;

    //special check for description
    if (!description || typeof description !== 'string' || /^\d+$/.test(description.trim())) {
        return res.status(400).json({ error: 'Description is required and must be a string' });
    }
    if (!duration || duration < 0 || isNaN(parseInt(duration))) {
        return res.status(400).json({ error: 'Duration is required and must be a positive integer' });
    }
    const exerciseDate = date ? new Date(date) : new Date();
    if (isNaN(exerciseDate)) {
        return res.status(400).json({ error: 'Date format is invalid (expected YYYY-MM-DD)' });
    }

    const formattedDate = exerciseDate.toISOString().split('T')[0];

    db.get(`SELECT * FROM users WHERE id = ?`, [userId], (err, user) => {
        if (err) return res.status(500).json({ error: 'Database error', details: err.message });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

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
}

const getUserExerciseLogs = async (req, res) => {
    const userId = parseInt(req.params._id);

    if (!/^\d+$/.test(userId)) {
        return res.status(400).json({ error: 'userId must be a valid number' });
    }
    const { from, to, limit } = req.query;

    const getUserQuery = `SELECT id, username FROM users WHERE id = ?`;

    db.get(getUserQuery, [userId], (err, user) => {
        if (err) return res.status(500).json({ error: 'Database error', details: err.message });
        if (!user) return res.status(404).json({ error: 'User not found' });

        // as from to and limit are optional first lets have only the base query and then add them as needed
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

        db.all(query, params, (err, rows) => {
            if (err) return res.status(500).json({ error: 'Failed to fetch exercises', details: err.message });
            //get all exercises in logs
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
}

module.exports = {
    getUsers,
    createUser,
    getSingleUser,
    addExercise,
    getUserExerciseLogs
}