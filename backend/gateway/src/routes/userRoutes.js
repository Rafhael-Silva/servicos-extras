const express = require('express');
const rateLimit = require('../middlewares/rateLimit');
const authenticateToken = require('../middlewares/authenticateToken');
const serviceProxies = require('../proxy/serviceProxies');

const router = express.Router();

router.use(
  rateLimit.userServiceLimit,
  authenticateToken,
  serviceProxies.userProxy,
);

module.exports = router;
