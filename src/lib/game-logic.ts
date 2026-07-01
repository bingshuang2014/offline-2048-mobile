/**
 * Game logic for the 2048 game
 * Handles grid creation, tile movement, merging, and spawning
 */

export type GridSize = 3 | 4 | 5;
export type Direction = "up" | "down" | "left" | "right";
export type Difficulty = "easy" | "hard";

export interface Tile {
  value: number;
  id: string; // Unique ID for animation tracking
}

// Global counter for generating unique tile IDs
let tileIdCounter = 0;

/**
 * Generate a unique tile ID
 * Uses a counter-based approach to guarantee uniqueness
 */
export function generateTileId(): string {
  return `tile-${Date.now()}-${++tileIdCounter}`;
}

export interface GameState {
  grid: (Tile | null)[][];
  size: GridSize;
  score: number;
  gameOver: boolean;
  won: boolean;
}

/**
 * Creates an empty game grid
 */
export function createEmptyGrid(size: GridSize): (Tile | null)[][] {
  return Array.from({ length: size }, () => Array(size).fill(null));
}

/**
 * Creates a new game state with the specified difficulty
 */
export function createNewGame(difficulty: Difficulty, size?: GridSize): GameState {
  const gridSize = size || (difficulty === "easy" ? 4 : 3);
  const grid = createEmptyGrid(gridSize);

  // Spawn 2 initial tiles
  spawnRandomTile(grid);
  spawnRandomTile(grid);

  return {
    grid,
    size: gridSize,
    score: 0,
    gameOver: false,
    won: false,
  };
}

/**
 * Gets all empty positions in the grid
 */
export function getEmptyPositions(grid: (Tile | null)[][]): [number, number][] {
  const positions: [number, number][] = [];
  for (let row = 0; row < grid.length; row++) {
    const gridRow = grid[row]!;
    for (let col = 0; col < gridRow.length; col++) {
      if (gridRow[col] === null) {
        positions.push([row, col]);
      }
    }
  }
  return positions;
}

/**
 * Spawns a random tile (value 2 or 4) at a random empty position
 */
export function spawnRandomTile(grid: (Tile | null)[][]): boolean {
  const emptyPositions = getEmptyPositions(grid);
  if (emptyPositions.length === 0) {
    return false;
  }

  const randomIndex = Math.floor(Math.random() * emptyPositions.length);
  const [row, col] = emptyPositions[randomIndex]!;
  const value = Math.random() < 0.9 ? 2 : 4; // 90% chance of 2, 10% chance of 4

  grid[row]![col] = {
    value,
    id: generateTileId(),
  };

  return true;
}

/**
 * Moves tiles in the specified direction
 * Returns true if any tile moved or merged
 */
