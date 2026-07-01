/**
 * Add Haptic Support Migration
 * Version: 1.1.0
 *
 * This migration adds haptic feedback support to the settings table.
 * It adds the haptic_enabled column to control vibration/haptic feedback.
 *
 * Changes:
 * - Add haptic_enabled column to settings table (default: true/1)
 */

import { registerMigration } from './migration-system';

registerMigration({
  version: '1.1.0',
  description: 'Add haptic_enabled column to settings table',
  critical: false,

  up: [
    // Add haptic_enabled column to settings table
    // Using ALTER TABLE to add the column with a default value
    `ALTER TABLE settings ADD COLUMN haptic_enabled INTEGER DEFAULT 1`,
  ],

  down: [
    // Rollback - SQLite doesn't support dropping columns directly
    // We would need to recreate the table, but for simplicity
    // we'll just note that this migration cannot be easily rolled back
    // In production, you would recreate the table without the column
    //
    // Example rollback (if needed):
    // 1. CREATE TABLE settings_backup AS SELECT all columns except haptic_enabled FROM settings
    // 2. DROP TABLE settings
    // 3. CREATE TABLE settings (without haptic_enabled)
    // 4. INSERT INTO settings SELECT * FROM settings_backup
    // 5. DROP TABLE settings_backup
  ],
});
