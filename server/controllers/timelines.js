'use strict';

var route = require('koa-route'),
    mongo = require('../config/mongo'),
    config = require('../config/config'),
    cryptography = require('../utils/cryptography'),
    jwt = require('jsonwebtoken'),
    _ = require('lodash'),
    ws = require('../config/ws');

exports.init = function (app) {
    app.use(route.get('/api/v1/timeline/home', getHomeTimeline));
};

async function getHomeTimeline(ctx) {
    const user = await cryptography.decryptUserToken(ctx);
    var query = ctx.request.query;
    console.log("query: ", JSON.stringify(query))
    const limit = parseInt(query.limit ? query.limit : 100);
    const skip = parseInt(query.skip ? query.skip : 0);
    console.log("limit: ", limit)
    console.log("skip: ", skip)
    var userData = {};

    var posts = await mongo.posts.find({}).sort({_id: -1}).skip(skip).limit(limit).toArray();
    
    for (var i = 0; i < posts.length; i++) {
        if (!userData[posts[i].from.toString()]) {
            var fromData = await mongo.users.findOne({_id: mongo.ObjectId(posts[i].from)}, {_id: 0, username: 1, displayname: 1, verified: 1});
            userData[posts[i].from.toString()] = {
                username: fromData.username,
                displayname: fromData.displayname,
            }
        }

        posts[i].fromData = userData[posts[i].from.toString()];
        var tmpLikeData = await getPostLikeCount(posts[i]._id.toString(), user.id.toString());
        posts[i].likes = tmpLikeData.likeCnt;
        posts[i].hasLiked = tmpLikeData.hasLiked;
        posts[i].comments = 0;
        posts[i].reposts = 0;
    }
    
    ctx.status = 200;
    ctx.body = posts;
}

async function getPostLikeCount(id, userId) {
    var tmp = await mongo.likes.findOne({postId: id}, {users: 1, _id: 0});
    var tmp2 = await mongo.likes.findOne({postId: id, "users.userId": userId.toString()});
    var hasLiked = false;
    if (tmp2) hasLiked = true;
    if (!tmp) return {hasLiked: false, likeCnt: 0};
    return {hasLiked: hasLiked, likeCnt: tmp.users.length}
}