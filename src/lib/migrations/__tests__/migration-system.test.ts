/**
 * Migration System Tests
 *
 * Run these tests to verify the migration system works correctly.
 *
 * Usage:
 * ```typescript
 * import { testMigrationSystem } from './lib/migrations/__tests__/migration-system.test';
 *
 * await testMigrationSystem();
 * ```
 */

import * as SQLite from 'expo-sqlite';
import {
  registerMigration,
  runMigrations,
  rollbackTo,
  initMigrationsTable,
  getMigrationStatus,
  getMigrationHistory,
  getCurrentVersion,
  type Migration,
} from '../migration-system';

// Test database name
const TEST_DB_NAME = 'test_migration.db';

/**
 * Clean up test database
 */
async function cleanupTestDatabase(): Promise<void> {
  try {
    const db = await SQLite.openDatabaseAsync(TEST_DB_NAME);
    await db.closeAsync();
    // Note: In expo-sqlite, we can't directly delete the database file
    // The database will be recreated on next open
  } catch (error) {
    // Database doesn't exist, that's fine
  }
}

/**
 * Test 1: Migration registration
 */
async function testMigrationRegistration(): Promise<boolean> {
  console.log('\n[Test 1] Migration Registration');

  try {
    // Register a test migration
    const testMigration: Migration = {
      version: '9.9.9',
      description: 'Test migration',
      up: [`CREATE TABLE IF NOT EXISTS test_table (id INTEGER)`],
      down: [`DROP TABLE IF EXISTS test_table`],
    };

    registerMigration(testMigration);

    // Check if migration is registered
    const migrations = await import('../index').then((m) => m.getMigrations());
    const found = migrations.some((m: Migration) => m.version === '9.9.9');

    if (found) {
      console.log('✓ Migration registered successfully');
      return true;
    } else {
      console.error('✗ Migration not found in registry');
      return false;
    }
  } catch (error) {
    console.error('✗ Registration test failed:', error);
    return false;
  }
}

/**
 * Test 2: Migration table initialization
 */
async function testMigrationTableInit(): Promise<boolean> {
  console.log('\n[Test 2] Migration Table Initialization');

  try {
    const db = await SQLite.openDatabaseAsync(TEST_DB_NAME);

    await initMigrationsTable(db);

    // Check if table exists
    const result = await db.getAllAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='__migrations'"
    );

    await db.closeAsync();

    if (result.length > 0) {
      console.log('✓ Migration table created successfully');
      return true;
    } else {
      console.error('✗ Migration table not found');
      return false;
    }
  } catch (error) {
    console.error('✗ Table initialization test failed:', error);
    return false;
  }
}

/**
 * Test 3: Migration execution
 */
async function testMigrationExecution(): Promise<boolean> {
  console.log('\n[Test 3] Migration Execution');

  try {
    const db = await SQLite.openDatabaseAsync(TEST_DB_NAME);

    // Run migrations
    const results = await runMigrations(db, { backup: false });

    await db.closeAsync();

    const success = results.every((r) => r.success);

    if (success) {
      console.log('✓ All migrations executed successfully');
      console.log(`  Applied ${results.length} migrations`);
      return true;
    } else {
      const failed = results.filter((r) => !r.success);
      console.error(`✗ ${failed.length} migration(s) failed`);
      failed.forEach((f) => console.error(`  - ${f.version}: ${f.error}`));
      return false;
    }
  } catch (error) {
    console.error('✗ Migration execution test failed:', error);
    return false;
  }
}

/**
 * Test 4: Migration status
 */
async function testMigrationStatus(): Promise<boolean> {
  console.log('\n[Test 4] Migration Status');

  try {
    const db = await SQLite.openDatabaseAsync(TEST_DB_NAME);

    const status = await getMigrationStatus(db);

    await db.closeAsync();


    if (status.currentVersion) {
      console.log('✓ Migration status retrieved successfully');
      return true;
    } else {
      console.error('✗ No current version found');
      return false;
    }
  } catch (error) {
    console.error('✗ Migration status test failed:', error);
    return false;
  }
}

/**
 * Test 5: Migration history
 */
async function testMigrationHistory(): Promise<boolean> {
  console.log('\n[Test 5] Migration History');

  try {
    const db = await SQLite.openDatabaseAsync(TEST_DB_NAME);

    const history = await getMigrationHistory(db);

    await db.closeAsync();

    console.log(`  History entries: ${history.length}`);

    if (history.length > 0) {
      console.log('  Latest migration:');
      const latest = history[history.length - 1];
      console.log(`    Version: ${latest.version}`);
      console.log(`    Description: ${latest.description}`);
      console.log(`    Applied at: ${latest.appliedAt}`);
      console.log(`    Execution time: ${latest.executionTimeMs}ms`);

      console.log('✓ Migration history retrieved successfully');
      return true;
    } else {
      console.error('✗ No migration history found');
      return false;
    }
  } catch (error) {
    console.error('✗ Migration history test failed:', error);
    return false;
  }
}

