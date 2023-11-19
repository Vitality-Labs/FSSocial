'use strict';

var fs = require('fs'),
    logger = require('koa-logger'),
    send = require('koa-send'),
    jwt = require('koa-jwt'),
    cors = require('kcors'),
    bodyParser = require('koa-bodyparser'),
    compress = require('koa-compress'),
    config = require('./config');

module.exports = function (app) {
    app.use(compress({
        filter (content_type) {
            return /text/i.test(content_type)
        },
        threshold: 128,
        gzip: {
            flush: require('zlib').constants.Z_SYNC_FLUSH
        },
        deflate: {
            flush: require('zlib').constants.Z_SYNC_FLUSH,
        },
        br: false
    }));
    if (config.app.env !== 'test') {
        app.use(logger());
    }
    app.use(cors({
        credentials: true,
        methods: 'GET, HEAD, OPTIONS, PUT, POST, DELETE',
        headers: 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Accept-Ranges'
    }));
    app.use(bodyParser({
        jsonLimit: '100mb',
    }));
      
    fs.readdirSync('./server/nojwt_controllers').forEach(function (file) {
        require('../nojwt_controllers/' + file).init(app);
    });
      
    var sendOpts = config.app.env === 'production' ? {root: 'client', maxage: config.app.cacheTime} : {root: 'client'};
    app.use(async function (ctx, next) {
        if (ctx.path.substr(0, 5).toLowerCase() === '/api/') {
            await next();
            return;
        } else if (await send(ctx, ctx.path, sendOpts)) {
            return;
        } else if (ctx.path.indexOf('.') !== -1) {
            return;
        } else {
            await send(ctx, '/index.html', sendOpts);
        }
    });
      
    app.use(jwt({secret: config.app.secret}));
      
    fs.readdirSync('./server/controllers').forEach(function (file) {
        require('../controllers/' + file).init(app);
    });
};
      