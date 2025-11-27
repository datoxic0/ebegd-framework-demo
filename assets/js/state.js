import { GRID_ROWS, GRID_COLS, TILE_EMPTY } from './constants.js';

export const state = {
    player: { 
        x: 2, // World Coordinates
        y: 2 
    },
    camera: {
        x: 40,
        y: 42
    },
    world: [], // The massive map (Array of Arrays)
    entities: [], 
    resources: {
        credits: 50,
        knowledge: 0,
        energy: 100
    },
    mode: 'PLAY', // 'PLAY' or 'BUILD'
    selectedBuildTool: 1, // Default to WALL
    agents: [], // Autonomous students
    tick: 0,
    
    // Legacy support
    score: 0,
    moves: 0,
    gameActive: true,
    modalOpen: false,
    currentInteraction: null,
    history: [],
    // Battle State
    battle: {
        active: false,
        enemyHP: 20
    }
};