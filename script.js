const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreElement = document.getElementById("score");
const highScoreElement = document.getElementById("highScore");
const levelElement = document.getElementById("level");
const comboElement = document.getElementById("combo");
const livesElement = document.getElementById("lives");
const messageLayer = document.getElementById("messageLayer");
const messageKicker = document.getElementById("messageKicker");
const messageTitle = document.getElementById("messageTitle");
const messageText = document.getElementById("messageText");
const primaryAction = document.getElementById("primaryAction");
const toast = document.getElementById("toast");
const missionText = document.getElementById("missionText");
const dashButton = document.getElementById("dashButton");
const pauseButton = document.getElementById("pauseButton");
const restartButton = document.getElementById("restart");
const soundToggle = document.getElementById("soundToggle");
const statusDot = document.getElementById("statusDot");
const statusText = document.getElementById("statusText");

const controls = {
  up: document.getElementById("up"),
  down: document.getElementById("down"),
  left: document.getElementById("left"),
  right: document.getElementById("right")
};

const cellCount = 22;
const storageKey = "snakeRushHighScore";
const directions = {
  Up: { x: 0, y: -1 },
  Down: { x: 0, y: 1 },
  Left: { x: -1, y: 0 },
  Right: { x: 1, y: 0 }
};

let cellSize = 24;
let snake = [];
let direction = directions.Right;
let nextDirection = directions.Right;
let snack = null;
let bonusSnack = null;
let powerUp = null;
let hazards = [];
let particles = [];
let score = 0;
let highScore = Number(localStorage.getItem(storageKey)) || 0;
let level = 1;
let lives = 3;
let moves = 0;
let shieldMoves = 0;
let nextPowerScore = 5;
let combo = 1;
let streak = 0;
let snacksThisRun = 0;
let nextBonusScore = 8;
let dashMoves = 0;
let dashCharges = 2;
let nextDashRecharge = 5;
let toastTimer = null;
let gameState = "ready";
let tickTimer = null;
let soundEnabled = true;
let audioContext = null;
let touchStart = null;

highScoreElement.textContent = highScore;

function resizeCanvas() {
  const wrap = canvas.parentElement;
  const size = Math.floor(wrap.getBoundingClientRect().width);
  const ratio = window.devicePixelRatio || 1;

  canvas.width = size * ratio;
  canvas.height = size * ratio;
  canvas.style.width = `${size}px`;
  canvas.style.height = `${size}px`;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  cellSize = size / cellCount;
  draw();
}

function resetGame(startNow = false) {
  const middle = Math.floor(cellCount / 2);

  snake = [
    { x: middle - 1, y: middle },
    { x: middle - 2, y: middle },
    { x: middle - 3, y: middle }
  ];
  direction = directions.Right;
  nextDirection = directions.Right;
  snack = createSnack();
  bonusSnack = null;
  powerUp = null;
  hazards = [];
  particles = [];
  score = 0;
  level = 1;
  lives = 3;
  moves = 0;
  shieldMoves = 0;
  nextPowerScore = 5;
  combo = 1;
  streak = 0;
  snacksThisRun = 0;
  nextBonusScore = 8;
  dashMoves = 0;
  dashCharges = 2;
  nextDashRecharge = 5;
  document.body.classList.remove("is-rush");

  updateStats();
  setStatus("ready");
  updateMission();
  showMessage("Ready?", "Eat, dash, survive.", "Chain snacks, spend lives wisely, and dash for bonus rushes.", "Start game");
  pauseButton.textContent = "Pause";
  updateDashButton();
  clearLoop();

  if (startNow) {
    startGame();
  } else {
    draw();
  }
}

function startGame() {
  if (gameState === "playing") return;
  gameState = "playing";
  hideMessage();
  setStatus("playing");
  scheduleLoop();
  playTone(560, 0.05);
}

function togglePause() {
  if (gameState === "ready") {
    startGame();
    return;
  }

  if (gameState === "over") {
    resetGame(true);
    return;
  }

  if (gameState === "paused") {
    gameState = "playing";
    pauseButton.textContent = "Pause";
    hideMessage();
    setStatus("playing");
    scheduleLoop();
    return;
  }

  gameState = "paused";
  clearLoop();
  pauseButton.textContent = "Resume";
  setStatus("paused");
  showMessage("Paused", "Catch your breath.", "Press resume or tap the board to continue.", "Resume");
}

