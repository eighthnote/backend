const router = require('express').Router();
const User = require('../models/User');
const Shareable = require('../models/Shareable');
const errorHandler = require('../utils/error-handler');
const ensureAuth = require('../auth/ensure-auth')();
const ensureOwner = require('../auth/ensure-owner')();

module.exports = router
  // retrieve own profile
  // requires 'Authorization' in the header as a signed TOKEN
  // requires 'userId' in the header as the user's id
  .get('/profile', ensureAuth, ensureOwner, (req, res) => {
    const userId = req.get('userId');

    User.findById(userId)
      .lean()
      .populate('shareables')
      .then(user => res.json(user))
      .catch(err => errorHandler(err, req, res));
  })

  // update profile
  .put('/profile', ensureAuth, ensureOwner, (req, res) => {
    const userId = req.get('userId');

    return User.findByIdAndUpdate(userId, req.body, {new: true})
      .then(updated => res.json(updated))
      .catch(err => errorHandler(err, req, res));
  })

  // send someone a friend request
  // expects the EMAIL OF THE FRIEND who is receiving the request in the BODY OF THE REQUEST as email
  // expects ID OF THE USER in the BODY OF THE REQUEST as .id
  .put('/profile/friends/', ensureAuth, (req, res) => {
    const query = { email: req.body.email };
    return User.findOneAndUpdate(query, {
      $push: {pendingFriends: req.body.id}
    }, {new: true})
      .then(updated => res.json(updated))
      .catch(err => errorHandler(err, req, res));
  })

  // confirm a friend request
  // expects the ID OF THE FRIEND as the PARAMS.ID
  // expects the ID OF THE USER as the .id PROPERTY ON THE BODY
  .put('/profile/friends/:id/confirm', ensureAuth, ensureOwner, (req, res) => {
    return User.findByIdAndUpdate(req.params.id, {
      $push: {friends: req.body.userId},
    }, {new: true})
      .then(() => {
        return User.findByIdAndUpdate(req.body.userId, {
          $push: {friends: req.params.id},
          $pull: {pendingFriends: req.params.id},
        }, {new: true})
          .then(updated => res.json(updated))
          .catch(err => errorHandler(err, req, res));  
      })
      .then(updated => res.json(updated))
      .catch(err => errorHandler(err, req, res));
  })

  // get all friends with minimal detail
  .get('/profile/friends', ensureAuth, (req, res) => {
    User.findById(req.params.id)
      .populate('friends', 'firstName lastName pictureUrl')
      .lean()
      .then(body => res.json(body.friends))
      .catch(err => errorHandler(err, req, res));
  })

  // populate a single friend's profile
  .get('/profile/friends/:id', ensureAuth, (req, res) => {
    User.findById(req.params.id)
      .lean()
      .populate('shareables', 'name priority date expiration type groupSize')
      .select('firstName lastName pictureUrl contact availability shareables')
      .then(user => res.json(user))
      .catch(err => errorHandler(err, req, res));
  })

  // add a new Shareable
  .post('/profile/shareables', ensureAuth, (req, res) => {
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
  .get('/profile/shareables', ensureAuth, (req, res) => {
    User.findById(req.params.id)
      .populate('shareables')
      .lean()
      .then(body => res.json(body.shareables))
      .catch(err => errorHandler(err, req, res));
  })

  // get a single personal shareable
  .get('/profile/shareables/:id', ensureAuth, (req, res) => {
    Shareable.findById(req.params.id)
      .lean()
      .then(shareable => res.json(shareable))
      .catch(err => errorHandler(err, req, res));
  })

  // update own shareable. expects an object with keys and values of a shareable to be updated
  .put('/profile/shareables/:id', ensureAuth, (req, res) => {
    return Shareable.findByIdAndUpdate(req.params.id, req.body, {new: true})
      .then(updated => res.json(updated))
      .catch(err => errorHandler(err, req, res));
  })

  // get all feed shareables with reduced detail
  // returns an array of objects containing reduced detail of shareables
  .get('/profile/feed', ensureAuth, (req, res) => {
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
  .get('/profile/feed/:id', ensureAuth, (req, res) => {
    Shareable.findById(req.params.id)
      .lean()
      .select('name priority date expiration type groupSize')
      .then(shareable => res.json(shareable))
      .catch(err => errorHandler(err, req, res));
  })

  // delete a shareable
  // expects the ID OF THE USER as the id PROPERTY IN THE BODY
  .delete('/profile/shareables/:id', ensureAuth, (req, res) => {
    Shareable.findByIdAndRemove(req.params.id)
      .then(() => {
        return User.findByIdAndUpdate(req.body.id, {
          $pull:{ shareables: req.params.id }
        });
      })
      .then(removed => res.json(removed))
      .catch(err => errorHandler(err, req, res));
  })

  // delete a friend
  // expects the ID OF THE FRIEND as a PARAM
  // expects the ID OF THE USER as the id PROPERTY ON THE BODY
  .delete('/profile/friends/:id', ensureAuth, (req, res) => {
    Shareable.findByIdAndRemove(req.params.id)
      .then(() => {
        return User.findByIdAndUpdate(req.body.id, {
          $pull:{ friends: req.params.id }
        });
      })
      .then(() => {
        return User.findByIdAndUpdate(req.params.id, {
          $pull:{ friends: req.body.id }
        });
      })
      .then(removed => res.json(removed))
      .catch(err => errorHandler(err, req, res));
  })

// delete a profile
  .delete('/profile', ensureAuth, (req, res) => {
    User.findByIdAndRemove(req.params.id)
      .then(removed => res.json(removed))
      .catch(err => errorHandler(err, req, res));
  });