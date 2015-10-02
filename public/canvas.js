function init() {
  var colors = ["#0099CC", "#007399", "#33CCFF", "#66D9FF", "#3D8299"];
  var stage = new createjs.Stage("diaCanvas");
  for (i = 1; i <= 10; i++) {
    for (j = 1; j <= 10; j++) {
      var circle = new createjs.Shape();
      circle.graphics.beginFill(colors[(i+j) % colors.length]).drawCircle(0, 0, 49);
      circle.x = i*100;
      circle.y = j*100;
      stage.addChild(circle);
      stage.update();
    }
  }
}

var socket = io();

socket.on('gameState', function(gameState) {
    console.log(gameState);
});
