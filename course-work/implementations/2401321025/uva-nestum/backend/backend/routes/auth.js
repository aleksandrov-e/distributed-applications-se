const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');
const { SECRET, authenticateToken } = require('../middleware/auth');

// REGISTER
router.post('/register', async (req, res, next) => {
    try {
        const { username, email, password, phone } = req.body;

        if (!username || !email || !password) {
            const err = new Error('Username, email and password are required.');
            err.status = 400;
            err.title = 'Bad Request';
            return next(err);
        }

        if (username.length > 50) {
            const err = new Error('Username must be at most 50 characters.');
            err.status = 400;
            err.title = 'Bad Request';
            return next(err);
        }

        if (email.length > 100) {
            const err = new Error('Email must be at most 100 characters.');
            err.status = 400;
            err.title = 'Bad Request';
            return next(err);
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const stmt = db.prepare(`
            INSERT INTO users (username, email, passwordHash, phone)
            VALUES (?, ?, ?, ?)
        `);

        const result = stmt.run(username, email, passwordHash, phone || null);

        res.status(201).json({
            message: 'User registered successfully.',
            userId: result.lastInsertRowid
        });

    } catch (err) {
        if (err.message.includes('UNIQUE')) {
            const error = new Error('Username or email already exists.');
            error.status = 409;
            error.title = 'Conflict';
            return next(error);
        }
        next(err);
    }
});

// LOGIN
router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            const err = new Error('Email and password are required.');
            err.status = 400;
            err.title = 'Bad Request';
            return next(err);
        }

        const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

        if (!user) {
            const err = new Error('Invalid email or password.');
            err.status = 401;
            err.title = 'Unauthorized';
            return next(err);
        }

        const validPassword = await bcrypt.compare(password, user.passwordHash);

        if (!validPassword) {
            const err = new Error('Invalid email or password.');
            err.status = 401;
            err.title = 'Unauthorized';
            return next(err);
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login successful.',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });

    } catch (err) {
        next(err);
    }
});

// GET ALL USERS (само admin)
router.get('/', authenticateToken, (req, res, next) => {
    try {
        const {
            username,
            email,
            role,
            page = 1,
            limit = 10,
            sortBy = 'id',
            order = 'ASC'
        } = req.query;

        const allowedSortFields = ['id', 'username', 'email', 'role'];
        const allowedOrders = ['ASC', 'DESC'];

        const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'id';
        const sortOrder = allowedOrders.includes(order.toUpperCase()) ? order.toUpperCase() : 'ASC';

        let query = 'SELECT id, username, email, phone, role FROM users WHERE 1=1';
        const params = [];

        if (username) {
            query += ' AND username LIKE ?';
            params.push(`%${username}%`);
        }
        if (email) {
            query += ' AND email LIKE ?';
            params.push(`%${email}%`);
        }
        if (role) {
            query += ' AND role = ?';
            params.push(role);
        }

        query += ` ORDER BY ${sortField} ${sortOrder}`;

        const offset = (Number(page) - 1) * Number(limit);
        query += ' LIMIT ? OFFSET ?';
        params.push(Number(limit), offset);

        const users = db.prepare(query).all(...params);

        res.json({
            page: Number(page),
            limit: Number(limit),
            data: users
        });

    } catch (err) {
        next(err);
    }
});

// GET USER BY ID
router.get('/:id', authenticateToken, (req, res, next) => {
    try {
        const user = db.prepare('SELECT id, username, email, phone, role FROM users WHERE id = ?').get(req.params.id);

        if (!user) {
            const err = new Error('User not found.');
            err.status = 404;
            err.title = 'Not Found';
            return next(err);
        }

        res.json(user);
    } catch (err) {
        next(err);
    }
});

// UPDATE USER
router.put('/:id', authenticateToken, async (req, res, next) => {
    try {
        const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);

        if (!user) {
            const err = new Error('User not found.');
            err.status = 404;
            err.title = 'Not Found';
            return next(err);
        }

        const { username, email, password, phone, role } = req.body;

        if (username && username.length > 50) {
            const err = new Error('Username must be at most 50 characters.');
            err.status = 400;
            err.title = 'Bad Request';
            return next(err);
        }

        if (email && email.length > 100) {
            const err = new Error('Email must be at most 100 characters.');
            err.status = 400;
            err.title = 'Bad Request';
            return next(err);
        }

        const passwordHash = password
            ? await bcrypt.hash(password, 10)
            : user.passwordHash;

        db.prepare(`
            UPDATE users SET
                username = ?,
                email = ?,
                passwordHash = ?,
                phone = ?,
                role = ?
            WHERE id = ?
        `).run(
            username || user.username,
            email || user.email,
            passwordHash,
            phone !== undefined ? phone : user.phone,
            role || user.role,
            req.params.id
        );

        res.json({ message: 'User updated successfully.' });

    } catch (err) {
        next(err);
    }
});

// DELETE USER
router.delete('/:id', authenticateToken, (req, res, next) => {
    try {
        const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);

        if (!user) {
            const err = new Error('User not found.');
            err.status = 404;
            err.title = 'Not Found';
            return next(err);
        }

        db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);

        res.json({ message: 'User deleted successfully.' });

    } catch (err) {
        next(err);
    }
});

// SETUP ADMIN - изпълни само веднъж
router.post('/setup-admin', (req, res, next) => {
    try {
        const { secretKey } = req.body;
        if (secretKey !== 'uva-nestum-setup-2025') {
            return res.status(403).json({ message: 'Invalid secret key.' });
        }
        db.prepare(`UPDATE users SET role = 'admin' WHERE email = 'admin@uvanestum.com'`).run();
        const user = db.prepare(`SELECT id, username, email, role FROM users WHERE email = 'admin@uvanestum.com'`).get();
        res.json({ message: 'Admin role set!', user });
    } catch (err) {
        next(err);
    }
});

module.exports = router;