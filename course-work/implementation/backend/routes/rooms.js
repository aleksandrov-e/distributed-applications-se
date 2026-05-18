const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');

// GET ALL ROOMS (с филтриране, pagination и sorting)
router.get('/', (req, res, next) => {
    try {
        const {
            type,
            name,
            minPrice,
            maxPrice,
            isAvailable,
            page = 1,
            limit = 10,
            sortBy = 'id',
            order = 'ASC'
        } = req.query;

        const allowedSortFields = ['id', 'name', 'type', 'price', 'capacity'];
        const allowedOrders = ['ASC', 'DESC'];

        const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'id';
        const sortOrder = allowedOrders.includes(order.toUpperCase()) ? order.toUpperCase() : 'ASC';

        let query = 'SELECT * FROM rooms WHERE 1=1';
        const params = [];

        if (type) {
            query += ' AND type LIKE ?';
            params.push(`%${type}%`);
        }
        if (name) {
            query += ' AND name LIKE ?';
            params.push(`%${name}%`);
        }
        if (minPrice) {
            query += ' AND price >= ?';
            params.push(Number(minPrice));
        }
        if (maxPrice) {
            query += ' AND price <= ?';
            params.push(Number(maxPrice));
        }
        if (isAvailable !== undefined) {
            query += ' AND isAvailable = ?';
            params.push(Number(isAvailable));
        }

        query += ` ORDER BY ${sortField} ${sortOrder}`;

        const offset = (Number(page) - 1) * Number(limit);
        query += ' LIMIT ? OFFSET ?';
        params.push(Number(limit), offset);

        const rooms = db.prepare(query).all(...params);

        res.json({
            page: Number(page),
            limit: Number(limit),
            data: rooms
        });

    } catch (err) {
        next(err);
    }
});

// GET ROOM BY ID
router.get('/:id', (req, res, next) => {
    try {
        const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(req.params.id);

        if (!room) {
            const err = new Error('Room not found.');
            err.status = 404;
            err.title = 'Not Found';
            return next(err);
        }

        res.json(room);
    } catch (err) {
        next(err);
    }
});

// CREATE ROOM
router.post('/', authenticateToken, (req, res, next) => {
    try {
        const { name, type, price, capacity, description, isAvailable } = req.body;

        if (!name || !type || !price || !capacity) {
            const err = new Error('Name, type, price and capacity are required.');
            err.status = 400;
            err.title = 'Bad Request';
            return next(err);
        }

        if (name.length > 100) {
            const err = new Error('Name must be at most 100 characters.');
            err.status = 400;
            err.title = 'Bad Request';
            return next(err);
        }

        const stmt = db.prepare(`
            INSERT INTO rooms (name, type, price, capacity, description, isAvailable)
            VALUES (?, ?, ?, ?, ?, ?)
        `);

        const result = stmt.run(
            name,
            type,
            Number(price),
            Number(capacity),
            description || null,
            isAvailable !== undefined ? Number(isAvailable) : 1
        );

        res.status(201).json({
            message: 'Room created successfully.',
            roomId: result.lastInsertRowid
        });

    } catch (err) {
        next(err);
    }
});

// UPDATE ROOM
router.put('/:id', authenticateToken, (req, res, next) => {
    try {
        const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(req.params.id);

        if (!room) {
            const err = new Error('Room not found.');
            err.status = 404;
            err.title = 'Not Found';
            return next(err);
        }

        const { name, type, price, capacity, description, isAvailable } = req.body;

        const stmt = db.prepare(`
            UPDATE rooms SET
                name = ?,
                type = ?,
                price = ?,
                capacity = ?,
                description = ?,
                isAvailable = ?
            WHERE id = ?
        `);

        stmt.run(
            name || room.name,
            type || room.type,
            price !== undefined ? Number(price) : room.price,
            capacity !== undefined ? Number(capacity) : room.capacity,
            description !== undefined ? description : room.description,
            isAvailable !== undefined ? Number(isAvailable) : room.isAvailable,
            req.params.id
        );

        res.json({ message: 'Room updated successfully.' });

    } catch (err) {
        next(err);
    }
});


router.delete('/:id', authenticateToken, (req, res, next) => {
    try {
        const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(req.params.id);

        if (!room) {
            const err = new Error('Room not found.');
            err.status = 404;
            err.title = 'Not Found';
            return next(err);
        }

        db.prepare('DELETE FROM rooms WHERE id = ?').run(req.params.id);

        res.json({ message: 'Room deleted successfully.' });

    } catch (err) {
        next(err);
    }
});

module.exports = router;