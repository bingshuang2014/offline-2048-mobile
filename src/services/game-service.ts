/**
 * Game Service - Service layer for game operations
 *
 * This service provides a clean abstraction for game logic and persistence,
 * routing to the appropriate backend based on platform:
 * - Web: Next.js API routes
 * - Native: Capacitor SQLite database
 */

import { Platform } from "react-native";
import type { GameState, Tile } from "@/lib/game-logic";
import type { Game } from "@/lib/schema";

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Convert timestamp from database to Date object
 * Handles both number timestamps and string dates
 */
function timestampToDate(timestamp: number | string | Date | undefined | null): Date {
  if (timestamp instanceof Date) {
    return timestamp;
  }

  if (typeof timestamp === 'number') {

    // Check if timestamp is in seconds (too small for milliseconds)
    // Valid millisecond timestamps should be > year 2000
    if (timestamp < 10000000000) {
      // Convert seconds to milliseconds
      timestamp = timestamp * 1000;
    }

    // Validate timestamp range (year 1970 to year 3000)
    const minTimestamp = 0; // 1970-01-01
    const maxTimestamp = 32503680000000; // 3000-01-01

    if (timestamp < minTimestamp || timestamp > maxTimestamp) {
      console.warn('[GameService] Invalid timestamp:', timestamp, 'using current time');
      return new Date();
    }

    return new Date(timestamp);
  }

  if (typeof timestamp === 'string') {

    // Try parsing as number string first (Unix timestamp in milliseconds)
    const numTimestamp = Number(timestamp);
    if (!isNaN(numTimestamp)) {
      // Recursively call with number to reuse the number parsing logic
      return timestampToDate(numTimestamp);
    }

    // Try parsing as ISO date string
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      console.warn('[GameService] Invalid date string:', timestamp, 'using current time');
      return new Date();
    }
    return date;
  }

  // Fallback to current time
  console.warn('[GameService] Unknown timestamp type:', typeof timestamp, 'using current time');
  return new Date();
}

/**
 * Check if any tiles can be merged
 */
function checkCanMerge(grid: (Tile | null)[][]): boolean {
  const size = grid.length;

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const tile = grid[row]?.[col];
      if (!tile) continue;

      // Check right neighbor
      if (col + 1 < size) {
        const rightNeighbor = grid[row]?.[col + 1];
        if (rightNeighbor && rightNeighbor.value === tile.value) {
          return true;
        }
      }

      // Check bottom neighbor
      if (row + 1 < size) {
        const bottomNeighbor = grid[row + 1]?.[col];
        if (bottomNeighbor && bottomNeighbor.value === tile.value) {
          return true;
        }
      }
    }
  }

  return false;
}

// ============================================================================
// Type Definitions
// ============================================================================

export interface StartGameRequest {
  mode: "simple" | "endless";
  gridSize: 3 | 4 | 5;
}

export interface MoveRequest {
  direction: "up" | "down" | "left" | "right";
}

export interface GameResponse {
  game: GameWithState;
  initialState: GameState;
}

// Game type with gameState as an object instead of JSON string
export type GameWithState = Omit<Game, 'gameState'> & {
  gameState: GameState | null;
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Fetch wrapper for API calls (web platform)
 */
async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    throw error;
  }
}

// ============================================================================
// Game Service Methods
// ============================================================================

/**
 * Get active game for current player
 * @returns Active game data or null if none
 */
