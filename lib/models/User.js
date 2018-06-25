const mongoose = require('mongoose');
const { Schema } = mongoose;

const schema = new Schema({
  firstName:  String,
  lastName:  String,
  pictureUrl: String,
  email: String,
  contact: [],
  // general availability, non-interactive
  availability: {},
  giving: [{}],
  requesting: [{}],
  friends: [],
  plans: [{}]
});

module.exports = mongoose.model('User', schema);