'use strict';

var WebSocketServer = require('ws').Server,
    url = require('url'),
    jwt = require('jsonwebtoken'),
    _ = require('lodash'),
    config = require('../config/config');

exports.listen = function (server) {
  var wss = new WebSocketServer({server: server, verifyClient: function (info) {
    var query = url.parse(info.req.url, true).query,
        accessToken = query.access_token;
    try {
      info.req.user = jwt.verify(accessToken, config.app.secret);
    } catch(e) {}

    return info.req.user;
  }});

  wss.on('connection', function (ws) {
    var user = ws.upgradeReq.user;
    console.log('A new WebSocket client connected with ID: ' + user.id);
    if (exports.clients[user.id]) {
      exports.clients[user.id].push(ws);
    }
    else {
      exports.clients[user.id] = [ws];
    }

    ws.on('close', function () {
      console.log('A WebSocket client with ID: ' + user.id + ' disconnected.');
      if (exports.clients[user.id].length === 1) {
        exports.clients[user.id] = null;
      }
      else {
        var index = exports.clients[user.id].indexOf(ws);
        exports.clients[user.id].splice(index, 1);
      }
    });

    ws.on('error', function (err) {
      console.log('A WebSocket error occurred: %s', err);
    });

    ws.on('message', function (data) {
      if (!data.toString().includes('ping')) {
        console.log('An unexpected WebSocket message received from client with data: %s', JSON.parse(data));
        return;
      }
      var id = data.split(':')[1].toString();
      console.log("ping: ", id)
      exports.clients[id][0].send('pong');
    });
  });

  exports.wss = wss;
  return wss;
};

exports.clients = [];
exports.notify = function (recipients, method, params) {
  if (!Array.isArray(recipients)) {
    params = method;
    method = recipients;
    recipients = _.keys(exports.clients);
  }
  var data = JSON.stringify({jsonrpc: '2.0', method: method, params: params});

  var send = function (client) {
    client.send(data, function (err) {
      if (err) {
        console.log('A WebSocket error occurred: %s', err);
      }
    });
  };

  for (var i = 0; i < recipients.length; i++) {
    var recipient = recipients[i],
        onlineClients = exports.clients[recipient];
    if (onlineClients) {
      onlineClients.forEach(send);
    }
  }
};