export async function getActiveGame(): Promise<GameWithState | null> {
  try {
    if (Platform.OS === "web") {
      const response = await apiFetch<{ game: Game | null }>("/api/games/active");
      if (!response.game) return null;

      // Parse gameState from JSON string to object
      return {
        ...response.game,
        gameState: response.game.gameState
          ? (JSON.parse(response.game.gameState) as GameState)
          : null,
      };
    } else {
      const { query } = await import("@/lib/db-expo");

      // Get active player first
      const activePlayers = await query<{ player_id: number }>(
        "SELECT player_id FROM active_player WHERE id = 1"
      );

      if (!activePlayers[0]) {
        return null;
      }

      // Get active game for this player (only incomplete games)
      const games = await query<any>(
        `SELECT id, player_id as playerId, difficulty, grid_size as gridSize, score,
                time_elapsed as timeElapsed, game_state as gameState, is_completed as isCompleted,
                created_at as createdAt, updated_at as updatedAt, last_move_at as lastMoveAt
         FROM games WHERE player_id = ? AND is_completed = 0 AND id IN (
          SELECT MAX(id) FROM games WHERE player_id = ? AND is_completed = 0
        )`,
        [activePlayers[0].player_id, activePlayers[0].player_id]
      );

      if (games[0]) {
        const game = {
          ...games[0],
          isCompleted: (Number(games[0].isCompleted) === 1),
        };

        // Parse gameState safely
        let parsedGameState: GameState | null = null;
        if (game.gameState && typeof game.gameState === 'string' && game.gameState.trim() !== '') {
          try {
            parsedGameState = JSON.parse(game.gameState) as GameState;
          } catch (e) {
            console.error('[GameService] Failed to parse gameState:', e);
          }
        } else {
          console.warn('[GameService] gameState is empty or invalid:', game.gameState);
        }

        return {
          ...game,
          gameState: parsedGameState,
          createdAt: timestampToDate(game.createdAt as any),
          updatedAt: timestampToDate(game.updatedAt as any),
        };
      }
      return null;
    }
  } catch (error) {
    console.error("[GameService] Error fetching active game:", error);
    return null;
  }
}

/**
 * Start a new game
 * @param request - Game start request
 * @returns Game data with initial state or null on error
 */
