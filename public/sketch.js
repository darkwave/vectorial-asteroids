const NUM_OF_ASTEROIDS = 100;

const HUGE = 200;
const BIG = 100;
const SMALL = 30;

const MISSILES_SPEED = 20;
const MISSILES_TTL = 2000;
const MISSILES_SIZE = 10;
const FIRE_RATE = 300;

const VELOCITY_MAX = 10;
const VELOCITY_MIN = 0.5;

const FORWARD = 0;
const TURN_LEFT = 1;
const TURN_RIGHT = 2;
const BACKWARD = 3;
const FIRE_FRONT = 4;
const FIRE_TURRET = 5;

var controls = [false, false, false, false, false, false];


var asteroids = [];
var missiles = [];
var explosions = [];

var freshAsteroids = [];
var freshMissiles = [];
var freshExplosions = [];

var cam;

var half_width;
var half_height;

var lastShot = 0;
var spaceShip;
var shield = 1;

var mX, mY;

var timestamp = 0;

var boldFont;

function preload() {
  boldFont = loadFont("fonts/Goldman-Bold.ttf", function(){}, function(error) {
    console.error(error);
  });
}

function setup() {
  createCanvas(displayWidth, displayHeight, WEBGL);
  colorMode(HSB);

  textFont(boldFont);
  textSize(42);
  textAlign(CENTER, CENTER);

  half_width = 0;
  half_height = 0;
  cam = createVector(0, 0, 1);
  initGame();  
}

function initGame() {
  asteroids = [];
  missiles = [];
  explosions = [];
  freshMissiles = [];
  freshExplosions = [];
  freshAsteroids = [];
  shield = 1;

  for (var a = 0; a < NUM_OF_ASTEROIDS; a++) {
    var angle = random(-PI, PI);
    var distance = random(300, 4000);
    var x = sin(angle) * distance;
    var y = cos(angle) * distance;
    var size = random(SMALL, HUGE);
    var asteroid = createAsteroid(x, y, size);
    
    var randomAngle = random(-PI, PI);
    var randomSpeed = random(0.1, 0.5);
    var impulseX = sin(randomAngle) * randomSpeed;
    var impulseY = cos(randomAngle) * randomSpeed;
    asteroid.velocity.add(impulseX, impulseY)
    asteroids.push(asteroid);
  }
  spaceShip = createSpaceShip(0, 0, 30);
}

function draw() {
  timestamp = millis();
  mX = (mouseX - (width / 2) + cam.x) / cam.z;
  mY = (mouseY - (height / 2) + cam.y) / cam.z;
  
  if (state == START) {
    updateCamera();
    displayGame();
    text("CLICK TO START", 0, 0);
  } else if (state == PLAYING) {
    controlElement(spaceShip);
    updateCamera();
    updateGame();
    displayGame();
  } else if (state == GAMEOVER) {
    updateGame();
    displayGame();
    text("YOU LOOSE", 0, 0);
  }
  
  
}

function updateCamera() {
  cam.x = spaceShip.x * cam.z;  
  cam.y = spaceShip.y * cam.z;
}

function displayGame() {
  background("#550044");
  push();
  translate(half_width - cam.x, half_height - cam.y);
  scale(cam.z);
  displayAll(asteroids);
  displayAll(missiles);
  displayAll(explosions);
  display(spaceShip);
  pop();
}

function updateGame() {
  collisionDetection(missiles, asteroids, missileToAsteroidCollision);
  collisionDetection([spaceShip], asteroids, spaceShipToAsteroidCollision);


  missiles = prune(missiles);
  asteroids = prune(asteroids);
  explosions = prune(explosions);
  
  asteroids = asteroids.concat(freshAsteroids);
  explosions = explosions.concat(freshExplosions);
  missiles = missiles.concat(freshMissiles);
  freshMissiles = [];
  freshExplosions = [];
  freshAsteroids = [];
  updateAll(asteroids);
  updateAll(missiles);
  updateAll(explosions);
  update(spaceShip);
}

function mousePressed() {
  if (state == PLAYING) {
    controls[FIRE_TURRET] = true;
  } else if (state == START) {
    changeState(PLAYING);
  } else if (state == GAMEOVER) {
    changeState(START);
  }
}
function mouseReleased() {
  controls[FIRE_TURRET] = false;
}

