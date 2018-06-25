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
      .lean()
      .select('firstName lastName pictureUrl contact availability friends giving requesting plans')
      .then(user => res.json(user))
      .catch(err => errorHandler(err, req, res));
  })
  // update profile
  .put('/users/:id', (req, res) => {
    return User.findByIdAndUpdate(req.params.id, req.body, {new: true})
      .then(updated => res.json(updated))
      .catch(err => errorHandler(err, req, res));
  })
  // add a friend
  .put('/users/:id/friends', (req, res) => {
    return User.findByIdAndUpdate(req.params.id, {
      $push: {friends: req.body.friendId}
    }, {new: true})
      .then(updated => res.json(updated))
      .catch(err => errorHandler(err, req, res));
  })
  // get friends list; returns an array of minimal friends objects
  .get('/users/:id/friends', (req, res) => {
    User.findById(req.params.id)
      .populate('friends', 'firstName lastName pictureUrl')
      .lean()
      .then(body => res.json(body.friends))
      .catch(err => errorHandler(err, req, res));
  })
  // populate a single friend's profile
  .get('/users/:id/friends/:id', (req, res) => {
    User.findById(req.params.id)
      .lean()
      .select('firstName lastName pictureUrl contact availability giving requesting')
      .then(user => res.json(user))
      .catch(err => errorHandler(err, req, res));
  });