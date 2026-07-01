/**
 * Consolidated type definitions for the 2048 game
 * Exports all TypeScript types from schema and game logic
 */

// Import types first
import type { Direction, Difficulty, GridSize, Tile, GameState } from "../lib/game-logic";
import type {
  Player,
  Game,
  Setting,
  ZodiacAvatar,
  NewPlayer,
  NewGame,
  NewSetting,
  NewZodiacAvatar,
} from "../lib/schema";

// Re-export database types
export type {
  Player,
  Game,
  Setting,
  ZodiacAvatar,
  NewPlayer,
  NewGame,
  NewSetting,
  NewZodiacAvatar,
};

// Re-export game logic types
export type { Direction, Difficulty, GridSize, Tile, GameState };

// Re-export commonly used types with aliases for clarity
export type GameHistory = Game; // Alias for clarity
export type GameSettings = Setting; // Alias for clarity
