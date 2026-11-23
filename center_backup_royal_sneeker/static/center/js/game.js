
const canvas = document.getElementById("snookerTable");
const ctx = canvas.getContext("2d");

const scoreElement = document.getElementById("score");
const pottedElement = document.getElementById("potted");
const redsElement = document.getElementById("reds");
const statusElement = document.getElementById("status");

const powerInput = document.getElementById("power");
const powerValue = document.getElementById("powerValue");
const shootButton = document.getElementById("shootBtn");
const restartButton = document.getElementById("restartBtn");
const placeButton = document.getElementById("placeBtn");

const WIDTH = 1100;
const HEIGHT = 620;
const RADIUS = 11;

const TABLE = {
    left: 88,
    right: 1012,
    top: 88,
    bottom: 532
};

const pockets = [
    { x: 70, y: 70 },
    { x: 550, y: 58 },
    { x: 1030, y: 70 },
    { x: 70, y: 550 },
    { x: 550, y: 562 },
    { x: 1030, y: 550 }
];

let balls = [];
let score = 0;
let pottedCount = 0;
let redsRemaining = 15;
let moving = false;
let scratch = false;

let aimAngle = 0;
let aimX = 500;
let aimY = 310;

let lastTime = 0;

function createBall(x, y, color, type, value) {
    return {
        x: x,
        y: y,
        vx: 0,
        vy: 0,
        radius: RADIUS,
        color: color,
        type: type,
        value: value,
        potted: false
    };
}

function setupGame() {
    balls = [];

    // White cue ball
    balls.push(createBall(290, 310, "#ffffff", "cue", 0));

    // Fifteen red balls in a triangle
    for (let row = 0; row < 5; row++) {
        for (let column = 0; column <= row; column++) {
            const x = 770 + row * 20;
            const y = 310 + (column - row / 2) * 21;

            balls.push(
                createBall(x, y, "#e21d27", "red", 1)
            );
        }
    }

    // Snooker coloured balls
    balls.push(createBall(290, 245, "#f5d52a", "yellow", 2));
    balls.push(createBall(290, 375, "#168c48", "green", 3));
    balls.push(createBall(290, 310, "#8a4c24", "brown", 4));
    balls.push(createBall(550, 310, "#1764d1", "blue", 5));
    balls.push(createBall(730, 310, "#f08ac5", "pink", 6));
    balls.push(createBall(930, 310, "#171717", "black", 7));

    score = 0;
    pottedCount = 0;
    redsRemaining = 15;
    moving = false;
    scratch = false;

    aimAngle = 0;
    aimX = 500;
    aimY = 310;

    updateScore();
    updateControls();

    statusElement.textContent =
        "Aim with your mouse, select power and press SHOOT.";

    draw();
}

function updateScore() {
    scoreElement.textContent = score;
    pottedElement.textContent = pottedCount;
    redsElement.textContent = redsRemaining;
}

function ballsAreMoving() {
    return balls.some(ball =>
        !ball.potted &&
        (Math.abs(ball.vx) > 0.04 || Math.abs(ball.vy) > 0.04)
    );
}

function updateControls() {
    shootButton.disabled = moving || scratch;
    placeButton.hidden = !scratch;
}

function getCueBall() {
    return balls.find(ball => ball.type === "cue");
}

function updateAim(position) {
    const cue = getCueBall();

    if (!cue || cue.potted || moving || scratch) {
        return;
    }

    aimX = position.x;
    aimY = position.y;

    aimAngle = Math.atan2(
        aimY - cue.y,
        aimX - cue.x
    );

    draw();
}

function getCanvasPosition(event) {
    const rect = canvas.getBoundingClientRect();

    return {
        x: (event.clientX - rect.left) * WIDTH / rect.width,
        y: (event.clientY - rect.top) * HEIGHT / rect.height
    };
}

// Move the mouse to choose the shooting direction.
canvas.addEventListener("pointermove", function(event) {
    if (moving || scratch) return;

    const position = getCanvasPosition(event);
    updateAim(position);
});

canvas.addEventListener("pointerdown", function(event) {
    if (moving || scratch) return;

    const position = getCanvasPosition(event);
    updateAim(position);
});

