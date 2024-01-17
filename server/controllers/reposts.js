'use strict';

var route = require('koa-route'),
    config = require('../config/config'),
    util = require('util'),
    cryptography = require('../utils/cryptography'),
    jwt = require('jsonwebtoken'),
    fs = require('fs'),
    mongo = require('../config/mongo');

exports.init = function (app) {
    mongo.reposts = mongo.reposts || mongo.db.collection('reposts');
    app.use(route.post('/api/v1/repost/:id', repost));
    app.use(route.post('/api/v1/unrepost/:id', unrepost));
};

async function repost(ctx, id) {
    const user = jwt.verify(ctx.request.accept.headers.authorization.toString().replace("Bearer ", ""), config.app.secret);
    var userId = user.id.toString();
    console.log("ctx.body: ", ctx.request.body)
    
    if (!id) {
        ctx.status = 500;
        ctx.body = "No postId provided!";
        return;
    }

    if (!userId) {
        ctx.status = 500;
        ctx.body = "Missing required field. [Required: 'userId']";
        return;
    }

    var post = await mongo.posts.findOne({_id: mongo.ObjectID(id)});
    if (!post) {
        ctx.status = 500;
        ctx.body = "Invalid postId provided!";
        return;
    }

    if (post.from.toString() == userId.toString()) {
        ctx.status = 400;
        ctx.body = "Can't repost your own post!";
        return;
    }

    var existingRepost = await mongo.reposts.findOne({from: userId.toString(), postId: post._id.toString()});
    if (existingRepost) {
        ctx.status = 400;
        ctx.body = "Can't repost twice!";
        return;
    }

    var repostDoc = {
        from: userId.toString(),
        postId: post._id.toString(),
        createdAt: Date.now()
    }

    await mongo.reposts.insertOne(repostDoc);
    ctx.status = 201;
    ctx.body = "Ok";
}

async function unrepost(ctx, id) {
    const user = jwt.verify(ctx.request.accept.headers.authorization.toString().replace("Bearer ", ""), config.app.secret);
    var userId = user.id.toString();
    if (!id) {
        ctx.status = 500;
        console.log("No postId provided!")
        ctx.body = "No postId provided!";
        return;
    }

    if (!userId) {
        ctx.status = 401;
        console.log("Unauthorized.")
        ctx.body = "Unauthorized.";
        return;
    }
    
    var existingRepost = await mongo.reposts.findOne({from: userId.toString(), postId: id});
    if (!existingRepost) {
        ctx.status = 400;
        ctx.body = "Can't unrepost if you haven't reposted yet!";
        return;
    }

    await mongo.reposts.deleteOne({_id: mongo.ObjectID(existingRepost._id.toString())});
    ctx.status = 201;
    ctx.body = "Ok";
}