function scheduleLoop() {
  clearLoop();
  tickTimer = window.setInterval(tick, getSpeed());
}

function clearLoop() {
  if (tickTimer) {
    window.clearInterval(tickTimer);
    tickTimer = null;
  }
}

function getSpeed() {
  const baseSpeed = Math.max(62, 145 - (level - 1) * 10);
  return dashMoves > 0 ? Math.max(42, baseSpeed - 34) : baseSpeed;
}

function tick() {
  direction = nextDirection;
  const levelBeforeMove = level;

  const head = snake[0];
  const nextHead = wrapCell({
    x: head.x + direction.x,
    y: head.y + direction.y
  });
  const growsThisMove = isSameCell(nextHead, snack);
  const selfCollisionParts = growsThisMove ? snake : snake.slice(0, -1);
  const hitSelf = selfCollisionParts.some(part => part.x === nextHead.x && part.y === nextHead.y);
  const hitHazard = hazards.some(hazard => hazard.x === nextHead.x && hazard.y === nextHead.y);

  if (hitSelf || hitHazard) {
    if (shieldMoves > 0) {
      clearHazardAt(nextHead);
      clearSnakeAt(nextHead);
      shieldMoves = Math.max(0, shieldMoves - 8);
      announce("Shield blocked it");
    } else {
      loseLife(nextHead);
      return;
    }
  }

  if (dashMoves > 0) {
    dashMoves -= 1;
    if (dashMoves === 0) {
      scheduleLoop();
      updateDashButton();
    }
  }

  if (dashMoves > 0 && !document.body.classList.contains("is-rush")) {
    document.body.classList.add("is-rush");
  }

  if (dashMoves === 0 && !bonusSnack) {
    document.body.classList.remove("is-rush");
  }

  if (lives <= 0) {
    endGame(nextHead);
    return;
  }

  snake.unshift(nextHead);
  moves += 1;

  if (shieldMoves > 0) {
    shieldMoves -= 1;
  }

  if (isSameCell(nextHead, snack)) {
    eatSnack();
  } else {
    snake.pop();
    if (moves % 12 === 0 && combo > 1) {
      combo = Math.max(1, combo - 1);
      updateStats();
    }
  }

  if (bonusSnack && isSameCell(nextHead, bonusSnack)) {
    eatBonusSnack();
  } else if (bonusSnack) {
    bonusSnack.life -= 1;
    if (bonusSnack.life <= 0) {
      bonusSnack = null;
      document.body.classList.remove("is-rush");
      announce("Bonus escaped");
    }
  }

  if (powerUp && isSameCell(nextHead, powerUp)) {
    collectPowerUp();
  }

  if (levelBeforeMove !== level) {
    announce(`Level ${level}`);
  }

  if (moves % 22 === 0) {
    addHazard();
  }

  if (!powerUp && score >= nextPowerScore) {
    powerUp = createPowerUp();
    nextPowerScore += 5;
    announce(`${powerUp.type === "shield" ? "Shield" : "Trim"} spawned`);
  }

  if (!bonusSnack && score >= nextBonusScore) {
    bonusSnack = createBonusSnack();
    nextBonusScore += 10;
    document.body.classList.add("is-rush");
    announce("Bonus rush! Catch it fast");
  }

  if (gameState === "playing") {
    setStatus(bonusSnack ? "rush" : shieldMoves > 0 ? "shield" : "playing");
  }

  updateMission();
  updateParticles();
  draw();
}

function eatSnack() {
  const points = snack.type === "star" ? 3 : 1;
  streak += 1;
  snacksThisRun += 1;
  rechargeDash();
  combo = Math.min(5, 1 + Math.floor(streak / 3));
  score += points * combo;
  level = Math.floor(score / 7) + 1;
  const eatenType = snack.type;
  snack = createSnack();
  burst(snake[0], snackColor(eatenType), 12 + combo * 3);
  updateStats();
  updateMission();
  scheduleLoop();
  announce(combo > 1 ? `Combo x${combo}! +${points * combo}` : `+${points}`);
  playTone(points === 3 ? 760 : 620 + combo * 20, 0.055);
}

