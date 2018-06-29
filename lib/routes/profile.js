const router = require('express').Router();
const User = require('../models/User');
const Shareable = require('../models/Shareable');
const errorHandler = require('../utils/error-handler');
const ensureAuth = require('../auth/ensure-auth')();

module.exports = router
  .get('/profile', ensureAuth, (req, res) => {
    User.findById(req.account.id)
      .lean()
      .populate('shareables')
      .then(user => res.json(user))
      .catch(err => errorHandler(err, req, res));
  })

  .put('/profile', ensureAuth, (req, res) => {
    const {
      firstName,
      lastName,
      pictureUrl,
      email,
      contact,
      availability
    } = req.body;

    const update = {
      firstName,
      lastName,
      pictureUrl,
      email,
      contact,
      availability
    };
    Object.keys(update).forEach(key => {if(!update[key]) delete update[key];});

    return User.findByIdAndUpdate(req.account.id, update, {new: true})
      .then(updated => res.json(updated))
      .catch(err => errorHandler(err, req, res));
  })

  // send a friend request
  .put('/profile/friends/', ensureAuth, (req, res) => {
    const query = req.body;
    return User.findOne(query)
      .populate('friends')
      .then(result => {

        let alreadyFriend = false;
        result.friends.forEach((friend) => {
          friend._id.toString() === req.account.id ? alreadyFriend = true : alreadyFriend = false;
        });

        if((alreadyFriend === false) && (result._id.toString() !== req.account.id)) {
          return User.findOneAndUpdate(query, {
            $addToSet: {pendingFriends: req.account.id}
          }, {new: true})
            .then(updated => res.json(updated))
            .catch(err => errorHandler(err, req, res));
        } else res.json('Cannot add yourself, or someone who is already a friend.');
      })
      .catch(err => errorHandler(err, req, res));
  })

  // confirm a friend request
  .put('/profile/friends/confirm/:id', ensureAuth, (req, res) => {
    return User.findByIdAndUpdate(req.params.id, {
      $addToSet: {friends: req.account.id},
    }, {new: true})
      .then(() => {
        return User.findByIdAndUpdate(req.account.id, {
          $addToSet: {friends: req.params.id},
          $pull: {pendingFriends: req.params.id},
        }, {new: true})
          .then(updated => res.json(updated))
          .catch(err => errorHandler(err, req, res));  
      })
      .then(updated => res.json(updated))
      .catch(err => errorHandler(err, req, res));
  })

  .get('/profile/friends', ensureAuth, (req, res) => {
    User.findById(req.account.id)
      .populate('friends', 'firstName lastName pictureUrl')
      .populate('pendingFriends', 'firstName lastName pictureUrl')
      .lean()
      .then(body => res.json([body.friends, body.pendingFriends]))
      .catch(err => errorHandler(err, req, res));
  })

  .get('/profile/friends/:id', ensureAuth, (req, res) => {
    User.findById(req.account.id)
      .populate('friends')
      .then((body) => {
        body.friends.forEach((friend) => {
          if(friend._id.toString() === req.params.id) {
            return User.findById(req.params.id)
              .populate('shareables')
              .select('firstName lastName pictureUrl email contact availability shareables')            
              .then(user => res.json(user))
              .catch(err => errorHandler(err, req, res));
          }
        });
      })
      .catch(err => errorHandler(err, req, res));
  })
  .post('/profile/shareables', ensureAuth, (req, res) => {
    return new Shareable(req.body).save()
      .then(shareable => {
        const { _id } = shareable;
        return Promise.all([shareable, User.findByIdAndUpdate(req.account.id, {
          $addToSet: { shareables: _id }
        }, {new: true})]);
      })
      .then(([shareable]) => res.json(shareable))
      .catch(err => errorHandler(err, req, res));
  })

  .get('/profile/shareables', ensureAuth, (req, res) => {
    User.findById(req.account.id)
      .populate('shareables')
      .lean()
      .then(body => res.json(body.shareables))
      .catch(err => errorHandler(err, req, res));
  })

  .put('/profile/shareables/:id', ensureAuth, (req, res) => {
    return User.findById(req.account.id)
      .populate('shareables')
      .then((body) => {
        body.shareables.forEach((shareable) => {
          if(shareable._id.toString() === req.params.id) {
            return Shareable.findByIdAndUpdate(req.params.id, req.body, {new: true})
              .then(updated => res.json(updated))
              .catch(err => errorHandler(err, req, res));                  
          }
        });
      });
  })

  // returns an ARRAY OF OBJECTS
  .get('/profile/feed', ensureAuth, (req, res) => {
    const feed = [];
    User.findById(req.account.id)
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
            {
              shareable.owner = friend.firstName;
              feed.push(shareable);
            }
          });
        });
        res.json(feed);
      })        
      .catch(err => errorHandler(err, req, res));
  })

  .delete('/profile/shareables/:id', ensureAuth, (req, res) => {
    return User.findById(req.account.id)
      .populate('shareables')
      .then((body) => {
        body.shareables.forEach((shareable) => {
          if(shareable._id.toString() === req.params.id) {
            Shareable.findByIdAndRemove(req.params.id)
              .then(() => {
                return User.findByIdAndUpdate(req.account.id, {
                  $pull:{ shareables: req.params.id },
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
    const friendId = req.params.id;
    User.findById(req.account.id)
      .populate('friends')
      .then((body) => {
        body.friends.forEach((friend) => {
          if(friend._id.toString() === friendId) {
            return User.findByIdAndUpdate(req.account.id, {
              $pull:{ friends: friendId }
            })
              .then(() => {
                return User.findByIdAndUpdate(friendId, {
                  $pull:{ friends: req.account.id }
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
    User.findByIdAndRemove(req.account.id)
      .then(removed => res.json(removed))
      .catch(err => errorHandler(err, req, res));
  });