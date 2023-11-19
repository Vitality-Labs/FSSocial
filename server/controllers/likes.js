'use strict';

var route = require('koa-route'),
    config = require('../config/config'),
    util = require('util'),
    cryptography = require('../utils/cryptography'),
    jwt = require('jsonwebtoken'),
    fs = require('fs'),
    mongo = require('../config/mongo');

exports.init = function (app) {
    mongo.likes = mongo.likes || mongo.db.collection('likes');
    app.use(route.post('/api/v1/like/:id', likePost));
    app.use(route.post('/api/v1/unlike/:id', unlikePost));
};

async function likePost(ctx, id) {
    const user = jwt.verify(ctx.request.accept.headers.authorization.toString().replace("Bearer ", ""), config.app.secret);
    var userId = user.id.toString();
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

    var likeDoc = await mongo.likes.findOne({postId: id.toString()});
    if (!likeDoc) {
        likeDoc = {
            postId: id.toString(),
            users: [
                {
                    userId: userId.toString(),
                    addedAt: Date.now()
                }
            ]
        }
        await mongo.likes.insertOne(likeDoc);
        ctx.status = 200;
        ctx.body = "Ok";
        return;
    }

    var usrLikeObj = likeDoc.users.find(o => o.userId == userId);
    var usrIdx = likeDoc.users.indexOf(usrLikeObj);
    if (usrIdx > 0) {
        ctx.status = 500;
        console.log("Post already liked, cannot like twice!")
        ctx.body = "Post already liked, cannot like twice!";
        return;
    }
    
    likeDoc.users.push({
        userId: userId.toString(),
        addedAt: Date.now()
    });
    await mongo.likes.updateOne({_id: mongo.ObjectID(likeDoc._id)}, {$set: likeDoc});
    ctx.status = 201;
    ctx.body = "Ok";
}

async function unlikePost(ctx, id) {
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

    var post = await mongo.posts.findOne({_id: mongo.ObjectID(id)});
    if (!post) {
        ctx.status = 500;
        ctx.body = "Invalid postId provided!";
        return;
    }

    var likeDoc = await mongo.likes.findOne({postId: id.toString()});
    var usrLikeObj = likeDoc.users.find(o => o.userId == userId);
    var usrIdx = likeDoc.users.indexOf(usrLikeObj);
    if (usrIdx < 0) {
        ctx.status = 500;
        console.log("Post not liked, cannot unlike!")
        ctx.body = "Post not liked, cannot unlike!";
        return;
    }
    likeDoc.users.splice(usrIdx, 1);
    await mongo.likes.updateOne({_id: mongo.ObjectID(likeDoc._id.toString())}, {$set: likeDoc});
    ctx.status = 201;
    ctx.body = "Ok";
}