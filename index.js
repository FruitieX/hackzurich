'use strict';

var _ = require('underscore');

var livereload = require('livereload');
var server = livereload.createServer();
server.watch(__dirname + '/public');

var express = require('express');
var app = express();

var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(express.static(__dirname + '/public'));
http.listen(8080, function() {
    console.log('listening on 8080');
});

var width = 10;
var height = 6;

var throttle = 500;

var players = [];

var gameState = [];

for (var i = 0; i < height; i++) {
    gameState.push([]);
}

var numPlayers = 6;

for (var x = 0; x < width; x++) {
    for (var y = 0; y < height; y++) {
        gameState[y][x] = Math.floor(Math.random() * numPlayers);
    }
}

var clearLineTimeoutVal = 5000;
var clearLineTimeout = null;

var clearLine = function() {
    var percentage = 0;
    var active = 0;
    var inactive = 0;

    for (var x = 0; x < width; x++) {
        for (var y = 0; y < height; y++) {
            if (gameState[y][x] !== -1) {
                active++;
            } else {
                inactive++;
            }
        }
    }

    percentage = active / (active + inactive);

    if (percentage < 1/3) {
        console.log('skipping line clear due to low percentage!');
        return;
    }

    gameState.unshift(Array.apply(null, Array(width)).map(Number.prototype.valueOf, -1));
    gameState.pop();
    console.log('line cleared!');
    console.log(gameState);
    io.sockets.emit('clearLine');
    resetClearLineTimeout();
};

var resetClearLineTimeout = function() {
    clearTimeout(clearLineTimeout);
    clearLineTimeout = setTimeout(function() {
        clearLine();
    }, clearLineTimeoutVal);
};

resetClearLineTimeout();

var checkPlayField = function() {
    var percentage = 0;
    var active = 0;
    var inactive = 0;

    for (var x = 0; x < width; x++) {
        for (var y = 0; y < height; y++) {
            if (gameState[y][x] !== -1) {
                active++;
            } else {
                inactive++;
            }
        }
    }

    percentage = active / (active + inactive);

    if (percentage > 0.70) {
        clearLine();
        checkPlayField();
        return;
    }

    var shouldBeDeleted = [];
    var removedLength = 3;
    var deltas = [[1, 0], [1, 1], [0, 1], [-1, 1]];

    for (var y = 0; y < height; y++) {
        for (var x = 0; x < width; x++) {
            // ignore empty elements
            if (gameState[y][x] === -1) {
                continue;
            }
            // check the adjacencies to right
            var lengths = [0, 0, 0, 0];
            for(var i = x; i < width; i++){
                if (gameState[y][x] === gameState[y][i]){
                    lengths[0] += 1;
                }
                else {
                    break;
                }
            }
            // check the direction to botright
            var j = y;
            for(var i = x; i < width; i++){
                if (j >= height){
                    break;
                }
                if (gameState[y][x] === gameState[j][i]){
                    lengths[1] += 1;
                }
                else {
                    break;
                }
                j++;
            }
            // check the direction to bot
            for(var j = y; j < height; j++){
                if (gameState[y][x] === gameState[j][x]){
                    lengths[2] += 1;
                }
                else {
                    break;
                }
            }
            // check the direction to botleft
            var j = y;
            for(var i = x; i >= 0; i--){
                if (j >= height){
                    break;
                }
                if (gameState[y][x] === gameState[j][i]){
                    lengths[3] += 1;
                }
                else {
                    break;
                }
                j++;
            }
            //console.log(lengths);
            // Check if there are any connected lines with length above threshold
            for (var index = 0; index < lengths.length; index++){
                if(lengths[index] >= removedLength){
                    for(var n = 0; n < lengths[index]; n++){
                        var temp = {x: x + deltas[index][0] * n, y: y + deltas[index][1] * n, player: gameState[y][x]};
                        if (shouldBeDeleted.length === 0){
                            shouldBeDeleted.push(temp);
                            continue;
                        }
                        for(var m = 0; m < shouldBeDeleted.length; m++){
                            if(shouldBeDeleted[m].x === temp.x && shouldBeDeleted[m].y === temp.y){
                                break;
                            }
                            else if(m === (shouldBeDeleted.length - 1)) {
                                shouldBeDeleted.push(temp);
                            }
                        }
                    }
                }
            }
        }
    }
    // Actually delete the marks
    if (shouldBeDeleted.length) {
        for (var i = 0; i < shouldBeDeleted.length; i++) {
            var x = shouldBeDeleted[i].x;
            var y = shouldBeDeleted[i].y;

            // loop from top of playfield above removed element,
            // drop every piece down one step
            for (var j = y - 1; j >= 0; j--) {
                gameState[j + 1][x] = gameState[j][x];
            }

            if (players[shouldBeDeleted[i].player]) {
                players[shouldBeDeleted[i].player].score++;
            }
            gameState[0][x] = -1;
        }

        // call recursively until there is nothing more to delete
        checkPlayField();

        io.sockets.emit('clearCircles', shouldBeDeleted);
        io.sockets.emit('scoreboard', players);
    }
};

// check playfield once before starting game
checkPlayField();

