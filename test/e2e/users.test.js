const { assert } = require('chai');
const request = require('./request');
const { dropCollection } = require('./db');

describe('User API', () => {
  before(() => dropCollection('users'));

  let userJon = {
    firstName:  'Jon',
    lastName:  'Snow',
    pictureUrl: 'https://i7.behindwoods.com/tamil-movies-cinema-news-16/images/game-of-thrones-actor-kit-harrington-to-get-married-photos-pictures-stills.png',
    contact: ['jon@thewall.com'],
    callOrText: null,
    availability: null,
    friends: [],
    giving: null,
    requesting: null,
    plans: null
  };

  let userDany = {
    firstName:  'Dany',
    lastName:  'Targaryen',
    pictureUrl: 'https://winteriscoming.net/files/2016/03/Daenerys-Targaryen-crop-630x371.jpg',
    contact: ['dany@dragons.com'],
    callOrText: null,
    availability: null,
    friends: [],
    giving: null,
    requesting: null,
    plans: null
  };

  let userSansa = {
    firstName:  'Sansa',
    lastName:  'Stark',
    pictureUrl: 'https://nerdist.com/wp-content/uploads/2017/08/Sansa_081917-1-970x545.jpg',
    contact: ['sansa@winterfell.com'],
    callOrText: null,
    availability: null,
    friends: [],
    giving: null,
    requesting: null,
    plans: null
  };

  before(() => {
    return request.post('/api/users')
      .send(userDany)
      .then(({ body }) => {
        userDany._id = body._id;
        return request.post('/api/users')
          .send(userSansa)
          .then(({ body }) => {
            userSansa._id = body._id;
          });
      });
  });

  it('Saves a new user', () => {
    return request.post('/api/users')
      .send(userJon)
      .then(({ body }) => {
        const { _id, __v } = body;
        assert.ok(_id);
        assert.equal(__v, 0);
        assert.deepEqual(body, {
          _id, __v,
          ...userJon
        });
        userJon = body;
      });
  });

  it('Retrieves a user by id', () => {
    return request.get(`/api/users/${userJon._id}`)
      .then(({ body }) => {
        assert.equal(body.__v, null);
        assert.ok(body.firstName);
        assert.ok(body.lastName);
        assert.ok(body.pictureUrl);
        assert.ok(body.contact);
        assert.ok(body.friends);
        assert.equal(body.giving, null);
        assert.equal(body.requesting, null);
        assert.equal(body.plans, null);
      });
  });

  it('Updates a profile information', () => {
    return request.put(`/api/users/${userJon._id}`)
      .send({ lastName: 'Targaryen' })
      .then(({ body }) => {
        assert.equal(body.lastName, 'Targaryen');
      });
  });

  it('Adds a friend by friend id', () => {
    return request.put(`/api/users/${userJon._id}/friends`)
      .send({friendId: userDany._id})
      .then(({ body }) => {
        assert.equal(body.friends.length, 1);
      });
  });

  it('Populates a friend list', () => {
    return request.put(`/api/users/${userJon._id}/friends`)
      .send({friendId: userSansa._id})
      .then(() => {
        return request.get(`/api/users/${userJon._id}/friends`)
          .then(({ body }) => {
            assert.equal(body.length, 2);
            assert.equal(body[0].friends, null);
          });
      });
  });

  it('Retrieves a single friend with details', () => {
    return request.get(`/api/users/${userJon._id}/friends/${userDany._id}`)
      .then(({ body }) => {
        assert.equal(body.firstName, 'Dany');
        assert.ok(body.lastName);
        assert.equal(body.friends, null);
      });
  });
});