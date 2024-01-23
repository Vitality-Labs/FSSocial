'use strict';

var route = require('koa-route'),
    config = require('../config/config'),
    util = require('util'),
    cryptography = require('../utils/cryptography'),
    jwt = require('jsonwebtoken'),
    fs = require('fs'),
    mongo = require('../config/mongo');

exports.init = function (app) {
  app.use(route.get('/api/v1/users/:id', getUser));
  app.use(route.get('/api/v1/users/byUsername/:username', getUserByUsername));
  app.use(route.post('/api/v1/users/updateProfilePicture/', updateProfilePicture));
  app.use(route.get('/api/v1/users/getProfileData/:id', getUserProfile));
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

async function updateProfilePicture(ctx) {
  const user = await cryptography.decryptUserToken(ctx);
  if (!user || !user.id) {
    ctx.status = 404;
    ctx.body = "Unauthorized!";
    return;
  }

  const body = ctx.request.body;
  const buffer = Buffer.from(body.image, 'base64');
  var vals = {
    jpg: 'ffd8ffe0',
    png: '89504e47',
    jpg2: 'ffd8ffe1',
    jpg3: 'ffd8ffdb',
    jpg4: 'ffd8ffee',
    png2: '89504e47'
  };
  if (!buffer.includes(vals.jpg, 0, "hex")
      && !buffer.includes(vals.jpg2, 0, "hex")
      && !buffer.includes(vals.jpg3, 0, "hex")
      && !buffer.includes(vals.jpg4, 0, "hex")
      && !buffer.includes(vals.png, 0, "hex")
      && !buffer.includes(vals.png2, 0, "hex")) {
    ctx.body = "Not an image";
    ctx.status = 409;
    return;
  }
  try {
    const image = await jimp.read(buffer);
    await image.resize(90, 90);
    const writeFile = util.promisify(fs.writeFile);
    await writeFile('client/uploads/users/' + user.id.toString() + '.jpg', await image.getBufferAsync(jimp.MIME_JPEG));
    ctx.status = 200;
    ctx.body = "Ok";
  } catch (err) {
    console.error('Error processing image:', err);
    ctx.status = 500;
    ctx.body = 'Internal Server Error';
  }
}

async function getUserProfile(ctx, id) {
  const requser = await cryptography.decryptUserToken(ctx);
  var user = await mongo.users.findOne({_id: mongo.ObjectId(id)}, 
    {_id: 1, username: 1, displayname: 1, description: 1, 
      birthday: 1, verified: 1, location: 1, suspended: 1});
  
  if (user == undefined) {
    ctx.status = 500;
    ctx.body = "User not found!"
    return;
  }

  var postCount = await mongo.posts.find({from: id.toString()}).count();
  var repostCount = await mongo.reposts.find({from: id.toString()}).count();
  var likedCount = await mongo.likes.find({'users.userId': id.toString()}).count();
  user.stats = {
    postCount: postCount ? postCount : 0,
    repostCount: repostCount ? repostCount : 0,
    likedCount: likedCount ? likedCount : 0,
    followers: 0,
    following: 0
  }

  if (requser.id == user._id.toString()) {
    user.ownAccount = true;;
  } else {
    user.isFollowing = false;
    user.isFollowingMe = false;
  }

  ctx.status = 200;
  ctx.body = user;
}