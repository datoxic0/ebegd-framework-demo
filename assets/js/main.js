import nipplejs from 'nipplejs';
import { state } from './state.js';
import { els, log, initGrid, updateView, closeModal, handleResize } from './ui.js';
import { initMap, spawnEntities, move, resolveDoor, toggleBuildModeTile, tick } from './game.js';
import { resolveBattleTurn } from './battle.js';
import { initAudio } from './audio.js';

// --- Initialization ---
function init() {
    initAudio();
    initMap();
    initGrid();
    spawnEntities();
    updateView();
    setupControls();
    log("System Initialized. EBEGD Framework v1.0 loaded.");

    // Initial formula
    els.formulaDisplay.textContent = `=GAME_START()`;
    
    // Start Simulation Loop
    setInterval(() => {
        if (state.mode !== 'PAUSE') {
            tick();
        }
    }, 1000);

    // Fix for mobile height
    window.addEventListener('resize', handleResize);
    handleResize();
}

function checkAnswer() {
    if (!state.currentInteraction) return;

    const userAnswer = els.modalInput.value.trim().toLowerCase();
    const correctStr = state.currentInteraction.data.a.toString().toLowerCase();
    const isCorrect = (userAnswer === correctStr);

    if (state.currentInteraction.interactionType === 'battle') {
        resolveBattleTurn(isCorrect);
    } else {
        resolveDoor(isCorrect);
    }
}

// --- Controls ---
function setupControls() {
    // Keyboard
    window.addEventListener('keydown', (e) => {
        if (state.modalOpen) {
            if (e.key === 'Enter') checkAnswer();
            if (e.key === 'Escape') closeModal();
            return;
        }

        switch(e.key) {
            case 'ArrowUp': case 'w': move(0, -1); break;
            case 'ArrowDown': case 's': move(0, 1); break;
            case 'ArrowLeft': case 'a': move(-1, 0); break;
            case 'ArrowRight': case 'd': move(1, 0); break;
        }
    });

    // Mouse Interaction (Build Mode)
    els.gridCanvas.addEventListener('click', (e) => {
        if (state.mode === 'BUILD') {
            const cell = e.target.closest('.cell');
            if (cell) {
                const x = parseInt(cell.dataset.x, 10);
                const y = parseInt(cell.dataset.y, 10);
                if (!isNaN(x) && !isNaN(y)) {
                    toggleBuildModeTile(x, y);
                }
            }
        }
    });
    
    // Mouse Move for Build Preview (Optional, maybe too heavy for DOM)
    // els.gridCanvas.addEventListener('mousemove', (e) => { ... });

    // Modal Buttons
    els.btnSubmit.addEventListener('click', checkAnswer);
    els.btnClose.addEventListener('click', closeModal);
    els.btnCancel.addEventListener('click', closeModal);

    // Nipple.js (Mobile)
    const options = {
        zone: els.mobileControls,
        mode: 'static',
        position: { left: '50%', top: '50%' },
        color: 'green',
        size: 80
    };
    const manager = nipplejs.create(options);

    let lastMoveTime = 0;
    manager.on('move', (evt, data) => {
        const now = Date.now();
        if (now - lastMoveTime < 200) return; // Throttle

        if (data.vector.y > 0.5) move(0, -1);
        else if (data.vector.y < -0.5) move(0, 1);
        else if (data.vector.x < -0.5) move(-1, 0);
        else if (data.vector.x > 0.5) move(1, 0);

        lastMoveTime = now;
    });
}

// Start
init();