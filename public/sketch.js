const NUM_OF_ASTEROIDS = 100;
const MISSILES_SPEED = 20;
const MISSILES_TTL = 2000;
const MISSILES_SIZE = 10;
const FIRE_RATE = 300;

const HUGE = 200;
const BIG = 100;
const SMALL = 30;

var asteroids = [];
var missiles = [];
var explosions = [];

var cam;

var half_width;
var half_height;

var lastShot = 0;
var spaceShip;

var mX, mY;
var freshAsteroids = [];
var freshMissiles = [];

var timestamp = 0;


function setup() {
  createCanvas(800, 800, WEBGL);
  colorMode(HSB);
  half_width = 0;
  half_height = 0;
  cam = createVector(0, 0, 0.8);
  
  
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
  
  

  controlElement(spaceShip);
  
  collisionDetection(missiles, asteroids, missileToAsteroidCollision);
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
  
  cam.x = spaceShip.x * cam.z;  
  cam.y = spaceShip.y * cam.z;
  
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

function mousePressed() {
  turrets = true;
}
function mouseReleased() {
  turrets = false;
}

function shotTurrets() {
  
  var mouseVector = createVector(mX - spaceShip.x, mY - spaceShip.y);
  var normalizedSpaceShipVector = createVector(0, -1);
  var angle = normalizedSpaceShipVector.angleBetween(mouseVector)
  var m = createMissile(spaceShip.x, spaceShip.y, angle);
  var impulseX = sin(angle) * MISSILES_SPEED;
  var impulseY = cos(angle) * MISSILES_SPEED;
  m.velocity.add(impulseX, impulseY);
  //print(m)
  freshMissiles.push(m);
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
var turrets = false;
function controlElement(element) {
  if (turrets && millis() - lastShot > FIRE_RATE) {
    lastShot = millis();
    shotTurrets();
  }
  if (fire && millis() - lastShot > FIRE_RATE) {
    lastShot = millis();
    var m = createMissile(element.x, element.y, element.angle);
    var impulseX = sin(m.angle) * MISSILES_SPEED;
    var impulseY = cos(m.angle) * MISSILES_SPEED;
    m.velocity.add(impulseX, impulseY);
    missiles.push(m);
  }
  
  
  if (right) {
    element.angle += radians(5);
  }
  if (left) {
    element.angle -= radians(5);
  }
  if (forward) {
    var impulseX = sin(element.angle) * 0.1;
    var impulseY = cos(element.angle) * 0.1;
    element.velocity.add(impulseX, impulseY)
  }
  
  if (backward) {
    element.velocity.x *= 0.9;
    element.velocity.y *= 0.9;
    
    if (element.velocity.mag() < 0.5) {
      element.velocity.x = 0;
      element.velocity.y = 0;
    }
  }
}

var forward, left, right, backward, fire;

function keyPressed() {
  if (keyCode == UP_ARROW || key == 'w') {
    forward = true;
  }
  if (keyCode == LEFT_ARROW || key == 'a') {
    left = true;
  }
  if (keyCode == RIGHT_ARROW || key == 'd') {
    right = true;
  }
  if (keyCode == DOWN_ARROW || key == 's') {
    backward = true;
  }
  if (key == ' ') {
    fire = true;
  }
}


function keyReleased() {
  if (keyCode == UP_ARROW || key == 'w') {
    forward = false;
  }
  if (keyCode == LEFT_ARROW || key == 'a') {
    left = false;
  }
  if (keyCode == RIGHT_ARROW || key == 'd') {
    right = false;
  }
  if (keyCode == DOWN_ARROW || key == 's') {
    backward = false;
  }
  if (key == ' ') {
    fire = false;
  }
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

var freshExplosions = [];
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
    color: color(338, 100, random(80, 100)),
    velocity: createVector(0, 0),
    size: radius
  }
  
  return newAsteroid;
}
