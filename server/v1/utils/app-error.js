class AppError extends Error {
  constructor(statusCode, code, message, details) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;

    //creates a stack trace showing where the error originated
    //which function the eroor get exicuted
    Error.captureStackTrace(this, AppError);
  }
}

module.exports = AppError;
