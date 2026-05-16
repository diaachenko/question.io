const express = require('express');
const cors = require('cors');
const path = require('path');
const AppError = require('./utils/AppError');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// підключка рутів
// app.use('/api/auth', authRoutes);
// app.use('/api/boards', boardRoutes);

// Якщо запит тут, значить жоден роут вище його не перехопив
app.all('*', (req, res, next) => {
  next(new AppError(`Маршрут ${req.originalUrl} не знайдено на сервері`, 404));
});

app.use(errorHandler);

module.exports = app;