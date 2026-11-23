
console.log("Royal Snooker JavaScript started!");

// HTML ELEMENTS
const canvas = document.getElementById("snookerTable");
const loading = document.getElementById("loading");
const scoreElement = document.getElementById("scoreValue");
const statusElement = document.getElementById("gameStatus");
const resetButton = document.getElementById("resetButton");
const homeButton = document.getElementById("homeButton");

if (!canvas) {
    throw new Error("Snooker canvas not found!");
}

const ctx = canvas.getContext("2d");

if (!ctx) {
    throw new Error("Canvas context not available!");
}


// TABLE SETTINGS
const W = canvas.width;
const H = canvas.height;

const table = {
    left: 50,
    right: W - 50,
    top: 50,
    bottom: H - 50
};

const pocketRadius = 23;
const ballRadius = 10;

const baulkX = table.left + 180;
const centerY = H / 2;


// POCKETS
const pockets = [
    [table.left, table.top],
    [(table.left + table.right) / 2, table.top],
    [table.right, table.top],
    [table.left, table.bottom],
    [(table.left + table.right) / 2, table.bottom],
    [table.right, table.bottom]
];


// GAME VARIABLES
let balls = [];
let score = 0;
let moving = false;
let isDragging = false;
let mouse = { x: 0, y: 0 };


// CREATE BALL
function createBall(x, y, color, type) {
    return {
        x,
        y,
        vx: 0,
        vy: 0,
        color,
        type,
        radius: ballRadius,
        active: true
    };
}


// UPDATE SCORE
function updateScore() {
    scoreElement.textContent = score;
}


// RESET GAME
function resetGame() {
    balls = [];
    score = 0;
    updateScore();

    // CUE BALL
    balls.push(
        createBall(baulkX - 75, centerY, "white", "cue")
    );

    // COLOURED BALLS
    balls.push(createBall(baulkX, centerY - 105, "#f2d21b", "yellow"));
    balls.push(createBall(baulkX, centerY + 105, "#158a48", "green"));
    balls.push(createBall(baulkX, centerY, "#8b4513", "brown"));
    balls.push(createBall(W / 2, centerY, "#1766e8", "blue"));
    balls.push(createBall(W - 330, centerY, "#ef82b5", "pink"));
    balls.push(createBall(W - 115, centerY, "#171717", "black"));

    // 15 RED BALLS
    const startX = W - 290;
    const startY = centerY;

    for (let row = 0; row < 5; row++) {
        for (let col = 0; col <= row; col++) {
            const x = startX + row * 21;
            const y = startY + (col - row / 2) * 21;

            balls.push(
                createBall(x, y, "#e21b2d", "red")
            );
        }
    }

    moving = false;
    isDragging = false;

    statusElement.textContent =
        "New game started! Aim and take your shot.";
}


