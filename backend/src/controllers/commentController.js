const prisma = require('../utils/prisma');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

exports.createComment = catchAsync(async (req, res, next) => {
  const { content, questionId } = req.body;

  if (!content || !questionId) {
    return next(new AppError('Вкажіть текст коментаря та ID питання', 400));
  }

  const question = await prisma.question.findUnique({
    where: { id: questionId },
    select: { boardId: true, board: { select: { status: true } } }
  });

  if (!question) return next(new AppError('Питання не знайдено', 404));
  if (question.board.status === 'CLOSED') return next(new AppError('Сесія закрита, коментування недоступне', 403));

  const comment = await prisma.comment.create({
    data: {
      content,
      questionId,
      authorId: req.user.id
    },
    include: {
      author: { select: { id: true, name: true, isGuest: true } }
    }
  });

  req.app.get('io').to(question.boardId).emit('new_comment', comment);

  res.status(201).json({ status: 'success', data: { comment } });
});

exports.getComments = catchAsync(async (req, res, next) => {
  const { questionId } = req.params;

  const comments = await prisma.comment.findMany({
    where: { questionId },
    include: {
      author: { select: { id: true, name: true, isGuest: true } }
    },
    orderBy: { createdAt: 'asc' }
  });

  res.status(200).json({ status: 'success', results: comments.length, data: { comments } });
});

exports.deleteComment = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const comment = await prisma.comment.findUnique({
    where: { id },
    include: { question: { select: { boardId: true, board: { select: { ownerId: true } } } } }
  });

  if (!comment) return next(new AppError('Коментар не знайдено', 404));

  const isAuthor = comment.authorId === req.user.id;
  const isBoardOwner = comment.question.board.ownerId === req.user.id;

  if (!isAuthor && !isBoardOwner) {
    return next(new AppError('Ви не маєте прав для видалення цього коментаря', 403));
  }

  await prisma.comment.delete({ where: { id } });

  req.app.get('io').to(comment.question.boardId).emit('comment_deleted', { 
    commentId: id, 
    questionId: comment.questionId 
  });

  res.status(204).json({ status: 'success', data: null });
});