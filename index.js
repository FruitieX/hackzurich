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

var players = [];

var gameState = [];

for (var i = 0; i < height; i++) {
    gameState.push([]);
}

var numPlayers = 5;

for (var x = 0; x < width; x++) {
    for (var y = 0; y < height; y++) {
        gameState[y][x] = Math.floor(Math.random() * numPlayers);
    }
}

var checkPlayField = function() {
    var shouldBeDeleted = [];
    for (var y = 0; y < height; y++) {
        for (var x = 0; x < width; x++) {
            // ignore empty elements
            if (gameState[y][x] === -1) {
                continue;
            }
            // check neighbors, but only if we're not going out of bounds
            if ((y > 0          && gameState[y][x] === gameState[y - 1][x])     ||
                (x > 0          && gameState[y][x] === gameState[y]    [x - 1]) ||
                (y < height - 1 && gameState[y][x] === gameState[y + 1][x])     ||
                (x < width - 1  && gameState[y][x] === gameState[y]    [x + 1])) {
                shouldBeDeleted.push({x: x, y: y});
            }
        }
    }

    if (shouldBeDeleted.length) {
        for (var i = 0; i < shouldBeDeleted.length; i++) {
            var x = shouldBeDeleted[i].x;
            var y = shouldBeDeleted[i].y;

            // loop from top of playfield above removed element,
            // drop every piece down one step
            for (var j = y - 1; j >= 0; j--) {
                gameState[j + 1][x] = gameState[j][x];
            }
            gameState[0][x] = -1;
        }

        // call recursively until there is nothing more to delete
        checkPlayField();
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
    var posCharacter = pos;
    pos = pos.charCodeAt(0) - pos.charCodeAt('a');

    if (pos < 0 || pos > width - 1) {
        console.log('invalid move!');
        return;
    }

    if (gameState[0][pos] !== -1) {
        console.log('invalid move! column ' + posCharacter + ' is full.');
        return;
    }

    // search first piece that either contains a piece or is beyond the array
    // (undefined), put new piece on top of it
    var y;
    for (var i = 0; i < height; i++) {
        if (gameState[i][pos] !== -1) {
            y = i - 1;
            gameState[i - 1][pos] = color;
            break;
        }
    }

    checkPlayField();
    drawGameState();

    var move = {
        x: pos,
        y: y,
        color: color
    };
    io.sockets.emit('doMove', move);
};

io.on('connection', function(socket) {
    socket.emit('gameState', gameState);
});

var initPlayer = function(msg) {
    console.log(msg.from.first_name + ' joined the game with id: ' + msg.from.id);

    var player = {
        name: msg.from.first_name,
        id: msg.from.id
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
        if (msg.text) {
            msg.text = msg.text.toLowerCase();

            var color = _.findIndex(players, function(player) {
                return player.id === msg.from.id;
            });

            if (msg.text.indexOf('/start')) {
                if (!color) {
                    color = initPlayer(msg);
                }

                bot.sendMessage({
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
            // drop piece commands
            } else if (msg.text.substr(0, 1) === '/' &&
                       msg.charCodeAt(1) >= 'a'.charCodeAt(0) &&
                       msg.charCodeAt(1) <= 'z'.charCodeAt(0)) {
                if (!color) {
                    color = initPlayer(msg);
                }

                doMove(msg.text.substr(1, 2), color);
            } else {
                console.log('error: unknown command!');
                console.log(msg.text);
            }
        }
    });

    bot.start();
} catch(e) {
    console.log('error initializing telegram bot API!');
    console.log(e);
    console.log('did you forget to write your API key to ~/.diagram-bot-token.js?');
    console.log('will use stdin for input instead (TODO)');
}