export async function startGame(request: StartGameRequest): Promise<GameResponse | null> {
  try {
    if (Platform.OS === "web") {
      const response = await apiFetch<GameResponse>("/api/games/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });
      return response;
    } else {
      const { execute, lastInsertId, query } = await import("@/lib/db-expo");

      // Get active player
      const activePlayers = await query<{ player_id: number }>(
        "SELECT player_id FROM active_player WHERE id = 1"
      );

      if (!activePlayers[0]) {
        throw new Error("No active player");
      }

      const playerId = activePlayers[0].player_id;

      // Create initial game state
      const size = request.gridSize;

      // Create empty grid
      const grid: (Tile | null)[][] = Array.from(
        { length: size },
        () => Array(size).fill(null)
      );

      // Add two initial tiles
      const emptyCells: [number, number][] = [];
      for (let row = 0; row < size; row++) {
        const rowCells = grid[row];
        if (rowCells) {
          for (let col = 0; col < size; col++) {
            if (rowCells[col] === null) {
              emptyCells.push([row, col]);
            }
          }
        }
      }

      if (emptyCells.length >= 2) {
        const pos1Idx = Math.floor(Math.random() * emptyCells.length);
        const cell1 = emptyCells[pos1Idx];
        if (cell1) {
          const [row1, col1] = cell1;
          const row = grid[row1];
          if (row) {
            row[col1] = {
              value: Math.random() < 0.9 ? 2 : 4,
              id: `${Date.now()}-${pos1Idx}`,
            };
          }
        }

        const remainingCells = emptyCells.filter((_, idx) => idx !== pos1Idx);
        const pos2Idx = Math.floor(Math.random() * remainingCells.length);
        const cell2 = remainingCells[pos2Idx];
        if (cell2) {
          const [row2, col2] = cell2;
          const row = grid[row2];
          if (row) {
            row[col2] = {
              value: Math.random() < 0.9 ? 2 : 4,
              id: `${Date.now()}-${pos2Idx}`,
            };
          }
        }
      }

      const gameState: GameState = {
        grid,
        size,
        score: 0,
        gameOver: false,
        won: false,
      };

      // Map mode to difficulty values used in database
      const difficulty = request.mode === "simple" ? "easy" : "hard";

      // Insert game into database
      await execute(
        `INSERT INTO games (player_id, difficulty, grid_size, score, time_elapsed, game_state, created_at, updated_at, last_move_at, is_completed)
         VALUES (?, ?, ?, 0, 0, ?, ?, ?, ?, 0)`,
        [
          playerId,
          difficulty,
          request.gridSize,
          JSON.stringify(gameState),
          Date.now(),
          Date.now(),
          Date.now(),
        ]
      );

      const gameId = await lastInsertId();

      // Fetch the created game
      const games = await query<any>(
        `SELECT id, player_id as playerId, difficulty, grid_size as gridSize, score,
                time_elapsed as timeElapsed, game_state as gameState, is_completed as isCompleted,
                created_at as createdAt, updated_at as updatedAt, last_move_at as lastMoveAt
         FROM games WHERE id = ?`,
        [gameId]
      );
      if (games[0]) {
        const game = {
          ...games[0],
          isCompleted: (Number(games[0].isCompleted) === 1),
        };
        return {
          game: {
            ...game,
            gameState: game.gameState ? (JSON.parse(game.gameState) as GameState) : null,
            createdAt: timestampToDate(game.createdAt as any),
            updatedAt: timestampToDate(game.updatedAt as any),
          },
          initialState: gameState,
        };
      }
      return null;
    }
  } catch (error) {
    console.error("[GameService] Error starting game:", error);
    return null;
  }
}

/**
 * Make a move in the game
 * @param gameId - Game ID
 * @param request - Move request
 * @returns Updated game data or null on error
 */
export async function makeMove(gameId: number, request: MoveRequest): Promise<GameWithState | null> {
  try {
    if (Platform.OS === "web") {
      const response = await apiFetch<{ game: Game }>(`/api/games/${gameId}/move`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });

      // Parse gameState from JSON string to object
      return {
        ...response.game,
        gameState: response.game.gameState
          ? (JSON.parse(response.game.gameState) as GameState)
          : null,
      };
    } else {
      // On native, execute game logic locally
      const { execute, query } = await import("@/lib/db-expo");

      // Get current game
      const games = await query<any>(
        `SELECT id, player_id as playerId, difficulty, grid_size as gridSize, score,
                time_elapsed as timeElapsed, game_state as gameState, is_completed as isCompleted,
                created_at as createdAt, updated_at as updatedAt, last_move_at as lastMoveAt
         FROM games WHERE id = ?`,
        [gameId]
      );
      if (!games[0]) {
        throw new Error("Game not found");
      }

      const game = {
        ...games[0],
        isCompleted: (Number(games[0].isCompleted) === 1),
      } as Game;
      if (game.isCompleted) {
        throw new Error("Game is already completed");
      }

      // Parse game state
      let gameState: GameState;
      try {
        gameState = JSON.parse(game.gameState as string) as GameState;
      } catch (parseError) {
        console.error('[GameService] Failed to parse game state:', parseError);
        throw new Error('Invalid game state data');
      }

      // Import and use game logic
      const { moveTiles, spawnRandomTile, getEmptyPositions } = await import("@/lib/game-logic");

      // Execute move
      const moveResult = moveTiles(gameState, request.direction);

      // Update game state
      let updatedGameState: GameState = {
        ...moveResult.gameState,
        score: moveResult.gameState.score,
      };

      // Only spawn new tile and save if move was successful
      if (moveResult.moved) {
        // Spawn a new tile
        spawnRandomTile(updatedGameState.grid);

        // Check if game is over (no empty cells and no possible merges)
        const emptyPositions = getEmptyPositions(updatedGameState.grid);

        if (emptyPositions.length === 0) {
          // Check if any merges are possible
          const canMerge = checkCanMerge(updatedGameState.grid);

          if (!canMerge) {
            updatedGameState.gameOver = true;
          }
        }
      } else {
        // Move failed - check if game is over
        const emptyPositions = getEmptyPositions(updatedGameState.grid);

        if (emptyPositions.length === 0) {
          const canMerge = checkCanMerge(updatedGameState.grid);

          if (!canMerge) {
            updatedGameState.gameOver = true;
          }
        }
      }

      // Update in database
      await execute(
        "UPDATE games SET game_state = ?, score = ?, updated_at = ?, last_move_at = ? WHERE id = ?",
        [
          JSON.stringify(updatedGameState),
          updatedGameState.score,
          Date.now(),
          Date.now(),
          gameId,
        ]
      );

      // Fetch updated game
      const updatedGames = await query<any>(
        `SELECT id, player_id as playerId, difficulty, grid_size as gridSize, score,
                time_elapsed as timeElapsed, game_state as gameState, is_completed as isCompleted,
                created_at as createdAt, updated_at as updatedAt, last_move_at as lastMoveAt
         FROM games WHERE id = ?`,
        [gameId]
      );
      if (updatedGames[0]) {
        const updatedGame = {
          ...updatedGames[0],
          isCompleted: (Number(updatedGames[0].isCompleted) === 1),
        };
        return {
          ...updatedGame,
          gameState: JSON.parse(updatedGame.gameState as string) as GameState,
          createdAt: timestampToDate(updatedGame.createdAt as any),
          updatedAt: timestampToDate(updatedGame.updatedAt as any),
        } as GameWithState;
      }

      // If move didn't change anything, return current game state
      return {
        ...game,
        gameState: JSON.parse(game.gameState as string) as GameState,
        createdAt: timestampToDate(game.createdAt as any),
        updatedAt: timestampToDate(game.updatedAt as any),
      } as GameWithState;
    }
  } catch (error) {
    console.error("[GameService] Error making move:", error);
    return null;
  }
}

