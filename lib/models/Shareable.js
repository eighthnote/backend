const mongoose = require('mongoose');
const { Schema } = mongoose;
const { RequiredString } = require('../utils/mongoose-helpers');

const schema = new Schema({
  archived: Boolean,
  confirmed: {type: Boolean, default: false},
  date: Date,
  expiration: Date,
  groupSize: {type: Number, default: 2},
  name: RequiredString,
  participants: [],
  // priority: 0 private, 1 low, 2 high
  priority: Number,
  // repeats: 0 means it repeats indefinitely. null means it does not repeat
  repeats: {type: Number, default: null},
  type: { type: String, enum: ['plans', 'requesting', 'giving']},
  owner: String
});

module.exports = mongoose.model('Shareable', schema);