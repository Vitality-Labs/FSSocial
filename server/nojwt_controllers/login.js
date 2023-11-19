'use strict';

var route = require('koa-route'),
    jwt = require('jsonwebtoken'),
    config = require('../config/config'),
    bcrypt = require('bcrypt'),
    mongo = require('../config/mongo');

const saltRounds = 10;

exports.init = function (app) {
  app.use(route.post('/login', login));
};

async function login(ctx) {
  var credentials = ctx.request.body;
  var user = await mongo.users.findOne({email: credentials.email}, {email: 1, username: 1, password: 1, displayname: 1, verified: 1});

  if (!user) {
    ctx.throw(401, 'Incorrect e-mail address.');
  } else if (!bcrypt.compareSync(credentials.password, user.password)) {
    ctx.throw(401, 'Incorrect password.');
  } else {
    user.id = user._id;
    delete user._id;
    delete user.password;
  }

  var token = jwt.sign(user, config.app.secret);
  ctx.body = {token: token, user: user};
}