var height;
var width;

var circles;
var colors = ["#0099CC", "#007399", "#33CCFF", "#66D9FF", "#3D8299"];
var stage;
var gameState;

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
          circles[i][j] = new createjs.Shape();
          circles[i][j].graphics.beginFill(colors[gameState[i][j]]).drawCircle(0, 0, 49);
          circles[i][j].x = j*100 + 100;
          circles[i][j].y = i*100 + 100;
          stage.addChild(circles[i][j]);
          stage.update();
        }
      }
  });

}

function drawCoordinates() {
  for (i = 0; i < width; i++) {
    var text = new createjs.Text(String.fromCharCode(65 + i), "40px Helvetica", "#000000");
    text.x = 87 + 100 * i;
    text.y = 0;
    stage.addChild(text);
  }
  for (i = 0; i < height; i++) {
    var text = new createjs.Text(i.toString(), "40px Helvetica", "#000000");
    text.x = 10;
    text.y = 80 + 100 * i;
    stage.addChild(text);
  }
  stage.update();
}

function swap(from, to) {

  var tempx, tempy;

  // Do the swap by saving the previous coordinates to temp variables
  tempx = circles[from.y][from.x].x;
  tempy = circles[from.y][from.x].y;
  circles[from.y][from.x].x = circles[to.y][to.x].x;
  circles[from.y][from.x].y = circles[to.y][to.x].y;
  circles[to.y][to.x].x = tempx;
  circles[to.y][to.x].y = tempy;
}

socket.on('doMove', function(coords) {
  swap(coords[0], coords[1]);
  stage.update();
});
