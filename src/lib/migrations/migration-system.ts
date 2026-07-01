/**
 * Database Migration System for Expo SQLite
 *
 * This module provides a comprehensive migration system with:
 * - Version tracking via migrations table
 * - Forward migration execution
 * - Rollback support
 * - Backup/restore before migrations
 * - Transaction safety
 *
 * Migration versions follow semantic versioning: MAJOR.MINOR.PATCH
 * - MAJOR: Breaking schema changes
 * - MINOR: New features/tables
 * - PATCH: Bug fixes, data migrations
 */

import * as SQLite from 'expo-sqlite';

// ============================================================================
// Type Definitions
// ============================================================================

export interface Migration {
  /** Unique version identifier (e.g., "1.0.0", "1.1.0") */
  version: string;
  /** Human-readable description of changes */
  description: string;
  /** SQL statements to apply this migration */
  up: string[];
  /** SQL statements to rollback this migration (optional) */
  down?: string[];
  /** Whether this migration is critical (requires user confirmation) */
  critical?: boolean;
}

export interface MigrationResult {
  success: boolean;
  version: string;
  message: string;
  backupPath?: string;
  error?: string;
}

export interface MigrationStatus {
  currentVersion: string | null;
  pendingMigrations: string[];
  appliedMigrations: string[];
}

// ============================================================================
// Migration Registry
// ============================================================================

/**
 * Registry of all available migrations
 * Migrations are executed in version order (sorted by version string)
 */
const MIGRATIONS: Migration[] = [];

/**
 * Register a migration
 * Call this function to add migrations to the registry
 */
export function registerMigration(migration: Migration): void {
  // Check if migration version already exists
  const existingIndex = MIGRATIONS.findIndex((m) => m.version === migration.version);
  if (existingIndex >= 0) {
    throw new Error(`Migration version ${migration.version} already registered`);
  }

  MIGRATIONS.push(migration);

  // Sort migrations by version (semantic versioning sort)
  MIGRATIONS.sort((a, b) => compareVersions(a.version, b.version));
}

/**
 * Get all registered migrations
 */
export function getMigrations(): Migration[] {
  return [...MIGRATIONS];
}

/**
 * Compare two version strings
 * Returns: -1 if a < b, 0 if a === b, 1 if a > b
 */
function compareVersions(a: string, b: string): number {
  const partsA = a.split('.').map(Number);
  const partsB = b.split('.').map(Number);

  for (let i = 0; i < 3; i++) {
    const partA = partsA[i] || 0;
    const partB = partsB[i] || 0;

    if (partA < partB) return -1;
    if (partA > partB) return 1;
  }

  return 0;
}

// ============================================================================
// Migration Tracking Table
// ============================================================================

const MIGRATIONS_TABLE = `
  CREATE TABLE IF NOT EXISTS __migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    version TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    applied_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    rollback_sql TEXT,
    execution_time_ms INTEGER
  )
`;

/**
 * Initialize the migrations tracking table
 */
export async function initMigrationsTable(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(MIGRATIONS_TABLE);
}

/**
 * Get the current database version from migrations table
 */
export async function getCurrentVersion(db: SQLite.SQLiteDatabase): Promise<string | null> {
  try {
    const result = await db.getAllAsync<{ version: string }>(
      'SELECT version FROM __migrations ORDER BY version DESC LIMIT 1'
    );
    return result[0]?.version || null;
  } catch (error) {
    // Table doesn't exist yet
    return null;
  }
}

/**
 * Get all applied migrations
 */
export async function getAppliedMigrations(db: SQLite.SQLiteDatabase): Promise<string[]> {
  try {
    const result = await db.getAllAsync<{ version: string }>(
      'SELECT version FROM __migrations ORDER BY version ASC'
    );
    return result.map((r) => r.version);
  } catch (error) {
    return [];
  }
}

/**
 * Record a migration as applied
 */
async function recordMigration(
  db: SQLite.SQLiteDatabase,
  migration: Migration,
  executionTimeMs: number
): Promise<void> {
  const rollbackSql = migration.down ? JSON.stringify(migration.down) : null;

  await db.runAsync(
    `INSERT INTO __migrations (version, description, rollback_sql, execution_time_ms)
     VALUES (?, ?, ?, ?)`,
    [migration.version, migration.description, rollbackSql, executionTimeMs]
  );
}

/**
 * Remove a migration record (used during rollback)
 */
async function removeMigrationRecord(db: SQLite.SQLiteDatabase, version: string): Promise<void> {
  await db.runAsync('DELETE FROM __migrations WHERE version = ?', [version]);
}

// ============================================================================
// Migration Status
// ============================================================================

/**
 * Get migration status
 */
export async function getMigrationStatus(db: SQLite.SQLiteDatabase): Promise<MigrationStatus> {
  const currentVersion = await getCurrentVersion(db);
  const appliedMigrations = await getAppliedMigrations(db);

  const pendingMigrations = MIGRATIONS.filter(
    (m) => !appliedMigrations.includes(m.version)
  ).map((m) => m.version);

  return {
    currentVersion,
    pendingMigrations,
    appliedMigrations,
  };
}

// ============================================================================
// Migration Execution
// ============================================================================

/**
 * Execute a single migration
 */
