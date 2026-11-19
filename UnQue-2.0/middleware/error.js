
export const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
};

export const errorMiddleware = (err, req, res, next) => {
    const statusCode = err.code && typeof err.code === 'number' ? err.code : 500;
    res.status(statusCode).json({
        message: err.message
    });
};
