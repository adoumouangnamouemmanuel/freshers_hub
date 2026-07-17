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
    logger.warn('Validation error', { error: error.errors });
    const message = error.errors.map(err => err.message).join(', ');
    return next(new AppError(`Validation failed: ${message}`, 400));
  }
};

module.exports = validate;
