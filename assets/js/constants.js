export const GRID_ROWS = 16; // Legacy export for compatibility if needed, but we prefer VIEW_ROWS
export const GRID_COLS = 20;

// World & Viewport
export const WORLD_ROWS = 100;
export const WORLD_COLS = 100;
export const VIEW_ROWS = 16; // Height of the visible window
export const VIEW_COLS = 20; // Width of the visible window

export const CELL_SIZE = 40;

// Tiles
export const TILE_EMPTY = 0;
export const TILE_WALL = 1;
export const TILE_DORM = 2;
export const TILE_LIBRARY = 3;
export const TILE_POWER = 4;

export const TILE_META = {
    [TILE_EMPTY]: { name: "Floor", cost: 0, color: "#fff" },
    [TILE_WALL]: { name: "Wall", cost: 5, color: "#555" },
    [TILE_DORM]: { name: "Dorm", cost: 50, color: "#aaddff", img: "tile_dorm.png" },
    [TILE_LIBRARY]: { name: "Library", cost: 100, color: "#ffccaa", img: "tile_library.png" },
    [TILE_POWER]: { name: "Power", cost: 150, color: "#ffffaa", img: "tile_power.png" }
};

export const STATS = {
    PLAYER_ATK: 15,
    ENEMY_DEF: 5
};

