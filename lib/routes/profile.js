const router = require('express').Router();
const User = require('../models/User');
const Shareable = require('../models/Shareable');
const { updateOptions } = require('../utils/mongoose-helpers');
const { Types } = require('mongoose');

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

    // control what user may update
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
          error: 'Cannot add yourself or someone who is already a friend.'
        };
        return User.findOneAndUpdate({ email }, {
          $addToSet: { pendingFriends: userId }
        }, updateOptions);
      })
      .then(() => res.json({ requestReceived: true }))
      .catch(next);
  })

  // confirm a friend request
  .put('/friends/confirm/:id', (req, res, next) => {
    const { params: { id: friendId }, account: { id: userId } } = req;
    return Promise.all([
      User.findByIdAndUpdate(friendId, {
        $addToSet: { friends: userId }
      }, updateOptions),
      User.findByIdAndUpdate(userId, {
        $addToSet: { friends: friendId },
        $pull: { pendingFriends: friendId }
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
      .then(({ friends, pendingFriends }) => res.json({ friends, pendingFriends }))
      .catch(next);
  })

  .get('/friends/:id', (req, res, next) => {
    const { params: { id: friendId }, account: { id: userId } } = req;
    User.find({ _id: userId, friends: friendId })
      .count()
      .then(count => {
        if(!count) throw {
          status: 403,
          error: 'Not your friend!'
        };
        return User.findById(friendId)
          .lean()
          .populate('shareables')
          .select('firstName lastName pictureUrl email contact availability shareables');
      })
      .then(friend => res.json(friend))
      .catch(next);
  })

  .post('/shareables', (req, res, next) => {
    const { body, account: { id } } = req; 
    Shareable.create(body)
      .then(shareable => {
        const { _id } = shareable;
        return Promise.all([shareable, User.findByIdAndUpdate(id, {
          $addToSet: { shareables: _id }
        }, updateOptions)]);
      })
      .then(([shareable,]) => res.json(shareable))
      .catch(next);
  })

  .get('/shareables', (req, res, next) => {
    User.findById(req.account.id)
      .populate('shareables')
      .lean()
      .then(({ shareables }) => res.json(shareables))
      .catch(next);
  })

  .put('/shareables/:id', (req, res, next) => {
    const { params: { id: shareableId }, account: { id: userId }, body } = req;
    return User.find({ _id: userId, shareables: shareableId })
      .count()
      .then(count => {
        if(!count) throw {
          status: 403,
          error: 'Not your shareable!'
        };
        return Shareable.findByIdAndUpdate(shareableId, body, updateOptions);
      })
      .then(updated => res.json(updated))
      .catch(next);   
  })

  .get('/feed', (req, res, next) => {
    const { id } = req.account;
    return User.aggregate([
      { $match: { _id: Types.ObjectId(id) } },
      {
        $lookup:
         {
           from: 'users',
           localField: 'friends',
           foreignField: '_id',
           as: 'friends'
         }
      },
      { $unwind: { path: '$friends' } },
      {
        $lookup:
         {
           from: 'shareables',
           localField: 'friends.shareables',
           foreignField: '_id',
           as: 'friendShareables'
         }
      },
      {
        $project: {
          shareable: {
            $filter: {
              input: '$friendShareables',
              as: 'friendShareable',
              cond: { $and: [
                { $eq: [ '$$friendShareable.priority', 2 ] },
                { $or: [
                  { $eq: [ '$$friendShareable.type', 'giving' ] },
                  { $eq: [ '$$friendShareable.type', 'requesting' ] }
                ] } 
              ] }
            }
          },
          owner: '$friends.firstName',
          ownerId: '$friends._id',
          _id: 0
        }
      },
      { $unwind: { path: '$shareable' } },
      { $project: {
        name: '$shareable.name',
        expiration: '$shareable.expiration',
        type: '$shareable.type',
        _id: '$shareable._id',
        owner: 1,
        ownerId: 1
      } }
    ])
      .then(shareables => res.json(shareables))
      .catch(next);
  })

  .delete('/shareables/:id', (req, res, next) => {
    const { params: { id: shareableId }, account: { id: userId } } = req;    
    return User.find({ _id: userId, shareables: shareableId })
      .count()
      .then(count => {
        if(!count) throw {
          status: 403,
          error: 'Not your shareable!'
        };
        return Shareable.findByIdAndRemove(shareableId);
      })
      .then(removed => {
        return User.findByIdAndUpdate(userId, {
          $pull: { shareables: removed._id }
        }, updateOptions);
      })
      .then(() => res.json({ deleted: true }))
      .catch(next);     
  })

  .delete('/friends/:id', (req, res, next) => {
    const { params: { id: friendId }, account: { id: userId } } = req;
    return User.findOneAndUpdate({ _id: userId, friends: friendId }, {
      $pull: { friends: friendId }
    }, updateOptions)
      .then(found => {
        if(found) {
          return User.findOneAndUpdate({ _id: friendId, friends: userId }, {
            $pull: { friends: userId }
          }, updateOptions);
        }
      })
      .then(found => {
        if(found) return res.json({ deleted: true });
        else throw {
          status: 400,
          error: 'Cannot delete a friendship you don\'t have.'
        };
      })
      .catch(next);  
  })

  .delete('/', (req, res, next) => {
    User.findByIdAndRemove(req.account.id)
      .then(() => res.json({ deleted: true }))
      .catch(next);
  });