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
  app.use(route.post('/api/v1/users/updateProfilePicture/', updateProfilePicture));
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