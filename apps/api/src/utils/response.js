/**
 * Send a standardized JSON success response.
 * @param {Object} res - Express response object
 * @param {Object} data - The data payload to send
 * @param {number} [statusCode=200] - HTTP status code
 * @param {string} [message] - Optional success message
 */
exports.sendSuccess = (res, data, statusCode = 200, message = null) => {
  const payload = {
    success: true,
    data,
  };
  
  if (message) {
    payload.message = message;
  }

  res.status(statusCode).json(payload);
};
