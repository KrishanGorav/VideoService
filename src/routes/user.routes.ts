import { login, refresh, signup } from '../middleware/authentication';
import express from 'express';

const router = express.Router({ mergeParams: true });

router.get('/refresh', refresh);

router.route('/signup').post(signup);
router.route('/login').post(login);

export { router as userRoutes };
