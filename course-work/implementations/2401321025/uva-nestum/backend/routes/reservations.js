const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');

// GET ALL RESERVATIONS (с филтриране, pagination и sorting)
router.get('/', authenticateToken, (req, res, next) => {
    try {
        const {
            guestName,
            guestEmail,
            status,
            checkIn,
            checkOut,
            page = 1,
            limit = 10,
            sortBy = 'id',
            order = 'ASC'
        } = req.query;

        const allowedSortFields = ['id', 'guestName', 'checkIn', 'checkOut', 'totalPrice', 'status'];
        const allowedOrders = ['ASC', 'DESC'];

        const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'id';
        const sortOrder = allowedOrders.includes(order.toUpperCase()) ? order.toUpperCase() : 'ASC';

        let query = 'SELECT * FROM reservations WHERE 1=1';
        const params = [];

        if (guestName) {
            query += ' AND guestName LIKE ?';
            params.push(`%${guestName}%`);
        }
        if (guestEmail) {
            query += ' AND guestEmail LIKE ?';
            params.push(`%${guestEmail}%`);
        }
        if (status) {
            query += ' AND status = ?';
            params.push(status);
        }
        if (checkIn) {
            query += ' AND checkIn >= ?';
            params.push(checkIn);
        }
        if (checkOut) {
            query += ' AND checkOut <= ?';
            params.push(checkOut);
        }

        query += ` ORDER BY ${sortField} ${sortOrder}`;

        const offset = (Number(page) - 1) * Number(limit);
        query += ' LIMIT ? OFFSET ?';
        params.push(Number(limit), offset);

        const reservations = db.prepare(query).all(...params);

        res.json({
            page: Number(page),
            limit: Number(limit),
            data: reservations
        });

    } catch (err) {
        next(err);
    }
});

// GET RESERVATION BY ID
router.get('/:id', authenticateToken, (req, res, next) => {
    try {
        const reservation = db.prepare('SELECT * FROM reservations WHERE id = ?').get(req.params.id);

        if (!reservation) {
            const err = new Error('Reservation not found.');
            err.status = 404;
            err.title = 'Not Found';
            return next(err);
        }

        res.json(reservation);
    } catch (err) {
        next(err);
    }
});

// CREATE RESERVATION
router.post('/', (req, res, next) => {
    try {
        const { roomId, guestName, guestEmail, checkIn, checkOut } = req.body;

        if (!roomId || !guestName || !guestEmail || !checkIn || !checkOut) {
            const err = new Error('RoomId, guestName, guestEmail, checkIn and checkOut are required.');
            err.status = 400;
            err.title = 'Bad Request';
            return next(err);
        }

        if (guestName.length > 100) {
            const err = new Error('Guest name must be at most 100 characters.');
            err.status = 400;
            err.title = 'Bad Request';
            return next(err);
        }

        if (guestEmail.length > 100) {
            const err = new Error('Guest email must be at most 100 characters.');
            err.status = 400;
            err.title = 'Bad Request';
            return next(err);
        }

        const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(roomId);

        if (!room) {
            const err = new Error('Room not found.');
            err.status = 404;
            err.title = 'Not Found';
            return next(err);
        }

        if (!room.isAvailable) {
            const err = new Error('Room is not available.');
            err.status = 400;
            err.title = 'Bad Request';
            return next(err);
        }

        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);
        const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));

        if (nights <= 0) {
            const err = new Error('Check-out must be after check-in.');
            err.status = 400;
            err.title = 'Bad Request';
            return next(err);
        }

        const totalPrice = nights * room.price;

        const stmt = db.prepare(`
            INSERT INTO reservations (roomId, guestName, guestEmail, checkIn, checkOut, totalPrice)
            VALUES (?, ?, ?, ?, ?, ?)
        `);

        const result = stmt.run(roomId, guestName, guestEmail, checkIn, checkOut, totalPrice);

        res.status(201).json({
            message: 'Reservation created successfully.',
            reservationId: result.lastInsertRowid,
            totalPrice
        });

    } catch (err) {
        next(err);
    }
});

// UPDATE RESERVATION
router.put('/:id', authenticateToken, (req, res, next) => {
    try {
        const reservation = db.prepare('SELECT * FROM reservations WHERE id = ?').get(req.params.id);

        if (!reservation) {
            const err = new Error('Reservation not found.');
            err.status = 404;
            err.title = 'Not Found';
            return next(err);
        }

        const { guestName, guestEmail, checkIn, checkOut, status } = req.body;

        const stmt = db.prepare(`
            UPDATE reservations SET
                guestName = ?,
                guestEmail = ?,
                checkIn = ?,
                checkOut = ?,
                status = ?
            WHERE id = ?
        `);

        stmt.run(
            guestName || reservation.guestName,
            guestEmail || reservation.guestEmail,
            checkIn || reservation.checkIn,
            checkOut || reservation.checkOut,
            status || reservation.status,
            req.params.id
        );

        res.json({ message: 'Reservation updated successfully.' });

    } catch (err) {
        next(err);
    }
});

// DELETE RESERVATION
router.delete('/:id', authenticateToken, (req, res, next) => {
    try {
        const reservation = db.prepare('SELECT * FROM reservations WHERE id = ?').get(req.params.id);

        if (!reservation) {
            const err = new Error('Reservation not found.');
            err.status = 404;
            err.title = 'Not Found';
            return next(err);
        }

        db.prepare('DELETE FROM reservations WHERE id = ?').run(req.params.id);

        res.json({ message: 'Reservation deleted successfully.' });

    } catch (err) {
        next(err);
    }
});

module.exports = router;