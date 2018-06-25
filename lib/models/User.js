const mongoose = require('mongoose');
const { Schema } = mongoose;

const schema = new Schema({
  firstName:  String,
  lastName:  String,
  pictureUrl: String,
  email: String,
  contact: [{
    type: String,
    // callOrText array: 0 either, 1 call, 2 text
    callOrText: {type: Array, default: null}
  }],
  availability: {},
  friends: [{type: Schema.Types.ObjectId, ref: 'User'}],
  giving: [{type: Schema.Types.ObjectId, ref: 'Plan'}],
  requesting: [{type: Schema.Types.ObjectId, ref: 'Plan'}],
  plans: [{type: Schema.Types.ObjectId, ref: 'Plan'}]
});

module.exports = mongoose.model('User', schema);