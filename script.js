const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreElement = document.getElementById("score");
const highScoreElement = document.getElementById("highScore");
const gameOverMessage = document.getElementById("gameOverMessage");
const restartButton = document.getElementById("restart");

/* ===================== SETTINGS ===================== */
let scale = 20;
let speed = 120;
let snake;
let fruits = [];
let obstacles = [];
let powerUps = [];
let score = 0;
let highScore = localStorage.getItem("snakeHighScore") || 0;
let gameLoop;
let rows, columns;
let particles = [];

/* ===================== RESPONSIVE CANVAS ===================== */
function resizeCanvas() {
    const size = Math.min(window.innerWidth - 40, 400);
    canvas.width = size;
    canvas.height = size;
    scale = Math.floor(size / 20);
    rows = Math.floor(canvas.width / scale);
    columns = Math.floor(canvas.height / scale);
}

document.addEventListener("DOMContentLoaded", () => {
    resizeCanvas();
    window.addEventListener("resize", () => {
        resizeCanvas();
        setup();
    });

    setup();
});

/* ===================== GAME SETUP ===================== */
function setup() {
    score = 0;
    speed = 120;
    scoreElement.textContent = score;
    highScoreElement.textContent = highScore;
    gameOverMessage.style.display = "none";

    snake = new Snake();
    fruits = [new Fruit()];
    obstacles = [];
    powerUps = [];
    particles = [];

    spawnObstacle();
    spawnPowerUp();

    clearInterval(gameLoop);
    gameLoop = setInterval(updateGame, speed);
}

/* ===================== GAME LOOP ===================== */
function updateGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw obstacles
    obstacles.forEach(o => o.draw());

    // Draw power-ups
    powerUps.forEach(p => p.draw());

    // Draw fruits
    fruits.forEach(f => f.draw());

    // Update snake
    snake.update();
    snake.draw();

    // Update particles
    particles.forEach((p, i) => {
        p.update();
        p.draw();
        if (p.alpha <= 0) particles.splice(i, 1);
    });

    // Check fruit collision
    for (let i = fruits.length - 1; i >= 0; i--) {
        if (snake.eat(fruits[i])) {
            score += fruits[i].points;
            scoreElement.textContent = score;

            if (score > highScore) {
                highScore = score;
                highScoreElement.textContent = highScore;
                localStorage.setItem("snakeHighScore", highScore);
            }

            if (fruits[i].type === "speed") {
                speed = Math.max(50, speed - 10);
                clearInterval(gameLoop);
                gameLoop = setInterval(updateGame, speed);
            }

            // Remove fruit and spawn a new one
            fruits.splice(i, 1);
            const newFruit = new Fruit();
            const pos = pickSafeFruitLocation();
            newFruit.x = pos.x;
            newFruit.y = pos.y;

            fruits.push(newFruit);
        }
    }
function pickSafeFruitLocation() {
    let x, y, safe;
    do {
        safe = true;
        x = Math.floor(Math.random() * rows) * scale;
        y = Math.floor(Math.random() * columns) * scale;
        // check snake body
        for (let part of snake.tail) {
            if (part.x === x && part.y === y) safe = false;
        }
        if (snake.x === x && snake.y === y) safe = false;
        // check obstacles
        for (let o of obstacles) {
            if (o.x === x && o.y === y) safe = false;
        }
        // check power-ups
        for (let p of powerUps) {
            if (p.x === x && p.y === y) safe = false;
        }
    } while (!safe);
    return { x, y };
}

    // Check power-ups
    for (let i = powerUps.length - 1; i >= 0; i--) {
        if (
            snake.x < powerUps[i].x + scale &&
            snake.x + scale > powerUps[i].x &&
            snake.y < powerUps[i].y + scale &&
            snake.y + scale > powerUps[i].y
        ) {
            if (powerUps[i].effect === "invincible") snake.invincible = 50;
            if (powerUps[i].effect === "shrink") snake.tail.splice(0, 2);

            powerUps.splice(i, 1);
        }
    }

    // Check obstacle collision
    if (!snake.invincible && obstacles.some(o => snake.x === o.x && snake.y === o.y)) {
        endGame();
    }

    // Check self collision
    if (!snake.invincible && snake.checkCollision()) {
        endGame();
    }

    // Randomly spawn obstacles/power-ups
    if (Math.random() < 0.01) spawnObstacle();
    if (Math.random() < 0.005) spawnPowerUp();
}

/* ===================== GAME END ===================== */
function endGame() {
    clearInterval(gameLoop);
    createDeathParticles(snake.x, snake.y);
    gameOverMessage.style.display = "block";
}

/* ===================== CONTROLS ===================== */
window.addEventListener("keydown", e => {
    const dir = e.key.replace("Arrow", "");
    snake.changeDirection(dir);
});

document.getElementById("up").onclick = () => snake.changeDirection("Up");
document.getElementById("down").onclick = () => snake.changeDirection("Down");
document.getElementById("left").onclick = () => snake.changeDirection("Left");
document.getElementById("right").onclick = () => snake.changeDirection("Right");

restartButton.onclick = setup;

/* ===================== SWIPE CONTROLS ===================== */
let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener("touchstart", e => {
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
});