powerInput.addEventListener("input", function() {
    powerValue.textContent = powerInput.value;
});

// Shoot the cue ball.
shootButton.addEventListener("click", function() {
    const cue = getCueBall();

    if (!cue || cue.potted || moving || scratch) {
        return;
    }

    const power = Number(powerInput.value);

    const speed = power * 0.72;

    cue.vx = Math.cos(aimAngle) * speed;
    cue.vy = Math.sin(aimAngle) * speed;

    moving = true;

    statusElement.textContent = "Shot played! Wait for the balls to stop.";

    updateControls();
});

// Place the cue ball again after a scratch.
placeButton.addEventListener("click", function() {
    const cue = getCueBall();

    if (!cue || !scratch) return;

    cue.potted = false;
    cue.x = 290;
    cue.y = 310;
    cue.vx = 0;
    cue.vy = 0;

    scratch = false;
    moving = false;

    aimAngle = 0;

    statusElement.textContent =
        "Cue ball placed. Take your next shot.";

    updateControls();
    draw();
});

// Restart the complete game.
restartButton.addEventListener("click", setupGame);

// Cushion collision.
function handleCushions(ball) {
    if (ball.x - ball.radius < TABLE.left) {
        ball.x = TABLE.left + ball.radius;
        ball.vx = Math.abs(ball.vx) * 0.82;
    }

    if (ball.x + ball.radius > TABLE.right) {
        ball.x = TABLE.right - ball.radius;
        ball.vx = -Math.abs(ball.vx) * 0.82;
    }

    if (ball.y - ball.radius < TABLE.top) {
        ball.y = TABLE.top + ball.radius;
        ball.vy = Math.abs(ball.vy) * 0.82;
    }

    if (ball.y + ball.radius > TABLE.bottom) {
        ball.y = TABLE.bottom - ball.radius;
        ball.vy = -Math.abs(ball.vy) * 0.82;
    }
}

// Collision between two balls.
function handleBallCollision(a, b) {
    if (a.potted || b.potted) return;

    const dx = b.x - a.x;
    const dy = b.y - a.y;

    const distance = Math.sqrt(dx * dx + dy * dy);
    const minimumDistance = a.radius + b.radius;

    if (distance === 0 || distance >= minimumDistance) {
        return;
    }

    const nx = dx / distance;
    const ny = dy / distance;

    // Separate overlapping balls.
    const overlap = minimumDistance - distance;

    a.x -= nx * overlap / 2;
    a.y -= ny * overlap / 2;

    b.x += nx * overlap / 2;
    b.y += ny * overlap / 2;

    // Relative velocity along the collision direction.
    const relativeVelocity =
        (a.vx - b.vx) * nx +
        (a.vy - b.vy) * ny;

    if (relativeVelocity > 0) {
        const impulse = relativeVelocity * 0.96;

        a.vx -= impulse * nx;
        a.vy -= impulse * ny;

        b.vx += impulse * nx;
        b.vy += impulse * ny;
    }
}

// Check whether a ball enters a pocket.
function checkPockets(ball) {
    if (ball.potted) return;

    for (const pocket of pockets) {
        const dx = ball.x - pocket.x;
        const dy = ball.y - pocket.y;

        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 25) {
            ball.potted = true;
            ball.vx = 0;
            ball.vy = 0;

            if (ball.type === "cue") {
                score = Math.max(0, score - 4);
                scratch = true;

                statusElement.textContent =
                    "FOUL! Cue ball pocketed. Place the white ball again.";
            } else {
                score += ball.value;
                pottedCount++;

                if (ball.type === "red") {
                    redsRemaining--;
                }

                statusElement.textContent =
                    ball.type.toUpperCase() +
                    " ball potted! +" + ball.value + " points.";
            }

            updateScore();
            return;
        }
    }
}

