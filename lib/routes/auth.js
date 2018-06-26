const Router = require('express').Router;
const router = Router();
const Account = require('../models/Account');
const User = require('../models/User');
const ensureAuth = require('../auth/ensure-auth')();
const { sign } = require('../auth/token-service');
const bodyParser = require('body-parser').json();

function hasEmailAndPassword(req, res, next) {
  const user = req.body;
  if(!user || !user.email || !user.password) {
    return next({
      code: 400,
      error: 'Name, email, and password must be provided'
    });
  }
  next();
}

router
  .get('/verify', ensureAuth, (req, res) => {
    res.send({ valid: true });
  })

  .post('/signup', bodyParser, hasEmailAndPassword, (req, res, next) => {
    const { email, password, firstName, lastName } = req.body;
    delete req.body.password;

    Account.exists({ email })
      .then(exists => {
        if (exists) { throw { code: 400, error: 'Email already in use.' }; }
        const account = new Account({ email });
        account.generateHash(password);
        return account.save();
      })
      .then(account => {
        res.json({ token: sign(account) });
        new User({ email, firstName, lastName, _id: account._id }).save();
      })
      .catch(next);
  })

  .post('/signin', (req, res, next) => {
    const { body } = req;
    const { email, password } = body;
    delete body.password;

    Account.findOne({ email })
      .then(account => {
        if(!account || !account.comparePassword(password)) throw {
          status: 401,
          error: 'Invalid email or password'
        };
        res.json({ token: sign(account) });
      })
      .catch(next);
  });

module.exports = router;