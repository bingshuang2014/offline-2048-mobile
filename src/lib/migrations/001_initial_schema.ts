/**
 * Initial Database Schema Migration
 * Version: 1.0.0
 *
 * This migration creates the initial database schema for the 2048 game app.
 * It creates all necessary tables, indexes, and inserts default data.
 *
 * Tables created:
 * - players: Player accounts with epitaph and avatar
 * - games: Game history and auto-save states
 * - settings: Player preferences and customization
 * - zodiac_avatars: 12 built-in zodiac cartoon avatars
 * - active_player: Tracks the currently active player
 */

import { registerMigration } from './migration-system';

registerMigration({
  version: '1.0.0',
  description: 'Initial database schema - create all tables and indexes',
  critical: true,

  up: [
    // Players table
    `CREATE TABLE IF NOT EXISTS players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      epitaph TEXT NOT NULL UNIQUE,
      avatar_id INTEGER NOT NULL CHECK (avatar_id BETWEEN 1 AND 12),
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    )`,

    // Games table
    `CREATE TABLE IF NOT EXISTS games (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id INTEGER NOT NULL,
      difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'hard')),
      grid_size INTEGER NOT NULL CHECK (grid_size IN (3, 4, 5)),
      score INTEGER NOT NULL DEFAULT 0,
      time_elapsed INTEGER NOT NULL DEFAULT 0,
      game_state TEXT NOT NULL,
      is_completed INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      last_move_at TEXT,
      FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
    )`,

    // Settings table
    `CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id INTEGER NOT NULL UNIQUE,
      theme TEXT CHECK (theme IN ('light', 'dark')),
      seasonal_theme TEXT CHECK (seasonal_theme IN ('spring', 'summer', 'autumn', 'winter')),
      custom_tile_colors TEXT,
      custom_background_color TEXT,
      custom_text_color TEXT,
      card_opacity INTEGER DEFAULT 100 CHECK (card_opacity BETWEEN 0 AND 100),
      sound_enabled INTEGER DEFAULT 1,
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
    )`,

    // Zodiac avatars table
    `CREATE TABLE IF NOT EXISTS zodiac_avatars (
      id INTEGER PRIMARY KEY CHECK (id BETWEEN 1 AND 12),
      name TEXT NOT NULL UNIQUE,
      image_path TEXT,
      is_builtin INTEGER DEFAULT 1
    )`,

    // Active player table (stores the currently active player)
    `CREATE TABLE IF NOT EXISTS active_player (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      player_id INTEGER NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
    )`,

    // Create indexes for better performance
    `CREATE INDEX IF NOT EXISTS idx_games_player_id ON games(player_id)`,
    `CREATE INDEX IF NOT EXISTS idx_games_difficulty ON games(difficulty)`,
    `CREATE INDEX IF NOT EXISTS idx_games_score ON games(score DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_games_created_at ON games(created_at DESC)`,

    // Insert default zodiac avatars
    `INSERT OR IGNORE INTO zodiac_avatars (id, name, image_path, is_builtin) VALUES
      (1, '鼠', '/zodiac/rat.png', 1),
      (2, '牛', '/zodiac/ox.png', 1),
      (3, '虎', '/zodiac/tiger.png', 1),
      (4, '兔', '/zodiac/rabbit.png', 1),
      (5, '龙', '/zodiac/dragon.png', 1),
      (6, '蛇', '/zodiac/snake.png', 1),
      (7, '马', '/zodiac/horse.png', 1),
      (8, '羊', '/zodiac/goat.png', 1),
      (9, '猴', '/zodiac/monkey.png', 1),
      (10, '鸡', '/zodiac/rooster.png', 1),
      (11, '狗', '/zodiac/dog.png', 1),
      (12, '猪', '/zodiac/pig.png', 1)
    `,
  ],

  down: [
    // Rollback SQL - drop all tables in reverse dependency order
    `DROP INDEX IF EXISTS idx_games_created_at`,
    `DROP INDEX IF EXISTS idx_games_score`,
    `DROP INDEX IF EXISTS idx_games_difficulty`,
    `DROP INDEX IF EXISTS idx_games_player_id`,
    `DROP TABLE IF EXISTS active_player`,
    `DROP TABLE IF EXISTS zodiac_avatars`,
    `DROP TABLE IF EXISTS settings`,
    `DROP TABLE IF EXISTS games`,
    `DROP TABLE IF EXISTS players`,
  ],
});
