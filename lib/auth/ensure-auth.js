/* eslint no-console: off */
const { verify } = require('./token-service');
const jwt = require('jsonwebtoken');

module.exports = function() {
  return (req, res, next) => {

    const token = req.get('Authorization');
    const userId = req.get('userId');

    try {
      if(!token) return next({ status: 400, error: 'Unauthorized' });

      const decodedToken = jwt.decode(token);
      const decodedId = decodedToken.id;

      if(decodedId != userId) return next({ code: 400, error: 'Unauthorized' });

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