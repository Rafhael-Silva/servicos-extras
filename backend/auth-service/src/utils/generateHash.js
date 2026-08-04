const crypto = require('crypto');

const generateHash = (value) => {
  return crypto.createHash('sha256').update(value).digest('hex');
};

module.exports = generateHash;
