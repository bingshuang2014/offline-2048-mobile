/**
 * Migration Registry
 *
 * This file imports and registers all database migrations.
 * Migrations are automatically registered when this module is imported.
 *
 * To add a new migration:
 * 1. Create a new file in the migrations directory (e.g., 002_add_feature.ts)
 * 2. Import it in this file
 * 3. The migration will be automatically registered
 *
 * Migration file naming convention:
 * - Use three-digit prefix: 001_, 002_, 003_, etc.
 * - Follow with descriptive name: add_users_table, add_indexes, etc.
 * - Example: 002_add_haptic_support.ts
 */

// Import all migrations (they auto-register themselves)
import './001_initial_schema';
import './002_add_haptic_support';
import './003_update_haptic_defaults';
import './004_add_debug_feature';
// Future migrations:
// import './005_add_game_statistics';
// import './006_add_achievement_system';

// Export migration system API
export {
  registerMigration,
  getMigrations,
  runMigrations,
  rollbackTo,
  getMigrationStatus,
  getMigrationHistory,
  getCurrentVersion,
  initMigrationsTable,
} from './migration-system';

export type { Migration, MigrationResult, MigrationStatus } from './migration-system';
