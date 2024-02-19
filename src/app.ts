import express from 'express';
import { Request, Response } from 'express';
import cors from 'cors';
import { globalErrorhandler } from './error.service';
import dotenv from 'dotenv';
import morgan from 'morgan';
import { videoRoute } from './routes/video.routes';

dotenv.config({ path: './config.env' });
const app = express();

app.use(express.json());
app.use(express.urlencoded({extended: true}));

if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'stage') {
    app.use(morgan('dev'));
}

app.use(cors());
app.use(express.json());
app.use('/api/v1', videoRoute);

app.use('/', (req: Request, resp: Response) => {
  resp.status(200).json({message: "API server is up & running"});
});


app.use(globalErrorhandler);

export { app };
