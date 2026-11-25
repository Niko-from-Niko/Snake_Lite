// Game configuration
const GRID_SIZE = 20;
const CELL_SIZE = 25;
const INITIAL_SPEED = 150;

// Game state
let canvas, ctx;
let snake = [];
let food = {};
let direction = { x: 1, y: 0 };
let nextDirection = { x: 1, y: 0 };
let score = 0;
let highScore = 0;
let gameRunning = false;
let gameLoop;
let speed = INITIAL_SPEED;

// Initialize game
function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // Set canvas size
    const gridWidth = Math.floor(canvas.offsetWidth / CELL_SIZE);
    const gridHeight = Math.floor(canvas.offsetHeight / CELL_SIZE);
    canvas.width = gridWidth * CELL_SIZE;
    canvas.height = gridHeight * CELL_SIZE;
    
    // Load high score
    highScore = parseInt(localStorage.getItem('snakeHighScore')) || 0;
    document.getElementById('highScore').textContent = highScore;
    
    // Event listeners
    document.getElementById('startBtn').addEventListener('click', startGame);
    document.getElementById('restartBtn').addEventListener('click', startGame);
    
    // Keyboard controls
    document.addEventListener('keydown', handleKeyPress);
    
    // Touch controls for mobile
    let touchStartX = 0;
    let touchStartY = 0;
    
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    });
    
    canvas.addEventListener('touchend', (e) => {
        e.preventDefault();
        if (!gameRunning) return;
        
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        
        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;
        
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // Horizontal swipe
            if (deltaX > 30 && direction.x === 0) {
                nextDirection = { x: 1, y: 0 }; // Right
            } else if (deltaX < -30 && direction.x === 0) {
                nextDirection = { x: -1, y: 0 }; // Left
            }
        } else {
            // Vertical swipe
            if (deltaY > 30 && direction.y === 0) {
                nextDirection = { x: 0, y: 1 }; // Down
            } else if (deltaY < -30 && direction.y === 0) {
                nextDirection = { x: 0, y: -1 }; // Up
            }
        }
    });
}

function startGame() {
    // Hide start/end screens
    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('gameOver').classList.add('hidden');
    
    // Reset game state
    const gridWidth = Math.floor(canvas.width / CELL_SIZE);
    const gridHeight = Math.floor(canvas.height / CELL_SIZE);
    
    snake = [
        { x: Math.floor(gridWidth / 2), y: Math.floor(gridHeight / 2) },
        { x: Math.floor(gridWidth / 2) - 1, y: Math.floor(gridHeight / 2) },
        { x: Math.floor(gridWidth / 2) - 2, y: Math.floor(gridHeight / 2) }
    ];
    
    direction = { x: 1, y: 0 };
    nextDirection = { x: 1, y: 0 };
    score = 0;
    speed = INITIAL_SPEED;
    gameRunning = true;
    
    updateScore();
    generateFood();
    
    // Start game loop
    if (gameLoop) clearInterval(gameLoop);
    gameLoop = setInterval(update, speed);
    
    // Draw initial state
    draw();
}

function handleKeyPress(e) {
    if (!gameRunning && e.key !== 'Enter' && !e.key.startsWith('Arrow') && !'wasd'.includes(e.key.toLowerCase())) {
        return;
    }
    
    const key = e.key.toLowerCase();
    
    // Prevent default behavior
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].includes(e.key.toLowerCase())) {
        e.preventDefault();
    }
    
    // Set direction based on key
    if ((key === 'arrowup' || key === 'w') && direction.y === 0) {
        nextDirection = { x: 0, y: -1 };
    } else if ((key === 'arrowdown' || key === 's') && direction.y === 0) {
        nextDirection = { x: 0, y: 1 };
    } else if ((key === 'arrowleft' || key === 'a') && direction.x === 0) {
        nextDirection = { x: -1, y: 0 };
    } else if ((key === 'arrowright' || key === 'd') && direction.x === 0) {
        nextDirection = { x: 1, y: 0 };
    }
}

function update() {
    if (!gameRunning) return;
    
    // Update direction
    direction = { ...nextDirection };
    
    // Calculate new head position
    const head = {
        x: snake[0].x + direction.x,
        y: snake[0].y + direction.y
    };
    
    // Check wall collision
    const gridWidth = Math.floor(canvas.width / CELL_SIZE);
    const gridHeight = Math.floor(canvas.height / CELL_SIZE);
    
    if (head.x < 0 || head.x >= gridWidth || head.y < 0 || head.y >= gridHeight) {
        gameOver();
        return;
    }
    
    // Check self collision
    for (let segment of snake) {
        if (head.x === segment.x && head.y === segment.y) {
            gameOver();
            return;
        }
    }
    
    // Add new head
    snake.unshift(head);
    
    // Check food collision
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        updateScore();
        generateFood();
        createParticles(food.x * CELL_SIZE + CELL_SIZE / 2, food.y * CELL_SIZE + CELL_SIZE / 2);
        
        // Increase speed slightly
        speed = Math.max(80, speed - 2);
        clearInterval(gameLoop);
        gameLoop = setInterval(update, speed);
    } else {
        // Remove tail
        snake.pop();
    }
    
    draw();
}

