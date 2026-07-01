/**
 * Add Debug Feature Migration
 * Version: 1.3.0
 *
 * This migration adds debug feature support to the settings table.
 * It adds the debug_enabled column to control the debug tools display.
 *
 * Changes:
 * - Add debug_enabled column to settings table (default: false/0)
 */

import { registerMigration } from './migration-system';

registerMigration({
  version: '1.3.0',
  description: 'Add debug_enabled column to settings table',
  critical: false,

  up: [
    // Add debug_enabled column to settings table
    // Using ALTER TABLE to add the column with a default value
    `ALTER TABLE settings ADD COLUMN debug_enabled INTEGER DEFAULT 0`,
  ],

  down: [
    // Rollback - SQLite doesn't support dropping columns directly
    // For production, you would recreate the table without the column
  ],
});
