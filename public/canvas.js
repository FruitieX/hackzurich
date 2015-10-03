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
  circles[y][x].distance = 0;
  stage.addChild(circles[y][x]);
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

      for (i = 0; i < height; i++) {
        circles.push([]);
      }

      for (i = 0; i < height; i++) {
        for (j = 0; j < width; j++) {
          if (gameState[i][j] == -1) {
            circles[i][j] == undefined;
            continue;
          }
          createCircle(j, i, gameState[i][j]);
        }
        stage.update();
      }
      createjs.Ticker.on("tick", tick);
      createjs.Ticker.setFPS(60);
  });

  socket.on('doMove', function(move) {
    createCircle(move.x, move.y, move.color);
    circles[move.y][move.x].distance = move.y * 100 + 100;
    circles[move.y][move.x].y = 0;
    stage.update();
  });
}

function tick(event) {

  for (i = 0; i < height; i++) {
    for (j = 0; j < width; j++) {
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
