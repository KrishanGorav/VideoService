import express from 'express';
import { protect } from '../auth.service';
import { sendPushNotificationToUsers } from '../services/pushNotification.service';

const router = express.Router({ mergeParams: true });
router.route('/').post(sendPushNotificationToUsers);

export { router as pushNotificationRoutes };
