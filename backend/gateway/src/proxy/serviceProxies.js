const createProxy = require('./createProxy');

const authProxy = createProxy(process.env.URL_AUTH_SERVICE, '/api/auth');

const userProxy = createProxy(process.env.URL_USER_SERVICE, '/api/user');

module.exports = {
  authProxy,
  userProxy,
};
