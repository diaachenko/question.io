const express = require('express');
const cors = require('cors');
const path = require('path');
const AppError = require('./utils/AppError');
const errorHandler = require('./middlewares/errorHandler');
const authRoutes = require('./routes/authRoutes');
const boardRoutes = require('./routes/boardRoutes');
const questionRoutes = require('./routes/questionRoutes');
const commentRoutes = require('./routes/commentRoutes');

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/boards', boardRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/comments', commentRoutes);

// Якщо запит тут, значить жоден роут вище його не перехопив
app.all('*', (req, res, next) => {
  next(new AppError(`Маршрут ${req.originalUrl} не знайдено на сервері`, 404));
});

app.use(errorHandler);

module.exports = app;