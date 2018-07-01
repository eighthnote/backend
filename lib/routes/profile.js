const router = require('express').Router();
const User = require('../models/User');
const Shareable = require('../models/Shareable');
const { updateOptions } = require('../utils/mongoose-helpers');

module.exports = router
  .get('/', (req, res, next) => {
    User.findById(req.account.id)
      .lean()
      .populate('shareables')
      .then(user => res.json(user))
      .catch(next);
  })

  .put('/', (req, res, next) => {
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

    return User.findByIdAndUpdate(req.account.id, update, updateOptions)
      .then(updated => res.json(updated))
      .catch(next);
  })

  // send a friend request
  .put('/friends', (req, res, next) => {
    const { account: { id: userId }, body: { email } } = req;
    return Promise.all([
      User.find({ email, friends: userId })
        .count(),
      User.findOne({ email, _id: userId })
    ])
      .then(([already, self]) => {
        if(already || self) throw {
          status: 403,
          error: 'Cannot add yourself, or someone who is already a friend.'
        };
        return User.findOneAndUpdate({ email }, {
          $addToSet: { pendingFriends: userId }
        }, updateOptions);
      })
      .then(() => res.json({ added: true }))
      .catch(next);
  })

  // confirm a friend request
  .put('/friends/confirm/:id', (req, res, next) => {
    const { params: { id: friendId }, account: { id: userId } } = req;
    return Promise.all([
      User.findByIdAndUpdate(friendId, {
        $addToSet: {friends: userId},
      }, updateOptions),
      User.findByIdAndUpdate(userId, {
        $addToSet: {friends: friendId},
        $pull: {pendingFriends: friendId},
      }, updateOptions)
    ])
      .then(([,user]) => res.json(user))
      .catch(next);
  })

  .get('/friends', (req, res, next) => {
    User.findById(req.account.id)
      .populate('friends', 'firstName lastName pictureUrl')
      .populate('pendingFriends', 'firstName lastName pictureUrl')
      .lean()
      .then(body => res.json([body.friends, body.pendingFriends]))
      .catch(next);
  })

  .get('/friends/:id', (req, res, next) => {
    const { params: { id: friendId }, account: { id: userId } } = req;
    User.findById(userId)
      .populate('friends')
      .then((body) => {
        body.friends.forEach((friend) => {
          if(friend._id.toString() === friendId) {
            return User.findById(friendId)
              .populate('shareables')
              .select('firstName lastName pictureUrl email contact availability shareables')            
              .then(user => res.json(user))
              .catch(next);
          }
        });
      })
      .catch(next);
  })

  .post('/shareables', (req, res, next) => {
    const { body, account: { id } } = req; 
    return new Shareable(body).save()
      .then(shareable => {
        const { _id } = shareable;
        return Promise.all([shareable, User.findByIdAndUpdate(id, {
          $addToSet: { shareables: _id }
        }, updateOptions)]);
      })
      .then(([shareable]) => res.json(shareable))
      .catch(next);
  })

  .get('/shareables', (req, res, next) => {
    User.findById(req.account.id)
      .populate('shareables')
      .lean()
      .then(body => res.json(body.shareables))
      .catch(next);
  })

  .put('/shareables/:id', (req, res, next) => {
    const { params: { id: shareableId }, account: { id: userId } } = req;
    return User.findById(userId)
      .populate('shareables')
      .then((body) => {
        body.shareables.forEach((shareable) => {
          if(shareable._id.toString() === shareableId) {
            return Shareable.findByIdAndUpdate(shareableId, req.body, updateOptions)
              .then(updated => res.json(updated))
              .catch(next);                  
          }
        });
      })
      .catch(next);
  })

  .get('/feed', (req, res, next) => {
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
              shareable.ownerId = friend._id;
              feed.push(shareable);
            }
          });
        });
        res.json(feed);
      })        
      .catch(next);
  })

  .delete('/shareables/:id', (req, res, next) => {
    const { params: { id: shareableId }, account: { id: userId } } = req;    
    return User.findById(userId)
      .populate('shareables')
      .then((body) => {
        body.shareables.forEach((shareable) => {
          if(shareable._id.toString() === shareableId) {
            Shareable.findByIdAndRemove(shareableId)
              .then(() => {
                return User.findByIdAndUpdate(userId, {
                  $pull:{ shareables: shareableId },
                }, updateOptions);
              })
              .then(updated => res.json(updated))
              .catch(next);                  
          }
        });
      })
      .catch(next);
  })

  .delete('/friends/:id', (req, res, next) => {
    const { params: { id: friendId }, account: { id: userId } } = req;
    User.findById(userId)
      .populate('friends')
      .then((body) => {
        body.friends.forEach((friend) => {
          if(friend._id.toString() === friendId) {
            return User.findByIdAndUpdate(userId, {
              $pull:{ friends: friendId }
            })
              .then(() => {
                return User.findByIdAndUpdate(friendId, { $pull:{ friends: userId } });
              })
              .then(removed => res.json(removed))
              .catch(next);
          }
        });
      })
      .catch(next);
  })

  .delete('/', (req, res, next) => {
    User.findByIdAndRemove(req.account.id)
      .then(removed => res.json(removed))
      .catch(next);
  });