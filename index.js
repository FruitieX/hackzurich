var _ = require('underscore');
var io = require('socket.io')();

io.on('connection', function(socket) {
    socket.emit('testevent', 'hello world');
});

var livereload = require('livereload');
var server = livereload.createServer();
server.watch(__dirname + '/public');

var express = require('express');
var app = express();

app.use(express.static(__dirname + '/public'));

app.listen(8080);

var width = 10;
var height = 10;

var gameState = [];

for (var i = 0; i < height; i++) {
    gameState.push([]);
}

var numPlayers = 4;

for (var x = 0; x < width; x++) {
    for (var y = 0; y < height; y++) {
        gameState[x][y] = Math.floor(Math.random() * numPlayers);
    }
}

console.log(gameState);

var doMove = function(from, direction) {
    var temp = gameState[from.x][from.y];

    switch (direction) {
        case 'up':
            gameState[from.x][from.y] = gameState[from.x][from.y - 1];
            gameState[from.x][from.y - 1] = temp;
            break;
        case 'down':
            gameState[from.x][from.y] = gameState[from.x][from.y + 1];
            gameState[from.x][from.y + 1] = temp;
            break;
        case 'left':
            gameState[from.x][from.y] = gameState[from.x - 1][from.y];
            gameState[from.x - 1][from.y] = temp;
            break;
        case 'right':
            gameState[from.x][from.y] = gameState[from.x + 1][from.y];
            gameState[from.x + 1][from.y] = temp;
            break;
        default:
            console.log('invalid move received! ' + direction);
    }
};

var token = require(process.env.HOME + '/.diagram-bot-token.js');
var Bot = require('node-telegram-bot');

var bot = new Bot({
    token: token
})
.on('message', function(msg) {
    if (msg.text) {
        console.log('got TG message: ' + msg.text);
    }
});

bot.start();
