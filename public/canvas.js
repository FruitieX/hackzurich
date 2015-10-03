var height;
var width;

var circles;
var colors = ["#0099CC", "#444444", "#00DB4A", "#005875", "#FF8300"];
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

function init() {
  stage = new createjs.Stage("diaCanvas");

  var socket = io();

  socket.on('gameState', function(gs) {

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
          if (gameState[i][j] == -1)
            continue;
          circles[i][j] = new createjs.Shape();
          circles[i][j].graphics.beginFill(colors[gameState[i][j]]).drawCircle(0, 0, 49);
          circles[i][j].x = j*100 + 100;
          circles[i][j].y = i*100 + 100;
          stage.addChild(circles[i][j]);
          stage.update();
        }
      }
  });

  socket.on('doMove', function(coords) {
    swap(coords[0], coords[1]);
    stage.update();
  });
}
