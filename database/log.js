const winston = require('winston');
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, printf } = format;

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'warn.log', level: 'warn' }),
        new winston.transports.File({ filename: 'info.log', level: 'info' }),
    ],
});

module.exports = logger;