/**
 * Get game by ID
 * @param gameId - Game ID
 * @returns Game data or null if not found
 */
export async function getGame(gameId: number): Promise<GameWithState | null> {
  try {
    if (Platform.OS === "web") {
      const response = await apiFetch<{ game: Game }>(`/api/games/${gameId}`);

      // Parse gameState from JSON string to object
      return {
        ...response.game,
        gameState: response.game.gameState
          ? (JSON.parse(response.game.gameState) as GameState)
          : null,
      };
    } else {
      const { query } = await import("@/lib/db-expo");
      const games = await query<any>(
        `SELECT id, player_id as playerId, difficulty, grid_size as gridSize, score,
                time_elapsed as timeElapsed, game_state as gameState, is_completed as isCompleted,
                created_at as createdAt, updated_at as updatedAt, last_move_at as lastMoveAt
         FROM games WHERE id = ?`,
        [gameId]
      );
      if (games[0]) {
        const game = {
          ...games[0],
          isCompleted: (Number(games[0].isCompleted) === 1),
        };

        // Parse gameState safely
        let parsedGameState: GameState | null = null;
        if (game.gameState && typeof game.gameState === 'string' && game.gameState.trim() !== '') {
          try {
            parsedGameState = JSON.parse(game.gameState) as GameState;
          } catch (e) {
            console.error('[GameService] Failed to parse gameState:', e);
          }
        } else {
          console.warn('[GameService] gameState is empty or invalid:', game.gameState);
        }

        return {
          ...game,
          gameState: parsedGameState,
          createdAt: timestampToDate(game.createdAt as any),
          updatedAt: timestampToDate(game.updatedAt as any),
        };
      }
      return null;
    }
  } catch (error) {
    console.error("[GameService] Error fetching game:", error);
    return null;
  }
}

/**
 * Delete game
 * @param gameId - Game ID to delete
 * @returns true if successful, false otherwise
 */
export async function deleteGame(gameId: number): Promise<boolean> {
  try {
    if (Platform.OS === "web") {
      await apiFetch(`/api/games/${gameId}`, { method: "DELETE" });
      return true;
    } else {
      const { execute } = await import("@/lib/db-expo");
      await execute("DELETE FROM games WHERE id = ?", [gameId]);
      return true;
    }
  } catch (error) {
    console.error("[GameService] Error deleting game:", error);
    return false;
  }
}

/**
 * End game (mark as completed)
 * @param gameId - Game ID to end
 * @param finalScore - Final score
 * @returns true if successful, false otherwise
 */
