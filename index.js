const express = require("express");
const path = require("path");
const TelegramBot = require("node-telegram-bot-api");

const TOKEN = "7710206652:AAHXjEntNWWxyhKG2crdP7-X89-hGhRgKG0";
const server = express();
const bot = new TelegramBot(TOKEN, {
    polling: true
});
const port = process.env.PORT || 5000;
const gameName = "ludo_social_prototype";
const queries = {};

// Middleware to serve Brotli-compressed files with the correct headers
server.get("*.br", (req, res, next) => {
    res.set("Content-Encoding", "br");
    res.set("Content-Type", "application/octet-stream"); // Adjust MIME type as needed
    next();
});

// Serve static files from the buildWeb directory
server.use(express.static(path.join(__dirname, "buildWeb")));

// Telegram bot handlers
bot.onText(/help/, (msg) => bot.sendMessage(msg.from.id, "Say /game if you want to play."));
bot.onText(/start|game/, (msg) => bot.sendGame(msg.from.id, gameName));
bot.on("callback_query", function (query) {
    if (query.game_short_name !== gameName) {
        bot.answerCallbackQuery(query.id, "Sorry, '" + query.game_short_name + "' is not available.");
    } else {
        queries[query.id] = query;
        let gameurl = "https://grafenters.github.io/ludo-build/";
        bot.answerCallbackQuery({
            callback_query_id: query.id,
            url: gameurl
        });
    }
});
bot.on("inline_query", function (iq) {
    bot.answerInlineQuery(iq.id, [{
        type: "game",
        id: "0",
        game_short_name: gameName
    }]);
});

// Endpoint to update high scores
server.get("/highscore/:score", function (req, res, next) {
    if (!Object.hasOwnProperty.call(queries, req.query.id)) return next();
    let query = queries[req.query.id];
    let options;
    if (query.message) {
        options = {
            chat_id: query.message.chat.id,
            message_id: query.message.message_id
        };
    } else {
        options = {
            inline_message_id: query.inline_message_id
        };
    }
    bot.setGameScore(query.from.id, parseInt(req.params.score), options, function (err, result) {
        if (err) console.error(err);
    });
});

// Start the server
server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
