const { assert } = require('chai');
const request = require('./request');
const User = require('../../lib/models/User');
const { dropCollection } = require('./db');

describe('User API', () => {
  before(() => dropCollection('users'));

  let userJon = {
    firstName:  'Jon',
    lastName:  'Snow',
    pictureUrl: 'https://i7.behindwoods.com/tamil-movies-cinema-news-16/images/game-of-thrones-actor-kit-harrington-to-get-married-photos-pictures-stills.png',
    contact: ['jon@thewall.com'],
    availability: null,
    friends: null,
    giving: null,
    requesting: null,
    plans: null
  };

  let userDany = {
    firstName:  'Dany',
    lastName:  'Targaryen',
    pictureUrl: 'https://winteriscoming.net/files/2016/03/Daenerys-Targaryen-crop-630x371.jpg',
    contact: ['dany@dragons.com'],
    availability: null,
    friends: null,
    giving: null,
    requesting: null,
    plans: null
  };

  it('Saves a new user', () => {
    return request.post('/api/users')
      .send(userJon)
      .then(({ body }) => {
        console.log("BODY: ", body);
      });
  });
});