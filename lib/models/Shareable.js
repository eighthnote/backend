const mongoose = require('mongoose');
const { Schema } = mongoose;

const schema = new Schema({
  name:  {type: String, required: true},
  // priority: 0 private, 1 low, 2 high
  priority: Number,
  groupSize: {type: Number, default: 2},
  participants: [],
  type: { type: String, enum: ['plans', 'requesting', 'giving']},
  date: Date,
  expiration: Date,
  confirmed: {type: Boolean, default: false},
  archived: Boolean,
  // repeats: 0 means it repeats indefinitely. null means it does not repeat
  repeats: {type: Number, default: null}
});

module.exports = mongoose.model('Shareable', schema);