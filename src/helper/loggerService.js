// logger.js
const winston = require('winston');
require('winston-mongodb');
const connection = require('../config/MongoConnection');

const logger = winston.createLogger({
  level: 'error',  // Lowest level of logs to capture
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),  // to capture stack trace
    winston.format.prettyPrint(),
    winston.format.metadata({
      fillExcept: ['message', 'level', 'timestamp', 'label', 'errors']
    })
  ),
  transports: [
    new winston.transports.MongoDB({
      db: connection.connection._connectionString,
      collection: 'tblErrorLog',
      options: {
        useUnifiedTopology: true
      },

      level: 'error'  // Can be adjusted based on what level of logs you want to store in MongoDB
    })
  ]
});
function errorLogger(err, req) {
  logger.error(err.message, { err, request: req, status: 500})
}

module.exports = { logger, errorLogger };
