const { assert } = require('chai');
const request = require('./request');
const { dropCollection } = require('./db');

describe('Auth API', () => {
  before(() => dropCollection('accounts'));
  before(() => dropCollection('users'));
  before(() => dropCollection('shareables'));

  let token = null;
  let userId = null;

  it('Fails if required information is not provided', () => {
    return request.post('/api/signup')
      .send({ lastName: 'lastname', firstName: 'name'})
      .then(({ body }) => {
        assert.equal(body.error, 'Name, email, and password must be provided');
      });
  });

  it('Signs someone up as a new account', () => {
    return request.post('/api/signup')
      .send({ lastName: 'Snow', firstName: 'Jon', email: 'jon@thewall.com', password: 'honor'})
      .then(({ body }) => {
        token = body.token;
        assert.exists(body.token);
      });
  });

  it('Cannot sign up with email if already used', () => {
    return request.post('/api/signup')
      .send({lastName: 'blah', firstName: 'blah', email: 'jon@thewall.com', password: '4321'})
      .then(({ body }) => {
        assert.equal(body.error, 'Email already in use.');
      });
  });

  it('Sign in works', () => {
    return request.post('/api/signin')
      .send({email: 'jon@thewall.com', password: 'honor'})
      .then(({ body }) => {
        userId = body.id.id;
        assert.exists(body.token);
        assert.exists(body.id.id);
        assert.exists(body.name);
      });
  });

  it('Verifies a token', () => {
    return request.get('/api/verify')
      .set('Authorization', token)
      .set('userId', userId)
      .then(({ body }) => {
        assert.equal(body.verified, true);
      });
  });
});