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
