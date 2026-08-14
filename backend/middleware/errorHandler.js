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

    res.status(err.status || 500).json({
        message: err.message || "Internal Server Error"
    });
}

module.exports = errorHandler;