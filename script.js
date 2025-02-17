const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const gameOverMessage = document.getElementById('gameOverMessage');
const restartButton = document.getElementById('restart');

const scale = 20;
const rows = canvas.height / scale;
const columns = canvas.width / scale;

let snake;
let fruit;
let score = 0;
let interval;

function setup() {
  canvas.width = 400;
  canvas.height = 400;

  snake = new Snake();
  fruit = new Fruit();
  fruit.pickLocation();

  interval = window.setInterval(() => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    fruit.draw();
    snake.update();
    snake.draw();

    if (snake.eat(fruit)) {
      fruit.pickLocation();
      score++;
      scoreElement.textContent = score;
    }

    if (snake.checkCollision()) {
      gameOver();
    }
  }, 250);
}

function resetGame() {
  score = 0;
  scoreElement.textContent = score;
  gameOverMessage.style.display = 'none';
  clearInterval(interval);
  setup();
}

window.addEventListener('keydown', (evt) => {
  const direction = evt.key.replace('Arrow', '');
  snake.changeDirection(direction);
});

document.getElementById('up').addEventListener('click', () => snake.changeDirection('Up'));
document.getElementById('down').addEventListener('click', () => snake.changeDirection('Down'));
document.getElementById('left').addEventListener('click', () => snake.changeDirection('Left'));
document.getElementById('right').addEventListener('click', () => snake.changeDirection('Right'));

restartButton.addEventListener('click', resetGame);

function gameOver() {
  clearInterval(interval);
  gameOverMessage.style.display = 'block';
}

function Snake() {
  this.x = 0;
  this.y = 0;
  this.xSpeed = scale * 1;
  this.ySpeed = 0;
  this.total = 0;
  this.tail = [];

  this.draw = function() {
    ctx.fillStyle = "#FFF";

    for (let i = 0; i < this.tail.length; i++) {
      ctx.fillRect(this.tail[i].x, this.tail[i].y, scale, scale);
    }

    ctx.fillRect(this.x, this.y, scale, scale);
  };

  this.update = function() {
    for (let i = 0; i < this.tail.length - 1; i++) {
      this.tail[i] = this.tail[i + 1];
    }

    this.tail[this.total - 1] = { x: this.x, y: this.y };

    this.x += this.xSpeed;
    this.y += this.ySpeed;

    if (this.x >= canvas.width) {
      this.x = 0;
    }

    if (this.y >= canvas.height) {
      this.y = 0;
    }

    if (this.x < 0) {
      this.x = canvas.width - scale;
    }

    if (this.y < 0) {
      this.y = canvas.height - scale;
    }
  };

  this.changeDirection = function(direction) {
    switch (direction) {
      case 'Up':
        if (this.ySpeed === 0) {
          this.xSpeed = 0;
          this.ySpeed = -scale * 1;
        }
        break;
      case 'Down':
        if (this.ySpeed === 0) {
          this.xSpeed = 0;
          this.ySpeed = scale * 1;
        }
        break;
      case 'Left':
        if (this.xSpeed === 0) {
          this.xSpeed = -scale * 1;
          this.ySpeed = 0;
        }
        break;
      case 'Right':
        if (this.xSpeed === 0) {
          this.xSpeed = scale * 1;
          this.ySpeed = 0;
        }
        break;
    }
  };

  this.eat = function(fruit) {
    if (this.x === fruit.x && this.y === fruit.y) {
      this.total++;
      return true;
    }

    return false;
  };

  this.checkCollision = function() {
    for (let i = 0; i < this.tail.length; i++) {
      if (this.x === this.tail[i].x && this.y === this.tail[i].y) {
        return true;
      }
    }
    return false;
  };
}

function Fruit() {
  this.x;
  this.y;

  this.pickLocation = function() {
    this.x = Math.floor(Math.random() * rows) * scale;
    this.y = Math.floor(Math.random() * columns) * scale;
  };

  this.draw = function() {
    ctx.fillStyle = "#4cafab";
    ctx.fillRect(this.x, this.y, scale, scale);
  };
}

setup();
