var xoffs;
var yoffs;

var heightPx;
var widthPx;

var height;
var width;

var circles;
var colors = ["#0099CC", "#444444", "#00DB4A", "#BB1D00", "#FF8300"];
var stage;
var gameState;

function drawCoordinates() {
  for (var i = 0; i < width; i++) {
    var text = new createjs.Text(String.fromCharCode(65 + i), scale / 24 + "px Helvetica", "#000000");
    text.x = scale / 15 + (scale / 12) * i + xoffs;
    text.y = 0 + yoffs;
    stage.addChild(text);
  }
  stage.update();
}

function createCircle(x, y, color) {
  circles[y][x] = new createjs.Shape();
  circles[y][x].graphics.beginFill(colors[color]).drawCircle(0, 0, scale / 24);
  circles[y][x].x = x*(scale / 12) + (scale / 12) + xoffs;
  circles[y][x].y = y*(scale / 12) + (scale / 12) + yoffs;
  circles[y][x].distance = 0;
  stage.addChild(circles[y][x]);
}

function drawCircles() {
  for (var i = 0; i < height; i++) {
    circles.push([]);
  }

  for (var i = 0; i < height; i++) {
    for (var j = 0; j < width; j++) {
      if (gameState[i][j] == -1)
        continue;
      createCircle(j, i, gameState[i][j]);
    }
  }
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

    stage.removeAllChildren();
    drawCoordinates();
    drawCircles();
    stage.update();
  }
  resize();
  window.addEventListener('resize', resize, false);

  var socket = io();

  socket.on('gameState', function(gs) {
      stage.removeAllChildren();

      gameState = gs;
      circles = [];

      height = gameState.length;
      width = gameState[0].length;

      drawCoordinates();

      createjs.Ticker.on("tick", tick);
      createjs.Ticker.setFPS(60);

      drawCircles();

      stage.update();
  });

  socket.on('doMove', function(move) {
    gameState[move.y][move.x] = move.color;
    createCircle(move.x, move.y, move.color);
    circles[move.y][move.x].distance = move.y * (scale / 12) + (scale / 12) + yoffs;
    circles[move.y][move.x].y = 0;
    stage.update();
  });

  socket.on('clearLine', function() {
      gameState.unshift(Array.apply(null, Array(width)).map(Number.prototype.valueOf, -1));
      gameState.pop();
      stage.removeAllChildren();
      drawCoordinates();
      drawCircles();
      stage.update();
  });
}

function tick(event) {

  for (var i = 0; i < height; i++) {
    for (var j = 0; j < width; j++) {
      if (circles[i][j] == undefined)
        continue;
      if (circles[i][j].distance > 0) {
        circles[i][j].distance -= (event.delta)/1000*1000;
        circles[i][j].y += (event.delta)/1000*1000;
        if (circles[i][j].distance < 0) {
          circles[i][j].y += circles[i][j].distance;
          circles[i][j].distance = 0;
        }
      }
    }
  }
  stage.update(event);
}