export function moveTiles(
  gameState: GameState,
  direction: Direction
): { gameState: GameState; moved: boolean; scoreGained: number } {
  const newGrid = gameState.grid.map((row) => row.map((tile) => (tile ? { ...tile } : null)));
  let moved = false;
  let scoreGained = 0;

  const processLine = (
    line: (Tile | null)[]
  ): { line: (Tile | null)[]; moved: boolean; scoreGained: number } => {
    // Remove nulls
    const tiles: Tile[] = [];
    for (const tile of line) {
      if (tile !== null) {
        tiles.push(tile);
      }
    }

    const newLine: (Tile | null)[] = [];
    let lineMoved = false;
    let lineScoreGained = 0;
    let i = 0;

    while (i < tiles.length) {
      if (i + 1 < tiles.length && tiles[i]!.value === tiles[i + 1]!.value) {
        // Merge
        const mergedValue = tiles[i]!.value * 2;
        newLine.push({
          value: mergedValue,
          id: generateTileId(),
        });
        lineScoreGained += mergedValue;
        lineMoved = true;
        i += 2;
      } else {
        newLine.push(tiles[i]!);
        i++;
      }
    }

    // Fill remaining with nulls
    while (newLine.length < line.length) {
      newLine.push(null);
    }

    // Check if any position changed
    for (let j = 0; j < line.length; j++) {
      const originalTile = line[j];
      const newTile = newLine[j];
      const originalValue = originalTile?.value ?? 0;
      const newValue = newTile?.value ?? 0;
      if (originalValue !== newValue) {
        lineMoved = true;
        break;
      }
    }

    return { line: newLine, moved: lineMoved, scoreGained: lineScoreGained };
  };

  const size = gameState.size;

  if (direction === "left") {
    for (let row = 0; row < size; row++) {
      const result = processLine(newGrid[row]!);
      newGrid[row] = result.line;
      if (result.moved) moved = true;
      scoreGained += result.scoreGained;
    }
  } else if (direction === "right") {
    for (let row = 0; row < size; row++) {
      const reversed: (Tile | null)[] = [...newGrid[row]!].reverse();
      const result = processLine(reversed);
      newGrid[row] = result.line.reverse();
      if (result.moved) moved = true;
      scoreGained += result.scoreGained;
    }
  } else if (direction === "up") {
    for (let col = 0; col < size; col++) {
      const column: (Tile | null)[] = [];
      for (let row = 0; row < size; row++) {
        column.push(newGrid[row]![col]!);
      }
      const result = processLine(column);
      for (let row = 0; row < size; row++) {
        newGrid[row]![col] = result.line[row]!;
      }
      if (result.moved) moved = true;
      scoreGained += result.scoreGained;
    }
  } else if (direction === "down") {
    for (let col = 0; col < size; col++) {
      const column: (Tile | null)[] = [];
      for (let row = 0; row < size; row++) {
        column.push(newGrid[row]![col]!);
      }
      const reversed = column.reverse();
      const result = processLine(reversed);
      const newColumn = result.line.reverse();
      for (let row = 0; row < size; row++) {
        newGrid[row]![col] = newColumn[row]!;
      }
      if (result.moved) moved = true;
      scoreGained += result.scoreGained;
    }
  }

  const newGameState: GameState = {
    ...gameState,
    grid: newGrid,
    score: gameState.score + scoreGained,
  };

  // Check for win based on grid size
  // Different grid sizes have different win targets for better game balance
  const winTarget = getWinTarget(size);

  if (!gameState.won) {
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        if (newGrid[row]![col]?.value === winTarget) {
          newGameState.won = true;
        }
      }
    }
  }

  return { gameState: newGameState, moved, scoreGained };
}

/**
 * Get the win target for a given grid size
 */
export function getWinTarget(gridSize: number): number {
  const targets: Record<number, number> = {
    3: 512,   // 3x3 → 512 (challenging but achievable)
    4: 2048,  // 4x4 → 2048 (standard)
    5: 2048,  // 5x5 → 2048 (easier with more space)
  };
  return targets[gridSize] || 2048;
}

/**
 * Checks if any tiles can be merged
 */
export function canMerge(grid: (Tile | null)[][]): boolean {
  const size = grid.length;

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const tile = grid[row]![col];
      if (!tile) continue;

      // Check right neighbor
      if (col + 1 < size) {
        const rightNeighbor = grid[row]![col + 1];
        if (rightNeighbor && rightNeighbor.value === tile.value) {
          return true;
        }
      }

      // Check bottom neighbor
      if (row + 1 < size) {
        const bottomNeighbor = grid[row + 1]![col];
        if (bottomNeighbor && bottomNeighbor.value === tile.value) {
          return true;
        }
      }
    }
  }

  return false;
}

/**
 * Serializes game state to JSON for storage
 */
export function serializeGameState(gameState: GameState): string {
  return JSON.stringify(gameState);
}

/**
 * Deserializes game state from JSON
 */
export function deserializeGameState(json: string): GameState {
  return JSON.parse(json);
}

/**
 * Counts tiles with non-zero values
 */
export function countNonZeroTiles(grid: (Tile | null)[][]): number {
  let count = 0;
  for (let row = 0; row < grid.length; row++) {
    const gridRow = grid[row]!;
    for (let col = 0; col < gridRow.length; col++) {
      if (gridRow[col] !== null && gridRow[col]!.value > 0) {
        count++;
      }
    }
  }
  return count;
}
