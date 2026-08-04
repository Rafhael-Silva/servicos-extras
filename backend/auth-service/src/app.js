const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookie = require('cookie-parser');
const { errorHandler } = require('./middlewares');

const authRoutes = require('./routes/authRoutes');

const app = express();

const configCors = {
  origin: process.env.FRONTEND_URL,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true,
};

app.use(
  helmet({
    contentSecurityPolicy: false,
  }),
);
app.use(cors(configCors));

app.use(cookie());

app.use(express.json({ limit: '50kb' }));

app.use('/api/auth', authRoutes);

app.use(errorHandler);

module.exports = app;
