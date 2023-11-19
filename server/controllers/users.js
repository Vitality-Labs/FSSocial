'use strict';

var route = require('koa-route'),
    config = require('../config/config'),
    util = require('util'),
    jwt = require('jsonwebtoken'),
    fs = require('fs'),
    mongo = require('../config/mongo');

exports.init = function (app) {
    app.use(route.get('/api/v1/users/:id', getUser));
    app.use(route.get('/api/v1/users/byUsername/:username', getUserByUsername));
};

async function getUser(ctx, id) {
    var user = await mongo.users.findOne({_id: mongo.ObjectId(id)});
    if (user == undefined) {
      ctx.status = 500;
      ctx.body = "User not found!"
      return;
    }
    delete user.password;
    ctx.status = 200;
    ctx.body = user;
}

async function getUserByUsername(ctx, username) {
    var user = await mongo.users.findOne({username: username});
    if (user == undefined) {
      ctx.status = 500;
      ctx.body = "User not found!"
      return;
    }
    delete user.password;
    ctx.status = 200;
    ctx.body = user;
}