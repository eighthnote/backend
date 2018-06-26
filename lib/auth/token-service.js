require('dotenv').config();
const jwt = require('jsonwebtoken');
const appSecret = process.env.APP_SECRET;

module.exports = {
  sign(user) {
    const payload = {
      id: user._id
    };
    return jwt.sign(payload, appSecret);
  },
  verify(token) {
    return jwt.verify(token, appSecret);
  }
};