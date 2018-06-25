const mongoose = require('mongoose');
const { Schema } = mongoose;

const schema = new Schema({
  name:  {type: String, required: true},
  friends: [{}],
  contact: [],
  // a calendar of general availability
  availability: {},
  // activities or hobbies that you're interested in doing or trying
  interests: [],
  // resources you have to help, e.g. a truck, tools, skills, etc.
  resources: [],
  requests: [{
    priority: [],
    visibility: []
  }]
});

module.exports = mongoose.model('User', schema);