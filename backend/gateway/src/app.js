const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const serviceProxies = require('./proxy/serviceProxies');
const errorHandler = require('./middlewares/errorHandler');

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

app.use('/api/auth', serviceProxies.authProxy);
app.use('/api/user', serviceProxies.userProxy);

app.use(errorHandler);

module.exports = app;
