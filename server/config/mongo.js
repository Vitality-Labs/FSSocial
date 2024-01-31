'use strict';

var mongodb = require('mongodb'),
    connect = mongodb.connect,
    config = require('./config');

mongodb.connect = async function () {
    if (mongodb.db) {
        await mongodb.db.close();
    }
    
    var db = mongodb.db = await connect(config.mongo.url);
    mongodb.users = db.collection('users');
    mongodb.posts = db.collection('posts');
    mongodb.reposts = db.collection('reposts');
    mongodb.likes = db.collection('likes');
};

module.exports = mongodb;