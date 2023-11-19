'use strict';

var path = require('path'),
    _ = require('lodash');

var baseConfig = {
    app: {
        root: path.normalize(__dirname + '/../..'),
        env: process.env.NODE_ENV,
        secret: process.env.SECRET || '1DLEBA4GMADAQUACx2gGGBiAKBboU',
        privateKey: 'MIGeMA0GCSqGSIb3DQEBAQUAA4GMADCBiAKBgGx2GboUVnyzzJuxhCjP2i1AtvYx==',
        pass: process.env.PASS || 'pass'
    }
};

var platformConfig = {
    development: {
        app: {
            port: 5000
        },
        mongo: {
            url: 'mongodb://localhost:27017/fssocial'
        }
    },
  
    test: {
        app: {
            port: 3001
        },
        mongo: {
            url: 'mongodb://localhost:27017/fssocial-test'
        }
    },
  
    production: {
        app: {
            port: process.env.PORT || 3000,
            cacheTime: 7 * 24 * 60 * 60 * 1000
        },
        mongo: {
            url: process.env.MONGODB_URI || process.env.MONGOHQ_URL || process.env.MONGOLAB_URI || 'mongodb://localhost:27017/koan'
        }
    }
};
  
module.exports = _.merge(baseConfig, platformConfig[baseConfig.app.env || (baseConfig.app.env = 'development')]);
  