function generateFood() {
    const gridWidth = Math.floor(canvas.width / CELL_SIZE);
    const gridHeight = Math.floor(canvas.height / CELL_SIZE);
    
    do {
        food = {
            x: Math.floor(Math.random() * gridWidth),
            y: Math.floor(Math.random() * gridHeight)
        };
    } while (snake.some(segment => segment.x === food.x && segment.y === food.y));
}

function draw() {
    // Clear canvas with gradient background
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#16213e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += CELL_SIZE) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += CELL_SIZE) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
    
    // Draw snake
    snake.forEach((segment, index) => {
        const x = segment.x * CELL_SIZE;
        const y = segment.y * CELL_SIZE;
        
        if (index === 0) {
            // Head with gradient
            const headGradient = ctx.createRadialGradient(
                x + CELL_SIZE / 2, y + CELL_SIZE / 2, 0,
                x + CELL_SIZE / 2, y + CELL_SIZE / 2, CELL_SIZE / 2
            );
            headGradient.addColorStop(0, '#4ade80');
            headGradient.addColorStop(1, '#22c55e');
            ctx.fillStyle = headGradient;
            
            // Draw eyes
            ctx.fillRect(x + 3, y + 3, CELL_SIZE - 6, CELL_SIZE - 6);
            ctx.fillStyle = '#fff';
            ctx.fillRect(x + 6, y + 6, 4, 4);
            ctx.fillRect(x + 10, y + 6, 4, 4);
        } else {
            // Body with gradient
            const bodyGradient = ctx.createLinearGradient(x, y, x + CELL_SIZE, y + CELL_SIZE);
            const intensity = 1 - (index / snake.length) * 0.5;
            bodyGradient.addColorStop(0, `rgba(74, 222, 128, ${intensity})`);
            bodyGradient.addColorStop(1, `rgba(34, 197, 94, ${intensity})`);
            ctx.fillStyle = bodyGradient;
            ctx.fillRect(x + 2, y + 2, CELL_SIZE - 4, CELL_SIZE - 4);
            
            // Add shine effect
            ctx.fillStyle = `rgba(255, 255, 255, ${intensity * 0.3})`;
            ctx.fillRect(x + 3, y + 3, CELL_SIZE - 6, 2);
        }
    });
    
    // Draw food with animation
    const foodX = food.x * CELL_SIZE + CELL_SIZE / 2;
    const foodY = food.y * CELL_SIZE + CELL_SIZE / 2;
    const time = Date.now() * 0.005;
    const pulse = Math.sin(time) * 0.2 + 0.8;
    
    // Outer glow
    const foodGradient = ctx.createRadialGradient(foodX, foodY, 0, foodX, foodY, CELL_SIZE / 2 * pulse);
    foodGradient.addColorStop(0, 'rgba(239, 68, 68, 0.8)');
    foodGradient.addColorStop(0.5, 'rgba(239, 68, 68, 0.4)');
    foodGradient.addColorStop(1, 'rgba(239, 68, 68, 0)');
    ctx.fillStyle = foodGradient;
    ctx.beginPath();
    ctx.arc(foodX, foodY, CELL_SIZE / 2 * pulse, 0, Math.PI * 2);
    ctx.fill();
    
    // Food circle
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(foodX, foodY, CELL_SIZE / 2 - 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Inner highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.beginPath();
    ctx.arc(foodX - 3, foodY - 3, 3, 0, Math.PI * 2);
    ctx.fill();
}

function updateScore() {
    document.getElementById('score').textContent = score;
    if (score > highScore) {
        highScore = score;
        document.getElementById('highScore').textContent = highScore;
        localStorage.setItem('snakeHighScore', highScore);
    }
}

function gameOver() {
    gameRunning = false;
    clearInterval(gameLoop);
    
    document.getElementById('finalScore').textContent = score;
    document.getElementById('gameOver').classList.remove('hidden');
}

function createParticles(x, y) {
    const particleContainer = document.getElementById('particles');
    const particleCount = 15;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.style.position = 'absolute';
        particle.style.left = `${canvas.offsetLeft + x}px`;
        particle.style.top = `${canvas.offsetTop + y}px`;
        particle.style.width = '6px';
        particle.style.height = '6px';
        particle.style.background = `hsl(${Math.random() * 60 + 330}, 100%, 60%)`;
        particle.style.borderRadius = '50%';
        particle.style.pointerEvents = 'none';
        particle.style.zIndex = '1000';
        
        const angle = (Math.PI * 2 * i) / particleCount;
        const velocity = 50 + Math.random() * 50;
        const vx = Math.cos(angle) * velocity;
        const vy = Math.sin(angle) * velocity;
        
        particle.animate([
            { transform: 'translate(0, 0) scale(1)', opacity: 1 },
            { transform: `translate(${vx}px, ${vy}px) scale(0)`, opacity: 0 }
        ], {
            duration: 500 + Math.random() * 300,
            easing: 'ease-out'
        }).onfinish = () => particle.remove();
        
        particleContainer.appendChild(particle);
    }
}

// Initialize when page loads
window.addEventListener('load', init);

// Handle window resize
window.addEventListener('resize', () => {
    if (!gameRunning) {
        init();
    }
});
