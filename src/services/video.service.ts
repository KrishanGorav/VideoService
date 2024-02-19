import fs from 'fs';
import path from 'path';
import { createLogger, transports, Logger, config} from "winston";
import { catchAsync } from '../util/catchAsync';
import { VideoProcessor } from '../middleware/create.video';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { MediaObject, VideoRequest } from '../types/generics';
import validateParams from '../util/validateParams';

const validatorObject: VideoRequest = {
    audioUrl: 'string',
    dimension: {width: 720, height: 1280},
    templateName: 'string',
    orientation: 'string',
    resources: [{
        url: 'string', 
        text: ['string'], 
        fontColor: 'string', 
        fontFamily: 'string',
        fontSize: 20, 
        textPosition: 'string',
        animation: 'string',
        duration: 0
    }]
}

const logger = createLogger({
    levels: config.syslog.levels,
    transports: [
        new transports.Console({ level: 'error' }),
        new transports.File({
            filename: './logs/combined.log',
            level: 'info'
        })
    ],
    exceptionHandlers: [
        new transports.File({ filename: './logs/exceptions.log' })
    ]
});

type CreateVideoRequest = Request & {body: VideoRequest}

const createVideo = catchAsync(async (req: CreateVideoRequest, res: Response) => {
    
    if (!validateParams(req.body, validatorObject)) {
        logger.error("Request validation failed.");
        return res.status(400).json({
            status: "failed",
            message: "Invalid request. The request must have audio url & array of images with url & text params",
        });
    }

    const videoProcessor = new VideoProcessor();
    let uniqueFolderName = uuidv4();
    const replacer = new RegExp('-', 'g');
    uniqueFolderName = uniqueFolderName.replace(replacer, '');
    const mediaResources: MediaObject[] = req.body.resources;

    if(mediaResources.length < 2) {
        return res.status(400).json({
            status: "failed",
            message: "The resources must be two or more images",
        });
    }

    videoProcessor.createVideo(req.body, uniqueFolderName);
    
    res.status(200).json({
        status: "success",
        videoID: uniqueFolderName,
        message: "We have received your request for creating your video. We are preparing your video.",
    });
});

const getVideo = catchAsync(async (req: Request, res: Response) => {
    const videoID: any = req.params['id'];
    const localMediaDirectory = path.resolve('media', 'videos');
    const localVideosFolderPath: string = path.join(localMediaDirectory, videoID);
    const videoPath: string = path.join(localVideosFolderPath, 'video.mp4');
    try {
        const stat = fs.statSync(videoPath);
        const fileSize = stat.size;
        const range = req.headers.range;

        if (range) {
            const parts = range.replace(/bytes=/, '').split('-');
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
            const chunkSize = end - start + 1;
            const file = fs.createReadStream(videoPath, { start, end });
            const head = {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunkSize,
                'Content-Type': 'video/mp4',
            };

            res.writeHead(206, head);
            file.pipe(res);
        } else {
            const head = {
                'Content-Length': fileSize,
                'Content-Type': 'video/mp4',
            };

            res.writeHead(200, head);
            fs.createReadStream(videoPath).pipe(res);
        }
    } catch {
        return res.status(200).json({
            status: "processing",
            message: "The video is not ready yet. Please check back in few minutes.",
        });
    }
});

export { createVideo, getVideo};
