const router = require('express').Router();
const User = require('../models/User');
const errorHandler = require('../utils/error-handler');

module.exports = router
  // sign up
  .post('/users', (req, res) => {
    const user = req.body;
    return new User(user).save()
      .then(user => res.json(user))
      .catch(err => errorHandler(err, req, res));
  })
  // sign in
  .get('/users/:id', (req, res) => {
    User.findById(req.params.id)
      .select('firstName lastName pictureUrl contact availability friends giving requesting plans')
      .lean()
      .then(user => res.json(user))
      .catch(err => errorHandler(err, req, res));
  })
  // get friends
  .get('/users/:id/friends', (req, res) => {
    User.findById(req.params.id)
      .populate('friends', 'firstName lastName pictureUrl')
      .lean()
      .then(friends => res.json(friends))
      .catch(err => errorHandler(err, req, res));
  })
  // populate a specific 
  .get('/users/:id/friends/:id', (req, res) => {
    User.findById(req.params.id)
      .lean()
      .then(user => res.json(user))
      .catch(err => errorHandler(err, req, res));
  })




;
// update own info: includes adding and removing a friend