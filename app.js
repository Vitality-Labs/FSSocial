var config = require('./server/config/config'),
    mongo = require('./server/config/mongo'),
    mongoSeed = require('./server/config/mongo-seed'),
    koaConfig = require('./server/config/koa'),
    ws = require('./server/config/ws'),
    Koa = require('koa'),
    app = new Koa();


app.init = async function (overwriteDB) {
    console.log("overwriteDB: ", overwriteDB)
    await mongo.connect();
    await mongoSeed(overwriteDB);
    koaConfig(app);

    app.server = app.listen(config.app.port);
    ws.listen(app.server);
    if (config.app.env !== 'test') {
    console.log('App listening on port ' + config.app.port);
    }
};

if (!module.parent) {
    app.init().catch(function (err) {
        console.error(err);
        process.exit(1);
    });
}

module.exports = app;