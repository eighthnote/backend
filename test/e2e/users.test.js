const { assert } = require('chai');
const request = require('./request');
const { dropCollection } = require('./db');

describe('User API', () => {
  before(() => dropCollection('users'));
  before(() => dropCollection('shareables'));

  let userJon = {
    firstName:  'Jon',
    lastName:  'Snow',
    pictureUrl: 'https://i7.behindwoods.com/tamil-movies-cinema-news-16/images/game-of-thrones-actor-kit-harrington-to-get-married-photos-pictures-stills.png',
    contact: ['jon@thewall.com'],
    callOrText: null,
    availability: null,
    friends: [],
    pendingFriends: [],
    shareables: []
  };

  let userDany = {
    firstName:  'Dany',
    lastName:  'Targaryen',
    pictureUrl: 'https://winteriscoming.net/files/2016/03/Daenerys-Targaryen-crop-630x371.jpg',
    contact: ['dany@dragons.com'],
    callOrText: null,
    availability: null,
    friends: [],
    shareables: []
  };

  let userSansa = {
    firstName:  'Sansa',
    lastName:  'Stark',
    pictureUrl: 'https://nerdist.com/wp-content/uploads/2017/08/Sansa_081917-1-970x545.jpg',
    contact: ['sansa@winterfell.com'],
    callOrText: null,
    availability: null,
    friends: [],
    shareables: []
  };

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

  before(() => {
    return request.post(`/api/users/${userDany._id}/shareables`)
      .send({ shareable: shareableRule })
      .then(({ body }) => {
        shareableRule._id = body._id;
        return request.post(`/api/users/${userSansa._id}/shareables`)
          .send({ shareable: shareableGetHome })
          .then(() => {
            return request.post(`/api/users/${userSansa._id}/shareables`)
              .send({ shareable: shareableEatASandwich });
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
        assert.ok(body.shareables);
      });
  });

  it('Updates a profile information', () => {
    return request.put(`/api/users/${userJon._id}`)
      .send({ lastName: 'Targaryen' })
      .then(({ body }) => {
        assert.equal(body.lastName, 'Targaryen');
      });
  });

  // it('Adds a friend by friend id', () => {
  //   return request.put(`/api/users/${userJon._id}/friends`)
  //     .send({friendId: userDany._id})
  //     .then(({ body }) => {
  //       assert.equal(body.friends.length, 1);
  //     });
  // });

  // it('Populates a friend list', () => {
  //   return request.put(`/api/users/${userJon._id}/friends`)
  //     .send({friendId: userSansa._id})
  //     .then(() => {
  //       return request.get(`/api/users/${userJon._id}/friends`)
  //         .then(({ body }) => {
  //           assert.equal(body.length, 2);
  //           assert.equal(body[0].friends, null);
  //         });
  //     });
  // });

  // it('Retrieves a single friend with details', () => {
  //   return request.get(`/api/users/${userJon._id}/friends/${userDany._id}`)
  //     .then(({ body }) => {
  //       assert.equal(body.firstName, 'Dany');
  //       assert.ok(body.lastName);
  //       assert.equal(body.friends, null);
  //     });
  // });

  // it('Saves a new shareable', () => {
  //   return request.post(`/api/users/${userJon._id}/shareables`)
  //     .send({shareable: shareableMeet})
  //     .then(({ body }) => {
  //       shareableMeet._id = body._id;
  //       assert.equal(body.type, 'requesting');
  //     });
  // });

  // it('Gets all personal shareables on a list', () => {
  //   return request.get(`/api/users/${userJon._id}/shareables`)
  //     .then(({ body }) => {
  //       assert.equal(body[0].name, 'Meet for the first time');
  //       assert.equal(body[0].confirmed, null);
  //     });
  // });

  // it('Retrieves all details of a single shareable', () => {
  //   return request.get(`/api/users/${userJon._id}/shareables/${shareableMeet._id}`)
  //     .then(({ body }) => {
  //       shareableMeet.date = body.date;
  //       assert.ok(body.groupSize);
  //       assert.equal(body.archived, false);
  //     });
  // });

  // it('Updates an owned shareable', () => {
  //   const oldDate = shareableMeet.date;
  //   return request.put(`/api/users/${userJon._id}/shareables/${shareableMeet._id}`)
  //     .send({ date: new Date })
  //     .then(({ body }) => {
  //       assert.notEqual(oldDate, body.date);
  //     });
  // });

  // it('Retrieves all feed shareables', () => {
  //   return request.get(`/api/users/${userJon._id}/feed`)
  //     .then(({ body }) => {
  //       assert.equal(body.length, 1);
  //       assert.equal(body[0].priority, 2);
  //     });
  // });

  // it('Retrieves a single shareable from the feed', () => {
  //   return request.get(`/api/users/${userJon._id}/feed/${shareableRule._id}`)
  //     .then(({ body }) => {
  //       assert.ok(body.name);
  //       assert.notExists(body.repeats);
  //     });
  // });
});