/**
 * Migration Runner
 *
 * This module provides a convenient interface to run database migrations
 * during app initialization. It handles:
 *
 * - Automatic migration on app startup
 * - Error handling and logging
 * - User notifications for critical migrations
 * - Progress tracking
 *
 * Usage:
 * ```typescript
 * import { migrateDatabase } from './lib/migrations/runner';
 *
 * // In your app initialization:
 * await migrateDatabase();
 * ```
 */

import * as SQLite from 'expo-sqlite';
import {
  runMigrations,
  getMigrationStatus,
  getMigrationHistory,
  initMigrationsTable,
  type MigrationResult,
} from './index';

// ============================================================================
// Configuration
// ============================================================================

const MIGRATION_CONFIG = {
  /** Automatically run migrations on startup */
  autoRun: true,

  /** Create backup before critical migrations */
  createBackups: true,

  /** Show migration progress in console */
  verbose: true,

  /** Notify user about migrations (for critical changes) */
  notifyUser: false,
};

// ============================================================================
// Migration Runner
// ============================================================================

/**
 * Initialize and run database migrations
 *
 * This function should be called during app initialization, before any
 * database operations are performed.
 *
 * @param dbName Database name (default: 'game2048.db')
 * @returns Migration results
 */
export async function migrateDatabase(dbName: string = 'game2048.db'): Promise<{
  success: boolean;
  results: MigrationResult[];
  currentVersion: string | null;
}> {
  try {
    // Open database connection
    const db = await SQLite.openDatabaseAsync(dbName);

    if (MIGRATION_CONFIG.verbose) {
    }

    // Initialize migrations table
    await initMigrationsTable(db);

    // Get current status
    const status = await getMigrationStatus(db);

    if (MIGRATION_CONFIG.verbose) {
    }

    // Run migrations
    const results = await runMigrations(db, {
      backup: MIGRATION_CONFIG.createBackups,
      onProgress: (version, description) => {
        if (MIGRATION_CONFIG.verbose) {
        }
      },
    });

    // Close database connection
    await db.closeAsync();

    // Check if all migrations succeeded
    const allSuccessful = results.every((r) => r.success);

    if (MIGRATION_CONFIG.verbose) {
      if (allSuccessful) {
      } else {
        console.error('[MigrationRunner] ✗ Some migrations failed');
      }
    }

    // Reuse the same database connection for final status check
    const finalDb = await SQLite.openDatabaseAsync(dbName);
    const finalStatus = await getMigrationStatus(finalDb);
    await finalDb.closeAsync();

    return {
      success: allSuccessful,
      results,
      currentVersion: finalStatus.currentVersion,
    };
  } catch (error) {
    console.error('[MigrationRunner] Migration failed:', error);

    return {
      success: false,
      results: [{
        success: false,
        version: 'error',
        message: 'Migration runner failed',
        error: error instanceof Error ? error.message : String(error),
      }],
      currentVersion: null,
    };
  }
}

/**
 * Get current migration status without running migrations
 *
 * @param dbName Database name (default: 'game2048.db')
 * @returns Migration status
 */
export async function getDatabaseMigrationStatus(dbName: string = 'game2048.db'): Promise<{
  currentVersion: string | null;
  pendingMigrations: string[];
  appliedMigrations: string[];
  history: Array<{
    version: string;
    description: string;
    appliedAt: string;
    executionTimeMs: number;
  }>;
}> {
  try {
    const db = await SQLite.openDatabaseAsync(dbName);

    const status = await getMigrationStatus(db);
    const history = await getMigrationHistory(db);

    await db.closeAsync();

    return {
      currentVersion: status.currentVersion,
      pendingMigrations: status.pendingMigrations,
      appliedMigrations: status.appliedMigrations,
      history,
    };
  } catch (error) {
    console.error('[MigrationRunner] Failed to get migration status:', error);

    return {
      currentVersion: null,
      pendingMigrations: [],
      appliedMigrations: [],
      history: [],
    };
  }
}

/**
 * Force re-run all migrations (DEVELOPMENT ONLY)
 *
 * ⚠️ WARNING: This will drop all tables and recreate the database.
 * All data will be lost!
 *
 * @param dbName Database name (default: 'game2048.db')
 */
export async function resetDatabase(dbName: string = 'game2048.db'): Promise<void> {
  console.warn('[MigrationRunner] ⚠️  RESETTING DATABASE - ALL DATA WILL BE LOST');

  const db = await SQLite.openDatabaseAsync(dbName);

  // Drop migrations table
  await db.execAsync('DROP TABLE IF EXISTS __migrations');

  // Drop all tables
  await db.execAsync(`
    DROP INDEX IF EXISTS idx_games_created_at;
    DROP INDEX IF EXISTS idx_games_score;
    DROP INDEX IF EXISTS idx_games_difficulty;
    DROP INDEX IF EXISTS idx_games_player_id;
    DROP TABLE IF EXISTS active_player;
    DROP TABLE IF EXISTS zodiac_avatars;
    DROP TABLE IF EXISTS settings;
    DROP TABLE IF EXISTS games;
    DROP TABLE IF EXISTS players;
  `);

  await db.closeAsync();

  // Re-run migrations
  await migrateDatabase(dbName);

}

// ============================================================================
// Development Helpers
// ============================================================================

/**
 * Log migration history for debugging
 */
export async function debugMigrationHistory(dbName: string = 'game2048.db'): Promise<void> {
  const status = await getDatabaseMigrationStatus(dbName);




}
