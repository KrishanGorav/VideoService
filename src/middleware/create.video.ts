import fs, {rmSync} from 'fs';
import path from 'path';
import { createLogger, transports, Logger, config} from "winston";
import { v4 as uuidv4 } from 'uuid';
import childProcess from 'child_process';
import axios from 'axios';
import http from 'http';
import https from 'https';
import { MediaObject, SlideObject, VideoRequest, VideoObject} from 'generics';



class VideoProcessor {
    logger: Logger;
    constructor() {
        this.logger = createLogger({
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
    }

    async createVideo(videoRequest: VideoRequest, uniqueFolderName: string) {
        
        const dimension = videoRequest.dimension;
        const audioURL = videoRequest.audioUrl;
        const mediaResources: MediaObject[] = videoRequest.resources;
        const templateName = videoRequest.templateName;
        const orientation = videoRequest.orientation;
        const date = new Date();
        const time = date.getTime();
        
        const localMediaDirectory = path.resolve('media', 'videos'); 
        const localAudioDirectory = path.resolve('media', 'audios');
        const localImagesDirectory = path.resolve('media', 'images');

        const localVideosFolderPath: string = path.join(localMediaDirectory, uniqueFolderName);
        const localImageFolderPath: string = path.join(localImagesDirectory, uniqueFolderName);
        const localAudioFolderPath: string = path.join(localAudioDirectory, uniqueFolderName);

        await fs.promises.mkdir(localVideosFolderPath, { recursive: true });
        await fs.promises.mkdir(localImageFolderPath, { recursive: true });
        await fs.promises.mkdir(localAudioFolderPath, { recursive: true });

        this.logger.info("Downloading provided assets audio and images to start video creation.");
        const outputVideoFileName: string = `video.mp4`;
        const audioFileName: string = `audio${time}.mp3`;
        const audioFilePath: string = path.join(localAudioFolderPath, audioFileName);
        const outputVideoFilePath: string = path.join(localVideosFolderPath, outputVideoFileName);
        await this.downloadFile(audioURL, audioFilePath);
        const slideObjects: Promise<SlideObject>[] = [];
        
        mediaResources.forEach((mediaObject) => {
            let slideObject: SlideObject = JSON.parse(JSON.stringify(mediaObject));
            slideObjects.push(this.downloadImage(slideObject, localImageFolderPath));
        });

        const mediaObjects: SlideObject[] = await Promise.all(slideObjects);

        this.logger.info("Assets downloaded sucessfully!");
        this.logger.info("Preparing to generate video.");
 
        const videoObject: VideoObject = {
            mediaObjects,
            audioFilePath, 
            orientation,
            dimension,
            outputVideoFilePath
        };

        switch(templateName) {
            case 'pre-wedding':
                this.generatePreWeddingVideo(videoObject).then((videoPath) => {
                    this.logger.info("Video succesfully generated!");
                    this.logger.info("Removing raw assets");
                    rmSync(localAudioDirectory, {recursive: true, force: true});
                    rmSync(localImagesDirectory, {recursive: true, force: true});
                    this.logger.info("Removed audio & images directories");
                }).catch((error) =>{
                    this.logger.error("Error deleting assets. Error is: "+error);
                });
            break;
        }
    }

    async generatePreWeddingVideo(videoObject: VideoObject) {
        
        try {
            const w = videoObject.dimension.width || 720;
            const h = videoObject.dimension.height || 1280;
            const fps = 60;
            const mediaObjects: SlideObject[] = videoObject.mediaObjects;
            const imageCount = mediaObjects.length;
            
            const videoDuration = mediaObjects.reduce((n, {duration}) => n + duration, 0);
            
            const complexFilter:string[] = [];
            const inputArgs:any[] = [];

            mediaObjects.forEach((mediaObject) => {
                inputArgs.push('-loop', '1', '-t', `${mediaObject.duration}`, '-framerate', `${fps}`,"-noautorotate", '-i', mediaObject.path);
            });
        
            inputArgs.push('-t', `${videoDuration}`, '-stream_loop', '-1', '-i', videoObject.audioFilePath);
            
            let i = 0;
            mediaObjects.forEach((mediaObject) => {
                let sd = mediaObject.duration;
                complexFilter.push(
                    `[${i}]
                    scale='8000:-1',
                    zoompan=z='zoom+0.001':x=iw/2-(iw/zoom/2):y=ih/2-(ih/zoom/2):d=${fps*sd}:s=${w}x${h}:fps=${fps},
                    setsar=1[v${i}]`
                );
                i++;
            });

            i = 0;
            mediaObjects.forEach((mediaObject) => {
                
                const fontSize = mediaObject.fontSize || '(h/30)';
                const fontColor = mediaObject.fontColor || '#FFFEEE';
                const textPosition = this.getTextPosition(mediaObject.textPosition);
                const textPositionLineTwo = this.getTextPositionLineTwo(mediaObject.textPosition);
                const fontFilePath = this.getFontFile(mediaObject.fontFamily);
                const x = textPosition.x;
                const y = textPosition.y;

                const x2 = textPositionLineTwo.x;
                const y2 = textPositionLineTwo.y;
                
                let text1 = (typeof mediaObject.text[0] === 'undefined') ? "" : this.escapeChars(mediaObject.text[0]);
                let text2 = (typeof mediaObject.text[1] === 'undefined') ? "" : this.escapeChars(mediaObject.text[1]);

                complexFilter.push(
                    `[v${i}]drawtext=fontfile='${fontFilePath}':text='${text1}':fontcolor='${fontColor}':fontsize='${fontSize}':x=${x}:y=${y}[dt${i}]`
                );
                complexFilter.push(
                    `[dt${i}]drawtext=fontfile='${fontFilePath}':text='${text2}':fontcolor='${fontColor}':fontsize='${fontSize}':x=${x2}:y=${y2}[d${i}]`
                );
                i++;
            });
            
            let textAnimation = 'dissolve';
            let offset = 0;
            for(let i = 0; i < (imageCount - 1); i++) {
                let mediaObject: SlideObject = mediaObjects[i];
                offset += mediaObject.duration;
                textAnimation = mediaObject.animation.toLowerCase();
                if(i === 0) {
                    complexFilter.push(
                        `[d${i}][d${i+1}]xfade=transition=${textAnimation}:duration=1:offset=${offset-1}[x${i+1}]`
                    );
                }
                else  {
                    complexFilter.push(
                        `[x${i}][d${i+1}]xfade=transition=${textAnimation}:duration=1:offset=${offset-1}[x${i+1}]`
                    );
                }
            }

            inputArgs.push('-filter_complex');
            inputArgs.push(complexFilter.join(';'));
            const outputArgs = ["-map",  `[x${imageCount-1}]`, "-map", `${imageCount}:a`, "-t", `${videoDuration}`, "-c:v", "libx264", "-y", "-pix_fmt", "yuv420p", `${videoObject.outputVideoFilePath}`];
            const argsArray = [...inputArgs, ...outputArgs];
            return new Promise<string>(async (resolve, reject) => {  
                const child = childProcess.spawn("ffmpeg", argsArray);
                
                child.on('error', (err) => {
                    this.logger.error(`Error executing binary:${err}`);
                });
                
                child.stdout.on('data', (data) => {
                    this.logger.error(data.toString());
                });
                
                child.stderr.on('data', (data) => {
                    this.logger.error(data.toString());
                });
                
                child.on('close', (code) => {
                    
                    if (code === 0) {
                        this.logger.error("FFmpeg finished successfully");
                        resolve(videoObject.outputVideoFilePath);
                    } else {
                        this.logger.error(`FFmpeg encountered an error, check the console output`);
                        reject('FFmpeg encountered an error, check the console output');
                    }
                });
            });
        } 
        catch(error: any) {
            this.logger.error("Internal processing error:"+(error?.message ? error.message : error));
        }
    }

    async downloadFile(url: string, savePath: any ) {

        try {
            const response = await axios({
                method: 'get',
                url: url,
                responseType: 'stream'
            });
            const writer = fs.createWriteStream(savePath);
            response.data.pipe(writer);
    
            return new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });
        } catch (error) {
            this.logger.error(`Error downloading file: ${error}`);
        }
    }

