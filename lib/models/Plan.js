const mongoose = require('mongoose');
const { Schema } = mongoose;

const schema = new Schema({
  name:  {type: String, required: true},
  attendees: [],
  // proposed dates, used to help scheduling
  tentative: Date,
  date: Date,
  activity: String,
  invited: []
});

module.exports = mongoose.model('User', schema);