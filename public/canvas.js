'use strict';

var xoffs;
var yoffs;

var heightPx;
var widthPx;

var height;
var width;

var scale;

var colors = ["#0099CC", "#444444", "#00DB4A", "#BB1D00", "#FF8300"];
var stage;
var gameState;
var scoreboard = [];

function render() {
  stage.removeAllChildren();
  drawCoordinates();
  drawScoreboard();
  drawCircles();
  stage.update();
}

function drawScoreboard() {
    var text = new createjs.Text('Scoreboard:', scale / 32 + "px Helvetica", "#000000");
    text.x = scale * 10 / 15 + xoffs;
    text.y = 0 + yoffs;
    stage.addChild(text);

    for (var i = 0; i < scoreboard.length; i++) {
        var player = scoreboard[i];

        // player name
        text = new createjs.Text(player.name + ':',
                scale / 32 + "px Helvetica", colors[i]);
        text.x = scale * 10 / 15 + xoffs;
        text.y = scale/32 + (2 * i + 1) * scale / 32 + yoffs;
        stage.addChild(text);

        // score
        text = new createjs.Text(player.score,
                scale / 32 + "px Helvetica", colors[i]);
        text.x = scale * 10 / 15 + xoffs;
        text.y = scale/32 + (2 * i + 2) * scale / 32 + yoffs;
        stage.addChild(text);
    }
}

function drawCoordinates() {
  for (var i = 0; i < width; i++) {
    var text = new createjs.Text(String.fromCharCode(65 + i), scale / 32 + "px Helvetica", "#000000");
    text.x = scale / 20 + (scale / 16) * i + xoffs;
    text.y = 0 + yoffs;
    stage.addChild(text);
  }
}

function drawCircles() {
  for (var i = 0; i < height; i++) {
    for (var j = 0; j < width; j++) {
      if (gameState[i][j].color != -1) {
        stage.addChild(gameState[i][j].circle);
      }
    }
  }
}

function createCircle(x, y, color) {
  var circle = new createjs.Shape();
  circle.graphics.beginFill(colors[color]).drawCircle(0, 0, scale / 32);
  circle.x = x*(scale / 16) + (scale / 16) + xoffs;
  circle.y = y*(scale / 16) + (scale / 16) + yoffs;
  gameState[y][x].color = color;
  gameState[y][x].circle = circle;
}

function init() {
  stage = new createjs.Stage("diaCanvas");

  function resize() {
    var wishAspect = 16/9;
    var curAspect = window.innerWidth / window.innerHeight;

    if (wishAspect > curAspect) {
        widthPx = window.innerWidth;
        heightPx = window.innerWidth / wishAspect;
        scale = heightPx * wishAspect;
        xoffs = 0;
        yoffs = (window.innerHeight - heightPx) / 2;
    } else {
        widthPx = window.innerHeight * wishAspect;
        heightPx = window.innerHeight;
        scale = widthPx;
        xoffs = (window.innerWidth - widthPx) / 2;
        yoffs = 0;
    }

    stage.canvas.width = window.innerWidth;
    stage.canvas.height = window.innerHeight;

    for (var i = 0; i < height; i++) {
      for (var j = 0; j < width; j++) {
        if (gameState[i][j].color !==  -1) {
          createCircle(j, i, gameState[i][j].color);
        }
      }
    }
    render();
  }
  resize();
  window.addEventListener('resize', resize, false);

  var socket = io();

  socket.on('gameState', function(gs) {

      gameState = [];
      height = gs.length;
      width = gs[0].length;

      for (var i = 0; i < height; i++) {
        gameState.push([]);
        for (var j = 0; j < width; j++) {
          gameState[i][j] = {};
          createCircle(j, i, gs[i][j]);
        }
      }
      render();
  });

  socket.on('doMove', function(move) {
    createCircle(move.x, move.y, move.color);
    render();
  });

  socket.on('clearLine', function() {
    var ObjectArray = [];
    for (var i = 0; i < width; i++) {
      ObjectArray[i] = {};
      ObjectArray[i].color = -1;
    }
    gameState.unshift(ObjectArray);
    gameState.pop();

    for (var i = 0; i < height; i++) {
      for (var j = 0; j < width; j++) {
        if (gameState[i][j].color != -1)
          gameState[i][j].circle.y += scale / 16;
      }
    }
    render();
  });

  socket.on('scoreboard', function(newScoreboard) {
    scoreboard = newScoreboard;
    scoreboard = _.sortBy(scoreboard, 'score');
    render();
  });

  socket.on('clearCircles', function(circles) {
      _.each(circles, function(circle) {
          gameState[circle.y][circle.x] = -1;
      });
      render();
  });
}