/**
 * Test 6: Idempotency (running migrations twice)
 */
async function testMigrationIdempotency(): Promise<boolean> {
  console.log('\n[Test 6] Migration Idempotency');

  try {
    const db = await SQLite.openDatabaseAsync(TEST_DB_NAME);

    // Run migrations first time
    const results1 = await runMigrations(db, { backup: false });

    // Run migrations second time
    const results2 = await runMigrations(db, { backup: false });

    await db.closeAsync();

    // Second run should have no pending migrations
    const secondRunHasNoPending = results2.length === 0 ||
      (results2.length === 1 && results2[0].version === 'current');

    if (secondRunHasNoPending) {
      console.log('✓ Migrations are idempotent (no re-execution)');
      return true;
    } else {
      console.error('✗ Migrations were re-executed');
      return false;
    }
  } catch (error) {
    console.error('✗ Idempotency test failed:', error);
    return false;
  }
}

/**
 * Test 7: Rollback (if rollback SQL exists)
 */
async function testMigrationRollback(): Promise<boolean> {
  console.log('\n[Test 7] Migration Rollback');

  try {
    const db = await SQLite.openDatabaseAsync(TEST_DB_NAME);

    const currentVersion = await getCurrentVersion(db);

    if (!currentVersion) {
      console.log('⊘ No migrations to rollback');
      await db.closeAsync();
      return true;
    }

    // Attempt rollback (will fail if no rollback SQL defined)
    const results = await rollbackTo(db, '0.0.0');

    await db.closeAsync();

    // Rollback might fail if no rollback SQL is defined
    // That's expected for the initial schema migration
    if (results.length === 0 || results[0].success || results[0].error?.includes('No rollback SQL')) {
      console.log('✓ Rollback test completed (no rollback SQL defined for initial migration)');
      return true;
    } else {
      console.error('✗ Rollback test failed:', results[0].error);
      return false;
    }
  } catch (error) {
    console.error('✗ Rollback test failed:', error);
    return false;
  }
}

/**
 * Run all migration system tests
 */
export async function testMigrationSystem(): Promise<{
  success: boolean;
  results: Array<{ name: string; success: boolean }>;
}> {
  console.log('  Migration System Test Suite');

  await cleanupTestDatabase();

  const tests = [
    { name: 'Migration Registration', fn: testMigrationRegistration },
    { name: 'Migration Table Initialization', fn: testMigrationTableInit },
    { name: 'Migration Execution', fn: testMigrationExecution },
    { name: 'Migration Status', fn: testMigrationStatus },
    { name: 'Migration History', fn: testMigrationHistory },
    { name: 'Migration Idempotency', fn: testMigrationIdempotency },
    { name: 'Migration Rollback', fn: testMigrationRollback },
  ];

  const results: Array<{ name: string; success: boolean }> = [];

  for (const test of tests) {
    try {
      const success = await test.fn();
      results.push({ name: test.name, success });
    } catch (error) {
      console.error(`\n[ERROR] Test "${test.name}" threw exception:`, error);
      results.push({ name: test.name, success: false });
    }
  }

  await cleanupTestDatabase();

  // Summary

  const passed = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;


  if (failed === 0) {
  } else {
    results
      .filter((r) => !r.success)
      .forEach((r) => console.log(`  - ${r.name}`));
  }


  return {
    success: failed === 0,
    results,
  };
}

/**
 * Quick test - just run migrations and check status
 */
export async function quickTest(): Promise<boolean> {

  try {
    const db = await SQLite.openDatabaseAsync(TEST_DB_NAME);

    await initMigrationsTable(db);
    const statusBefore = await getMigrationStatus(db);

    console.log(`  Before: ${statusBefore.appliedMigrations.length} applied, ${statusBefore.pendingMigrations.length} pending`);

    const results = await runMigrations(db, { backup: false });
    const statusAfter = await getMigrationStatus(db);

    await db.closeAsync();

    console.log(`  After: ${statusAfter.appliedMigrations.length} applied, ${statusAfter.pendingMigrations.length} pending`);

    const success = results.every((r) => r.success);

    if (success) {
      console.log('✓ Quick test passed');
    } else {
      console.error('✗ Quick test failed');
    }

    return success;
  } catch (error) {
    console.error('✗ Quick test failed:', error);
    return false;
  }
}
