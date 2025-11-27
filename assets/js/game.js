import { state } from './state.js';
import { 
    WORLD_ROWS, WORLD_COLS, VIEW_ROWS, VIEW_COLS, 
    TILE_WALL, TILE_EMPTY, TILE_DORM, TILE_LIBRARY, TILE_POWER, CELL_SIZE, TILE_META
} from './constants.js';
import { els, log, updateView, openModal, closeModal, updateStats, updateTile } from './ui.js';
import { playAudio } from './audio.js';
import { startBattle } from './battle.js';

export function initMap() {
    // Generate Large World (Procedural)
    state.world = Array(WORLD_ROWS).fill().map(() => Array(WORLD_COLS).fill(TILE_EMPTY));

    // Simple Noise / City Generation
    for(let r=0; r<WORLD_ROWS; r++) {
        for(let c=0; c<WORLD_COLS; c++) {
            // Borders
            if (r === 0 || r === WORLD_ROWS-1 || c === 0 || c === WORLD_COLS-1) {
                state.world[r][c] = TILE_WALL;
            }
            // Scattered Walls (Ruins)
            else if (Math.random() < 0.05) {
                state.world[r][c] = TILE_WALL;
            }
        }
    }
    
    // Clear start area
    state.world[1][1] = TILE_EMPTY;
    state.world[1][2] = TILE_EMPTY;
    state.world[2][1] = TILE_EMPTY;
    state.world[2][2] = TILE_EMPTY;
    
    // Pre-build some structures for flavor
    state.world[5][5] = TILE_DORM;
    state.world[5][6] = TILE_DORM;
    state.world[5][7] = TILE_DORM;
}

export function spawnEntities() {
    // Legacy spawn
    // ... 
    
    // Spawn Agents
    for(let i=0; i<5; i++) {
        spawnAgent();
    }
    
    // Existing Entities
    const add = (type, x, y, imgPath, data = {}) => {
        // Ensure not in wall
        if (state.world[y][x] === TILE_WALL) return;

        const el = document.createElement('div');
        el.className = 'entity';
        el.style.left = (x * CELL_SIZE) + 'px';
        el.style.top = (y * CELL_SIZE) + 'px';
        const img = document.createElement('img');
        img.src = imgPath;
        el.appendChild(img);
        els.gridCanvas.appendChild(el);

        state.entities.push({ type, x, y, el, data });
    };

    // Doors (Questions)
    add('door', 4, 3, 'door.png', { q: "2 + 2", a: "4" });
    add('door', 10, 5, 'door.png', { q: "SQRT(16)", a: "4" });
    add('door', 8, 10, 'door.png', { q: "Type 'excel'", a: "excel" });

    // Chests (Points)
    add('chest', 15, 2, 'chest.png', { score: 100 });
    add('chest', 3, 12, 'chest.png', { score: 200 }); 

    // Enemies (Bugs)
    add('enemy', 6, 6, 'enemy.png', { hp: 20, q: "10 * 2", a: "20" });
    add('enemy', 12, 8, 'enemy.png', { hp: 20, q: "50 - 15", a: "35" });
}

function spawnAgent() {
    // Find random empty spot
    let x, y;
    let attempts = 0;
    do {
        x = Math.floor(Math.random() * WORLD_COLS);
        y = Math.floor(Math.random() * WORLD_ROWS);
        attempts++;
    } while (state.world[y][x] === TILE_WALL && attempts < 100);
    
    state.agents.push({
        id: Math.random().toString(36).substr(2, 9),
        x, y,
        energy: 100,
        task: 'IDLE'
    });
}

// --- Simulation Core ---

export function tick() {
    state.tick++;
    
    // 1. Agent Logic
    if (state.tick % 2 === 0) { // Move agents every 2 ticks
        state.agents.forEach(agent => {
            if (Math.random() > 0.3) moveAgent(agent);
        });
        updateView(); // Update agent visuals
    }

    // 2. Resource Generation (SimCity style)
    if (state.tick % 5 === 0) { // Every 5 seconds approx
        let knowledgeGain = 0;
        let energyGain = 0;
        let upkeep = 0;

        // Scan world (Optimized: Should maintain a list of buildings, but scanning 100x100 array is fast enough for this demo)
        for(let r=0; r<WORLD_ROWS; r++) {
            for(let c=0; c<WORLD_COLS; c++) {
                const t = state.world[r][c];
                if (t === TILE_LIBRARY) { knowledgeGain += 5; upkeep += 2; }
                if (t === TILE_POWER) { energyGain += 10; upkeep += 5; }
                if (t === TILE_DORM) { upkeep += 1; }
            }
        }

        // Apply
        state.resources.knowledge += knowledgeGain;
        state.resources.energy = Math.min(100, state.resources.energy + energyGain - upkeep);
        
        // UI Feedback
        if(knowledgeGain > 0) els.formulaDisplay.textContent = `=UPDATE_RES("Know", +${knowledgeGain})`;
        updateStats();
    }
}

