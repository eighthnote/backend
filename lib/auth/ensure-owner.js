/* eslint no-console: off */
const jwt = require('jsonwebtoken');

module.exports = function() {
  return (req, res, next) => {

    const token = req.get('Authorization');
    const userId = req.get('userId');

    try {
      if(!token) return next({ code: 400, error: 'Unauthorized' });

      const decodedToken = jwt.decode(token);
      const decodedId = decodedToken.id;

      if(decodedId != userId) return next({ code: 400, error: 'Unauthorized' });

      next();
    }
    catch(err) {
      next({
        code: 401,
        error: 'Invalid token.'
      });
    }
  };
};