function keyPressed() {
  if (keyCode == UP_ARROW || key == 'w') {
    controls[FORWARD] = true;
  }
  if (keyCode == LEFT_ARROW || key == 'a') {
    controls[TURN_LEFT] = true;
  }
  if (keyCode == RIGHT_ARROW || key == 'd') {
    controls[TURN_RIGHT] = true;
  }
  if (keyCode == DOWN_ARROW || key == 's') {
    controls[BACKWARD] = true;
  }
  if (key == ' ') {
    controls[FIRE_FRONT] = true;
  }
}

function keyReleased() {
  if (keyCode == UP_ARROW || key == 'w') {
    controls[FORWARD] = false;
  }
  if (keyCode == LEFT_ARROW || key == 'a') {
    controls[TURN_LEFT] = false;
  }
  if (keyCode == RIGHT_ARROW || key == 'd') {
    controls[TURN_RIGHT] = false;
  }
  if (keyCode == DOWN_ARROW || key == 's') {
    controls[BACKWARD] = false;
  }
  if (key == ' ') {
    controls[FIRE_FRONT] = false;
  }
}

function updateAll(elements) {
  for (var element of elements) {
    update(element);
  }
}

function displayAll(elements) {
  for (var element of elements) {
    display(element);
  }
}

function prune(elements) {
  return elements.filter(element => {
    return !element.dead;
  })
}

function crackAsteroid(asteroid, x, y) {
  createExplosion(x, y);
  if (asteroid.size < SMALL) {    
    return;
  }
  
  var pieces = 2;
  var size = asteroid.size * 0.7;
  
  for (var a = 0; a < pieces; a++) {
    var newAsteroid = createAsteroid(asteroid.x, asteroid.y, size);
    
    var randomAngle = random(-PI, PI);
    var impulseX = sin(randomAngle) * 1;
    var impulseY = cos(randomAngle) * 1;
    newAsteroid.velocity.add(impulseX, impulseY)
    freshAsteroids.push(newAsteroid);
  }
}
const GAMEOVER = -1;
const START = 0;
const PLAYING = 1;

var state = START;

function changeState(newState) {
  console.log(state, newState);
  if (state == GAMEOVER && newState == START) {
    initGame();
  }
  state = newState;
}

function spaceShipToAsteroidCollision(ship, asteroid) {
  if (asteroid.size > HUGE) {
    shield -= 0.5;
  } else if (asteroid.size > BIG) {
    shield -= 0.3;
  } else if (asteroid.size > SMALL) {
    shield -= 0.2;
  } else {
    shield -= 0.1;
  }
  
  if (shield > 0) {
    asteroid.dead = true;
    crackAsteroid(asteroid, ship.x, ship.y);
  } else {
    changeState(GAMEOVER);
  }
}

function missileToAsteroidCollision(missile, asteroid) {
  if (missile.dead)
    return;
    
  missile.dead = true;
  asteroid.dead = true;
  
  crackAsteroid(asteroid, missile.x, missile.y);
  
}

function collisionDetection(groupA, groupB, callback) {
  for (var a of groupA) {
    for (var b of groupB) {
      if (dist(a.x, a.y, b.x, b.y) < a.size + b.size) {
        callback(a, b)
      }
    }
  }
}

function update(element) {
  element.x += element.velocity.x;
  element.y -= element.velocity.y;
  
  if (element.post)
      element.post();
}

function controlElement(element) {
  if (controls[FIRE_TURRET] && millis() - lastShot > FIRE_RATE) {
    lastShot = millis();
    shotTurrets();
  }

  if (controls[FIRE_FRONT] && millis() - lastShot > FIRE_RATE) {
    lastShot = millis();
    var m = createMissile(element.x, element.y, element.angle);
    var impulseX = sin(m.angle) * MISSILES_SPEED;
    var impulseY = cos(m.angle) * MISSILES_SPEED;
    m.velocity.add(impulseX, impulseY);
    missiles.push(m);
  }  
  
  if (controls[TURN_RIGHT]) {
    element.angle += radians(5);
  }
  if (controls[TURN_LEFT]) {
    element.angle -= radians(5);
  }


  var velocity = element.velocity.mag();

  if (controls[FORWARD] && velocity < VELOCITY_MAX) {
    var impulseX = sin(element.angle) * 0.1;
    var impulseY = cos(element.angle) * 0.1;
    element.velocity.add(impulseX, impulseY)
  }

  if (controls[BACKWARD]) {
    element.velocity.x *= 0.9;
    element.velocity.y *= 0.9;
    if (velocity < VELOCITY_MIN) {
      element.velocity.x = 0;
      element.velocity.y = 0;
    }
  }

}

