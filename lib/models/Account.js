const mongoose = require('mongoose');
const { Schema } = mongoose;
const bcrypt = require('bcryptjs');
const { RequiredString } = require('../utils/mongoose-helpers');

const schema = new Schema({
  firstName: RequiredString,
  email: RequiredString,
  hash: RequiredString
});

schema.methods = {
  generateHash(password) {
    this.hash = bcrypt.hashSync(password, 8);
  },

  comparePassword(password) {
    return bcrypt.compareSync(password, this.hash);
  }
};

module.exports = mongoose.model('Account', schema);