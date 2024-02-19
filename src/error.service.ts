const sendErrorDev = (err: any, res: any) => {
    res.status(err.statusCode).json({
        status: err.status,
        err,
        message: err.message,
        stack: err.stack,
    });
};

const sendErrorPrd = (err: any, res: any) => {
    if (err.isOperational) {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
        });
    } else {
        console.log('ERROR', err);
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong',
        });
    }
};

export const globalErrorhandler = (
    err: {
        message: any;
        statusCode: number;
        status: string;
        info: any;
        stack: string;
    },
    req: any,
    res: any,
    next: any,
) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';
    err.info = err.stack.split(' ')[0] || '';
    if (process.env.NODE_ENV === 'development') {
        console.log(err, '*******');
        console.log(err.message, '*******');
        sendErrorDev(err, res);
    } else {
        const error: any = { ...err };
        error.message = err.message;
        sendErrorPrd(error, res);
    }
};