function shotTurrets() {
  var mouseVector = createVector(mX - spaceShip.x, mY - spaceShip.y);
  var normalizedSpaceShipVector = createVector(0, -1);
  var angle = normalizedSpaceShipVector.angleBetween(mouseVector)
  var m = createMissile(spaceShip.x, spaceShip.y, angle);
  var impulseX = sin(angle) * MISSILES_SPEED;
  var impulseY = cos(angle) * MISSILES_SPEED;
  m.velocity.add(impulseX, impulseY);
  freshMissiles.push(m);
}

function display(element) {
  push();
  noStroke();
  
  translate(element.x, element.y);
  
  rotate(element.angle);
  fill(element.color)
  beginShape();
  for (var v of element.vertices) {
    vertex(v.x, v.y);
  }
  endShape(CLOSE);
  pop();
}

function createSpaceShip(x, y, radius) {
  var vertices = [];
  var r = radius;

  for (var n = 0; n < 360; n += 120) {
    var angle = radians(n) + PI;
    vertices.push(createVector(sin(angle) * r, cos(angle) * r * 1.2, angle));
  }
  
  var newSpaceShip = {
    x,
    y,
    vertices,
    color: "#ffdd00",
    angle: 0,
    size: radius,
    velocity: createVector(0, 0)
  }
  
  return newSpaceShip;
}

function missilesPost() {
  if (timestamp > this.timeToDie) {
    
    this.dead = true;
  }
}

function createExplosionRay(x, y, vertices, escapeAngle) {
  var newRay = {
    x: x,
    y: y,
    vertices: vertices,
    color: color(70, 100, 100),
    angle: 0,
    velocity: createVector(sin(escapeAngle) * 6, -cos(escapeAngle) * 6),
    post: missilesPost,
    timeToDie: timestamp + 500
  }
  return newRay;
}

function createExplosion(x, y) {
  var angleIncrement = random(50, 80);
  for (var a = 0; a < 360; a += angleIncrement) {
    var n = radians(a);
    var originX = 0;
    var originY = 0;
    var randomLength = random(60, 80);
    var randomThickness = 24;
    var leftX = sin(n +  PI / randomThickness) * randomLength;
    var leftY = cos(n + PI / randomThickness) * randomLength;
    var rightX = sin(n - PI / randomThickness) * randomLength;
    var rightY = cos(n - PI / randomThickness) * randomLength;
    var origin = createVector(originX, originY);
    var leftPoint = createVector(leftX, leftY);
    var rightPoint = createVector(rightX, rightY);
    freshExplosions.push(createExplosionRay(x, y, [origin, leftPoint, rightPoint], n));
  }
  
}

function createMissile(x,y, initialAngle) {
    var vertices = [];
  var r = MISSILES_SIZE;

  for (var n = 0; n < 360; n += 120) {
    var angle = radians(n) + PI;
    vertices.push(createVector(sin(angle) * r, cos(angle) * r * 1.2, angle));
  }
  
  var newMissile = {
    x,
    y,
    vertices,
    color: color(200, 100, 100),
    angle: initialAngle,
    velocity: createVector(0, 0),
    size: r,
    timeToDie: timestamp + MISSILES_TTL,
    post: missilesPost
  }
  
  return newMissile;
}

function createAsteroid(x, y, radius) {
  var res = 24;
  var vertices = [];
  for (var n = 0; n < 360; n += res) {
    var angle = radians(n);
    var r = radius * random(0.9, 1);
    vertices.push(createVector(sin(angle) * r, cos(angle) * r, angle));
  }
  
  var newAsteroid = {
    x,
    y,
    angle: 0,
    vertices,
    color: color(338, 100, random(50, 100)),
    velocity: createVector(0, 0),
    size: radius
  }
  
  return newAsteroid;
}
