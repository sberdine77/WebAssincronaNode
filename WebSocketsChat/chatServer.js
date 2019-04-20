"use strict";

process.title = "node-chat";

var webSocketsServerPort = 1337;

var webSocketServer = require('websocket').server;
var http = require('http');

var history = [];
var users = []

function htmlEntities(str) {
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

var colors = ['red', 'blue', 'green', 'magenta', 'purple', 'plum', 'orange'];
colors.sort(function(a,b) { return Math.random() > 0.5; } );

var server = http.createServer(function(request, response) {
    //
});

server.listen(webSocketsServerPort, function() {
    console.log((new Date()) + "Server is listening on port " + webSocketsServerPort);
});

var wsServer = new webSocketServer({
    httpServer: server
});

wsServer.on('request', function(request) {
    console.log((new Date()) + 'Connection request from ' + request.origin);
    var connection = request.accept(null, request.origin);
    var index = users.push(connection) - 1;
    var userName = false;
    var userColor = false;
    
    console.log((new Date()) + 'Connection accepted.');
    if (history.length > 0) {
        console.log('HISTORY');
        connection.sendUTF(JSON.stringify({
            type: 'history', data: history
        }));
    }

    connection.on('message', function(message) {
        console.log('MESSAGE');
        if (message.type === 'utf8') {
            console.log('utf8');
            if (userName === false) {
                userName = htmlEntities(message.utf8Data);
                userColor = colors.shift();
                connection.sendUTF(JSON.stringify({
                    type: 'color', data: userColor
                }));
                console.log((new Date()) + ' User is known as: ' + userName + ' with ' + userColor + ' color.')
            } else {
                console.log((new Date()) + ' Received Message from ' + userName + ': ' + message.utf8Data);
                var obj = {
                  time: (new Date()).getTime(),
                  text: htmlEntities(message.utf8Data),
                  author: userName,
                  color: userColor
                };
                history.push(obj);
                history = history.slice(-100);
                var json = JSON.stringify({
                    type:'message', data: obj
                });
                for (var i = 0; i < users.length; i++) {
                  users[i].sendUTF(json);
                }
            }
        }
    });

    connection.on('close', function(connection) {
        if (userName !== false && userColor !== false) {
            console.log((new Date()) + " Peer " + connection.remoteAddress + " disconnected.");
            users.splice(index, 1);
            colors.push(userColor);
        }
    });

});

