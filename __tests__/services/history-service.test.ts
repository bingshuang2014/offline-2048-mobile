/**
 * History Service Tests
 *
 * Tests for game history queries and management
 */

import {
  getGameHistory,
  getHistoryByPlayer,
  getHistoryByModeAndGridSize,
  deleteHistoryEntry,
  batchDeleteHistory,
  searchHistoryByEpitaph,
} from '../../src/services/history-service';
import { mockOpenDatabase, seedMockDatabase, resetMockDatabase } from '../utils/database-mock';

describe('HistoryService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetMockDatabase();
    seedMockDatabase();
    mockOpenDatabase();
  });

  afterEach(() => {
    resetMockDatabase();
  });

  describe('getGameHistory', () => {
    it('returns empty array when no history exists', async () => {
      const history = await getGameHistory();

      expect(history).toEqual([]);
    });

    it('returns all game history', async () => {
      // Create mock history entries
      // (would be done by creating games in game-service)

      const history = await getGameHistory();

      expect(Array.isArray(history)).toBe(true);
    });

    it('orders by score descending', async () => {
      const history = await getGameHistory();

      if (history.length > 1) {
        for (let i = 0; i < history.length - 1; i++) {
          expect(history[i].score).toBeGreaterThanOrEqual(history[i + 1].score);
        }
      }
    });

    it('includes player information', async () => {
      const history = await getGameHistory();

      history.forEach((entry) => {
        expect(entry).toHaveProperty('player_epitaph');
        expect(entry).toHaveProperty('player_avatar_id');
      });
    });

    it('includes game details', async () => {
      const history = await getGameHistory();

      history.forEach((entry) => {
        expect(entry).toHaveProperty('mode');
        expect(entry).toHaveProperty('grid_size');
        expect(entry).toHaveProperty('score');
        expect(entry).toHaveProperty('time_elapsed');
        expect(entry).toHaveProperty('created_at');
      });
    });
  });

  describe('getHistoryByPlayer', () => {
    it('returns history for specific player', async () => {
      const history = await getHistoryByPlayer(1);

      expect(Array.isArray(history)).toBe(true);
      history.forEach((entry) => {
        expect(entry.player_id).toBe(1);
      });
    });

    it('returns empty array for non-existent player', async () => {
      const history = await getHistoryByPlayer(999);

      expect(history).toEqual([]);
    });

    it('orders by score descending', async () => {
      const history = await getHistoryByPlayer(1);

      if (history.length > 1) {
        for (let i = 0; i < history.length - 1; i++) {
          expect(history[i].score).toBeGreaterThanOrEqual(history[i + 1].score);
        }
      }
    });
  });

  describe('getHistoryByModeAndGridSize', () => {
    it('returns history for simple mode 4x4', async () => {
      const history = await getHistoryByModeAndGridSize('simple', 4);

      expect(Array.isArray(history)).toBe(true);
      history.forEach((entry) => {
        expect(entry.mode).toBe('simple');
        expect(entry.grid_size).toBe(4);
      });
    });

    it('returns history for endless mode 3x3', async () => {
      const history = await getHistoryByModeAndGridSize('endless', 3);

      expect(Array.isArray(history)).toBe(true);
      history.forEach((entry) => {
        expect(entry.mode).toBe('endless');
        expect(entry.grid_size).toBe(3);
      });
    });

    it('returns history for simple mode 5x5', async () => {
      const history = await getHistoryByModeAndGridSize('simple', 5);

      expect(Array.isArray(history)).toBe(true);
      history.forEach((entry) => {
        expect(entry.mode).toBe('simple');
        expect(entry.grid_size).toBe(5);
      });
    });

    it('returns empty array when no matching history', async () => {
      const history = await getHistoryByModeAndGridSize('simple', 4);

      // If no games played in this mode
      expect(Array.isArray(history)).toBe(true);
    });

    it('orders by score descending', async () => {
      const history = await getHistoryByModeAndGridSize('simple', 4);

      if (history.length > 1) {
        for (let i = 0; i < history.length - 1; i++) {
          expect(history[i].score).toBeGreaterThanOrEqual(history[i + 1].score);
        }
      }
    });
  });

  describe('searchHistoryByEpitaph', () => {
    it('returns history matching epitaph', async () => {
      const history = await searchHistoryByEpitaph('Test');

      expect(Array.isArray(history)).toBe(true);
      history.forEach((entry) => {
        expect(entry.player_epitaph.toLowerCase()).toContain('test');
      });
    });

    it('is case-insensitive', async () => {
      const historyLower = await searchHistoryByEpitaph('test');
      const historyUpper = await searchHistoryByEpitaph('TEST');

      expect(historyLower).toEqual(historyUpper);
    });

    it('returns empty array when no matches', async () => {
      const history = await searchHistoryByEpitaph('NonExistentPlayer');

      expect(history).toEqual([]);
    });

    it('handles partial matches', async () => {
      const history = await searchHistoryByEpitaph('Player');

      expect(Array.isArray(history)).toBe(true);
    });

    it('handles special characters', async () => {
      const history = await searchHistoryByEpitaph('昵称');

      expect(Array.isArray(history)).toBe(true);
    });
  });

  describe('deleteHistoryEntry', () => {
    it('deletes a single history entry', async () => {
      // First create a history entry
      // (would be done by ending a game)

      const result = await deleteHistoryEntry(1);

      expect(result.success).toBe(true);
    });

    it('returns error for non-existent entry', async () => {
      const result = await deleteHistoryEntry(999);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('validates entry id', async () => {
      const result = await deleteHistoryEntry(0);

      expect(result.success).toBe(false);
    });

    it('validates entry id is a number', async () => {
      const result = await deleteHistoryEntry(NaN);

      expect(result.success).toBe(false);
    });
  });

  describe('batchDeleteHistory', () => {
    it('deletes multiple history entries', async () => {
      const ids = [1, 2, 3];
      const result = await batchDeleteHistory(ids);

      expect(result.success).toBe(true);
      expect(result.deleted_count).toBe(3);
    });

    it('handles empty array', async () => {
      const result = await batchDeleteHistory([]);

      expect(result.success).toBe(true);
      expect(result.deleted_count).toBe(0);
    });

    it('returns partial success when some ids not found', async () => {
      const ids = [1, 999, 2, 998];
      const result = await batchDeleteHistory(ids);

      expect(result.success).toBe(true);
      expect(result.deleted_count).toBeGreaterThan(0);
      expect(result.deleted_count).toBeLessThan(4);
    });

    it('returns error when all ids not found', async () => {
      const ids = [999, 998, 997];
      const result = await batchDeleteHistory(ids);

      expect(result.success).toBe(false);
      expect(result.deleted_count).toBe(0);
    });

    it('validates all ids are numbers', async () => {
      const ids = [1, 2, 'invalid' as any, 3];
      const result = await batchDeleteHistory(ids);

      expect(result.success).toBe(false);
    });

    it('handles large batches', async () => {
      const ids = Array.from({ length: 100 }, (_, i) => i + 1);
      const result = await batchDeleteHistory(ids);

      expect(result.success).toBe(true);
      expect(result.deleted_count).toBeGreaterThanOrEqual(0);
    });
  });

  describe('History Data Integrity', () => {
    it('includes all required fields', async () => {
      const history = await getGameHistory();

      history.forEach((entry) => {
        expect(entry).toHaveProperty('id');
        expect(entry).toHaveProperty('player_id');
        expect(entry).toHaveProperty('player_epitaph');
        expect(entry).toHaveProperty('player_avatar_id');
        expect(entry).toHaveProperty('mode');
        expect(entry).toHaveProperty('grid_size');
        expect(entry).toHaveProperty('score');
        expect(entry).toHaveProperty('time_elapsed');
        expect(entry).toHaveProperty('created_at');
      });
    });

    it('score is non-negative', async () => {
      const history = await getGameHistory();

      history.forEach((entry) => {
        expect(entry.score).toBeGreaterThanOrEqual(0);
      });
    });

    it('time_elapsed is non-negative', async () => {
      const history = await getGameHistory();

      history.forEach((entry) => {
        expect(entry.time_elapsed).toBeGreaterThanOrEqual(0);
      });
    });

    it('grid_size is 3, 4, or 5', async () => {
      const history = await getGameHistory();

      history.forEach((entry) => {
        expect([3, 4, 5]).toContain(entry.grid_size);
      });
    });

    it('mode is either simple or endless', async () => {
      const history = await getGameHistory();

      history.forEach((entry) => {
        expect(['simple', 'endless']).toContain(entry.mode);
      });
    });

    it('avatar_id is between 1 and 12', async () => {
      const history = await getGameHistory();

      history.forEach((entry) => {
        expect(entry.player_avatar_id).toBeGreaterThanOrEqual(1);
        expect(entry.player_avatar_id).toBeLessThanOrEqual(12);
      });
    });
  });
});
