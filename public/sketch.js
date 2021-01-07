/*
    This file is part of Destructible Asteroid by Massimo Avvisati

    Destructible Asteroid is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    Destructible Asteroid is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with Destructible Asteroid.  If not, see <https://www.gnu.org/licenses/>.
*/

const NUM_OF_ASTEROIDS = 100;

const MINERAL_PER_UNIT = 0.01;

const HUGE = 200;
const BIG = 100;
const SMALL = 30;
const TINY = 16;

const MISSILES_SPEED = 20;
const MISSILES_TTL = 2000;
const MISSILES_SIZE = 10;
const FIRE_RATE = 300;

const VELOCITY_MAX = 10;
const VELOCITY_MIN = 0.1;

const FORWARD = 0;
const TURN_LEFT = 1;
const TURN_RIGHT = 2;
const BACKWARD = 3;
const FIRE_FRONT = 4;
const FIRE_TURRET = 5;

const NUM_OF_NEBULAS = 20;

const TIME_LIMIT = 1000 * 90;


const GAMEOVER = -1;
const START = 0;
const PLAYING = 1;
const WIN = 2;

var state = START;

var gameStartTime = 0;

var controls = [false, false, false, false, false, false];

var nebulas = [];
var asteroids = [];
var missiles = [];
var explosions = [];
var minerals = [];

var freshAsteroids = [];
var freshMissiles = [];
var freshExplosions = [];
var freshMinerals = [];

var cam;

var half_width;
var half_height;

var lastShot = 0;
var spaceShip;
var shield = 1;
var oxygen = 1;
var mineral = 0;

var mX, mY;

var timestamp = 0;

var boldFont;

function preload() {
  boldFont = loadFont("fonts/Goldman-Bold.ttf");
}

function setup() {
  var bodyElement = document.querySelector('body');
  var bodyBounding = bodyElement.getBoundingClientRect();
  createCanvas(bodyBounding.width, bodyBounding.height, WEBGL);
  colorMode(HSB);

  textFont(boldFont);
  textSize(42);
  textAlign(CENTER, CENTER);

  half_width = 0;
  half_height = 0;
  cam = createVector(0, 0, 1);
  frameRate(60)
  initGame();
}

function updateStats() {
  var gameTime = timestamp - gameStartTime;
  oxygen = map(gameTime, 0, TIME_LIMIT, 1, 0);
  if (oxygen <= 0) {
    changeState(GAMEOVER);
  }
  if (mineral >= 1) {
    changeState(WIN);
  }

}

function initGame() {

  nebulas = [];
  asteroids = [];
  missiles = [];
  explosions = [];
  freshMissiles = [];
  freshExplosions = [];
  freshAsteroids = [];
  shield = 1;
  oxygen = 1;
  mineral = 0;


  for (var a = 0; a < NUM_OF_NEBULAS; a++) {
    var angle = random(-PI, PI);
    var distance = random(500, 6000);
    var x = sin(angle) * distance;
    var y = cos(angle) * distance;
    var size = random(SMALL, HUGE * 3);
    var nebula = createNebula(x, y, size);

    nebulas.push(nebula);
  }

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

  gameStartTime = timestamp;
}

function draw() {
  timestamp = millis();

  updateHUD();

  mX = (mouseX - (width / 2) + cam.x) / cam.z;
  mY = (mouseY - (height / 2) + cam.y) / cam.z;

  if (state == START) {
    gameStartTime = timestamp;
    updateCamera();
    displayGame();
    text("CLICK TO START", 0, 0);
  } else if (state == PLAYING) {
    controlElement(spaceShip);
    updateStats();
    updateCamera();
    updateGame();
    displayGame();
  } else if (state == GAMEOVER) {
    updateGame();
    displayGame();
    text("YOU LOOSE", 0, 0);
  } else if (state == WIN) {
    updateGame();
    displayGame();
    text("YOU WIN", 0, 0);
  }
}


function updateCamera() {
  var currentVelocity = spaceShip.velocity.mag();
  currentVelocity = constrain(currentVelocity, VELOCITY_MIN, VELOCITY_MAX);
  cam.z = map(currentVelocity, VELOCITY_MIN, VELOCITY_MAX, 0.7, 0.3);
  cam.x = spaceShip.x * cam.z;
  cam.y = spaceShip.y * cam.z;
}

function createNebula(x, y, radius) {
  var res = 36;
  var vertices = [];

  for (var n = 0; n < 360; n += res) {
    var angle = radians(n);
    var noiseX = sin(angle) * radius;
    var noiseY = cos(angle) * radius;
    var offset = noise(radius + noiseX, radius + noiseY);
    offset = map(offset, 0, 1, 500, 1000);
    var r = radius + offset;
    vertices.push(createVector(sin(angle) * r, cos(angle) * r, angle));
  }

  var newNebula = {
    x,
    y,
    angle: 0,
    vertices,
    color: color(312, 100, random(18, 22)),
    velocity: createVector(0, 0),
    size: radius
  }

  return newNebula;
}

function displayGame() {
  background(color(312, 100, 20));
  push();
  translate(half_width - cam.x, half_height - cam.y);
  scale(cam.z);
  displayAll(nebulas);
  displayAll(asteroids);
  displayAll(missiles);
  displayAll(explosions);
  displayAll(minerals);
  display(spaceShip);
  pop();
}

