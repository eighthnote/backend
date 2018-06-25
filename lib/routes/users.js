const router = require('express').Router();
const User = require('../models/User');
const Shareable = require('../models/Shareable');
const errorHandler = require('../utils/error-handler');

module.exports = router
  // sign up
  .post('/users', (req, res) => {
    const user = req.body;
    return new User(user).save()
      .then(user => res.json(user))
      .catch(err => errorHandler(err, req, res));
  })
  // populate own profile
  .get('/users/:id', (req, res) => {
    User.findById(req.params.id)
      .lean()
      .select('firstName lastName pictureUrl contact availability friends shareables')
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
  // get all friends with minimal detail
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
  })
  // add a new Shareable
  .post('/users/:id/shareables', (req, res) => {
    const { shareable } = req.body;
    const userId = req.params.id;
    return new Shareable(shareable).save()
      .then(body => {
        const { _id } = body;
        return User.findByIdAndUpdate(userId, {
          $push: {shareables: _id}
        }, {new: true})
          .then((body) => res.json(body))
          .catch(err => errorHandler(err, req, res));
      })
      .then((body) => res.json(body))
      .catch(err => errorHandler(err, req, res));
  })
  // get all personal shareables with minimal details
  .get('/users/:id/shareables', (req, res) => {
    User.findById(req.params.id)
      .populate('shareables', 'name priority date expiration type')
      .lean()
      .then(body => res.json(body.shareables))
      .catch(err => errorHandler(err, req, res));
  })

// get a single shareable with details
  .get('/users/:id/shareables/:id', (req, res) => {
    Shareable.findById(req.params.id)
      .lean()
      .then(shareable => res.json(shareable))
      .catch(err => errorHandler(err, req, res));
  })

// update own shareable. expects an object with keys and values of a shareable to be updated
  .put('/users/:id/shareables/:id', (req, res) => {
    return Shareable.findByIdAndUpdate(req.params.id, req.body, {new: true})
      .then(updated => res.json(updated))
      .catch(err => errorHandler(err, req, res));
  });

// get all feed shareables with minimal detail
// .get('/users/:id/feed', (req, res) => {

// });

// get a feed shareable with full detail
// .get('/users/:id/feed/:id', (req, res) => {

// });