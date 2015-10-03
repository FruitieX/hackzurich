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

function render() {
  stage.removeAllChildren();
  drawCoordinates();
  drawCircles();
  stage.update();
}

function drawCoordinates() {
  for (var i = 0; i < width; i++) {
    var text = new createjs.Text(String.fromCharCode(65 + i), scale / 24 + "px Helvetica", "#000000");
    text.x = scale / 15 + (scale / 12) * i + xoffs;
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
  circle.graphics.beginFill(colors[color]).drawCircle(0, 0, scale / 24);
  circle.x = x*(scale / 12) + (scale / 12) + xoffs;
  circle.y = y*(scale / 12) + (scale / 12) + yoffs;
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
            gameState[i][j].circle.y += scale / 12;
        }
      }
      render();
  });
}