// DRAW TABLE
function drawTable() {
    ctx.clearRect(0, 0, W, H);

    // WOODEN BORDER
    ctx.fillStyle = "#683b20";
    ctx.fillRect(0, 0, W, H);

    // INNER WOOD
    ctx.fillStyle = "#a56a36";
    ctx.fillRect(20, 20, W - 40, H - 40);

    // GREEN SURFACE
    ctx.fillStyle = "#087443";
    ctx.fillRect(
        table.left,
        table.top,
        table.right - table.left,
        table.bottom - table.top
    );

    // TABLE BORDER
    ctx.strokeStyle = "#e4c27a";
    ctx.lineWidth = 3;

    ctx.strokeRect(
        table.left,
        table.top,
        table.right - table.left,
        table.bottom - table.top
    );

    // BAULK LINE
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(baulkX, table.top);
    ctx.lineTo(baulkX, table.bottom);
    ctx.stroke();

    // D SEMICIRCLE
    ctx.beginPath();
    ctx.arc(
        baulkX,
        centerY,
        70,
        Math.PI / 2,
        Math.PI * 1.5
    );
    ctx.stroke();

    // POCKETS
    pockets.forEach(([x, y]) => {
        ctx.beginPath();
        ctx.fillStyle = "#050505";
        ctx.arc(x, y, pocketRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "#b58a50";
        ctx.lineWidth = 2;
        ctx.stroke();
    });
}


// DRAW BALLS
function drawBalls() {
    balls.forEach(ball => {
        if (!ball.active) return;

        ctx.beginPath();
        ctx.fillStyle = ball.color;

        ctx.arc(
            ball.x,
            ball.y,
            ball.radius,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.strokeStyle = "rgba(0,0,0,0.6)";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // HIGHLIGHT
        ctx.beginPath();
        ctx.fillStyle = "rgba(255,255,255,0.55)";

        ctx.arc(
            ball.x - 3,
            ball.y - 3,
            3,
            0,
            Math.PI * 2
        );

        ctx.fill();
    });
}


// DRAW AIMING LINE
function drawAim() {
    const cue = balls.find(
        ball => ball.type === "cue" && ball.active
    );

    if (!cue || moving) return;

    const dx = mouse.x - cue.x;
    const dy = mouse.y - cue.y;
    const distance = Math.hypot(dx, dy);

    if (distance < 2) return;

    const nx = dx / distance;
    const ny = dy / distance;

    ctx.save();

    // AIMING LINE
    ctx.strokeStyle = "rgba(255,255,255,0.7)";
    ctx.lineWidth = 2;
    ctx.setLineDash([7, 6]);

    ctx.beginPath();
    ctx.moveTo(cue.x, cue.y);
    ctx.lineTo(
        cue.x + nx * 180,
        cue.y + ny * 180
    );
    ctx.stroke();

    ctx.setLineDash([]);

    // CUE STICK
    const power = isDragging
        ? Math.min(distance, 180)
        : 40;

    ctx.strokeStyle = "#d8a45c";
    ctx.lineWidth = 6;
    ctx.lineCap = "round";

    ctx.beginPath();

    ctx.moveTo(
        cue.x - nx * (25 + power * 0.35),
        cue.y - ny * (25 + power * 0.35)
    );

    ctx.lineTo(
        cue.x - nx * (120 + power * 0.35),
        cue.y - ny * (120 + power * 0.35)
    );

    ctx.stroke();

    ctx.restore();
}


// CHECK POCKETS
function checkPockets() {
    balls.forEach(ball => {
        if (!ball.active) return;

        pockets.forEach(([px, py]) => {
            if (!ball.active) return;

            const distance = Math.hypot(
                ball.x - px,
                ball.y - py
            );

            if (distance < pocketRadius + 2) {
                if (ball.type === "cue") {
                    ball.active = false;

                    statusElement.textContent =
                        "Cue ball pocketed! Returning...";

                    setTimeout(() => {
                        ball.x = baulkX - 75;
                        ball.y = centerY;
                        ball.vx = 0;
                        ball.vy = 0;
                        ball.active = true;
                    }, 700);

                } else {
                    ball.active = false;

                    const points = {
                        red: 1,
                        yellow: 2,
                        green: 3,
                        brown: 4,
                        blue: 5,
                        pink: 6,
                        black: 7
                    };

                    score += points[ball.type] || 0;
                    updateScore();

                    statusElement.textContent =
                        ball.type.toUpperCase() +
                        " ball pocketed! +" +
                        points[ball.type] +
                        " points";
                }
            }
        });
    });
}


// UPDATE PHYSICS
function updatePhysics() {
    moving = false;

    // BALL MOVEMENT
    balls.forEach(ball => {
        if (!ball.active) return;

        ball.x += ball.vx;
        ball.y += ball.vy;

        // FRICTION
        ball.vx *= 0.992;
        ball.vy *= 0.992;

        if (Math.abs(ball.vx) < 0.025) ball.vx = 0;
        if (Math.abs(ball.vy) < 0.025) ball.vy = 0;

        if (ball.vx !== 0 || ball.vy !== 0) {
            moving = true;
        }

        // LEFT CUSHION
        if (ball.x - ball.radius < table.left) {
            ball.x = table.left + ball.radius;
            ball.vx = Math.abs(ball.vx) * 0.85;
        }

        // RIGHT CUSHION
        if (ball.x + ball.radius > table.right) {
            ball.x = table.right - ball.radius;
            ball.vx = -Math.abs(ball.vx) * 0.85;
        }

        // TOP CUSHION
        if (ball.y - ball.radius < table.top) {
            ball.y = table.top + ball.radius;
            ball.vy = Math.abs(ball.vy) * 0.85;
        }

        // BOTTOM CUSHION
        if (ball.y + ball.radius > table.bottom) {
            ball.y = table.bottom - ball.radius;
            ball.vy = -Math.abs(ball.vy) * 0.85;
        }
    });

    // BALL COLLISIONS
    for (let i = 0; i < balls.length; i++) {
        for (let j = i + 1; j < balls.length; j++) {
            const a = balls[i];
            const b = balls[j];

            if (!a.active || !b.active) continue;

            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const distance = Math.hypot(dx, dy);

            const minDistance = a.radius + b.radius;

            if (distance < minDistance && distance > 0) {
                const nx = dx / distance;
                const ny = dy / distance;

                const overlap = minDistance - distance;

                a.x -= nx * overlap / 2;
                a.y -= ny * overlap / 2;

                b.x += nx * overlap / 2;
                b.y += ny * overlap / 2;

                const relativeVelocity =
                    (b.vx - a.vx) * nx +
                    (b.vy - a.vy) * ny;

                if (relativeVelocity < 0) {
                    const impulse = -relativeVelocity * 0.96;

                    a.vx -= impulse * nx;
                    a.vy -= impulse * ny;

                    b.vx += impulse * nx;
                    b.vy += impulse * ny;
                }
            }
        }
    }

    checkPockets();
}


// MOUSE POSITION
function getMousePosition(event) {
    const rect = canvas.getBoundingClientRect();

    mouse.x =
        (event.clientX - rect.left) * W / rect.width;

    mouse.y =
        (event.clientY - rect.top) * H / rect.height;
}


// SHOOT BALL
function shoot() {
    if (moving) return;

    const cue = balls.find(
        ball => ball.type === "cue" && ball.active
    );

    if (!cue) return;

    const dx = mouse.x - cue.x;
    const dy = mouse.y - cue.y;
    const distance = Math.hypot(dx, dy);

    if (distance < 5) return;

    const power = Math.min(distance, 180) * 0.105;

    cue.vx = (dx / distance) * power;
    cue.vy = (dy / distance) * power;

    isDragging = false;

    statusElement.textContent = "Shot played!";
}


// POINTER CONTROLS
canvas.addEventListener("pointermove", event => {
    getMousePosition(event);
});

canvas.addEventListener("pointerdown", event => {
    if (moving) return;

    getMousePosition(event);
    isDragging = true;

    canvas.setPointerCapture(event.pointerId);
});

canvas.addEventListener("pointerup", event => {
    if (!isDragging) return;

    getMousePosition(event);
    shoot();

    isDragging = false;
});

canvas.addEventListener("pointercancel", () => {
    isDragging = false;
});


// RESET BUTTON
resetButton.addEventListener("click", resetGame);


// HOME BUTTON
homeButton.addEventListener("click", () => {
    window.location.href = "/";
});


// MAIN GAME LOOP
function gameLoop() {
    updatePhysics();
    drawTable();
    drawBalls();
    drawAim();

    requestAnimationFrame(gameLoop);
}


// START GAME
resetGame();
gameLoop();


// HIDE LOADING SCREEN
if (loading) {
    loading.style.display = "none";
}

console.log("Royal Snooker Arena started successfully!");
