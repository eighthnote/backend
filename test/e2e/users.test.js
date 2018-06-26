const { assert } = require('chai');
const request = require('./request');
const { dropCollection } = require('./db');

describe.only('User API', () => {
  before(() => dropCollection('users'));
  before(() => dropCollection('shareables'));
  before(() => dropCollection('accounts'));

  let token = null;
  let tokenDany = null;
  let jonId = null;

  let userDany = {};
  let userSansa = {};

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
        jonId = body.id.id;
      }).then(() => {
        return request.post('/api/signin')
          .send({email: 'dany@dragons.com', password: 'dragons' })
          .then(({ body }) => {
            userDany._id = body.id.id;
            tokenDany = body.token;
          })
          .then(() => {
            return request.post('/api/signin')
              .send({email: 'sansa@winterfell.com', password: 'whyme' })
              .then(({ body }) => {
                userSansa._id = body.id.id;
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

  // before(() => {
  //   return request.post(`/api/users/${userDany._id}/shareables`)
  //     .send({ shareable: shareableRule })
  //     .then(({ body }) => {
  //       shareableRule._id = body._id;
  //       return request.post(`/api/users/${userSansa._id}/shareables`)
  //         .send({ shareable: shareableGetHome })
  //         .then(() => {
  //           return request.post(`/api/users/${userSansa._id}/shareables`)
  //             .send({ shareable: shareableEatASandwich });
  //         });
  //     });
  // });

  it('Retrieves a user\'s profile by id', () => {
    return request.get('/api/profile/')
      .set('Authorization', token)
      .set('userId', jonId)
      .then(({ body }) => {
        assert.equal(body.__v, 0);
        assert.ok(body.firstName);
        assert.ok(body.lastName);
      });
  });

  it('Cannot retrieve someone else\'s profile', () => {
    return request.get('/api/profile/')
      .set('Authorization', token)
      .set('userId', userDany._id)
      .then(({ body }) => {
        assert.equal(body.error, 'Unauthorized');
      });
  });

  it('Updates own profile information', () => {
    return request.put('/api/profile')
      .set('Authorization', token)
      .set('userId', jonId)
      .send({ lastName: 'Targaryen' })
      .then(({ body }) => {
        assert.equal(body.lastName, 'Targaryen');
      });
  });

  it('Adds a friend request', () => {
    return request.put('/api/profile/friends/')
      .set('Authorization', token)
      .set('userId', jonId)
      .send({id: jonId, email: 'dany@dragons.com'})
      .then(({ body }) => {
        assert.equal(body.pendingFriends.length, 1);
        assert.equal(body.pendingFriends[0], jonId);
      });
  });

  it('Confirms a friend request', () => {
    return request.put(`/api/profile/friends/${jonId}/confirm`)
      .set('Authorization', tokenDany)
      .set('userId', userDany._id)
      .send({userId: userDany._id})
      .then(({ body }) => {
        assert.equal(body.friends.length, 1);
        assert.equal(body.pendingFriends.length, 0);
      });
  });

  it('Populates a friend list', () => {
    return request.get('/api/profile/friends')
      .set('Authorization', token)
      .set('userId', jonId)
      .then(({ body }) => {
        assert.equal(body.length, 1);
      });
  });

  it('Retrieves a single friend with details', () => {
    return request.get(`/api/profile/friends/${userDany._id}`)
      .set('Authorization', token)
      .set('userId', jonId)
      .then(({ body }) => {
        console.log('body: ', body);
        // assert.equal(body.firstName, 'Dany');
        // assert.ok(body.lastName);
        // assert.equal(body.friends, null);
      });
  });

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

  // it('Deletes a shareable', () => {
  //   return request.delete(`/api/users/${userJon._id}/shareables/${shareableMeet._id}`)
  //     .send({ id: userJon._id })
  //     .then(() => {
  //       return request.get(`/api/users/${userJon._id}/shareables/${shareableMeet._id}`)
  //         .then(({ body }) => {
  //           assert.notExists(body);
  //         });
  //     });
  // });

  // it('Deletes a friend', () => {
  //   return request.delete(`/api/users/${userJon._id}/friends/${userDany._id}`)
  //     .send({ id: userJon._id })
  //     .then(() => {
  //       return request.get(`/api/users/${userJon._id}`)
  //         .then(({ body }) => {
  //           assert.equal(body.friends.length, 1);
  //         });
  //     });
  // });

  // it('Deletes a profile', () => {
  //   return request.delete(`/api/users/${userJon._id}`)
  //     .then(() => {
  //       return request.get(`/api/users/${userJon._id}`)
  //         .then(({ body }) => {
  //           assert.notExists(body);
  //         });
  //     });
  // });
});