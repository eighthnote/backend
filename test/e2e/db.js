require('dotenv').config({path: __dirname + '/.env'});
const connect = require('../../lib/connect');
const mongoose = require('mongoose');

before(() => connect(process.env.MONGODB_URI));
after(() => mongoose.connection.close());

module.exports = {
  dropCollection(db) {
    return mongoose.connection.dropCollection(db)
      .catch(err => {
        if(err.codeName !== 'NamespaceNotFound') throw err;
      });
  }
};