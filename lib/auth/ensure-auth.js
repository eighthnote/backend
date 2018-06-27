/* eslint no-console: off */
const { verify } = require('./token-service');

module.exports = function() {
  return (req, res, next) => {

    const token = req.get('Authorization');

    try {
      if(!token) return next({ status: 400, error: 'Unauthorized' });

      const payload = verify(token);
      req.account = payload;
      next();
    }
    catch(err) {
      next({
        status: 401,
        error: 'Invalid token.'
      });
    }
  };
};