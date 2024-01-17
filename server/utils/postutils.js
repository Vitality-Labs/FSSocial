'use strict';

var mongo = require('../config/mongo'),
    config = require('../config/config'),
    _ = require('lodash');

var initilized = false;

async function init() {
    mongo.likes = mongo.likes || mongo.db.collection('likes');
    mongo.reposts = mongo.reposts || mongo.db.collection('reposts');
    mongo.posts = mongo.posts || mongo.db.collection('posts');
    mongo.users = mongo.users || mongo.db.collection('users');
    initilized = true;
}

async function getPostData(postObj, userId) {
    if (initilized == false) await init();
    var tmpLikeData = await getPostLikeCount(postObj._id.toString(), userId.toString());
    postObj.likes = tmpLikeData.likeCnt;
    postObj.hasLiked = tmpLikeData.hasLiked;
    var tmpRepostData = await getPostRepostCount(postObj._id.toString(), userId.toString());
    postObj.reposts = tmpRepostData.repostCnt;
    postObj.hasRepost = tmpRepostData.hasRepost;
    postObj.comments = await getPostCommentCount(postObj._id.toString());;
    return postObj;
}

async function getPost(postId, userId) {
    if (initilized == false) await init();
    var postObj = await mongo.posts.findOne({_id: mongo.ObjectId(postId.toString())});
    if (!postObj) return null;
    postObj.fromData = await mongo.users.findOne({_id: mongo.ObjectId(postObj.from)}, {_id: 0, username: 1, displayname: 1, verified: 1});
    // Following Logic
    // TODO
    postObj.fromData.following = false;
    // ----------------
    var tmpLikeData = await getPostLikeCount(postObj._id.toString(), userId.toString());
    postObj.likes = tmpLikeData.likeCnt;
    postObj.hasLiked = tmpLikeData.hasLiked;
    var tmpRepostData = await getPostRepostCount(postObj._id.toString(), userId.toString());
    postObj.reposts = tmpRepostData.repostCnt;
    postObj.hasRepost = tmpRepostData.hasRepost;
    postObj.comments = await getPostCommentCount(postObj._id.toString());
    return postObj;
}

module.exports.getPostData = getPostData;
module.exports.getPost = getPost;

// Helper Functions

async function getPostLikeCount(id, userId) {
    var tmp = await mongo.likes.findOne({postId: id}, {users: 1, _id: 0});
    if (!tmp || tmp.users.length == 0) return {hasLiked: false, likeCnt: 0};
    var tmp2 = await mongo.likes.findOne({postId: id, "users.userId": userId.toString()});
    var hasLiked = false;
    if (tmp2) hasLiked = true;
    return {hasLiked: hasLiked, likeCnt: tmp.users.length}
}

async function getPostRepostCount(id, userId) {
    var repostsArr = await mongo.reposts.find({postId: id.toString()}).toArray();
    if (!repostsArr || repostsArr.length == 0) return {repostCnt: 0, hasRepost: false};
    var tmp = await mongo.reposts.findOne({postId: id.toString(), from: userId.toString()});
    var hasRepost = false;
    if (tmp) hasRepost = true;
    return {repostCnt: repostsArr.length, hasRepost: hasRepost};
}

async function getPostCommentCount(id) {
    var commentArr = await mongo.posts.find({parentId: id.toString()}).toArray();
    return commentArr.length;
}