function eatBonusSnack() {
  const bonus = 6 + combo * 2;
  score += bonus;
  streak += 2;
  snacksThisRun += 1;
  rechargeDash();
  combo = Math.min(5, combo + 1);
  level = Math.floor(score / 7) + 1;
  burst(bonusSnack, snackColor("bonus"), 30);
  bonusSnack = null;
  document.body.classList.remove("is-rush");
  updateStats();
  updateMission();
  scheduleLoop();
  announce(`Bonus rush +${bonus}`);
  playTone(980, 0.09);
}

function collectPowerUp() {
  if (powerUp.type === "shield") {
    shieldMoves = 38;
    setStatus("shield");
    announce("Shield on");
    playTone(880, 0.08);
  } else {
    snake.splice(Math.max(3, snake.length - 3));
    streak += 1;
    announce("Tail trimmed");
    playTone(420, 0.08);
  }

  burst(powerUp, snackColor(powerUp.type), 18);
  updateStats();
  powerUp = null;
}

function loseLife(cell) {
  lives -= 1;
  streak = 0;
  combo = 1;
  dashMoves = 0;
  shieldMoves = lives > 0 ? 16 : 0;
  burst(cell, "#ff5b68", 22);
  updateStats();
  updateDashButton();

  if (lives <= 0) {
    endGame(cell);
    return;
  }

  resetSnakePosition();
  clearLoop();
  announce(`${lives} ${lives === 1 ? "life" : "lives"} left`);
  draw();
  window.setTimeout(() => {
    if (gameState === "playing") {
      scheduleLoop();
    }
  }, 420);
}

function resetSnakePosition() {
  const middle = Math.floor(cellCount / 2);
  snake = [
    { x: middle - 1, y: middle },
    { x: middle - 2, y: middle },
    { x: middle - 3, y: middle }
  ];
  direction = directions.Right;
  nextDirection = directions.Right;
}

function clearHazardAt(cell) {
  hazards = hazards.filter(hazard => !isSameCell(hazard, cell));
}

function clearSnakeAt(cell) {
  snake = snake.filter(part => !isSameCell(part, cell));
}

function activateDash() {
  if (gameState === "ready") {
    startGame();
  }

  if (gameState !== "playing" || dashCharges <= 0 || dashMoves > 0) return;

  dashCharges -= 1;
  dashMoves = 5;
  document.body.classList.add("is-rush");
  announce("Dash");
  updateDashButton();
  scheduleLoop();
  playTone(1040, 0.06);
}

function rechargeDash() {
  if (snacksThisRun < nextDashRecharge || dashCharges >= 3) return;
  dashCharges += 1;
  nextDashRecharge += 5;
  announce("Dash recharged");
  updateDashButton();
}

function endGame(cell) {
  gameState = "over";
  clearLoop();
  document.body.classList.remove("is-rush");
  burst(cell, "#ff5b68", 28);
  draw();
  setStatus("over");
  showMessage("Game over", "Nice run.", `Score ${score}. Best combo x${combo}. Press restart to go again.`, "Play again");
  playTone(180, 0.18);
}

function createSnack() {
  const position = randomFreeCell();
  return {
    ...position,
    type: Math.random() < 0.18 ? "star" : "apple",
    pulse: Math.random() * Math.PI
  };
}

function createBonusSnack() {
  return {
    ...randomFreeCell(),
    type: "bonus",
    pulse: Math.random() * Math.PI,
    life: 42
  };
}

function createPowerUp() {
  return {
    ...randomFreeCell(),
    type: Math.random() < 0.55 ? "shield" : "shrink"
  };
}

function addHazard() {
  const maxHazards = Math.min(10, 2 + level);
  if (hazards.length >= maxHazards) return;
  hazards.push(randomFreeCell());
  if (hazards.length === 1 || hazards.length % 3 === 0) {
    announce("New hazard");
  }
}

function randomFreeCell() {
  let cell;
  let attempts = 0;

  do {
    cell = {
      x: Math.floor(Math.random() * cellCount),
      y: Math.floor(Math.random() * cellCount)
    };
    attempts += 1;
  } while (!isCellFree(cell) && attempts < 600);

  return cell;
}

