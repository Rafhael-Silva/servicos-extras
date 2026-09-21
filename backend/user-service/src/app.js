const express = require('express');
const errorHandler = require('../src/middlewares/errorHandler');

const userRoutes = require('./routes/userRoutes');

const app = express();

app.use(express.json({ limit: '50kb' }));

app.use('/api/user', userRoutes);

app.use(errorHandler);

module.exports = app;
