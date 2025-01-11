/**
 * Logger utility for logging errors and other information.
 * @module middleware/errorHandler
 * @requires ../utils/logger
 */
const { logger } = require('../utils/logger');

module.exports = (err, req, res, next) => {
  logger.error(err.stack);

  if (err.statusCode) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  }

  res.status(500).json({
    status: 'error',
    message: 'Internal server error'
  });
};