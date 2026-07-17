const logger = require('../utils/logger');
const AppError = require('../utils/AppError');

const sendErrorDev = (err, req, res) => {
  res.status(err.statusCode).json({
    success: false,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err, req, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    const { isOperational, status, statusCode, message, ...rest } = err;
    return res.status(err.statusCode).json({
      error: err.message,
      ...rest
    });
  } 
  
  // Programming or other unknown error: don't leak error details
  logger.error('ERROR 💥', err);
  return res.status(500).json({
    error: 'Something went very wrong!',
  });
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    error.message = err.message;
    sendErrorProd(error, req, res);
  } else {
    sendErrorDev(err, req, res);
  }
};