function isCellFree(cell) {
  const occupiedBySnake = snake.some(part => isSameCell(part, cell));
  const occupiedBySnack = snack && isSameCell(snack, cell);
  const occupiedByBonus = bonusSnack && isSameCell(bonusSnack, cell);
  const occupiedByPower = powerUp && isSameCell(powerUp, cell);
  const occupiedByHazard = hazards.some(hazard => isSameCell(hazard, cell));
  return !occupiedBySnake && !occupiedBySnack && !occupiedByBonus && !occupiedByPower && !occupiedByHazard;
}

function wrapCell(cell) {
  return {
    x: (cell.x + cellCount) % cellCount,
    y: (cell.y + cellCount) % cellCount
  };
}

function isSameCell(a, b) {
  return a && b && a.x === b.x && a.y === b.y;
}

function changeDirection(name) {
  const desired = directions[name];
  if (!desired) return;

  const isReverse = desired.x + direction.x === 0 && desired.y + direction.y === 0;
  if (!isReverse) {
    nextDirection = desired;
  }

  if (gameState === "ready") {
    startGame();
  }
}

function draw() {
  if (!ctx || !cellSize) return;

  const boardSize = cellSize * cellCount;
  ctx.clearRect(0, 0, boardSize, boardSize);
  drawBoard(boardSize);
  hazards.forEach(drawHazard);
  if (snack) drawSnack(snack);
  if (bonusSnack) drawSnack(bonusSnack);
  if (powerUp) drawPowerUp(powerUp);
  drawSnake();
  drawParticles();
}

function drawBoard(boardSize) {
  const gradient = ctx.createLinearGradient(0, 0, boardSize, boardSize);
  if (bonusSnack) {
    gradient.addColorStop(0, "#251927");
    gradient.addColorStop(0.55, "#1d2117");
    gradient.addColorStop(1, "#111417");
  } else {
    gradient.addColorStop(0, "#151b21");
    gradient.addColorStop(1, "#0f1418");
  }
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, boardSize, boardSize);

  ctx.strokeStyle = "rgba(255, 255, 255, 0.045)";
  ctx.lineWidth = 1;
  for (let i = 1; i < cellCount; i += 1) {
    const line = i * cellSize;
    ctx.beginPath();
    ctx.moveTo(line, 0);
    ctx.lineTo(line, boardSize);
    ctx.moveTo(0, line);
    ctx.lineTo(boardSize, line);
    ctx.stroke();
  }
}

function drawSnake() {
  snake.forEach((part, index) => {
    const inset = index === 0 ? cellSize * 0.10 : cellSize * 0.16;
    const size = cellSize - inset * 2;
    const radius = Math.max(5, cellSize * 0.25);
    const hue = 142 + index * 6;

    ctx.fillStyle = index === 0 ? "#f7fbff" : `hsl(${hue}, 72%, 58%)`;
    ctx.shadowColor = shieldMoves > 0 ? "#49d2ff" : "#53e086";
    ctx.shadowBlur = index === 0 ? 18 : 10;
    roundRect(part.x * cellSize + inset, part.y * cellSize + inset, size, size, radius);
    ctx.fill();

    if (index === 0) {
      drawEyes(part);
    }
  });

  ctx.shadowBlur = 0;
}

function drawEyes(head) {
  const centerX = head.x * cellSize + cellSize / 2;
  const centerY = head.y * cellSize + cellSize / 2;
  const eyeOffset = cellSize * 0.18;
  const eyeRadius = Math.max(2, cellSize * 0.055);

  ctx.fillStyle = "#111417";
  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.arc(centerX + direction.y * eyeOffset + direction.x * eyeOffset, centerY - direction.x * eyeOffset + direction.y * eyeOffset, eyeRadius, 0, Math.PI * 2);
  ctx.arc(centerX - direction.y * eyeOffset + direction.x * eyeOffset, centerY + direction.x * eyeOffset + direction.y * eyeOffset, eyeRadius, 0, Math.PI * 2);
  ctx.fill();
}

