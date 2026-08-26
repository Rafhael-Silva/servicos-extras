const createProxy = require('./createProxy');

const authProxy = createProxy(process.env.URL_AUTH_SERVICE);

const userProxy = createProxy(process.env.URL_USER_SERVICE);

module.exports = {
  authProxy,
  userProxy,
};
