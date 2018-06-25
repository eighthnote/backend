const mongoose = require('mongoose');
const { Schema } = mongoose;

const schema = new Schema({
  email: String,
});

module.exports = mongoose.model('Account', schema);