var height;
var width;

var circles;
var colors = ["#0099CC", "#444444", "#00DB4A", "#BB1D00", "#FF8300"];
var stage;
var gameState;

function drawCoordinates() {
  for (i = 0; i < width; i++) {
    var text = new createjs.Text(String.fromCharCode(65 + i), "40px Helvetica", "#000000");
    text.x = 87 + 100 * i;
    text.y = 0;
    stage.addChild(text);
  }
  stage.update();
}

function createCircle(x, y, color) {
  circles[y][x] = new createjs.Shape();
  circles[y][x].graphics.beginFill(colors[color]).drawCircle(0, 0, 49);
  circles[y][x].x = x*100 + 100;
  circles[y][x].y = y*100 + 100;
  stage.addChild(circles[y][x]);
}

function drawCircles() {
  for (i = 0; i < height; i++) {
    circles.push([]);
  }

  for (i = 0; i < height; i++) {
    for (j = 0; j < width; j++) {
      if (gameState[i][j] == -1)
        continue;
      createCircle(j, i, gameState[i][j]);
    }
  }
}

function init() {
  stage = new createjs.Stage("diaCanvas");

  var socket = io();

  socket.on('gameState', function(gs) {
      stage.removeAllChildren();

      gameState = gs;
      circles = [];

      height = gameState.length;
      width = gameState[0].length;

      drawCoordinates();

      drawCircles();

      stage.update();
  });

  socket.on('doMove', function(move) {
    createCircle(move.x, move.y, move.color);
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
