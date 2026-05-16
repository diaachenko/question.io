const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

exports.protect = catchAsync(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('Ви не авторизовані! Будь ласка, увійдіть в систему.', 401));
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super-secret-key-change-it-in-env');

  const currentUser = await prisma.user.findUnique({
    where: { id: decoded.id }
  });

  if (!currentUser) {
    return next(new AppError('Користувача, якому належить цей токен, більше не існує.', 401));
  }

  req.user = currentUser;
  next();
});