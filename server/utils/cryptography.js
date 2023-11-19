var jwt = require('jsonwebtoken'),
    config = require('../config/config');

async function decryptUserToken(ctx) {
    return jwt.verify(ctx.request.accept.headers.authorization.toString()
        .replace("Bearer ", ""), config.app.secret);
}

module.exports.decryptUserToken = decryptUserToken;