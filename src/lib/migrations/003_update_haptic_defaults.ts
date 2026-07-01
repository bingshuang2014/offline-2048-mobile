/**
 * Update Haptic Defaults Migration
 * Version: 1.2.0
 *
 * This migration updates existing settings records to have proper haptic_enabled values.
 * For any records where haptic_enabled is NULL, set it to 1 (enabled).
 */

import { registerMigration } from './migration-system';

registerMigration({
  version: '1.2.0',
  description: 'Update NULL haptic_enabled values to default (1)',
  critical: false,

  up: [
    // Update all NULL haptic_enabled values to 1 (enabled)
    `UPDATE settings SET haptic_enabled = 1 WHERE haptic_enabled IS NULL`,
  ],

  down: [
    // Rollback - set haptic_enabled back to NULL (not recommended, but possible)
    `UPDATE settings SET haptic_enabled = NULL WHERE haptic_enabled = 1`,
  ],
});
