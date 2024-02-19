import jwt from 'jsonwebtoken';
import { catchAsync } from '../util/catchAsync';
import { AppError } from '../util/appError';
import { promisify } from 'util';
import { userSchema } from '../model/user/schema';
import { model } from 'mongoose';

const refreshTokenCookieOptions = {
    //@ts-ignore
    expires: new Date(Date.now() + process.env.JWT_REFRESH_TOKEN_EXPIRES_IN * 24 * 60 * 60 * 1000),
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
};

const cookieOptions = {
    //@ts-ignore
    expiresIn: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
};

const signToken = (user_id: string) => {
    return jwt.sign({ user_id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
    });
};

const signRefreshToken = (user_id: string) => {
    return jwt.sign({ user_id }, process.env.JWT_REFRESH_TOKEN, {
        expiresIn: process.env.JWT_EXPIRES_IN,
    });
};

const createAndSendToken = (user, statusCode, res) => {
    const token = signToken(user._id);
    const refreshToken = signRefreshToken(user._id);

    res.cookie('jwt', token, cookieOptions);
    res.cookie('refresh-token', refreshToken, refreshTokenCookieOptions);

    user.password = undefined;

    res.status(statusCode).json({
        status: 'success',
        token,
        refreshToken,
        data: user,
    });
};

export const signup = catchAsync(async (req, res, next) => {
    const tenantIdentifier = req.tenant.tenant_id;
    const collectionName = `${tenantIdentifier}_users`;
    const User = model(collectionName, userSchema);
    const payload = { ...req.body };
    payload.tenant_id = tenantIdentifier;
    const newUser = await User.create(payload);
    createAndSendToken(newUser, 201, res);
});

export const login = catchAsync(async (req, res, next) => {
    const { phone_number, email, password } = req.body;
    const tenantIdentifier = req.tenant.tenant_id;
    const collectionName = `${tenantIdentifier}_users`;
    const User = model(collectionName, userSchema);
    const user: any = await User.findOne({
        $or: [{ email }, { phone_number }],
    }).select('+password +phone_number');
    if (!user || !(await user.correctPassword(password, user.password))) {
        return next(new AppError(`Incorrect login username, email, phonenumber or password`, 401));
    }
    createAndSendToken(user, 201, res);
});


export const refresh = catchAsync(async (req, res, next) => {
    const cookie = req.headers.cookie;
    if (!cookie) return next(new AppError('You cannot use the refresh token, please log in again', 400));
    const refreshToken = cookie.split('refresh-token=')[1];
    if (!refreshToken) return next(new AppError('You are not logged in! Please log in to get access', 401));
    const decoded = await promisify(jwt.verify)(refreshToken, process.env.JWT_REFRESH_TOKEN);
    const tenantIdentifier = req.tenant.tenant_id;
    const collectionName = `${tenantIdentifier}_users`;
    const User = model(collectionName, userSchema);
    const currentUser = await User.findById(decoded.user_id);
    if (!currentUser) return next(new AppError('The user belonging to this token does no longer exist', 401));
    createAndSendToken(currentUser, 201, res);
});
