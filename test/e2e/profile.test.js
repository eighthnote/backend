const { assert } = require('chai');
const request = require('./request');
const { dropCollection } = require('./db');
const jwt = require('jsonwebtoken');

describe.only('User API', () => {
  before(() => dropCollection('users'));
  before(() => dropCollection('shareables'));
  before(() => dropCollection('accounts'));

  let token = null;
  let tokenDany = null;
  let tokenSansa = null;

  let jonId = null;
  let danyId = null;
  let sansaId = null;

  before(() => {
    return request.post('/api/signup')
      .send({ lastName: 'Snow', firstName: 'Jon', email: 'jon@thewall.com', password: 'honor'})
      .then(() => {
        return request.post('/api/signup')
          .send({email: 'dany@dragons.com', firstName: 'Dany', lastName: 'Targaryan', password: 'dragons'})
          .then(() => {
            return request.post('/api/signup')
              .send({email: 'sansa@winterfell.com', firstName: 'Sansa', lastName: 'Stark', password: 'whyme'});
          });
      });
  });

  before(() => {
    return request.post('/api/signin')
      .send({email: 'jon@thewall.com', password: 'honor'})
      .then(({ body }) => {
        token = body.token;
        jonId = jwt.decode(token).id;
      }).then(() => {
        return request.post('/api/signin')
          .send({email: 'dany@dragons.com', password: 'dragons' })
          .then(({ body }) => {
            tokenDany = body.token;
            danyId = jwt.decode(tokenDany).id;
          })
          .then(() => {
            return request.post('/api/signin')
              .send({email: 'sansa@winterfell.com', password: 'whyme' })
              .then(({ body }) => {
                tokenSansa = body.token;
                sansaId = jwt.decode(tokenSansa).id;
              });
          });
      });
  });

  let shareableMeet = {
    name:  'Meet for the first time',
    priority: 2,
    groupSize: 2,
    participants: [],
    date: new Date,
    expiration: null,
    confirmed: true,
    archived: false,
    repeats: null,
    type: 'requesting'
  };

  let shareableRule = {
    name:  'Take everything over',
    priority: 2,
    groupSize: 2,
    participants: [],
    date: new Date,
    expiration: null,
    confirmed: true,
    archived: false,
    repeats: null,
    type: 'giving'
  };

  let shareableGetHome = {
    name:  'Get back to Winterfell',
    priority: 2,
    groupSize: 2,
    participants: [],
    date: new Date,
    expiration: null,
    confirmed: true,
    archived: false,
    repeats: null,
    type: 'plans'
  };

  let shareableEatASandwich = {
    name:  'Eat a sandwich',
    priority: 1
  };

  before(() => {
    return request.post('/api/profile/shareables')
      .set('Authorization', tokenDany)
      .send(shareableRule)
      .then(({ body }) => {
        shareableRule._id = body._id;
        return request.post('/api/profile/shareables')
          .set('Authorization', tokenSansa)
          .send(shareableGetHome)
          .then(() => {
            return request.post('/api/profile/shareables')
              .set('Authorization', tokenSansa)
              .send(shareableEatASandwich);
          });
      });
  });

  it('Retrieves a user\'s profile by id', () => {
    return request.get('/api/profile/')
      .set('Authorization', token)
      .then(({ body }) => {
        assert.equal(body.__v, 0);
        assert.ok(body.firstName);
        assert.ok(body.lastName);
      });
  });

  it('Updates own profile information', () => {
    return request.put('/api/profile')
      .set('Authorization', token)
      .send({ lastName: 'Targaryen' })
      .then(({ body }) => {
        assert.equal(body.lastName, 'Targaryen');
      });
  });

  it('Adds a friend request', () => {
    return request.put('/api/profile/friends/')
      .set('Authorization', token)
      .send({email: 'dany@dragons.com'})
      .then(({ body }) => {
        assert.equal(body, 'Friend request sent! If your friend does not receive the request, please check the spelling of their email.');
      });
  });

  it('Can\'t duplicate a friend request', () => {
    return request.put('/api/profile/friends/')
      .set('Authorization', token)
      .send({email: 'dany@dragons.com'})
      .then(() => {
        request.get('/api/profile')
          .set('Authorization', tokenDany)
          .then(({ body }) => {
            assert.equal(body.pendingFriends.length, 1);
          });
      });
  });

  it('Can\'t send self a friend request', () => {
    return request.put('/api/profile/friends/')
      .set('Authorization', token)
      .send({email: 'jon@thewall.com'})
      .then(({ body }) => {
        assert.equal(body, 'Cannot add yourself, or someone who is already a friend.');
      });
  });

  it('Confirms a friend request', () => {
    return request.put(`/api/profile/friends/confirm/${jonId}`)
      .set('Authorization', tokenDany)
      .then(({ body }) => {
        assert.equal(body.friends.length, 1);
        assert.equal(body.pendingFriends.length, 0);
      });
  });

  it('Can\'t add an already friend', () => {
    return request.put('/api/profile/friends/')
      .set('Authorization', token)
      .send({email: 'dany@dragons.com'})
      .then(({ body }) => {
        assert.equal(body, 'Cannot add yourself, or someone who is already a friend.');
      });
  });

  it('Populates a friend list', () => {
    return request.get('/api/profile/friends')
      .set('Authorization', token)
      .then(({ body }) => {
        assert.equal(body[0].length, 1);
        assert.equal(body.length, 2);
      });
  });

  it('Retrieves a single friend\'s profile', () => {
    return request.get(`/api/profile/friends/${danyId}`)
      .set('Authorization', token)
      .then(({ body }) => {
        assert.equal(body.firstName, 'Dany');
        assert.equal(typeof {}, typeof body.shareables);
      });
  });

  it('Will not retrieve a profile if not friends', () => {
    return request.get(`/api/profiles/friends/${sansaId}`)
      .set('Authorization', token)
      .then(({ body }) => {
        assert.deepEqual({}, body);
      });
  });

  it('Saves a new shareable', () => {
    return request.post('/api/profile/shareables')
      .set('Authorization', token)
      .send(shareableMeet)
      .then(({ body }) => {
        shareableMeet._id = body._id;
        assert.equal(body.type, 'requesting');
      });
  });

  it('Gets all personal shareables on a list', () => {
    return request.get('/api/profile/shareables')
      .set('Authorization', token)
      .then(({ body }) => {
        assert.equal(body[0].name, 'Meet for the first time');
      });
  });

  it('Updates an owned shareable', () => {
    const oldDate = shareableMeet.date;
    return request.put(`/api/profile/shareables/${shareableMeet._id}`)
      .set('Authorization', token)
      .send({ date: new Date })
      .then(({ body }) => {
        assert.notEqual(oldDate, body.date);
      });
  });

  it('Retrieves all feed shareables', () => {
    return request.get('/api/profile/feed')
      .set('Authorization', token)
      .then(({ body }) => {
        assert.equal(body.length, 1);
        assert.equal(body[0].priority, 2);
      });
  });

  it('Deletes a shareable', () => {
    return request.delete(`/api/profile/shareables/${shareableMeet._id}`)
      .set('Authorization', token)
      .then(({ body }) => {
        assert.equal(body.shareables.length, 0);
      });
  });

  it('Deletes a friend', () => {
    return request.delete(`/api/profile/friends/${danyId}`)
      .set('Authorization', token)
      .then(() => {
        return request.get('/api/profile')
          .set('Authorization', token)
          .then(({ body }) => {
            assert.equal(body.friends.length, 0);
          });
      });
  });

  it('Deletes a profile', () => {
    return request.delete('/api/profile')
      .set('Authorization', token)
      .then(() => {
        return request.get('/api/profile')
          .set('Authorization', token)
          .then(({ body }) => {
            assert.notExists(body);
          });
      });
  });
});