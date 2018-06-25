const { assert } = require('chai');
const User = require('../../lib/models/User');

describe('User model test', () => {
  it('Valid and good model', () => {
    const data = {
      firstName:  'Don',
      lastName:  'Jon',
      pictureUrl: 'https://media.wmagazine.com/photos/5853d5909c190ec57ac0a0bf/3:2/w_640/don-jon-on-set-photos-joseph-gordon-levitt-02-e1380212981747.jpg',
      contact: ['email'],
      availability: null,
      friends: null,
      giving: null,
      requesting: null,
      plans: null
    };

    const user = new User(data);

    assert.deepEqual(user.toJSON(), {
      _id: user._id,
      ...data
    });

    assert.isUndefined(user.validateSync());
  });
});