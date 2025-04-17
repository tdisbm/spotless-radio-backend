import express, {NextFunction} from "express";

export async function genericExpressErrorHandler(
    err: Error,
    req: express.Request,
    res: express.Response,
    next: NextFunction
) {
    res.status(500).json({
        error: err.message,
        stack: String(err.stack)
    });
}


export async function processRejection(reason, promise) {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
}

export async function processException(error) {
    console.error('Uncaught Exception:', error);
}