const mongoose = require('mongoose');
const { Schema } = mongoose;

const schema = new Schema({
  firstName:  String,
  lastName:  String,
  pictureUrl: String,
  email: String,
  preferredContact: {},
  additionalContact: [],
  // general availability, non-interactive
  availability: {},
  friends: [],
  // activities or hobbies that you're interested in doing or trying
  interests: [],
  offering: [{}],
  wanting: [{}],
});

module.exports = mongoose.model('User', schema);