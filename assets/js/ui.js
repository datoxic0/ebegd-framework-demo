import { WORLD_ROWS, WORLD_COLS, CELL_SIZE, TILE_WALL, TILE_DORM, TILE_LIBRARY, TILE_POWER, TILE_META } from './constants.js';
import { state } from './state.js';

export const els = {
    gridCanvas: document.getElementById('grid-canvas'),
    colHeaders: document.getElementById('col-headers'),
    rowHeaders: document.getElementById('row-headers'),
    formulaDisplay: document.getElementById('formula-display'),
    cellAddress: document.getElementById('cell-address'),
    statsScore: document.getElementById('stat-score'),
    statsMoves: document.getElementById('stat-moves'),
    auditLog: document.getElementById('audit-log'),
    modalOverlay: document.getElementById('modal-overlay'),
    modalQuestion: document.getElementById('question-text'),
    modalInput: document.getElementById('answer-input'),
    modalFeedback: document.getElementById('feedback-msg'),
    btnSubmit: document.getElementById('btn-submit'),
    btnClose: document.getElementById('close-modal'),
    btnCancel: document.querySelector('.btn-cancel'),
    mobileControls: document.getElementById('mobile-controls'),
    tabs: document.querySelectorAll('.tab'),
    analyticsPanel: document.getElementById('analytics-panel'),
    gameContainer: document.getElementById('game-container'),
    viewport: document.getElementById('grid-viewport'),
    buildToolbar: document.getElementById('build-toolbar'),
    toolBtns: document.querySelectorAll('.tool-btn')
};

export function log(msg) {
    const p = document.createElement('p');
    const time = new Date().toLocaleTimeString();
    p.textContent = `[${time}] ${msg}`;
    els.auditLog.prepend(p); // Newest top
}

export function initGrid() {
    // Headers
    els.colHeaders.innerHTML = '';
    els.rowHeaders.innerHTML = '';

    // Columns (A, B, C...)
    for (let c = 0; c < WORLD_COLS; c++) {
        const div = document.createElement('div');
        div.className = 'col-header';
        div.textContent = String.fromCharCode(65 + (c % 26)); // Simple A-Z
        els.colHeaders.appendChild(div);
    }

    // Rows (1, 2, 3...)
    for (let r = 0; r < WORLD_ROWS; r++) {
        const div = document.createElement('div');
        div.className = 'row-header';
        div.textContent = r + 1;
        els.rowHeaders.appendChild(div);
    }

    // Grid Body
    els.gridCanvas.style.width = (WORLD_COLS * CELL_SIZE) + 'px';
    els.gridCanvas.style.height = (WORLD_ROWS * CELL_SIZE) + 'px';
    els.gridCanvas.innerHTML = ''; // Clear

    for (let r = 0; r < WORLD_ROWS; r++) {
        for (let c = 0; c < WORLD_COLS; c++) {
            const cell = document.createElement('div');
            
            // Check Backend Map
            const tileType = state.world[r][c];
            configureCell(cell, tileType);
            
            // Interaction Data
            cell.dataset.x = c;
            cell.dataset.y = r;
            
            cell.style.left = (c * CELL_SIZE) + 'px';
            cell.style.top = (r * CELL_SIZE) + 'px';
            els.gridCanvas.appendChild(cell);
        }
    }

    // Create Player Element
    const playerEl = document.createElement('div');
    playerEl.className = 'entity';
    playerEl.id = 'player-entity';
    playerEl.style.zIndex = 100;
    const pImg = document.createElement('img');
    pImg.src = 'player.png';
    playerEl.appendChild(pImg);
    els.gridCanvas.appendChild(playerEl);

    // Active Cell Border (The "Selection")
    const activeCell = document.createElement('div');
    activeCell.className = 'cell active-cell';
    activeCell.id = 'active-selection';
    els.gridCanvas.appendChild(activeCell);
}

function configureCell(cell, tileType) {
    cell.innerHTML = ''; // Clear
    cell.className = 'cell';
    
    if (tileType === TILE_WALL) cell.classList.add('wall');
    else if (tileType === TILE_DORM) {
        cell.classList.add('dorm');
        addTileImage(cell, 'tile_dorm.png');
    }
    else if (tileType === TILE_LIBRARY) {
        cell.classList.add('library');
        addTileImage(cell, 'tile_library.png');
    }
    else if (tileType === TILE_POWER) {
        cell.classList.add('power');
        addTileImage(cell, 'tile_power.png');
    }
}

function addTileImage(cell, src) {
    const img = document.createElement('img');
    img.src = src;
    img.className = 'tile-img';
    cell.appendChild(img);
}

