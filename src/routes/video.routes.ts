import express from 'express';
import { createVideo, getVideo} from '../services/video.service';

const router = express.Router({ mergeParams: true });

router.route('/videos').post(createVideo);
router.route('/videos/:id').get(getVideo);

export { router as videoRoute };
