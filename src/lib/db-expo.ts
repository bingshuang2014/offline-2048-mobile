/**
 * Expo SQLite database adapter for React Native
 * This module provides database operations using expo-sqlite
 */
/* eslint-disable no-console */

import * as SQLite from 'expo-sqlite';
import * as MigrationSystem from './migrations';

let db: SQLite.SQLiteDatabase | null = null;

/**
 * Initialize the SQLite connection
 */
export async function initSQLite(): Promise<void> {
  if (db) {
    return;
  } // Already initialized

  try {
    db = await SQLite.openDatabaseAsync('game2048.db');
  } catch (error) {
    console.error('[ExpoSQLite] ❌ Failed to initialize:', error);
    throw error;
  }
}

/**
 * Ensure database is initialized before operations
 */
async function ensureInitialized(): Promise<void> {
  if (!db) {
    await initSQLite();
  }
}

/**
 * Execute a SQL query that returns data (SELECT)
 */
export async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  await ensureInitialized();

  try {
    const result = await db!.getAllAsync(sql, params);
    return result as T[];
  } catch (error) {
    console.error('[ExpoSQLite] Query failed:', sql, error);
    throw error;
  }
}

/**
 * Execute a SQL query that modifies data (INSERT, UPDATE, DELETE)
 */
export async function execute(sql: string, params: any[] = []): Promise<number> {
  await ensureInitialized();

  try {
    await db!.runAsync(sql, params);
    // For INSERT, return the lastInsertId
    if (sql.trim().toUpperCase().startsWith('INSERT')) {
      const result = await query<{ last_insert_rowid: number }>(
        'SELECT last_insert_rowid() as last_insert_rowid'
      );
      const insertId = result[0]?.last_insert_rowid || 0;
      return insertId;
    }
    // For other operations, return changes count (not directly available in expo-sqlite)
    return 1;
  } catch (error) {
    console.error('[ExpoSQLite] Execute failed:', sql, 'params:', params, 'error:', error);
    throw error;
  }
}

/**
 * Execute multiple SQL statements in a transaction
 */
export async function executeTransaction(
  queries: Array<{ sql: string; params?: any[] }>
): Promise<void> {
  await ensureInitialized();

  try {
    await db!.withTransactionAsync(async () => {
      for (const query of queries) {
        await db!.runAsync(query.sql, query.params || []);
      }
    });
  } catch (error) {
    console.error('[ExpoSQLite] Transaction failed:', error);
    throw error;
  }
}

/**
 * Get the last inserted row ID
 */
export async function lastInsertId(): Promise<number> {
  await ensureInitialized();

  try {
    const result = await query<{ last_insert_rowid: number }>(
      "SELECT last_insert_rowid() as last_insert_rowid"
    );
    return result[0]?.last_insert_rowid || 0;
  } catch (error) {
    console.error('[ExpoSQLite] Failed to get last insert ID:', error);
    return 0;
  }
}

/**
 * Close the database connection
 */
export async function closeDatabase(): Promise<void> {
  if (db) {
    try {
      await db!.closeAsync();
      db = null;
    } catch (error) {
      console.error('[ExpoSQLite] Failed to close database:', error);
    }
  }
}

/**
 * Initialize database schema using migration system
 *
 * This function runs all pending database migrations to ensure the schema
 * is up to date. Migrations are tracked in the __migrations table.
 */
export async function initSchema(): Promise<void> {
  await ensureInitialized();

  try {
    const { runMigrations, initMigrationsTable, getMigrationStatus } = MigrationSystem;

    // Initialize migrations tracking table
    await initMigrationsTable(db!);

    // Check current migration status
    const status = await getMigrationStatus(db!);

    if (status.pendingMigrations.length > 0) {
    }

    // Run all pending migrations
    const results = await runMigrations(db!, {
      backup: true, // Create backup before critical migrations
      onProgress: (version, description) => {
      },
    });

    // Check results
    const allSuccessful = results.every((r) => r.success);

    if (allSuccessful) {
      const finalStatus = await getMigrationStatus(db!);
    } else {
      const failed = results.filter((r) => !r.success);
      console.error('[ExpoSQLite] ❌ Some migrations failed:', failed);
      throw new Error(`Migration failed: ${failed[0]?.error}`);
    }
  } catch (error) {
    console.error('[ExpoSQLite] ❌ Schema initialization failed:', error);
    throw error;
  }
}

