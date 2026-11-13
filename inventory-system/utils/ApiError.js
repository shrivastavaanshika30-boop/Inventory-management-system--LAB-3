// Error with an HTTP status code, thrown from controllers/middleware
class ApiError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.statusCode = statusCode;
    if (details) this.details = details;
  }
}

module.exports = ApiError;
