'use strict';

var route = require('koa-route'),
    config = require('../config/config'),
    util = require('util'),
    cryptography = require('../utils/cryptography'),
    jwt = require('jsonwebtoken'),
    postutils = require('../utils/postutils'),
    fs = require('fs'),
    mongo = require('../config/mongo');

exports.init = function (app) {
    app.use(route.post('/api/v1/posts', createPost));
    app.use(route.get('/api/v1/post/:id', getPost));
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