function updateGame() {
  if (state == PLAYING) {
    collisionDetection(missiles, asteroids, missileToAsteroidCollision);
    collisionDetection([spaceShip], asteroids, spaceShipToAsteroidCollision);
  }

  missiles = prune(missiles);
  asteroids = prune(asteroids);
  explosions = prune(explosions);
  minerals = prune(minerals);

  asteroids = asteroids.concat(freshAsteroids);
  explosions = explosions.concat(freshExplosions);
  missiles = missiles.concat(freshMissiles);
  minerals = minerals.concat(freshMinerals);

  freshMissiles = [];
  freshExplosions = [];
  freshAsteroids = [];
  freshMinerals = [];

  updateAll(asteroids);
  updateAll(missiles);
  updateAll(explosions);
  updateAll(minerals);
  update(spaceShip);
}

function updateHUD() {
  var shieldBar = document.querySelector('#shield');
  shieldBar.style.width = map(shield, 0, 1, 0, 100) + '%';
  var oxygenBar = document.querySelector('#oxygen');
  oxygenBar.style.width = map(oxygen, 0, 1, 0, 100) + '%';
  var mineralBar = document.querySelector('#mineral');
  mineralBar.style.width = map(mineral, 0, 1, 0, 100) + '%';
}

function mousePressed() {
  if (state == PLAYING) {
    controls[FIRE_TURRET] = true;
  } else if (state == START) {
    changeState(PLAYING);
  } else if (state == GAMEOVER) {
    changeState(START);
  } else if (state == WIN) {
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
    var newMineral = createMineral(asteroid.x, asteroid.y, TINY);
    freshMinerals.push(newMineral);
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

function changeState(newState) {
  if (newState == START) {
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
    shield = 0;
    ship.velocity = createVector(0, 0);
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

  if (controls[FORWARD]) {
    var impulseX = sin(element.angle) * 0.1;
    var impulseY = cos(element.angle) * 0.1;
    element.velocity.add(impulseX, impulseY);
    element.velocity.limit(VELOCITY_MAX);
  }

  if (controls[BACKWARD]) {
    element.velocity.x *= 0.8;
    element.velocity.y *= 0.8;
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
    var leftX = sin(n + PI / randomThickness) * randomLength;
    var leftY = cos(n + PI / randomThickness) * randomLength;
    var rightX = sin(n - PI / randomThickness) * randomLength;
    var rightY = cos(n - PI / randomThickness) * randomLength;
    var origin = createVector(originX, originY);
    var leftPoint = createVector(leftX, leftY);
    var rightPoint = createVector(rightX, rightY);
    freshExplosions.push(createExplosionRay(x, y, [origin, leftPoint, rightPoint], n));
  }

}

function createMissile(x, y, initialAngle) {
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

function createMineral(x, y, radius) {
  var vertices = [];
  var res = 360 / 8;
  var counter = 0;
  for (var n = 0; n < 360; n += res) {
    var angle = radians(n)
    var r = counter % 2 == 0 ? radius * 0.4 : radius;
    var vx = sin(angle - PI / 4) * r;
    var vy = cos(angle - PI / 4) * r;
    vertices.push(createVector(vx, vy));
    counter++;
  }

  var newMineral = {
    x,
    y,
    angle: 0,
    vertices: vertices,
    color: "#ffcc00",
    velocity: createVector(0, 0),
    post: goToSpaceShip,
    size: radius
  }

  return newMineral;
}

const GRAVITY_FIELD = 400;

function goToSpaceShip() {
  var distanceFromSpaceShip = dist(this.x, this.y, spaceShip.x, spaceShip.y);
  if (distanceFromSpaceShip < GRAVITY_FIELD) {
    if (distanceFromSpaceShip < spaceShip.size + this.size) {
      mineral += MINERAL_PER_UNIT;
      this.dead = true;
    }
    var mineralVector = createVector(this.x - spaceShip.x, this.y - spaceShip.y).normalize();

    var currentSpaceShipVector = createVector(0, -1);
    var angle = currentSpaceShipVector.angleBetween(mineralVector) + PI;
    var speed = map(distanceFromSpaceShip, 0, GRAVITY_FIELD, 5, 0.5);
    var impulseX = sin(angle) * speed;
    var impulseY = cos(angle) * speed;
    this.velocity.add(impulseX, impulseY);
  }
}


function createAsteroid(x, y, radius) {
  var res = 24;
  var vertices = [];
  for (var n = 0; n < 360; n += res) {
    var angle = radians(n);
    var r = radius * random(0.9, 1);
    vertices.push(createVector(sin(angle) * r, cos(angle) * r, angle));
  }

  var asteroidColor = color(338, 100, random(50, 100));

  var newAsteroid = {
    x,
    y,
    angle: 0,
    vertices,
    color: asteroidColor,
    velocity: createVector(0, 0),
    size: radius
  }

  return newAsteroid;
}

function windowResized() {
  var bodyElement = document.querySelector('body');
  var bodyBounding = bodyElement.getBoundingClientRect();

  resizeCanvas(bodyBounding.width, bodyBounding.height);
}