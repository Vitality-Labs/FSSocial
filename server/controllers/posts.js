'use strict';

var route = require('koa-route'),
    config = require('../config/config'),
    util = require('util'),
    cryptography = require('../utils/cryptography'),
    jwt = require('jsonwebtoken'),
    postutils = require('../utils/postutils'),
    fs = require('fs'),
    jimp = require('jimp'),
    jpeg = require('jpeg-js'),
    imageSize = require('image-size'),
    mongo = require('../config/mongo');

const { 
  v1: uuidv1,
  v4: uuidv4,
} = require('uuid');
    
exports.init = function (app) {
  app.use(route.post('/api/v1/posts', createPost));
  app.use(route.get('/api/v1/post/:id', getPost));
  app.use(route.get('/api/v1/post/comments/:id', getComments));
  app.use(route.post('/api/v1/uploadPostImage', uploadPostImage))
};

async function createPost(ctx) {
  var post = ctx.request.body;
  const user = await cryptography.decryptUserToken(ctx);
  if (user.id.toString() != post.from.toString()) {
      ctx.status = 401;
      ctx.body = "You are not authorized to post to that user's account!";
      return;
  }

  if ((!post.from || post.from == "") || (!post.body || post.body == "")) {
      ctx.status = 400;
      ctx.body = "Missing required field. [Required: 'from', and 'body']";
      return;
  }

  post.body = await proccessPostBodyhelper(post.body, post);
  post.createdAt = Date.now();
  var results = await mongo.posts.insertOne(post);
  ctx.status = 200;
  ctx.body = {id: results.ops[0]._id};
}

async function proccessPostBodyhelper(body, post) {
    var output = "";
    var array = body.split(" ");
    for (var i = 0; i < array.length; i++) {
      var tmp = array[i];
      var puncTest = tmp.substring(tmp.length-1, tmp.length);
      var puncHolder = null;
      if (puncTest == '.' || puncTest == ',' || puncTest == '?' || puncTest == "!") {
        puncHolder = puncTest;
        tmp = tmp.substring(0, tmp.length-1);
      }
  
      var dotIdx = tmp.indexOf('.');
      if (dotIdx != -1 && dotIdx != tmp.length-1 && dotIdx != 0) {
        if (tmp.substring(0, 4).toLowerCase() == 'http') {
          var tmpLink = tmp;
        } else {
          var tmpLink = "https://" + tmp;
        }
        tmp = "<a href='" + tmpLink + "' target='_blank' ng-click='$event.stopPropagation()'>" + tmp + "</a>";
      }
  
      if (tmp.substring(0, 1) == '#') {
        if (!post.hashtags) {
          post.hashtags = [tmp];
        } else {
          post.hashtags.push(tmp);
        }
        tmp = "<a href='/explore?search=" + tmp.substring(1, tmp.length) + "&hashtag=true' ng-click='$event.stopPropagation()'>" + tmp + "</a>";
      }
  
      if (tmp.substring(0, 1) == '@') {
        tmp = "<a href='/explore?search=" + tmp.substring(1, tmp.length) + "&profile=true' ng-click='$event.stopPropagation()'>" + tmp + "</a>";
      }
      
      output += tmp;
      if (puncHolder) output += puncHolder;
      if (i < array.length-1) output += " ";
    }
    return output;
}

async function getPost(ctx, id) {
  console.log("[getPost] id=" + id);
  const user = await cryptography.decryptUserToken(ctx);
  console.log("[getPost] user=", user);
  var post = await postutils.getPost(id, user.id.toString());
  console.log("post: ", post)
  ctx.status = 200;
  ctx.body = post;
}

async function getComments(ctx, id) {
  const user = await cryptography.decryptUserToken(ctx);
  var output = [];
  var commentIds = await mongo.posts.find({parentId: id.toString()}, {_id: 1}).sort({_id: -1}).toArray();

  for (var i = 0; i < commentIds.length; i++) {
    output.push(await postutils.getPost(commentIds[i]._id.toString(), user.id.toString()));
  }

  ctx.status = 200;
  ctx.body = output;
}

async function uploadPostImage(ctx) {
  const user = await cryptography.decryptUserToken(ctx);
  if (!user) {
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
    const compressedImageBuffer = await resizeAndCompressImage(buffer, 800, 75);
    const filename = uuidv4();
    const compressedFilePath = 'client/uploads/posts/' + filename + '_compressed.jpg';
    await util.promisify(fs.writeFile)(compressedFilePath, compressedImageBuffer);
    const originalFilePath = 'client/uploads/posts/' + filename + '.jpg';
    await util.promisify(fs.writeFile)(originalFilePath, buffer);
    ctx.status = 200;
    ctx.body = {
      filename: filename + '.jpg',
      compressed: filename + '_compressed.jpg'
    }
  } catch (err) {
    console.error('Error processing image:', err);
    ctx.status = 500;
    ctx.body = 'Internal Server Error';
  }
}

async function resizeAndCompressImage(buffer, maxWidth, quality) {
  const dimensions = imageSize(buffer);
  const aspectRatio = dimensions.width / dimensions.height;
  const newHeight = Math.floor(maxWidth / aspectRatio);
  const image = await jimp.read(buffer);
  await image.resize(maxWidth, newHeight);
  const compressedBuffer = await image.getBufferAsync(jimp.MIME_JPEG);
  return compressedBuffer;
}