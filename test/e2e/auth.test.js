const { assert } = require('chai');
const request = require('./request');
const { dropCollection } = require('./db');

describe('Auth API', () => {
  before(() => dropCollection('accounts'));
  before(() => dropCollection('users'));

  let token = null;

  it('Fails if required information is not provided', () => {
    return request.post('/api/signup')
      .send({ lastName: 'lastname', firstName: 'name'})
      .then(({ body }) => {
        assert.equal(body.error, 'Name, email, and password must be provided');
      });
  });

  it('Signs someone up as a new account', () => {
    return request.post('/api/signup')
      .send({ lastName: 'lastname', firstName: 'name', email: 'email', password: '1234'})
      .then(({ body }) => {
        token = body.token;
        assert.exists(body.token);
      });
  });

  it('Cannot sign up with email if already used', () => {
    return request.post('/api/signup')
      .send({lastName: 'blah', firstName: 'blah', email: 'email', password: '4321'})
      .then(({ body }) => {
        assert.equal(body.error, 'Email already in use.');
      });
  });

  it('Verifies a token', () => {
    return request.get('/api/verify')
      .set('Authorization', token)
      .then(({ body }) => {
        assert.equal(body.verified, true);
      });
  });

  it('Sign in works', () => {
    return request.post('/api/signin')
      .send({email: 'email', password: '1234'})
      .then(({ body }) => {
        assert.exists(body.token);
      });
  });
});