const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const errorHandler = require('../src/middlewares/errorHandler');

const userRoutes = require('./routes/userRoutes');

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

app.use(express.json({ limit: '50kb' }));

app.use('/api/user', userRoutes);

app.use(errorHandler);

module.exports = app;
