'use strict';

var route = require('koa-route'),
    bcrypt = require('bcrypt'),
    config = require('../config/config'),
    jwt = require('jsonwebtoken'),
    _ = require('lodash'),
    fs = require('fs'),
    mongo = require('../config/mongo');

const saltRounds = 10;

exports.init = function (app) {
    app.use(route.post('/api/v1/users', createUser));
    app.use(route.get('/api/v1/users/isUsernameTaken/:username', isUsernameTaken))
};

async function createUser(ctx) {
    var user = ctx.request.body;
  
    if (user.username == undefined || user.email == undefined || user.password == undefined) {
      ctx.status = 500;
      ctx.body = "Missing required field. [Required: 'username', 'email', and 'password']"
      return;
    }
  
    var unameCheck = await mongo.users.findOne({username: user.username});
  
    if (unameCheck != undefined) {
      ctx.status = 500;
      ctx.body = "Username taken!"
      return;
    }
  
    var emailCheck = await mongo.users.findOne({email: user.email});
  
    if (emailCheck != undefined) {
      ctx.status = 500;
      ctx.body = "Email already being used!"
      return;
    }
  
    var hash = bcrypt.hashSync(user.password, saltRounds);
    user.password = hash;
    user.joined = Date.now();
    if (!user.displayname) {
      user.displayname = user.username;
    }
    var results = await mongo.users.insertOne(user);
    ctx.status = 201;
    ctx.body = {id: results.ops[0]._id};
    fs.copyFile('client/uploads/users/default.jpg', 'client/uploads/users/' + results.ops[0]._id.toString() + '.jpg', (err) => {
      if (err) throw err;
      console.log('client/uploads/users/default.jpg was copied to client/uploads/users/' + results.ops[0]._id.toString() + '.jpg');
    });
}

async function isUsernameTaken(ctx, username) {
    var output = false;
    var test = await mongo.users.findOne({username: username});
    if (test) output = true;
    ctx.status = 200;
    ctx.body = output;
}