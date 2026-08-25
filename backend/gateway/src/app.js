const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

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

module.exports = app;
