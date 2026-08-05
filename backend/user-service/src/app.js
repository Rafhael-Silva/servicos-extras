const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const logger = require('./config/logger');

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

app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({
    message: 'Erro interno do servidor.',
  });
});

module.exports = app;
