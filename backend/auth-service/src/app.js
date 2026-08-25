const express = require('express');
const cookie = require('cookie-parser');
const { errorHandler } = require('./middlewares');

const authRoutes = require('./routes/authRoutes');

const app = express();

app.use(cookie());

app.use(express.json({ limit: '50kb' }));

app.use('/api/auth', authRoutes);

app.use(errorHandler);

module.exports = app;
