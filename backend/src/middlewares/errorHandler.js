const AppError = require('../utils/AppError');

const handlePrismaError = (err) => {
  if (err.code === 'P2002') {
    const target = err.meta?.target ? err.meta.target.join(', ') : 'поле';
    return new AppError(`Запис з таким значенням (${target}) вже існує.`, 400);
  }
  if (err.code === 'P2025') {
    return new AppError('Запис не знайдено в базі даних.', 404);
  }
  return err;
};

const handleJWTError = () => new AppError('Недійсний токен. Будь ласка, увійдіть знову.', 401);
const handleJWTExpiredError = () => new AppError('Термін дії токена закінчився. Будь ласка, увійдіть знову.', 401);

const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  let error = Object.assign(err, { message: err.message, name: err.name });

  if (error.code && error.code.startsWith('P')) {
    error = handlePrismaError(error);
  }

  if (error.name === 'JsonWebTokenError') error = handleJWTError();
  if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

  if (process.env.NODE_ENV === 'development') {
    res.status(error.statusCode).json({
      status: error.status,
      message: error.message,
      error: error,
      stack: error.stack
    });
  } else {
    if (error.isOperational) {
      res.status(error.statusCode).json({
        status: error.status,
        message: error.message
      });
    } else {
      console.error('ERROR', err);
      res.status(500).json({
        status: 'error',
        message: 'Щось пішло не так на сервері!'
      });
    }
  }
};

module.exports = errorHandler;