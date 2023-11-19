'use strict';

var mongo = require('./mongo'),
    config = require('./config'),
    ObjectId = mongo.ObjectID;

async function seed(overwrite) {
  var count = await mongo.users.count({}, {limit: 1});
  if (overwrite || count === 0) {
    var collerrmsg = 'ns not found';
    for (var collection in mongo) {
      if (mongo[collection].drop) {
        try {
          await mongo[collection].drop();
        } catch (err) {
          if (err.message !== collerrmsg) {
            throw err;
          }
        }
      }
    }

    await mongo.users.insert(users);
  }
}

var users = [
  {
    "username": "test",
    "email": "test@gmail.com",
    "password": "$2b$10$gUgrO6OkdENARKHvrhVTCed50lQ.aXHOt3lawjRxvx63P6EZjdqtq",
    "displayname": "Test"
  }
];

var now = new Date();
function getTime(h) {
  return new Date(new Date(now).setHours(now.getHours() + h));
}

seed.users = users;
module.exports = seed;