export function updateView() {
    const { x, y } = state.player;

    // Update visual position
    const playerEl = document.getElementById('player-entity');
    const selectionEl = document.getElementById('active-selection');
    
    if(!playerEl || !selectionEl) return;

    const leftVal = x * CELL_SIZE;
    const topVal = y * CELL_SIZE;

    playerEl.style.left = leftVal + 'px';
    playerEl.style.top = topVal + 'px';

    selectionEl.style.left = leftVal + 'px';
    selectionEl.style.top = topVal + 'px';

    // Update UI
    const colChar = String.fromCharCode(65 + x);
    const cellRef = `${colChar}${y + 1}`;
    els.cellAddress.textContent = cellRef;

    // Maintain visibility
    playerEl.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });

    // Update Agents View
    state.agents.forEach(agent => {
        if (!agent.el) {
            // Create DOM if missing
            const el = document.createElement('div');
            el.className = 'entity';
            el.style.zIndex = 12;
            const img = document.createElement('img');
            img.src = 'student.png';
            el.appendChild(img);
            els.gridCanvas.appendChild(el);
            agent.el = el;
        }
        // Update Pos
        agent.el.style.left = (agent.x * CELL_SIZE) + 'px';
        agent.el.style.top = (agent.y * CELL_SIZE) + 'px';
        
        // Simple culling
        const dist = Math.abs(agent.x - x) + Math.abs(agent.y - y);
        agent.el.style.display = dist > 20 ? 'none' : 'flex'; 
    });
}

export function updateTile(x, y, type) {
    const cell = document.querySelector(`.cell[data-x="${x}"][data-y="${y}"]`);
    if (cell) {
        state.world[y][x] = type; // Ensure state is synced
        configureCell(cell, type);
    }
}

export function openModal(entity, type = 'door') {
    state.modalOpen = true;
    state.currentInteraction = { ...entity, interactionType: type }; // Store type

    const promptText = type === 'battle' ? "BATTLE! Solve to Attack:" : "Security Door:";
    
    els.modalQuestion.textContent = `${promptText} ${entity.data.q}`;
    els.modalInput.value = '';
    els.modalFeedback.textContent = '';
    els.modalFeedback.className = 'feedback-msg';

    els.modalOverlay.classList.remove('hidden');
    els.modalInput.focus();

    if (type === 'door') {
        els.formulaDisplay.textContent = `=IF(ANSWER="${entity.data.a}", "OPEN", "LOCKED")`;
    }
}

export function closeModal() {
    state.modalOpen = false;
    state.currentInteraction = null;
    els.modalOverlay.classList.add('hidden');
    els.modalInput.blur();
}

export function updateStats() {
    els.statsScore.textContent = state.score;
    els.statsMoves.textContent = state.moves;
    
    // Resource Update
    document.getElementById('res-credits').textContent = state.resources.credits;
    document.getElementById('res-knowledge').textContent = state.resources.knowledge;
    document.getElementById('res-energy').textContent = state.resources.energy + '%';
}

// Window global for onclick in HTML
window.switchTab = (tabName) => {
    if (tabName === 'game') {
        els.tabs[0].classList.add('active');
        els.tabs[1].classList.remove('active');
        els.analyticsPanel.classList.add('hidden');
    } else {
        els.tabs[0].classList.remove('active');
        els.tabs[1].classList.add('active');
        els.analyticsPanel.classList.remove('hidden');
        updateStats();
    }
};

window.setMode = (mode) => {
    state.mode = mode;
    document.body.classList.toggle('build-mode', mode === 'BUILD');
    
    // Toggle Toolbar
    if (mode === 'BUILD') els.buildToolbar.classList.remove('hidden');
    else els.buildToolbar.classList.add('hidden');

    log(`System Mode set to: ${mode}`);
    els.formulaDisplay.textContent = `=SWITCH_MODE("${mode}")`;
};

window.selectTool = (type) => {
    state.selectedBuildTool = type;
    // Update UI
    els.toolBtns.forEach(btn => btn.classList.remove('active'));
    // Use event to find button or index? simple iteration for now
    // We rely on the onclick passing the value. Visual feedback needs to match.
    // This is a quick hack for the visual toggle:
    const btns = Array.from(els.toolBtns);
    const targetBtn = btns.find(b => b.getAttribute('onclick').includes(`(${type})`));
    if(targetBtn) targetBtn.classList.add('active');

    const meta = TILE_META[type];
    log(`Tool Selected: ${meta.name} ($${meta.cost})`);
};

export function handleResize() {
    document.body.style.height = window.innerHeight + 'px';
}