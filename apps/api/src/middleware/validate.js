const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

const validate = (schema) => (req, res, next) => {
  try {
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  } catch (error) {
    logger.warn('Validation error', { error: error.message });
    const errorsArray = error.errors || error.issues || [];
    const message = errorsArray.length ? errorsArray.map(err => err.message).join(', ') : error.message;
    return next(new AppError(`Validation failed: ${message}`, 400));
  }
};

module.exports = validate;
