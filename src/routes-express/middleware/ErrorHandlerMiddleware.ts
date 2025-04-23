import express, {NextFunction} from "express";

export async function errorHandler(
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
