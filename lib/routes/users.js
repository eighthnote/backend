const router = require('express').Router();
const User = require('../models/Users');
const errorHandler = require('../utils/error-handler');

module.exports = router
  .post('/users', (req, res) => {
    const user = req.body;
    return new User(user).save()
      .then(user => res.json(user))
      .catch(err => errorHandler(err, req, res));
  });