// Main physics update.
function updatePhysics(deltaTime) {
    const frameScale = Math.min(deltaTime / 16.67, 2);

    for (const ball of balls) {
        if (ball.potted) continue;

        ball.x += ball.vx * frameScale;
        ball.y += ball.vy * frameScale;

        handleCushions(ball);

        // Friction gradually slows each ball.
        const friction = Math.pow(0.986, frameScale);

        ball.vx *= friction;
        ball.vy *= friction;

        if (Math.abs(ball.vx) < 0.035) ball.vx = 0;
        if (Math.abs(ball.vy) < 0.035) ball.vy = 0;

        checkPockets(ball);
    }

    // Check every pair of balls.
    for (let i = 0; i < balls.length; i++) {
        for (let j = i + 1; j < balls.length; j++) {
            handleBallCollision(balls[i], balls[j]);
        }
    }

    const stillMoving = ballsAreMoving();

    if (!stillMoving && moving) {
        moving = false;

        if (!scratch) {
            statusElement.textContent =
                "All balls stopped. Aim and take your next shot.";
        }

        updateControls();
    }
}

// Draw the table and pockets.
function drawTable() {
    ctx.fillStyle = "#38200f";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.fillStyle = "#0a5034";
    ctx.fillRect(55, 55, 990, 510);

    ctx.fillStyle = "#087443";
    ctx.fillRect(88, 88, 924, 444);

    // Baulk line.
    ctx.strokeStyle = "rgba(255,255,255,0.8)";
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(290, 88);
    ctx.lineTo(290, 532);
    ctx.stroke();

    // D shape.
    ctx.beginPath();
    ctx.arc(290, 310, 64, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();

    // Table spots.
    const spots = [
        [290, 245],
        [290, 310],
        [290, 375],
        [550, 310],
        [730, 310],
        [930, 310]
    ];

    ctx.fillStyle = "rgba(255,255,255,0.65)";

    for (const spot of spots) {
        ctx.beginPath();
        ctx.arc(spot[0], spot[1], 2.5, 0, Math.PI * 2);
        ctx.fill();
    }

    // Six pockets.
    for (const pocket of pockets) {
        ctx.fillStyle = "#050505";
        ctx.beginPath();
        ctx.arc(pocket.x, pocket.y, 25, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Draw an individual ball.
function drawBall(ball) {
    if (ball.potted) return;

    const gradient = ctx.createRadialGradient(
        ball.x - 4,
        ball.y - 5,
        1,
        ball.x,
        ball.y,
        ball.radius
    );

    gradient.addColorStop(0, "#ffffff");
    gradient.addColorStop(0.18, ball.color);
    gradient.addColorStop(1, "#151515");

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(0,0,0,0.5)";
    ctx.lineWidth = 1;
    ctx.stroke();
}

// Draw the cue and aiming line.
function drawCue() {
    const cue = getCueBall();

    if (!cue || cue.potted || moving || scratch) return;

    const dx = Math.cos(aimAngle);
    const dy = Math.sin(aimAngle);

    // Aiming guideline.
    ctx.save();

    ctx.setLineDash([8, 7]);
    ctx.strokeStyle = "rgba(255,255,255,0.75)";
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(cue.x, cue.y);
    ctx.lineTo(cue.x + dx * 220, cue.y + dy * 220);
    ctx.stroke();

    ctx.setLineDash([]);

    // Cue stick behind the white ball.
    ctx.strokeStyle = "#d5a36b";
    ctx.lineWidth = 7;
    ctx.lineCap = "round";

    ctx.beginPath();
    ctx.moveTo(
        cue.x - dx * 135,
        cue.y - dy * 135
    );

    ctx.lineTo(
        cue.x - dx * 15,
        cue.y - dy * 15
    );

    ctx.stroke();

    ctx.restore();
}

// Draw everything.
function draw() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    drawTable();

    for (const ball of balls) {
        drawBall(ball);
    }

    drawCue();
}

// Animation loop.
function gameLoop(timestamp) {
    if (!lastTime) lastTime = timestamp;

    const deltaTime = Math.min(timestamp - lastTime, 33);
    lastTime = timestamp;

    if (moving) {
        updatePhysics(deltaTime);
    }

    draw();

    requestAnimationFrame(gameLoop);
}

// Start game.
setupGame();
requestAnimationFrame(gameLoop);