var drawGameState = function() {
    console.log(gameState);
    /*
    for (var y = 0; y < height; y++) {
        for (var x = 0; x < width; x++) {
            process.stdout.write(gameState[x][y] + ', ');
        }
        process.stdout.write('\n');
    }
    */
};
drawGameState();

var doMove = function(pos, color) {
    pos = pos.toLowerCase();
    var posCharacter = pos.substr(0, 1);
    pos = pos.charCodeAt(0) - 'a'.charCodeAt(0);

    if (pos < 0 || pos > width - 1) {
        console.log('invalid move! out of bounds.');
        return;
    }

    if (gameState[0][pos] !== -1) {
        console.log('invalid move! column ' + posCharacter + ' is full.');
        return;
    }

    // search from top the first place that either contains a piece or is
    // beyond the array (undefined), put new piece on top of it
    var y;
    for (var i = 0; i < height; i++) {
        // first element found
        if (gameState[i][pos] !== -1) {
            // put piece above it
            y = i - 1;
            gameState[i - 1][pos] = color;
            break;
        }
        // got to last row and still no elements found
        if (gameState[i][pos] === -1 && i === height - 1) {
            // put piece on last row
            y = i;
            gameState[i][pos] = color;
            break;
        }
    }

    // TODO: uncomment when checkPlayField is implemented

    var move = {
        x: pos,
        y: y,
        color: color
    };
    io.sockets.emit('doMove', move);

    checkPlayField();
    drawGameState();

    io.sockets.emit('scoreboard', players);
};

io.on('connection', function(socket) {
    socket.emit('gameState', gameState);
    socket.emit('scoreboard', players);
});

var initPlayer = function(msg) {
    console.log(msg.from.first_name + ' joined the game with id: ' + msg.from.id);

    var player = {
        name: msg.from.first_name,
        id: msg.from.id,
        lastCmd: 0,
        score: 0
    }

    // return new index
    return players.push(player) - 1;
};

try {
    var token = require(process.env.HOME + '/.diagram-bot-token.js');
    var Bot = require('node-telegram-bot');

    var bot = new Bot({
        token: token
    })
    .on('message', function(msg) {
        console.log('telegram message:');
        console.log(msg);

        if (msg.text) {
            msg.text = msg.text.toLowerCase();

            var color = _.findIndex(players, function(player) {
                return player.id === msg.from.id;
            });

            if (!msg.text.indexOf('/start')) {
                if (color === -1) {
                    color = initPlayer(msg);
                }

                bot.sendMessage({
                    text: 'Welcome to diagram!',
                    chat_id: msg.chat ? msg.chat.id : msg.from.id,
                    reply_to_message_id: msg.message_id,
                    reply_markup: {
                        keyboard: [
                            ['/a', '/b', '/c', '/d', '/e'],
                            ['/f', '/g', '/h', '/i', '/j']
                        ],
                        resize_keyboard: true,
                        selective: true
                    }
                }, function(err) {
                    if (err) {
                        console.log('error on sendMessage:');
                        console.log(err);
                    }
                });
            } else if (!msg.text.indexOf('/stop')) {
                bot.sendMessage({
                    text: msg.from.first_name + ' left the game.',
                    chat_id: msg.chat ? msg.chat.id : msg.from.id,
                    reply_to_message_id: msg.message_id,
                    reply_markup: {
                        hide_keyboard: true,
                        selective: true
                    }
                }, function(err) {
                    if (err) {
                        console.log('error on sendMessage:');
                        console.log(err);
                    }
                });
            } else if (msg.text.substr(0, 1) === '/' &&
                       msg.text.charCodeAt(1) >= 'a'.charCodeAt(0) &&
                       msg.text.charCodeAt(1) <= 'z'.charCodeAt(0)) {
                // commands for dropping pieces (/a, /b, /c, etc.)
                if (color === -1) {
                    color = initPlayer(msg);
                }

                if (new Date().getTime() - players[color].lastCmd < throttle) {
                    console.log('skipping too fast cmd!');
                    return;
                }
                players[color].lastCmd = new Date().getTime();

                doMove(msg.text.substr(1, 2), color);
            } else {
                console.log('error: unknown command!');
                console.log(msg.text);
            }
        }
    });

    bot.start();
} catch(e) {
    console.log('ERROR initializing telegram bot API!');
    console.log(e);
    console.log('Did you forget to write your API key to ~/.diagram-bot-token.js?');
    console.log('Will use stdin for input instead. Syntax:');
    console.log('    3d - inserts element for player 3 in position D');
}

var readline = require('readline');
var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
});

rl.on('line', function(line){
    var input = {
        color: line.substr(0, 1),
        pos: line.substr(1, 2).toLowerCase()
    };

    var color = _.findIndex(players, function(player) {
        return player.id === 'dummy' + input.color;
    });

    if (color === -1) {
        var player = {
            name: 'Test player ' + input.color,
            score: 0,
            lastCmd: 0,
            id: 'dummy' + input.color
        }

        console.log('adding new player: ' + player.id);
        console.log(player);

        // return new index
        color = players.push(player) - 1;
    }

    doMove(input.pos, color);
});