function drawSnack(item) {
  const color = snackColor(item.type);
  const centerX = item.x * cellSize + cellSize / 2;
  const centerY = item.y * cellSize + cellSize / 2;
  const pulse = Math.sin(Date.now() / 180 + item.pulse) * cellSize * 0.04;
  const radius = item.type === "bonus" ? cellSize * 0.34 + pulse : cellSize * 0.28 + pulse;

  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = item.type === "bonus" ? 26 : 18;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fill();
  if (item.type === "bonus") {
    ctx.strokeStyle = "rgba(255, 255, 255, 0.75)";
    ctx.lineWidth = Math.max(2, cellSize * 0.06);
    ctx.stroke();
  }
  ctx.shadowBlur = 0;
}

function drawPowerUp(item) {
  const color = snackColor(item.type);
  const x = item.x * cellSize + cellSize * 0.23;
  const y = item.y * cellSize + cellSize * 0.23;
  const size = cellSize * 0.54;

  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 18;
  roundRect(x, y, size, size, Math.max(5, cellSize * 0.16));
  ctx.fill();
  ctx.shadowBlur = 0;
}

function drawHazard(hazard) {
  const inset = cellSize * 0.20;
  const x = hazard.x * cellSize + inset;
  const y = hazard.y * cellSize + inset;
  const size = cellSize - inset * 2;

  ctx.strokeStyle = "#ff5b68";
  ctx.lineWidth = Math.max(2, cellSize * 0.08);
  ctx.shadowColor = "#ff5b68";
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + size, y + size);
  ctx.moveTo(x + size, y);
  ctx.lineTo(x, y + size);
  ctx.stroke();
  ctx.shadowBlur = 0;
}

function drawParticles() {
  particles.forEach(particle => {
    ctx.globalAlpha = particle.life;
    ctx.fillStyle = particle.color;
    ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
  });
  ctx.globalAlpha = 1;
}

function burst(cell, color, amount) {
  const x = cell.x * cellSize + cellSize / 2;
  const y = cell.y * cellSize + cellSize / 2;

  for (let i = 0; i < amount; i += 1) {
    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4,
      size: Math.max(2, cellSize * (0.07 + Math.random() * 0.09)),
      life: 1,
      color
    });
  }
}

function updateParticles() {
  particles = particles
    .map(particle => ({
      ...particle,
      x: particle.x + particle.vx,
      y: particle.y + particle.vy,
      life: particle.life - 0.08
    }))
    .filter(particle => particle.life > 0);
}

function snackColor(type) {
  if (type === "star") return "#ffd166";
  if (type === "bonus") return "#ff8bd1";
  if (type === "shield") return "#49d2ff";
  if (type === "shrink") return "#ff6ea8";
  return "#53e086";
}