function moveAgent(agent) {
    const dirs = [[0,1], [0,-1], [1,0], [-1,0]];
    const dir = dirs[Math.floor(Math.random() * dirs.length)];
    const nx = agent.x + dir[0];
    const ny = agent.y + dir[1];

    if (nx >= 0 && nx < WORLD_COLS && ny >= 0 && ny < WORLD_ROWS && state.world[ny][nx] !== TILE_WALL) {
        agent.x = nx;
        agent.y = ny;
    }
}

export function move(dx, dy) {
    if (state.modalOpen) return;

    const currentX = state.player.x;
    const currentY = state.player.y;
    const newX = currentX + dx;
    const newY = currentY + dy;

    // 1. Check boundaries
    if (newX < 0 || newX >= WORLD_COLS || newY < 0 || newY >= WORLD_ROWS) return;

    // 2. Check collision with Walls (Backend Map)
    const targetTileValue = state.world[newY][newX];
    if (targetTileValue === TILE_WALL) {
        // "Bump" sound optional
        return;
    }

    // 3. Check collision with Entities
    const entity = state.entities.find(e => e.x === newX && e.y === newY);

    if (entity) {
        if (entity.type === 'door') {
            openModal(entity, 'door');
            return;
        } else if (entity.type === 'enemy') {
            startBattle(entity, openModal);
            return;
        } else if (entity.type === 'chest') {
            collectChest(entity);
            // Chests are collected, so we can move into the tile
        }
    }

    // Commit move
    state.player.x = newX;
    state.player.y = newY;
    state.moves++;

    updateStats();
    els.formulaDisplay.textContent = `=MOVE_PLAYER("${newX}","${newY}")`;

    // Play sound
    playAudio('move');

    updateView();
}

export function toggleBuildModeTile(x, y) {
    // 1. Bounds Check
    if (x < 0 || x >= WORLD_COLS || y < 0 || y >= WORLD_ROWS) return;

    const type = state.selectedBuildTool;
    const meta = TILE_META[type];

    // Cost Check
    if (state.resources.credits < meta.cost) {
        log(`[BUILD_ERROR] Insufficient Funds. Need $${meta.cost}`);
        playAudio('wrong');
        return;
    }

    // 2. Deduct Cost
    state.resources.credits -= meta.cost;

    // 3. Update State & View
    updateTile(x, y, type);
    updateStats();
    
    // 5. Feedback
    playAudio('move');
    log(`[BUILD] Placed ${meta.name} at (${x}, ${y}). -$${meta.cost}`);
    els.formulaDisplay.textContent = `=BUILD("${meta.name}", ${x}, ${y})`;
}

export function collectChest(entity) {
    // Remove from screen
    entity.el.style.display = 'none';
    // Remove from data
    const idx = state.entities.indexOf(entity);
    if (idx > -1) state.entities.splice(idx, 1);

    state.score += entity.data.score;
    state.resources.credits += entity.data.score; // Convert score to credits
    updateStats();
    playAudio('correct');
    log(`Chest collected. Credits +${entity.data.score}`);
    els.formulaDisplay.textContent = `=SUM(CREDITS, ${entity.data.score})`;
}

export function resolveDoor(isCorrect) {
    if (isCorrect) {
        // Success
        playAudio('correct');
        els.modalFeedback.textContent = "ACCESS GRANTED";
        setTimeout(() => {
            // Find actual entity reference
            const { x, y } = state.currentInteraction;
            const entity = state.entities.find(e => e.x === x && e.y === y);

            if (entity) {
                // Remove door
                entity.el.style.display = 'none';
                state.entities.splice(state.entities.indexOf(entity), 1);
            }

            // Move player to that spot
            state.player.x = x;
            state.player.y = y;
            updateView();

            log("Access Granted. Door mechanism released.");
            closeModal();
        }, 500);
    } else {
        // Fail
        playAudio('wrong');
        els.modalFeedback.textContent = "ACCESS DENIED";
        els.modalFeedback.classList.add('error');
        els.modalInput.classList.add('shake');
        setTimeout(() => els.modalInput.classList.remove('shake'), 300);
    }
}