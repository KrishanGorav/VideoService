import { NextFunction } from 'express';
import Push, { PushType } from '../lib/push-notification';
import { AppError } from '../util/appError';
import { catchAsync } from '../util/catchAsync';

type Data = {
    title: string;
    body: string;
    pushId?: string | number;
    pushType?: PushType;
};

type Body = {
    data: Data;
    usersNotificationTokens: Array<string>;
};

/** The below will send  */
export const sendPushNotificationToUsers = catchAsync(async (req: any, res: any, next: NextFunction) => {
    const { data, usersNotificationTokens } = req.body as Body;
    if (!data || !data.title) {
        return next(new AppError('Please provide a title and/or body', 400));
    }
    if (!usersNotificationTokens || usersNotificationTokens.length < 1) {
        return next(new AppError('Please provide a list of registration tokens', 400));
    }
    const push = new Push(data);
    usersNotificationTokens.forEach(notificationToken => {
        push.sendPushNotification([notificationToken], data, 1);
    });
    res.status(200).json({
        status: 'success',
        message: 'push successfully sent',
    });
});
