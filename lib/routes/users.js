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
      .populate('shareables')
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

  // send someone a friend request
  // expects the ID OF THE FRIEND who is receiving the request as a PARAM
  // expects ID OF THE USER in the BODY OF THE REQUEST as .id
  .put('/users/:id/friends/:id', (req, res) => {
    return User.findByIdAndUpdate(req.params.id, {
      $push: {pendingFriends: req.body.id}
    }, {new: true})
      .then(updated => res.json(updated))
      .catch(err => errorHandler(err, req, res));
  })

  // confirm a friend request
  // expects the ID OF THE FRIEND as the PARAMS.ID
  // expects the ID OF THE USER as the .id PROPERTY ON THE BODY
  .put('/users/:id/friends/:id', (req, res) => {
    return User.findByIdAndUpdate(req.params.id, {
      $push: {friends: req.body.id},
      $pull: {pendingFriends: req.body.id}
    })
      .then(() => {
        return User.findByIdAndUpdate(req.body.id, {
          $push: {friends: req.params.id},
        })
          .then(updated => res.json(updated))
          .catch(err => errorHandler(err, req, res));  
      })
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
      .populate('shareables', 'name priority date expiration type groupSize')
      .select('firstName lastName pictureUrl contact availability shareables')
      .then(user => res.json(user))
      .catch(err => errorHandler(err, req, res));
  })

  // add a new Shareable
  .post('/users/:id/shareables', (req, res) => {
    const { shareable } = req.body;
    const userId = req.params.id;
    return new Shareable(shareable).save()
      .then(addition => {
        const { _id } = addition;
        return Promise.all([addition, User.findByIdAndUpdate(userId, {
          $push: { shareables: _id }
        }, {new: true})]);
      })
      .then(([addition]) => res.json(addition))
      .catch(err => errorHandler(err, req, res));
  })

  // get all personal shareables with minimal details
  .get('/users/:id/shareables', (req, res) => {
    User.findById(req.params.id)
      .populate('shareables')
      .lean()
      .then(body => res.json(body.shareables))
      .catch(err => errorHandler(err, req, res));
  })

  // get a single personal shareable
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
  })

  // get all feed shareables with reduced detail
  // returns an array of objects containing reduced detail of shareables
  .get('/users/:id/feed', (req, res) => {
    const feed = [];
    User.findById(req.params.id)
      .populate({
        path: 'friends',
        populate: {
          path: 'shareables',
          select: 'name priority date expiration type groupSize'
        }
      })
      .lean()
      .then(body => {
        body.friends.forEach((friend) => {
          friend.shareables.forEach((shareable) => {
            if(shareable.priority === 2
              && (shareable.type === 'giving' || shareable.type === 'requesting'))
            { feed.push(shareable); }
          });
        });
        res.json(feed);
      })        
      .catch(err => errorHandler(err, req, res));
  })

  // get a single friend's shareable with details
  .get('/users/:id/feed/:id', (req, res) => {
    Shareable.findById(req.params.id)
      .lean()
      .select('name priority date expiration type groupSize')
      .then(shareable => res.json(shareable))
      .catch(err => errorHandler(err, req, res));
  });