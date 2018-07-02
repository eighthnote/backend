const connect = require('../../lib/connect');
const mongoose = require('mongoose');

before(() => connect(process.env.MONGODB_URI));
after(() => mongoose.connection.close());

module.exports = {
  dropCollection(name) {
    const collection = mongoose.connection.collections[name];
    return collection.drop()
      .catch(err => {
        if(err.codeName !== 'NamespaceNotFound') throw err;
      });
  }
};