canvas.addEventListener("touchend", e => {
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartX;
    const dy = touch.clientY - touchStartY;

    if (Math.abs(dx) > Math.abs(dy)) {
        dx > 0 ? snake.changeDirection("Right") : snake.changeDirection("Left");
    } else {
        dy > 0 ? snake.changeDirection("Down") : snake.changeDirection("Up");
    }
});

/* ===================== SNAKE CLASS ===================== */
function Snake() {
    this.x = 0;
    this.y = 0;
    this.xSpeed = scale;
    this.ySpeed = 0;
    this.total = 0;
    this.tail = [];
    this.invincible = 0;

    this.draw = function () {
        this.tail.forEach((part, index) => {
            const colorRatio = index / Math.max(this.tail.length, 1);
            ctx.fillStyle = `hsl(${200 + colorRatio * 120}, 80%, 60%)`;
            ctx.shadowBlur = 15;
            ctx.shadowColor = "#00e5ff";
            ctx.fillRect(part.x, part.y, scale, scale);
        });

        ctx.fillStyle = "#ffffff";
        ctx.shadowBlur = 20;
        ctx.shadowColor = "#00e5ff";
        ctx.fillRect(this.x, this.y, scale, scale);
        ctx.shadowBlur = 0;
    };

    this.update = function () {
        for (let i = 0; i < this.tail.length - 1; i++) this.tail[i] = this.tail[i + 1];
        if (this.total > 0) this.tail[this.total - 1] = { x: this.x, y: this.y };

        this.x += this.xSpeed;
        this.y += this.ySpeed;

        if (this.x >= canvas.width) this.x = 0;
        if (this.y >= canvas.height) this.y = 0;
        if (this.x < 0) this.x = canvas.width - scale;
        if (this.y < 0) this.y = canvas.height - scale;

        if (this.invincible > 0) this.invincible--;
    };

    this.changeDirection = function (dir) {
        switch (dir) {
            case "Up": if (this.ySpeed === 0) { this.xSpeed = 0; this.ySpeed = -scale; } break;
            case "Down": if (this.ySpeed === 0) { this.xSpeed = 0; this.ySpeed = scale; } break;
            case "Left": if (this.xSpeed === 0) { this.xSpeed = -scale; this.ySpeed = 0; } break;
            case "Right": if (this.xSpeed === 0) { this.xSpeed = scale; this.ySpeed = 0; } break;
        }
    };

    this.eat = function (fruit) {
        if (
            this.x < fruit.x + scale &&
            this.x + scale > fruit.x &&
            this.y < fruit.y + scale &&
            this.y + scale > fruit.y
        ) {
            this.total += fruit.points;
            return true;
        }
        return false;
    };

    this.checkCollision = function () {
        return this.tail.some(part => part.x === this.x && part.y === this.y);
    };
}

/* ===================== FRUIT CLASS ===================== */
function Fruit() {
    this.x = 0;
    this.y = 0;
    this.type = Math.random() < 0.1 ? "speed" : "normal"; // 10% chance speed fruit
    this.points = this.type === "speed" ? 2 : 1;

    this.pickLocation = function () {
        this.x = Math.floor(Math.random() * rows) * scale;
        this.y = Math.floor(Math.random() * columns) * scale;
    };

    this.draw = function () {
        ctx.fillStyle = this.type === "speed" ? "#ffdd00" : "#00e5ff";
        ctx.shadowBlur = 20;
        ctx.shadowColor = ctx.fillStyle;
        ctx.fillRect(this.x, this.y, scale, scale);
        ctx.shadowBlur = 0;
    };
}

/* ===================== OBSTACLE CLASS ===================== */
function spawnObstacle() {
    obstacles.push({
        x: Math.floor(Math.random() * rows) * scale,
        y: Math.floor(Math.random() * columns) * scale,
        draw() {
            ctx.fillStyle = "#ff5252";
            ctx.shadowBlur = 15;
            ctx.shadowColor = "#ff5252";
            ctx.fillRect(this.x, this.y, scale, scale);
            ctx.shadowBlur = 0;
        }
    });
}

/* ===================== POWER-UP CLASS ===================== */
function spawnPowerUp() {
    const effects = ["invincible", "shrink"];
    powerUps.push({
        x: Math.floor(Math.random() * rows) * scale,
        y: Math.floor(Math.random() * columns) * scale,
        effect: effects[Math.floor(Math.random() * effects.length)],
        draw() {
            ctx.fillStyle = this.effect === "invincible" ? "#00ff99" : "#ff99ff";
            ctx.shadowBlur = 15;
            ctx.shadowColor = ctx.fillStyle;
            ctx.fillRect(this.x, this.y, scale, scale);
            ctx.shadowBlur = 0;
        }
    });
}

/* ===================== PARTICLE EFFECTS ===================== */
function createDeathParticles(x, y) {
    for (let i = 0; i < 20; i++) {
        particles.push({
            x, y,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10,
            alpha: 1,
            update() { this.x += this.vx; this.y += this.vy; this.alpha -= 0.05; },
            draw() { ctx.fillStyle = `rgba(255,255,255,${this.alpha})`; ctx.fillRect(this.x, this.y, scale / 2, scale / 2); }
        });
    }
}
