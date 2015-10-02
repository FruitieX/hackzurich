var height = 10;
var width = 10;

var circles = [];
var colors = ["#0099CC", "#007399", "#33CCFF", "#66D9FF", "#3D8299"];
var stage;

function init() {
  stage = new createjs.Stage("diaCanvas");
  for (i = 0; i < height; i++) {
    circles.push([]);
  }
  for (i = 0; i < width; i++) {
    for (j = 0; j < height; j++) {
      circles[i][j] = new createjs.Shape();
      circles[i][j].graphics.beginFill(colors[(i+j) % colors.length]).drawCircle(0, 0, 49);
      circles[i][j].x = j*100 + 100;
      circles[i][j].y = i*100 + 100;
      stage.addChild(circles[i][j]);
      stage.update();
    }
  }
}

var socket = io();

socket.on('gameState', function(gameState) {
    console.log(gameState);
});
