const mongoose = require('mongoose');
const { Schema } = mongoose;

const schema = new Schema({
  firstName:  String,
  lastName:  String,
  pictureUrl: String,
  email: String,
  contact: [],
  callOrText: {type: Boolean, default: null},
  availability: {},
  friends: [{type: Schema.Types.ObjectId, ref: 'User'}],
  pendingFriends: [{type: Schema.Types.ObjectId, ref: 'User'}],
  shareables: [{type: Schema.Types.ObjectId, ref: 'Shareable'}],
});

module.exports = mongoose.model('User', schema);