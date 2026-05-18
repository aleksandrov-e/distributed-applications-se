const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'hotel.db'));

db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        passwordHash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'guest',
        phone TEXT,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS rooms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        price REAL NOT NULL,
        capacity INTEGER NOT NULL,
        description TEXT,
        isAvailable INTEGER NOT NULL DEFAULT 1,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS reservations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        roomId INTEGER NOT NULL,
        guestName TEXT NOT NULL,
        guestEmail TEXT NOT NULL,
        checkIn DATETIME NOT NULL,
        checkOut DATETIME NOT NULL,
        totalPrice REAL NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (roomId) REFERENCES rooms(id)
    );
`);

db.prepare(`UPDATE users SET role = 'admin' WHERE email = 'admin@uvanestum.com'`).run();

module.exports = db;