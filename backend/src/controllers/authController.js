const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const prisma = require('../utils/prisma');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'super-secret-key-change-it-in-env', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

exports.register = catchAsync(async (req, res, next) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return next(new AppError('Будь ласка, вкажіть email, пароль та ім\'я', 400));
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      isGuest: false
    }
  });

  const token = signToken(user.id);

  user.password = undefined;

  res.status(201).json({ status: 'success', token, data: { user } });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Будь ласка, вкажіть email та пароль', 400));
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.password || !(await bcrypt.compare(password, user.password))) {
    return next(new AppError('Невірний email або пароль', 401));
  }

  const token = signToken(user.id);
  user.password = undefined;

  res.status(200).json({ status: 'success', token, data: { user } });
});

exports.guestLogin = catchAsync(async (req, res, next) => {
  const { name } = req.body;

  if (!name) {
    return next(new AppError('Вкажіть ім\'я для гостьового входу', 400));
  }

  const user = await prisma.user.create({
    data: {
      name,
      isGuest: true
    }
  });

  const token = signToken(user.id);

  res.status(201).json({ status: 'success', token, data: { user } });
});