    async findImageExt(url:string) {
        const imageType = {
            jpg: 'ffd8ffe0',
            png: '89504e47',
            gif: '47494638'
        };
        https.get(url, response => {
            response.on('readable', () => {
                (async () => {
                    const chunk = response.read(5);
                    response.destroy();
                    const magicNumber = chunk.toString('hex',0,4);
                    if(imageType.jpg === magicNumber){
                        return '.jpg';
                    }
                    if(imageType.png === magicNumber) {
                        return '.png';
                    }
                })();
            });
        });
    }

    async downloadImage(slideObject: SlideObject, localImageFolderPath: string) {
        const imageType = {
            jpg: 'ffd8ffe0',
            png: '89504e47',
            gif: '47494638'
        };

        const url = slideObject.url;
        
        const proto = !url.charAt(4).localeCompare('s') ? https : http;
  
        return new Promise<SlideObject>((resolve, reject) => {

            const request = proto.get(url, response => {
                let ext = '.jpg';
                if (response.statusCode !== 200) {
                    reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
                    return;
                }

                let imageFileName: string = `img${this.uuidWithoutHyphen()}${ext}`;
                let imageFilePath: string = path.join(localImageFolderPath, imageFileName);
                
                slideObject.path = imageFilePath;
                const writer = fs.createWriteStream(imageFilePath);
                response.pipe(writer);
                // The destination stream is ended by the time it's called
                writer.on('finish', () => {
                    response.destroy();
                    resolve(slideObject);
                });
                writer.on('error', err => reject(err));
            });

           
            request.on('error', err =>  reject(err));
            request.end();
        });
    }  

