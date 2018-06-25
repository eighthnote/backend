const router = require('express').Router();
const User = require('../models/User');
const errorHandler = require('../utils/error-handler');

module.exports = router
  .post('/users', (req, res) => {
    const user = req.body;
    return new User(user).save()
      .then(user => res.json(user))
      .catch(err => errorHandler(err, req, res));
  })
  .get('/users/:id', (req, res) => {
    User.findById(req.params.id)
      .lean()
      .then(user => res.json(user))
      .catch(err => errorHandler(err, req, res));
  });
// update own info: includes adding and removing a friend