export async function endGame(gameId: number, finalScore: number, timeElapsed?: number): Promise<boolean> {

  try {
    if (Platform.OS === "web") {
      await apiFetch(`/api/games/${gameId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score: finalScore, isCompleted: true, timeElapsed }),
      });
      return true;
    } else {
      const { execute, query } = await import("@/lib/db-expo");

      const updated_at = Date.now();
      const sql = timeElapsed !== undefined
        ? "UPDATE games SET is_completed = 1, score = ?, time_elapsed = ?, updated_at = ? WHERE id = ?"
        : "UPDATE games SET is_completed = 1, score = ?, updated_at = ? WHERE id = ?";
      const params = timeElapsed !== undefined
        ? [finalScore, timeElapsed, updated_at, gameId]
        : [finalScore, updated_at, gameId];

      await execute(sql, params);
      return true;
    }
  } catch (error) {
    console.error('❌ [GameService] Error ending game:', error);
    console.error('❌ [GameService] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return false;
  }
}

/**
 * Cheat - Spawn a specific tile value (debug/testing feature)
 * @param gameId - Game ID
 * @param value - Tile value to spawn
 * @returns Updated game state or null on error
 */
export async function cheatGame(gameId: number, value: number): Promise<any | null> {
  try {
    if (Platform.OS === "web") {
      const response = await apiFetch<any>(`/api/games/${gameId}/cheat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value }),
      });
      return response;
    } else {
      const { execute, query } = await import("@/lib/db-expo");

      // Get current game
      const games = await query<any>(
        `SELECT id, player_id as playerId, difficulty, grid_size as gridSize, score,
                time_elapsed as timeElapsed, game_state as gameState, is_completed as isCompleted,
                created_at as createdAt, updated_at as updatedAt, last_move_at as lastMoveAt
         FROM games WHERE id = ?`,
        [gameId]
      );
      if (!games[0]) {
        throw new Error("Game not found");
      }

      const game = {
        ...games[0],
        isCompleted: (Number(games[0].isCompleted) === 1),
      };
      if (game.isCompleted) {
        throw new Error("Game is already completed");
      }

      // Parse game state
      let gameState: GameState;
      try {
        gameState = JSON.parse(game.gameState as string) as GameState;
      } catch (parseError) {
        console.error('[GameService] Failed to parse game state:', parseError);
        throw new Error('Invalid game state data');
      }

      // Find empty position
      const emptyPositions: [number, number][] = [];
      for (let r = 0; r < gameState.grid.length; r++) {
        for (let c = 0; c < gameState.grid[r].length; c++) {
          if (!gameState.grid[r][c]) {
            emptyPositions.push([r, c]);
          }
        }
      }

      if (emptyPositions.length === 0) {
        throw new Error("No empty positions available");
      }

      // Place tile
      const firstEmpty = emptyPositions[0];
      if (!firstEmpty) {
        throw new Error("No empty position available");
      }
      const [row, col] = firstEmpty;
      // Import generateTileId from game-logic
      const { generateTileId } = await import("@/lib/game-logic");
      gameState.grid[row][col] = {
        value,
        id: generateTileId(),
      };

      // Update game
      await execute(
        "UPDATE games SET game_state = ?, updated_at = ? WHERE id = ?",
        [JSON.stringify(gameState), Date.now(), gameId]
      );

      return {
        game_id: gameId,
        player_id: game.player_id,
        game_state: gameState,
        message: `Cheat tile ${value} spawned at [${row}, ${col}]`,
      };
    }
  } catch (error) {
    console.error("[GameService] Error cheating game:", error);
    return null;
  }
}

/**
 * Get player's personal best scores for each difficulty
 * @param playerId - Player ID
 * @returns Object with easy and hard best scores
 */
export async function getPersonalBest(playerId: number): Promise<{ easy: number; hard: number }> {
  try {
    if (Platform.OS === "web") {
      const response = await apiFetch<{ best: { easy: number; hard: number } }>(
        `/api/players/${playerId}/best`
      );
      return response.best || { easy: 0, hard: 0 };
    } else {
      const { query } = await import("@/lib/db-expo");

      // Get best score for easy difficulty
      const easyResults = await query<{ score: number }>(
        `SELECT MAX(score) as score FROM games WHERE player_id = ? AND difficulty = 'easy' AND is_completed = 1`,
        [playerId]
      );

      // Get best score for hard difficulty
      const hardResults = await query<{ score: number }>(
        `SELECT MAX(score) as score FROM games WHERE player_id = ? AND difficulty = 'hard' AND is_completed = 1`,
        [playerId]
      );

      const easy = easyResults[0]?.score || 0;
      const hard = hardResults[0]?.score || 0;


      return { easy, hard };
    }
  } catch (error) {
    console.error("[GameService] Error fetching personal best:", error);
    return { easy: 0, hard: 0 };
  }
}

/**
 * Get personal best score for a specific game mode
 * @param playerId - Player ID
 * @param difficulty - Game difficulty ('easy' or 'hard')
 * @param gridSize - Grid size (3, 4, or 5)
 * @returns Personal best score for the specific mode
 */
export async function getPersonalBestByMode(
  playerId: number,
  difficulty: 'easy' | 'hard',
  gridSize: 3 | 4 | 5
): Promise<number> {
  try {
    if (Platform.OS === "web") {
      const response = await apiFetch<{ best: number }>(
        `/api/players/${playerId}/best?difficulty=${difficulty}&gridSize=${gridSize}`
      );
      return response.best || 0;
    } else {
      const { query } = await import("@/lib/db-expo");

      const results = await query<{ score: number }>(
        `SELECT MAX(score) as score FROM games WHERE player_id = ? AND difficulty = ? AND grid_size = ? AND is_completed = 1`,
        [playerId, difficulty, gridSize]
      );

      const best = results[0]?.score || 0;

      return best;
    }
  } catch (error) {
    console.error("[GameService] Error fetching personal best by mode:", error);
    return 0;
  }
}
