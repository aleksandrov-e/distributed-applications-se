function errorHandler(err, req, res, next) {
    console.error(err.stack);

    const status = err.status || 500;

    res.status(status).json({
        type: 'https://tools.ietf.org/html/rfc7807',
        title: err.title || 'Internal Server Error',
        status: status,
        detail: err.message || 'An unexpected error occurred',
        instance: req.originalUrl
    });
}

module.exports = errorHandler;