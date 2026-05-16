const prisma = require('../utils/prisma');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

exports.createQuestion = catchAsync(async (req, res, next) => {
  const { content, boardId } = req.body;

  if (!content || !boardId) {
    return next(new AppError('Вкажіть текст питання та ID дошки', 400));
  }

  const board = await prisma.board.findUnique({ where: { id: boardId } });
  if (!board) return next(new AppError('Дошку не знайдено', 404));
  if (board.status === 'CLOSED') return next(new AppError('Сесія закрита, не можна ставити нові питання', 403));

  let imageUrl = null;
  if (req.file) {
    imageUrl = `/uploads/${req.file.filename}`;
  }

  const question = await prisma.question.create({
    data: {
      content,
      imageUrl,
      boardId,
      authorId: req.user.id
    },
    include: {
      author: { select: { id: true, name: true, isGuest: true } }
    }
  });

  const io = req.app.get('io');
  io.to(boardId).emit('new_question', question);

  res.status(201).json({ status: 'success', data: { question } });
});

exports.getQuestions = catchAsync(async (req, res, next) => {
  const { boardId } = req.params;

  const questions = await prisma.question.findMany({
    where: { boardId },
    include: {
      author: { select: { name: true, id: true } },
      votes: {
        where: { userId: req.user.id },
        select: { value: true }
      }
    },
    orderBy: [
      { rating: 'desc' },
      { createdAt: 'desc' }
    ]
  });

  res.status(200).json({ status: 'success', results: questions.length, data: { questions } });
});

exports.voteQuestion = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { value } = req.body;

  if (![1, -1].includes(value)) return next(new AppError('Значення голосу має бути 1 або -1', 400));

  const question = await prisma.question.findUnique({ where: { id } });
  if (!question) return next(new AppError('Питання не знайдено', 404));

  const existingVote = await prisma.vote.findUnique({
    where: { userId_questionId: { userId: req.user.id, questionId: id } }
  });

  let ratingChange = 0;

  if (!existingVote) {
    await prisma.vote.create({ data: { value, userId: req.user.id, questionId: id } });
    ratingChange = value;
  } else if (existingVote.value === value) {
    await prisma.vote.delete({ where: { id: existingVote.id } });
    ratingChange = -value;
  } else {
    await prisma.vote.update({ where: { id: existingVote.id }, data: { value } });
    ratingChange = value * 2;
  }

  const updatedQuestion = await prisma.question.update({
    where: { id },
    data: { rating: { increment: ratingChange } }
  });

  req.app.get('io').to(question.boardId).emit('question_voted', { 
    questionId: id, 
    newRating: updatedQuestion.rating 
  });

  res.status(200).json({ status: 'success', data: { rating: updatedQuestion.rating } });
});

exports.markAsAnswered = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const question = await prisma.question.findUnique({ include: { board: true }, where: { id } });
  if (!question) return next(new AppError('Питання не знайдено', 404));

  if (question.board.ownerId !== req.user.id) {
    return next(new AppError('Тільки організатор може позначати питання як відповів', 403));
  }

  await prisma.question.update({
    where: { id },
    data: { status: 'ANSWERED' }
  });

  req.app.get('io').to(question.boardId).emit('question_answered', id);

  res.status(200).json({ status: 'success', message: 'Питання перенесено в архів' });
});

exports.deleteQuestion = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const question = await prisma.question.findUnique({ include: { board: true }, where: { id } });
  if (!question) return next(new AppError('Питання не знайдено', 404));

  const isAuthor = question.authorId === req.user.id;
  const isBoardOwner = question.board.ownerId === req.user.id;

  if (!isAuthor && !isBoardOwner) {
    return next(new AppError('Ви не маєте прав для видалення цього питання', 403));
  }

  await prisma.question.delete({ where: { id } });

  req.app.get('io').to(question.boardId).emit('question_deleted', id);

  res.status(204).json({ status: 'success', data: null });
});