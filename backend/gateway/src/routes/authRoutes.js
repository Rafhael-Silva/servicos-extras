const express = require('express');
const rateLimit = require('../middlewares/rateLimit');
const authenticateToken = require('../middlewares/authenticateToken');
const serviceProxies = require('../proxy/serviceProxies');

const router = express.Router();

router.patch(
  '/change-password',
  rateLimit.authServiceLimit,
  authenticateToken,
  serviceProxies.authProxy,
);
router.get(
  '/me',
  rateLimit.authServiceLimit,
  authenticateToken,
  serviceProxies.authProxy,
);
router.post(
  '/logout',
  rateLimit.authServiceLimit,
  authenticateToken,
  serviceProxies.authProxy,
);

router.use(rateLimit.authServiceLimit, serviceProxies.authProxy);

module.exports = router;
