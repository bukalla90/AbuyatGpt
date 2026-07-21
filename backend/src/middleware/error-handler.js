export const errorHandler = (
    err,
    req,
    res,
    next
) => {

    if (res.headersSent) return next(err);

    const customError = {
        statusCode: err.statusCode || 500,

        message: err.statusCode ? err.message : "Something went wrong",
    };



    return res
        .status(customError.statusCode)
        .json({
            success: false,

            message: customError.message,
        });
};