    getFontFile(fontFamily: string) {
        let fontFilePath = path.resolve('build/fonts/Roboto/Roboto-Light.ttf');
        
        if(fontFamily.includes('Roboto')) 
            fontFilePath = path.resolve(`build/fonts/Roboto/${fontFamily}.ttf`);
        else if(fontFamily.includes('WorkSans')) 
            fontFilePath = path.resolve(`build/fonts/Work_Sans/${fontFamily}.ttf`);
        else if(fontFamily.includes('GFSDidot')) 
            fontFilePath = path.resolve(`build/fonts/GFS_Didot/${fontFamily}.ttf`);

        return fontFilePath;
    }

    getTextPosition(position: string) {
        let textCoordinate = {x: '50', y: '80'};
        switch(position){
          case 'TopLeft':
          textCoordinate = {x: '50', y: '80'};
          break;
          case 'TopCenter':
          textCoordinate = {x: '(w-text_w)/2', y: '80'};
          break;
          case 'TopRight':
            textCoordinate = {x: 'w-tw-30', y: '80'};
          break;
          case 'Centered':
            textCoordinate = {x: '(w-text_w)/2', y: '(h-text_h)/2'};
          break;
          case 'LeftCentered':
            textCoordinate = {x: '20', y: '(h-text_h)/2'};
          break;
          case 'RightCentered':
            textCoordinate = {x: '(w-text_w-30)', y: '(h-text_h)/2'};
          break;
          case 'BottomLeft':
            textCoordinate = {x: '50', y: '(h-th-100)'};
          break;
          case 'BottomCenter':
            textCoordinate = {x: '(w-tw)/2', y: 'h-th-100'};
          break;
          case 'BottomRight':
            textCoordinate = {x: '(w-tw-30)', y: '(h-th-100)'};
          break;
          default:
            textCoordinate = {x: '50', y: '80'};
          break;
        }
        return textCoordinate;
    }

    getTextPositionLineTwo(position: string) {
        let textCoordinate = {x: '50', y: '(90+th)'};
        switch(position){
          case 'TopLeft':
          textCoordinate = {x: '50', y: '90+th'};
          break;
          case 'TopCenter':
          textCoordinate = {x: '(w-text_w)/2', y: '(90+th)'};
          break;
          case 'TopRight':
            textCoordinate = {x: 'w-tw-30', y: '(90+th)'};
          break;
          case 'Centered':
            textCoordinate = {x: '(w-text_w)/2', y: '((h/2)+text_h)-10'};
          break;
          case 'LeftCentered':
            textCoordinate = {x: '50', y: '(h/2)+text_h'};
          break;
          case 'RightCentered':
            textCoordinate = {x: '(w-text_w)', y: '(h/2)+text_h'};
          break;
          case 'BottomLeft':
            textCoordinate = {x: '10', y: '(h-90)'};
          break;
          case 'BottomCenter':
            textCoordinate = {x: '(w-tw)/2', y: 'h-90'};
          break;
          case 'BottomRight':
            textCoordinate = {x: '(w-tw-30)', y: '(h-90)'};
          break;
          default:
            textCoordinate = {x: '50', y: '(90+th)'};
          break;
        }
        return textCoordinate;
    }
    escapeChars(text:any) {
        return text.replace(/'/g, "\u2019");
    }
    uuidWithoutHyphen() {
        let uuidStr = uuidv4();
        const replacer = new RegExp('-', 'g');
        uuidStr = uuidStr.replace(replacer, '');
        return uuidStr;
    }
    unlink(path:string) {
        new Promise((resolve, reject) => fs.unlink(path, err => (err ? reject(err) : resolve(`${"Temprary file "+path + "deleted."}`))));
    }
}

export { VideoProcessor };
