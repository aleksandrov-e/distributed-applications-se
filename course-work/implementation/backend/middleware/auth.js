const jwt = require('jsonwebtoken');

const SECRET = 'uva-nestum-secret-key';

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        const err = new Error('Access denied. No token provided.');
        err.status = 401;
        err.title = 'Unauthorized';
        return next(err);
    }

    try {
        const decoded = jwt.verify(token, SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        const error = new Error('Invalid or expired token.');
        error.status = 403;
        error.title = 'Forbidden';
        return next(error);
    }
}

module.exports = { authenticateToken, SECRET };