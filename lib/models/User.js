const mongoose = require('mongoose');
const { Schema } = mongoose;
const { RequiredString } = require('../utils/mongoose-helpers');

const schema = new Schema({
  firstName:  RequiredString,
  lastName:  RequiredString,
  pictureUrl: String,
  email: RequiredString,
  contact: String,
  availability: {},
  friends: [{type: Schema.Types.ObjectId, ref: 'User'}],
  pendingFriends: [{type: Schema.Types.ObjectId, ref: 'User'}],
  shareables: [{type: Schema.Types.ObjectId, ref: 'Shareable'}],
});

module.exports = mongoose.model('User', schema);