const prisma = require('../utils/prisma');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

const generateSlug = (title) => {
  const baseSlug = title.toLowerCase().replace(/[^a-z0-9а-яіїєґ]/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  const randomStr = Math.random().toString(36).substring(2, 6);
  return baseSlug ? `${baseSlug}-${randomStr}` : randomStr;
};

exports.createBoard = catchAsync(async (req, res, next) => {
  const { title } = req.body;

  if (!title) {
    return next(new AppError('Будь ласка, вкажіть назву дошки', 400));
  }

  let code;
  let isUnique = false;
  while (!isUnique) {
    code = Math.floor(100000 + Math.random() * 900000).toString();
    const existingBoard = await prisma.board.findUnique({ where: { code } });
    if (!existingBoard) isUnique = true;
  }

  const slug = generateSlug(title);

  const board = await prisma.board.create({
    data: {
      title,
      code,
      slug,
      ownerId: req.user.id
    }
  });

  res.status(201).json({ status: 'success', data: { board } });
});

exports.getMyBoards = catchAsync(async (req, res, next) => {
  const boards = await prisma.board.findMany({
    where: { ownerId: req.user.id },
    orderBy: { createdAt: 'desc' }
  });

  res.status(200).json({ status: 'success', results: boards.length, data: { boards } });
});

exports.getBoardByCode = catchAsync(async (req, res, next) => {
  const { code } = req.params;

  const board = await prisma.board.findUnique({
    where: { code }
  });

  if (!board) {
    return next(new AppError('Дошку з таким кодом не знайдено', 404));
  }

  if (board.status === 'CLOSED') {
    return next(new AppError('Ця сесія вже завершена', 403));
  }

  res.status(200).json({ status: 'success', data: { board } });
});

exports.updateBoardStatus = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['ACTIVE', 'PAUSED', 'CLOSED'].includes(status)) {
    return next(new AppError('Недопустимий статус дошки', 400));
  }

  const board = await prisma.board.findUnique({ where: { id } });

  if (!board) {
    return next(new AppError('Дошку не знайдено', 404));
  }

  if (board.ownerId !== req.user.id) {
    return next(new AppError('У вас немає прав для зміни цієї дошки', 403));
  }

  const updatedBoard = await prisma.board.update({
    where: { id },
    data: { status }
  });

  req.app.get('io').to(id).emit('board_status_changed', status);

  res.status(200).json({ status: 'success', data: { board: updatedBoard } });
});

exports.deleteBoard = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const board = await prisma.board.findUnique({ where: { id } });

  if (!board) {
    return next(new AppError('Дошку не знайдено', 404));
  }

  if (board.ownerId !== req.user.id) {
    return next(new AppError('У вас немає прав для видалення цієї дошки', 403));
  }

  await prisma.board.delete({ where: { id } });

  res.status(204).json({ status: 'success', data: null });
});

exports.getBoardById = catchAsync(async (req, res, next) => {
  const board = await prisma.board.findUnique({ where: { id: req.params.id } });
  if (!board) return next(new AppError('Дошку не знайдено', 404));
  res.status(200).json({ status: 'success', data: { board } });
});