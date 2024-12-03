const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Constants
const BACKGROUND_COLOR = 'rgb(245, 247, 250)';
const UI_COLOR = 'rgb(70, 80, 95)';
const ACCENT_COLOR = 'rgb(94, 114, 228)';
const GRID_COLOR = 'rgb(230, 235, 240)';
const SHADOW_COLOR = 'rgba(0, 0, 0, 0.15)';
const G = 0.3;

// Game state
let planets = [];
let particles = [];
let selectedPlanet = null;
let paused = false;
let runMainMenu = true;

// Controls
const keys = {};
window.addEventListener('keydown', e => keys[e.key] = true);
window.addEventListener('keyup', e => keys[e.key] = false);

// Mouse handling
let lastMouseX = 0;
let lastMouseY = 0;
window.addEventListener('mousemove', (e) => {
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
});

canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    selectedPlanet = null;
    planets.forEach(planet => {
        const dx = planet.x - x;
        const dy = planet.y - y;
        if (dx * dx + dy * dy < planet.radius * planet.radius) {
            selectedPlanet = planet;
        }
    });
});

function drawControls() {
    const controls = document.getElementById('controls');
    controls.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <span style="font-size: 18px; color: ${UI_COLOR};">Controls</span>
            <span class="key" style="cursor: pointer; padding: 5px 10px;" onclick="document.getElementById('controls').style.display='none'">✕</span>
        </div>
        <div class="control-item">
            <span class="key">Space</span>
            <span class="action">Create Planet</span>
        </div>
        <div class="control-item">
            <span class="key">P</span>
            <span class="action">Pause</span>
        </div>
        <div class="control-item">
            <span class="key">X</span>
            <span class="action">Clear All</span>
        </div>
        <div class="control-item">
            <span class="key">C</span>
            <span class="action">Clear Selected</span>
        </div>
        <div class="control-item">
            <span class="key">Arrow Keys</span>
            <span class="action">Move Selected</span>
        </div>
        <div class="control-item">
            <span class="key">U/D</span>
            <span class="action">Increase/Decrease Mass</span>
        </div>
    `;
}

function startGame() {
    document.getElementById('title-screen').style.display = 'none';
    runMainMenu = false;
    resizeCanvas();
    drawControls();
}

function quitGame() {
    window.close();
}

// Set canvas size to window size
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    drawControls(); // Redraw controls to fit new size
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Main game loop
function gameLoop() {
    ctx.fillStyle = BACKGROUND_COLOR;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    if (!runMainMenu) {
        drawGrid();
        
        if (!paused) {
            updatePlanets();
            updateParticles();
        }
        
        drawParticles();
        drawPlanets();
    }
    
    requestAnimationFrame(gameLoop);
}

function updateParticles() {
    particles = particles.filter(particle => !particle.dead);
    particles.forEach(particle => particle.update());
}

function drawParticles() {
    particles.forEach(particle => particle.draw(ctx));
}

function drawGrid() {
    const gridSpacing = Math.min(canvas.width, canvas.height) / 20;
    ctx.strokeStyle = GRID_COLOR;
    ctx.lineWidth = 1;

    for (let x = 0; x < canvas.width; x += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }

    for (let y = 0; y < canvas.height; y += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}

function updatePlanets() {
    for (let i = 0; i < planets.length; i++) {
        const planetA = planets[i];
        planetA.handleControls(keys);
        planetA.update(planets);

        for (let j = i + 1; j < planets.length; j++) {
            const planetB = planets[j];
            const dx = planetA.x - planetB.x;
            const dy = planetA.y - planetB.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < planetA.radius + planetB.radius) {
                // Merge planets
                const totalMass = planetA.mass + planetB.mass;
                const newRadius = Math.sqrt((planetA.radius ** 2) + (planetB.radius ** 2));
                const newVx = (planetA.v_x * planetA.mass + planetB.v_x * planetB.mass) / totalMass;
                const newVy = (planetA.v_y * planetA.mass + planetB.v_y * planetB.mass) / totalMass;
                const newColor = [
                    (planetA.color[0] + planetB.color[0]) / 2,
                    (planetA.color[1] + planetB.color[1]) / 2,
                    (planetA.color[2] + planetB.color[2]) / 2
                ];

                const mergedPlanet = new Planet(
                    totalMass, newRadius, newColor,
                    [(planetA.x + planetB.x) / 2, (planetA.y + planetB.y) / 2],
                    [newVx, newVy]
                );

                planets.splice(j, 1); // Remove planetB
                planets.splice(i, 1, mergedPlanet); // Replace planetA with mergedPlanet
                break; // Exit the inner loop to avoid further checks on merged planet
            }
        }
    }
}

function drawPlanets() {
    planets.forEach(planet => planet.draw(ctx));
}

// Space key handler to create new planets
window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        const rect = canvas.getBoundingClientRect();
        const mouseX = lastMouseX - rect.left;
        const mouseY = lastMouseY - rect.top;
        
        const newPlanet = new Planet(
            1, 25,
            [Math.random() * 155 + 100, Math.random() * 155 + 100, Math.random() * 155 + 100],
            [mouseX, mouseY]
        );
        planets.push(newPlanet);
        selectedPlanet = newPlanet;
    }
    if (e.code === 'KeyP') {
        paused = !paused;
    }
    if (e.code === 'KeyX') {
        planets = [];
        selectedPlanet = null;
    }
    if (e.code === 'KeyC' && selectedPlanet) {
        planets = planets.filter(planet => planet !== selectedPlanet);
        selectedPlanet = null;
    }
    if (selectedPlanet) {
        const velocityIncrement = 0.2;
        const massIncrement = 2;

        if (e.code === 'ArrowUp') selectedPlanet.v_y -= velocityIncrement;
        if (e.code === 'ArrowDown') selectedPlanet.v_y += velocityIncrement;
        if (e.code === 'ArrowLeft') selectedPlanet.v_x -= velocityIncrement;
        if (e.code === 'ArrowRight') selectedPlanet.v_x += velocityIncrement;
        if (e.code === 'KeyU') {
            selectedPlanet.radius += massIncrement;
            selectedPlanet.mass = Math.PI * (selectedPlanet.radius ** 2) * 3;
            selectedPlanet.glow_radius = selectedPlanet.radius * 1.8;
        }
        if (e.code === 'KeyD' && selectedPlanet.radius > 5) {
            selectedPlanet.radius -= massIncrement;
            selectedPlanet.mass = Math.PI * (selectedPlanet.radius ** 2) * 3;
            selectedPlanet.glow_radius = selectedPlanet.radius * 1.8;
        }
    }
});

// Add initial planets
planets.push(
    new Planet(100, 25, [0,0,100], [150,400], [0,1]),
    new Planet(100, 25, [0,100,0], [1100,400], [0,-1]),
    new Planet(1, 25, [200,0,0], [400,600], [0.5,-0.5])
);

// Touch handling for mobile devices
let lastTouchX = null;
let lastTouchY = null;
let touchInterval = null;

canvas.addEventListener('touchstart', (e) => {
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    selectedPlanet = null;
    planets.forEach(planet => {
        const dx = planet.x - x;
        const dy = planet.y - y;
        if (dx * dx + dy * dy < planet.radius * planet.radius) {
            selectedPlanet = planet;
        }
    });

    lastTouchX = x;
    lastTouchY = y;
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    if (selectedPlanet) {
        selectedPlanet.x = x;
        selectedPlanet.y = y;
        selectedPlanet.v_x = (x - lastTouchX) * 0.1; // Adjust multiplier for desired momentum
        selectedPlanet.v_y = (y - lastTouchY) * 0.1;
    }

    lastTouchX = x;
    lastTouchY = y;
}, { passive: false });

canvas.addEventListener('touchend', () => {
    lastTouchX = null;
    lastTouchY = null;
});

function startContinuousMovement(direction) {
    if (touchInterval) clearInterval(touchInterval);
    touchInterval = setInterval(() => moveSelectedPlanet(direction), 100);
}

function stopContinuousMovement() {
    if (touchInterval) clearInterval(touchInterval);
}

// Bind touch events to arrow buttons
document.querySelectorAll('.touch-button').forEach(button => {
    button.addEventListener('touchstart', (e) => {
        const direction = e.target.getAttribute('onclick').match(/'(.*?)'/)[1];
        startContinuousMovement(direction);
    });

    button.addEventListener('touchend', stopContinuousMovement);
});

function moveSelectedPlanet(direction) {
    if (selectedPlanet) {
        const velocityIncrement = 0.5;
        switch (direction) {
            case 'up':
                selectedPlanet.v_y -= velocityIncrement;
                break;
            case 'down':
                selectedPlanet.v_y += velocityIncrement;
                break;
            case 'left':
                selectedPlanet.v_x -= velocityIncrement;
                break;
            case 'right':
                selectedPlanet.v_x += velocityIncrement;
                break;
        }
    }
}

function adjustMass(action) {
    if (selectedPlanet) {
        const massIncrement = 5;
        if (action === 'increase') {
            selectedPlanet.radius += massIncrement;
            selectedPlanet.mass = Math.PI * (selectedPlanet.radius ** 2) * 3;
            selectedPlanet.glow_radius = selectedPlanet.radius * 1.8;
        } else if (action === 'decrease' && selectedPlanet.radius > 5) {
            selectedPlanet.radius -= massIncrement;
            selectedPlanet.mass = Math.PI * (selectedPlanet.radius ** 2) * 3;
            selectedPlanet.glow_radius = selectedPlanet.radius * 1.8;
        }
    }
}

function clearAllPlanets() {
    planets = [];
    selectedPlanet = null;
}

function clearSelectedPlanet() {
    if (selectedPlanet) {
        planets = planets.filter(planet => planet !== selectedPlanet);
        selectedPlanet = null;
    }
}

function toggleTouchControls() {
    const touchControls = document.getElementById('touch-controls');
    const showButton = document.querySelector('.show-button');
    if (touchControls.style.display === 'none') {
        touchControls.style.display = 'flex';
        showButton.style.display = 'none';
    } else {
        touchControls.style.display = 'none';
        showButton.style.display = 'block';
    }
}

function createPlanet() {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    const newPlanet = new Planet(
        1, 25,
        [Math.random() * 155 + 100, Math.random() * 155 + 100, Math.random() * 155 + 100],
        [centerX, centerY]
    );
    planets.push(newPlanet);
    selectedPlanet = newPlanet;
}

function toggleInfoBar() {
    const controls = document.getElementById('controls');
    if (controls.style.display === 'none' || controls.style.display === '') {
        controls.style.display = 'block';
    } else {
        controls.style.display = 'none';
    }
}

// Initialize game
gameLoop();