/**
 * Insert default zodiac avatars
 */
async function insertDefaultZodiacAvatars(): Promise<void> {
  const avatars = [
    { id: 1, name: '鼠', image_path: '/zodiac/rat.png' },
    { id: 2, name: '牛', image_path: '/zodiac/ox.png' },
    { id: 3, name: '虎', image_path: '/zodiac/tiger.png' },
    { id: 4, name: '兔', image_path: '/zodiac/rabbit.png' },
    { id: 5, name: '龙', image_path: '/zodiac/dragon.png' },
    { id: 6, name: '蛇', image_path: '/zodiac/snake.png' },
    { id: 7, name: '马', image_path: '/zodiac/horse.png' },
    { id: 8, name: '羊', image_path: '/zodiac/goat.png' },
    { id: 9, name: '猴', image_path: '/zodiac/monkey.png' },
    { id: 10, name: '鸡', image_path: '/zodiac/rooster.png' },
    { id: 11, name: '狗', image_path: '/zodiac/dog.png' },
    { id: 12, name: '猪', image_path: '/zodiac/pig.png' },
  ];

  for (const avatar of avatars) {
    await execute(
      `INSERT OR IGNORE INTO zodiac_avatars (id, name, image_path, is_builtin) VALUES (?, ?, ?, 1)`,
      [avatar.id, avatar.name, avatar.image_path]
    );
  }

  // Insert test users if database is empty
  const testUsers = await query<{ count: number }>("SELECT COUNT(*) as count FROM players");
  if (testUsers[0]?.count === 0) {

    const now = Date.now();
    const dayInMs = 24 * 60 * 60 * 1000;

    await execute(
      `INSERT INTO players (epitaph, avatar_id, created_at) VALUES (?, ?, ?)`,
      ['小明', 1, now - (3 * dayInMs)] // 3天前
    );

    await execute(
      `INSERT INTO players (epitaph, avatar_id, created_at) VALUES (?, ?, ?)`,
      ['张三', 5, now - (7 * dayInMs)] // 7天前
    );

    await execute(
      `INSERT INTO players (epitaph, avatar_id, created_at) VALUES (?, ?, ?)`,
      ['李四', 9, now - (1 * dayInMs)] // 1天前
    );

  }
}

/**
 * Export database to JSON for backup
 */
export async function exportDatabase(): Promise<string> {
  await ensureInitialized();

  try {
    const tables = ['players', 'games', 'settings', 'zodiac_avatars', 'active_player'];
    const data: Record<string, any[]> = {};

    for (const table of tables) {
      const result = await query(`SELECT * FROM ${table}`);
      data[table] = result;
    }

    return JSON.stringify(data);
  } catch (error) {
    console.error('[ExpoSQLite] Export failed:', error);
    throw error;
  }
}

/**
 * Import database from JSON for restore
 */
export async function importDatabase(jsonData: string): Promise<void> {
  await ensureInitialized();

  try {
    const data = JSON.parse(jsonData);

    // Clear existing data
    await execute('DELETE FROM games');
    await execute('DELETE FROM settings');
    await execute('DELETE FROM players');
    await execute('DELETE FROM zodiac_avatars');
    await execute('DELETE FROM active_player');

    // Import data
    for (const [table, rows] of Object.entries(data)) {
      if (!Array.isArray(rows) || rows.length === 0) continue;

      const columns = Object.keys(rows[0]);
      const placeholders = columns.map(() => '?').join(', ');
      const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;

      for (const row of rows) {
        await execute(
          sql,
          columns.map((col) => row[col])
        );
      }
    }

  } catch (error) {
    console.error('[ExpoSQLite] Import failed:', error);
    throw error;
  }
}
