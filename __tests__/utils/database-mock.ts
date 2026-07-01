/**
 * Database Mock Helper
 *
 * Mocks Expo SQLite for testing without a real database
 */

import { SQLite } from 'expo-sqlite';

export type MockDatabase = {
  exec: jest.Mock;
  closeAsync: jest.Mock;
  deleteDatabase: jest.Mock;
  getFirstAsync: jest.Mock;
  getAllAsync: jest.Mock;
  runAsync: jest.Mock;
};

// In-memory database state
const mockDBState = {
  players: [] as any[],
  games: [] as any[],
  settings: [] as any[],
  autoIncrement: {
    players: 1,
    games: 1,
    settings: 1,
  },
};

/**
 * Reset mock database to initial state
 */
export function resetMockDatabase() {
  mockDBState.players = [];
  mockDBState.games = [];
  mockDBState.settings = [];
  mockDBState.autoIncrement = {
    players: 1,
    games: 1,
    settings: 1,
  };
}

/**
 * Create a mock database instance
 */
export function createMockDatabase(): MockDatabase {
  return {
    exec: jest.fn(({ sql }: { sql: string }) => {
      // Parse SQL and update mock state
      if (sql.includes('INSERT INTO players')) {
        const match = sql.match(/VALUES \('([^']+)', (\d+)\)/);
        if (match) {
          const [, epitaph, avatar_id] = match;
          mockDBState.players.push({
            id: mockDBState.autoIncrement.players++,
            epitaph,
            avatar_id: parseInt(avatar_id),
            created_at: new Date().toISOString(),
          });
        }
      } else if (sql.includes('INSERT INTO games')) {
        const match = sql.match(
          /VALUES \((\d+), '([^']+)', (\d+), (\d+), (\d+), '([^']+)'/
        );
        if (match) {
          const [, player_id, mode, grid_size, score, time_elapsed, game_state] =
            match;
          mockDBState.games.push({
            id: mockDBState.autoIncrement.games++,
            player_id: parseInt(player_id),
            mode,
            grid_size: parseInt(grid_size),
            score: parseInt(score),
            time_elapsed: parseInt(time_elapsed),
            game_state,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            is_completed: false,
          });
        }
      } else if (sql.includes('INSERT INTO settings')) {
        const match = sql.match(/VALUES \((\d+), '([^']+)', '([^']+)'/);
        if (match) {
          const [, player_id, theme, seasonal_theme] = match;
          mockDBState.settings.push({
            id: mockDBState.autoIncrement.settings++,
            player_id: parseInt(player_id),
            theme,
            seasonal_theme,
            card_opacity: 14,
            sound_enabled: 1,
            updated_at: new Date().toISOString(),
          });
        }
      } else if (sql.includes('DELETE FROM players')) {
        const match = sql.match(/WHERE id = (\d+)/);
        if (match) {
          const id = parseInt(match[1]);
          mockDBState.players = mockDBState.players.filter((p) => p.id !== id);
        }
      } else if (sql.includes('DELETE FROM games')) {
        const match = sql.match(/WHERE id = (\d+)/);
        if (match) {
          const id = parseInt(match[1]);
          mockDBState.games = mockDBState.games.filter((g) => g.id !== id);
        }
      }
    }),

    closeAsync: jest.fn(async () => {
      // No-op for mock
    }),

    deleteDatabase: jest.fn(async () => {
      resetMockDatabase();
    }),

    getFirstAsync: jest.fn(async (query: string, params?: any[]) => {
      if (query.includes('SELECT * FROM players WHERE id =')) {
        const id = parseInt(params![0]);
        return mockDBState.players.find((p) => p.id === id) || null;
      }
      if (query.includes('SELECT * FROM settings WHERE player_id =')) {
        const player_id = parseInt(params![0]);
        return mockDBState.settings.find((s) => s.player_id === player_id) || null;
      }
      return null;
    }),

    getAllAsync: jest.fn(async (query: string, params?: any[]) => {
      if (query.includes('SELECT * FROM players')) {
        if (query.includes('WHERE epitaph =')) {
          const epitaph = params![0];
          return mockDBState.players.filter((p) => p.epitaph === epitaph);
        }
        return mockDBState.players;
      }
      if (query.includes('SELECT * FROM games')) {
        if (query.includes('WHERE player_id =')) {
          const player_id = parseInt(params![0]);
          return mockDBState.games.filter((g) => g.player_id === player_id);
        }
        return mockDBState.games;
      }
      if (query.includes('SELECT * FROM settings')) {
        return mockDBState.settings;
      }
      return [];
    }),

    runAsync: jest.fn(async (query: string, params?: any[]) => {
      if (query.includes('UPDATE players SET active = 0')) {
        // Deactivate all players
        mockDBState.players.forEach((p) => (p.active = 0));
      }
      if (query.includes('UPDATE players SET active = 1 WHERE id =')) {
        const id = parseInt(params![0]);
        const player = mockDBState.players.find((p) => p.id === id);
        if (player) player.active = 1;
      }
      if (query.includes('UPDATE settings')) {
        // Parse UPDATE query
        const match = query.match(/SET (.*?) WHERE player_id = (\d+)/);
        if (match) {
          const [, updates, player_id] = match;
          const setting = mockDBState.settings.find(
            (s) => s.player_id === parseInt(player_id)
          );
          if (setting) {
            // Apply updates (simplified)
            if (updates.includes('theme =')) {
              const themeMatch = updates.match(/theme = '([^']+)'/);
              if (themeMatch) setting.theme = themeMatch[1];
            }
            if (updates.includes('seasonal_theme =')) {
              const seasonMatch = updates.match(/seasonal_theme = '([^']+)'/);
              if (seasonMatch) setting.seasonal_theme = seasonMatch[1];
            }
          }
        }
      }
      return { lastInsertRowId: mockDBState.autoIncrement.players, changes: 1 };
    }),
  };
}

/**
 * Initialize mock database with test data
 */
export function seedMockDatabase() {
  resetMockDatabase();

  // Add test players
  mockDBState.players = [
    {
      id: 1,
      epitaph: 'Test Player 1',
      avatar_id: 1,
      active: 1,
      created_at: new Date().toISOString(),
    },
    {
      id: 2,
      epitaph: 'Test Player 2',
      avatar_id: 2,
      active: 0,
      created_at: new Date().toISOString(),
    },
  ];

  mockDBState.autoIncrement.players = 3;

  // Add test settings
  mockDBState.settings = [
    {
      id: 1,
      player_id: 1,
      theme: 'light',
      seasonal_theme: 'spring',
      card_opacity: 14,
      sound_enabled: 1,
      updated_at: new Date().toISOString(),
    },
  ];

  mockDBState.autoIncrement.settings = 2;
}

/**
 * Get current mock database state (for debugging)
 */
export function getMockDatabaseState() {
  return { ...mockDBState };
}

/**
 * Mock openDatabaseAsync from expo-sqlite
 */
export function mockOpenDatabase() {
  const SQLite = require('expo-sqlite');
  SQLite.openDatabaseAsync = jest.fn(async () => createMockDatabase());
  SQLite.openDatabaseSync = jest.fn(() => createMockDatabase());
}
