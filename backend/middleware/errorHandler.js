function errorHandler(err, req, res, next) {
    console.error(err);

    if (err.name === "ValidationError") {
        return res.status(400).json({
            message: "Validation failed",
            errors: Object.values(err.errors).map(error => error.message)
        });
    }

    if (err.name === "CastError") {
        return res.status(400).json({
            message: "Invalid ID"
        });
    }

    if (err.code === 11000) {
        return res.status(409).json({
            message: "Duplicate value already exists"
        });
    }

    const status = err.status || 500;

    res.status(status).json({
        message:
            status >= 500
                ? "Internal Server Error"
                : err.message || "Request failed"
    });
}

module.exports = errorHandler;