function roundRect(x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function updateStats() {
  scoreElement.textContent = score;
  levelElement.textContent = level;
  comboElement.textContent = `x${combo}`;
  livesElement.textContent = lives;
  comboElement.parentElement.classList.toggle("is-hot", combo >= 3);

  if (score > highScore) {
    highScore = score;
    localStorage.setItem(storageKey, String(highScore));
  }

  highScoreElement.textContent = highScore;
  updateDashButton();
}

function updateDashButton() {
  const label = dashMoves > 0 ? `Dashing ${dashMoves}` : `Dash ${dashCharges}/3`;
  dashButton.textContent = label;
  dashButton.disabled = gameState === "over" || dashCharges <= 0 || dashMoves > 0;
}

function updateMission() {
  if (snacksThisRun < 3) {
    missionText.textContent = `Grab ${3 - snacksThisRun} more snack${3 - snacksThisRun === 1 ? "" : "s"} to wake up combos.`;
    return;
  }

  if (dashCharges < 3 && snacksThisRun < nextDashRecharge) {
    missionText.textContent = `Grab ${nextDashRecharge - snacksThisRun} more snack${nextDashRecharge - snacksThisRun === 1 ? "" : "s"} to recharge Dash.`;
    return;
  }

  if (combo < 3) {
    missionText.textContent = "Chain snacks faster to hit combo x3.";
    return;
  }

  if (!bonusSnack && score < nextBonusScore) {
    missionText.textContent = `Reach ${nextBonusScore} points to trigger a bonus rush.`;
    return;
  }

  if (bonusSnack) {
    missionText.textContent = `Bonus rush expires in ${bonusSnack.life} moves.`;
    return;
  }

  missionText.textContent = "Stay alive while hazards stack up.";
}

function showMessage(kicker, title, text, actionText) {
  messageKicker.textContent = kicker;
  messageTitle.textContent = title;
  messageText.textContent = text;
  primaryAction.textContent = actionText;
  messageLayer.classList.remove("is-hidden");
}

function hideMessage() {
  messageLayer.classList.add("is-hidden");
}

function announce(text) {
  toast.textContent = text;
  toast.classList.add("is-visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 1200);
}

function setStatus(status) {
  statusDot.className = "status-dot";

  if (status === "playing") {
    statusDot.classList.add("playing");
    statusText.textContent = shieldMoves > 0 ? `Shielded for ${shieldMoves} moves` : "Snake is moving";
    gameState = "playing";
    updateDashButton();
    return;
  }

  if (status === "shield") {
    statusDot.classList.add("playing");
    statusText.textContent = `Shielded for ${shieldMoves} moves`;
    updateDashButton();
    return;
  }

  if (status === "rush") {
    statusDot.classList.add("rush");
    statusText.textContent = "Bonus rush is live";
    updateDashButton();
    return;
  }

  if (status === "paused") {
    statusText.textContent = "Paused";
    updateDashButton();
    return;
  }

  if (status === "over") {
    statusDot.classList.add("danger");
    statusText.textContent = "Game over";
    gameState = "over";
    updateDashButton();
    return;
  }

  statusText.textContent = "Waiting for first move";
  gameState = "ready";
  updateDashButton();
}

function playTone(frequency, duration) {
  if (!soundEnabled) return;

  try {
    audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.frequency.value = frequency;
    oscillator.type = "sine";
    gain.gain.setValueAtTime(0.04, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
  } catch (error) {
    soundEnabled = false;
    soundToggle.setAttribute("aria-pressed", "false");
  }
}

function handleKey(event) {
  const keyMap = {
    ArrowUp: "Up",
    KeyW: "Up",
    ArrowDown: "Down",
    KeyS: "Down",
    ArrowLeft: "Left",
    KeyA: "Left",
    ArrowRight: "Right",
    KeyD: "Right"
  };

  if (event.code === "Space") {
    event.preventDefault();
    togglePause();
    return;
  }

  if (event.code === "ShiftLeft" || event.code === "ShiftRight") {
    event.preventDefault();
    activateDash();
    return;
  }

  if (keyMap[event.code]) {
    event.preventDefault();
    changeDirection(keyMap[event.code]);
  }
}

function bindPress(button, directionName) {
  button.addEventListener("click", () => changeDirection(directionName));
}

window.addEventListener("resize", resizeCanvas);
window.addEventListener("keydown", handleKey);

canvas.addEventListener("pointerdown", event => {
  touchStart = { x: event.clientX, y: event.clientY };

  if (gameState === "paused") {
    togglePause();
  }
});

canvas.addEventListener("pointerup", event => {
  if (!touchStart) return;

  const dx = event.clientX - touchStart.x;
  const dy = event.clientY - touchStart.y;
  touchStart = null;

  if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) return;
  changeDirection(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "Right" : "Left") : (dy > 0 ? "Down" : "Up"));
});

primaryAction.addEventListener("click", () => {
  if (gameState === "over") {
    resetGame(true);
  } else if (gameState === "paused") {
    togglePause();
  } else {
    startGame();
  }
});

pauseButton.addEventListener("click", togglePause);
restartButton.addEventListener("click", () => resetGame(true));
dashButton.addEventListener("click", activateDash);
soundToggle.addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  soundToggle.classList.toggle("is-muted", !soundEnabled);
  soundToggle.setAttribute("aria-pressed", String(soundEnabled));
  soundToggle.querySelector("span").innerHTML = soundEnabled ? "&#9834;" : "x";
});

bindPress(controls.up, "Up");
bindPress(controls.down, "Down");
bindPress(controls.left, "Left");
bindPress(controls.right, "Right");

resizeCanvas();
resetGame();
