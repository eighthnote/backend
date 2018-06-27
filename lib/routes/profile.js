const router = require('express').Router();
const User = require('../models/User');
const Shareable = require('../models/Shareable');
const errorHandler = require('../utils/error-handler');
const ensureAuth = require('../auth/ensure-auth')();
const jwt = require('jsonwebtoken');

module.exports = router
  // retrieve own profile
  .get('/profile', ensureAuth, (req, res) => {
    const userId = jwt.decode(req.get('Authorization')).id;

    User.findById(userId)
      .lean()
      .populate('shareables')
      .then(user => res.json(user))
      .catch(err => errorHandler(err, req, res));
  })

  // update profile
  .put('/profile', ensureAuth, (req, res) => {
    const userId = jwt.decode(req.get('Authorization')).id;

    return User.findByIdAndUpdate(userId, req.body, {new: true})
      .then(updated => res.json(updated))
      .catch(err => errorHandler(err, req, res));
  })

  // send someone a friend request
  // expects the EMAIL OF THE FRIEND who is receiving the request in the BODY OF THE REQUEST as email
  .put('/profile/friends/', ensureAuth, (req, res) => {
    const userId = jwt.decode(req.get('Authorization')).id;

    const query = { email: req.body.email };
    return User.findOneAndUpdate(query, {
      $push: {pendingFriends: userId}
    }, {new: true})
      .then(updated => res.json(updated))
      .catch(err => errorHandler(err, req, res));
  })

  // confirm a friend request
  .put('/profile/friends/confirm/:id', ensureAuth, (req, res) => {
    const userId = jwt.decode(req.get('Authorization')).id;

    return User.findByIdAndUpdate(req.params.id, {
      $push: {friends: userId},
    }, {new: true})
      .then(() => {
        return User.findByIdAndUpdate(userId, {
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
    const userId = jwt.decode(req.get('Authorization')).id;
    User.findById(userId)
      .populate('friends', 'firstName lastName pictureUrl')
      .lean()
      .then(body => res.json(body.friends))
      .catch(err => errorHandler(err, req, res));
  })

  // populate a single friend's profile
  // returns an empty object if user is not friends with params.id profile
  .get('/profile/friends/:id', ensureAuth, (req, res) => {
    const userId = jwt.decode(req.get('Authorization')).id;
    const friendId = req.params.id;

    User.findById(userId)
      .populate('friends')
      .then((body) => {
        body.friends.forEach((friend) => {
          if(friend._id.toString() === friendId) {
            return User.findById(friendId)
              .lean()
              .select('firstName lastName pictureUrl email contact callOrText availability shareables')            
              .then(user => res.json(user))
              .catch(err => errorHandler(err, req, res));
          }
        });
      })
      .catch(err => errorHandler(err, req, res));
  })

  // add a new Shareable
  .post('/profile/shareables', ensureAuth, (req, res) => {
    const shareable = req.body;
    const userId = jwt.decode(req.get('Authorization')).id;

    return new Shareable(shareable).save()
      .then(shareable => {
        const { _id } = shareable;
        return Promise.all([shareable, User.findByIdAndUpdate(userId, {
          $push: { shareables: _id }
        }, {new: true})]);
      })
      .then(([shareable]) => res.json(shareable))
      .catch(err => errorHandler(err, req, res));
  })

  // get all personal shareables
  .get('/profile/shareables', ensureAuth, (req, res) => {
    const userId = jwt.decode(req.get('Authorization')).id;
    User.findById(userId)
      .populate('shareables')
      .lean()
      .then(body => res.json(body.shareables))
      .catch(err => errorHandler(err, req, res));
  })

  // update own shareable
  .put('/profile/shareables/:id', ensureAuth, (req, res) => {
    const userId = jwt.decode(req.get('Authorization')).id;
    const shareableId = req.params.id;
    return User.findById(userId)
      .populate('shareables')
      .then((body) => {
        body.shareables.forEach((shareable) => {
          if(shareable._id.toString() === shareableId) {
            return Shareable.findByIdAndUpdate(req.params.id, req.body, {new: true})
              .then(updated => res.json(updated))
              .catch(err => errorHandler(err, req, res));                  
          }
        });
      });
  })

  // get all feed shareables
  // returns an ARRAY OF OBJECTS
  .get('/profile/feed', ensureAuth, (req, res) => {
    const userId = jwt.decode(req.get('Authorization')).id;
    const feed = [];
    User.findById(userId)
      .populate({
        path: 'friends',
        populate: {
          path: 'shareables',
          select: 'confirmed date expiration groupSize name participants priority repeats type'
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

  // delete a shareable
  .delete('/profile/shareables/:id', ensureAuth, (req, res) => {
    const userId = jwt.decode(req.get('Authorization')).id;
    const shareableId = req.params.id;
    return User.findById(userId)
      .populate('shareables')
      .then((body) => {
        body.shareables.forEach((shareable) => {
          if(shareable._id.toString() === shareableId) {
            Shareable.findByIdAndRemove(shareableId)
              .then(() => {
                return User.findByIdAndUpdate(userId, {
                  $pull:{ shareables: shareableId },
                }, {new: true});
              })
              .then(updated => res.json(updated))
              .catch(err => errorHandler(err, req, res));                  
          }
        });
      });
  })

  // delete a friend
  .delete('/profile/friends/:id', ensureAuth, (req, res) => {
    const userId = jwt.decode(req.get('Authorization')).id;
    const friendId = req.params.id;
    User.findById(userId)
      .populate('friends')
      .then((body) => {
        body.friends.forEach((friend) => {
          if(friend._id.toString() === friendId) {
            return User.findByIdAndUpdate(userId, {
              $pull:{ friends: friendId }
            })
              .then(() => {
                return User.findByIdAndUpdate(friendId, {
                  $pull:{ friends: userId }
                });
              });
          }
        });
      })
      .then(removed => res.json(removed))
      .catch(err => errorHandler(err, req, res));
  })

  // delete a profile
  .delete('/profile', ensureAuth, (req, res) => {
    const userId = jwt.decode(req.get('Authorization')).id;
    User.findByIdAndRemove(userId)
      .then(removed => res.json(removed))
      .catch(err => errorHandler(err, req, res));
  });