const { assert } = require('chai');
const Plan = require('../../lib/models/Shareable');

describe('Shareable model test', () => {
  it('Valid and good model', () => {
    const data = {
      name:  'Get coffee',
      priority: 0,
      groupSize: 3,
      confirmed: false,
      participants: [],
      repeats: null
    };

    const plan = new Plan(data);

    assert.deepEqual(plan.toJSON(), {
      _id: plan._id,
      ...data
    });

    assert.isUndefined(plan.validateSync());
  });
});