export const errorHandler = (
    err,
    req,
    res,
    next
) => {

    const customError = {
        statusCode: err.statusCode || 500,

        message:
            err.message ||
            "Something went wrong",
    };



    return res
        .status(customError.statusCode)
        .json({
            success: false,

            message: customError.message,
        });
};