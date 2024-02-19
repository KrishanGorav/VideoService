import { NextFunction, Request, Response } from 'express';

export const catchAsync = (fn: any) => {
    return (req: Request, res: Response, next: NextFunction, ...args: any) => {
        fn(req, res, next, ...args).catch((err: any) => {
            return next(err);
        });
    };
};