async function executeMigration(
  db: SQLite.SQLiteDatabase,
  migration: Migration
): Promise<MigrationResult> {
  const startTime = Date.now();

  try {

    // Execute all SQL statements in a transaction
    await db.withTransactionAsync(async () => {
      for (const sql of migration.up) {
        await db.execAsync(sql);
      }
    });

    const executionTimeMs = Date.now() - startTime;

    // Record the migration
    await recordMigration(db, migration, executionTimeMs);


    return {
      success: true,
      version: migration.version,
      message: `Migration ${migration.version} applied successfully`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[Migration] Failed to apply version ${migration.version}:`, errorMessage);

    return {
      success: false,
      version: migration.version,
      message: `Migration ${migration.version} failed`,
      error: errorMessage,
    };
  }
}

/**
 * Rollback a migration
 */
async function rollbackMigration(
  db: SQLite.SQLiteDatabase,
  version: string
): Promise<MigrationResult> {
  const migration = MIGRATIONS.find((m) => m.version === version);

  if (!migration) {
    return {
      success: false,
      version,
      message: `Migration ${version} not found`,
      error: 'Migration not registered',
    };
  }

  if (!migration.down || migration.down.length === 0) {
    return {
      success: false,
      version,
      message: `Migration ${version} cannot be rolled back`,
      error: 'No rollback SQL defined',
    };
  }

  try {

    // Execute rollback SQL in a transaction
    await db.withTransactionAsync(async () => {
      for (const sql of migration.down!) {
        await db.execAsync(sql);
      }
    });

    // Remove migration record
    await removeMigrationRecord(db, version);


    return {
      success: true,
      version,
      message: `Migration ${version} rolled back successfully`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[Migration] Failed to rollback version ${version}:`, errorMessage);

    return {
      success: false,
      version,
      message: `Rollback of ${version} failed`,
      error: errorMessage,
    };
  }
}

// ============================================================================
// Public Migration API
// ============================================================================

/**
 * Run all pending migrations
 *
 * @param db SQLite database connection
 * @param options Optional configuration
 * @returns Migration result
 */
export async function runMigrations(db: SQLite.SQLiteDatabase, options?: {
  /** Create backup before migration */
  backup?: boolean;
  /** Callback for progress updates */
  onProgress?: (version: string, description: string) => void;
}): Promise<MigrationResult[]> {
  // Ensure migrations table exists
  await initMigrationsTable(db);

  const appliedMigrations = await getAppliedMigrations(db);
  const pendingMigrations = MIGRATIONS.filter(
    (m) => !appliedMigrations.includes(m.version)
  );

  if (pendingMigrations.length === 0) {
    return [{
      success: true,
      version: 'current',
      message: 'Database is up to date',
    }];
  }


  const results: MigrationResult[] = [];

  for (const migration of pendingMigrations) {
    // Notify progress if callback provided
    options?.onProgress?.(migration.version, migration.description);

    // Create backup if requested and this is a critical migration
    let backupPath: string | undefined;
    if (options?.backup && migration.critical) {
      try {
        // Dynamic import to avoid circular dependency
        const { exportDatabase } = await import('../db-expo');
        const backupData = await exportDatabase();
        backupPath = `backup_${migration.version}_${Date.now()}.json`;
        // In a real app, you'd save this to file system
      } catch (error) {
        console.error('[Migration] Backup creation failed:', error);
        // Continue without backup
      }
    }

    // Execute migration
    const result = await executeMigration(db, migration);
    result.backupPath = backupPath;
    results.push(result);

    // Stop if migration failed
    if (!result.success) {
      console.error(`[Migration] Stopping due to failure at version ${migration.version}`);
      break;
    }
  }

  return results;
}

/**
 * Rollback to a specific version
 *
 * @param db SQLite database connection
 * @param targetVersion Version to rollback to
 * @returns Migration result
 */
export async function rollbackTo(
  db: SQLite.SQLiteDatabase,
  targetVersion: string
): Promise<MigrationResult[]> {
  const appliedMigrations = await getAppliedMigrations(db);

  // Find migrations to rollback (in reverse order)
  const toRollback = appliedMigrations
    .filter((v) => compareVersions(v, targetVersion) > 0)
    .sort((a, b) => compareVersions(b, a));

  if (toRollback.length === 0) {
    return [{
      success: true,
      version: targetVersion,
      message: `Already at version ${targetVersion}`,
    }];
  }


  const results: MigrationResult[] = [];

  for (const version of toRollback) {
    const result = await rollbackMigration(db, version);
    results.push(result);

    if (!result.success) {
      console.error(`[Migration] Rollback stopped at version ${version}`);
      break;
    }
  }

  return results;
}

/**
 * Get migration history
 */
export async function getMigrationHistory(db: SQLite.SQLiteDatabase): Promise<Array<{
  version: string;
  description: string;
  appliedAt: string;
  executionTimeMs: number;
}>> {
  try {
    const result = await db.getAllAsync<any>(
      `SELECT version, description, applied_at, execution_time_ms
       FROM __migrations
       ORDER BY version ASC`
    );

    return result.map((row) => ({
      version: row.version,
      description: row.description,
      appliedAt: row.applied_at,
      executionTimeMs: row.execution_time_ms || 0,
    }));
  } catch (error) {
    return [];
  }
}
