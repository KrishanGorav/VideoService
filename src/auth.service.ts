import { NextFunction, Request, Response } from "express";
import { AppError } from "./util/appError";
import { catchAsync } from "./util/catchAsync";

export const protect = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const {authorization} = req.headers;
    if (!authorization || authorization !== process.env.PN_SERVICE_KEY) {
        return next (new AppError('You are not authorized', 401))
    }
    next();
})