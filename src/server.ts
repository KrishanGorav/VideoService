import http from 'http';
import { app } from './app';
import chalk from 'chalk';
import dotenv from 'dotenv';
import { config, createLogger, transports } from "winston";

dotenv.config({ path: './config.env' });

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
    
function logRequest(req, res, next) {
    logger.info(req.url);
    next();
}
app.use(logRequest);

function logError(err, req, res, next) {
    logger.error(err);
    next();
}
app.use(logError);
    
process.on('uncaughtException', err => {
    console.log('UNCAUGHT EXCEPTION!!: 🔥 Shutting down');
    console.log(err.name, err.message);
    process.exit(1);
});

const server = http.createServer(app);
const port = process.env.PORT || 3333;

server.listen(port, () => {
    console.log(chalk.cyan(`App running on ${port}`));
});

process.on('unhandledRejection', (err: any) => {
    console.log(err);
    console.log('UNHANDLED REJECTION: 🔥 Shutting down');
    server.close(() => {
        process.exit(1);
    });
});

// SIGTERM RELATED TO AWS. TODO: FIND FOR AWS
process.on('SIGTERM', () => {
    console.log('SIGTERM recieved, shutting down gracefully!!! 🔥');
    server.close(() => {
        console.log('Process Terminated');
    });
});
