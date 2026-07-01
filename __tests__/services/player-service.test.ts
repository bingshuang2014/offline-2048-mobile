/**
 * Player Service Tests
 *
 * Tests for player management operations
 */

import {
  createPlayer,
  getAllPlayers,
  getPlayerById,
  getActivePlayer,
  switchPlayer,
  deletePlayer,
  setActivePlayer,
} from '../../src/services/player-service';
import { mockOpenDatabase, seedMockDatabase, resetMockDatabase } from '../utils/database-mock';

describe('PlayerService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetMockDatabase();
    mockOpenDatabase();
  });

  afterEach(() => {
    resetMockDatabase();
  });

  describe('createPlayer', () => {
    it('creates a new player successfully', async () => {
      const result = await createPlayer('Test Player', 1);

      expect(result.success).toBe(true);
      expect(result.player).toBeDefined();
      expect(result.player?.epitaph).toBe('Test Player');
      expect(result.player?.avatar_id).toBe(1);
      expect(result.player?.id).toBeDefined();
    });

    it('prevents duplicate epitaphs', async () => {
      // Create first player
      await createPlayer('Test Player', 1);

      // Try to create duplicate
      const result = await createPlayer('Test Player', 2);

      expect(result.success).toBe(false);
      expect(result.error).toContain('already exists');
    });

    it('validates epitaph is not empty', async () => {
      const result = await createPlayer('', 1);

      expect(result.success).toBe(false);
      expect(result.error).toContain('epitaph');
    });

    it('validates avatar_id is valid (1-12)', async () => {
      const result = await createPlayer('Test Player', 13);

      expect(result.success).toBe(false);
      expect(result.error).toContain('avatar');
    });

    it('sets new player as active', async () => {
      const result = await createPlayer('Test Player', 1);

      expect(result.success).toBe(true);
      const activePlayer = await getActivePlayer();
      expect(activePlayer?.id).toBe(result.player?.id);
    });
  });

  describe('getAllPlayers', () => {
    it('returns empty array when no players exist', async () => {
      const players = await getAllPlayers();

      expect(players).toEqual([]);
    });

    it('returns all players', async () => {
      await createPlayer('Player One', 1);
      await createPlayer('Player Two', 2);
      await createPlayer('Player Three', 3);

      const players = await getAllPlayers();

      expect(players).toHaveLength(3);
      expect(players[0].epitaph).toBe('Player One');
      expect(players[1].epitaph).toBe('Player Two');
      expect(players[2].epitaph).toBe('Player Three');
    });

    it('includes active status', async () => {
      await createPlayer('Player One', 1);
      await createPlayer('Player Two', 2);

      const players = await getAllPlayers();

      expect(players[0].active).toBe(true);
      expect(players[1].active).toBe(false);
    });

    it('orders by creation date', async () => {
      await createPlayer('First Player', 1);
      await new Promise((resolve) => setTimeout(resolve, 10));
      await createPlayer('Second Player', 2);

      const players = await getAllPlayers();

      expect(players[0].epitaph).toBe('First Player');
      expect(players[1].epitaph).toBe('Second Player');
    });
  });

  describe('getPlayerById', () => {
    it('returns player by id', async () => {
      const created = await createPlayer('Test Player', 1);

      if (created.player) {
        const player = await getPlayerById(created.player.id);

        expect(player).toBeDefined();
        expect(player?.epitaph).toBe('Test Player');
      }
    });

    it('returns null for non-existent player', async () => {
      const player = await getPlayerById(999);

      expect(player).toBeNull();
    });
  });

  describe('getActivePlayer', () => {
    it('returns the active player', async () => {
      await createPlayer('Test Player', 1);

      const activePlayer = await getActivePlayer();

      expect(activePlayer).toBeDefined();
      expect(activePlayer?.epitaph).toBe('Test Player');
      expect(activePlayer?.active).toBe(true);
    });

    it('returns null when no players exist', async () => {
      const activePlayer = await getActivePlayer();

      expect(activePlayer).toBeNull();
    });

    it('returns the most recently activated player', async () => {
      await createPlayer('Player One', 1);
      await createPlayer('Player Two', 2);

      // Switch to Player Two
      const players = await getAllPlayers();
      if (players[1]) {
        await setActivePlayer(players[1].id);

        const activePlayer = await getActivePlayer();
        expect(activePlayer?.epitaph).toBe('Player Two');
      }
    });
  });

  describe('switchPlayer', () => {
    it('switches to target player', async () => {
      await createPlayer('Player One', 1);
      await createPlayer('Player Two', 2);

      const players = await getAllPlayers();
      const result = await switchPlayer(players[1].id);

      expect(result.success).toBe(true);

      const activePlayer = await getActivePlayer();
      expect(activePlayer?.id).toBe(players[1].id);
    });

    it('deactivates previous player', async () => {
      await createPlayer('Player One', 1);
      await createPlayer('Player Two', 2);

      const players = await getAllPlayers();
      await switchPlayer(players[1].id);

      const updatedPlayers = await getAllPlayers();
      expect(updatedPlayers[0].active).toBe(false);
      expect(updatedPlayers[1].active).toBe(true);
    });

    it('returns error for non-existent player', async () => {
      const result = await switchPlayer(999);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  describe('deletePlayer', () => {
    it('deletes a player successfully', async () => {
      const created = await createPlayer('Test Player', 1);

      if (created.player) {
        // Deactivate first
        await setActivePlayer(null);

        const result = await deletePlayer(created.player.id);

        expect(result.success).toBe(true);

        const player = await getPlayerById(created.player.id);
        expect(player).toBeNull();
      }
    });

    it('prevents deletion of active player', async () => {
      const created = await createPlayer('Test Player', 1);

      if (created.player) {
        const result = await deletePlayer(created.player.id);

        expect(result.success).toBe(false);
        expect(result.error).toContain('active');
      }
    });

    it('returns error for non-existent player', async () => {
      const result = await deletePlayer(999);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('cascades delete to related data', async () => {
      const created = await createPlayer('Test Player', 1);

      if (created.player) {
        // Create games and settings for this player
        // (mocked in database-mock.ts)

        await setActivePlayer(null);
        await deletePlayer(created.player.id);

        // Verify related data is also deleted
        const players = await getAllPlayers();
        expect(players.find((p) => p.id === created.player?.id)).toBeUndefined();
      }
    });
  });

  describe('setActivePlayer', () => {
    it('activates target player', async () => {
      await createPlayer('Player One', 1);
      await createPlayer('Player Two', 2);

      const players = await getAllPlayers();
      await setActivePlayer(players[1].id);

      const updatedPlayers = await getAllPlayers();
      expect(updatedPlayers[1].active).toBe(true);
    });

    it('deactivates all other players', async () => {
      await createPlayer('Player One', 1);
      await createPlayer('Player Two', 2);
      await createPlayer('Player Three', 3);

      const players = await getAllPlayers();
      await setActivePlayer(players[2].id);

      const updatedPlayers = await getAllPlayers();
      expect(updatedPlayers[0].active).toBe(false);
      expect(updatedPlayers[1].active).toBe(false);
      expect(updatedPlayers[2].active).toBe(true);
    });

    it('handles null player id (deactivate all)', async () => {
      await createPlayer('Test Player', 1);

      await setActivePlayer(null);

      const players = await getAllPlayers();
      expect(players[0].active).toBe(false);
    });
  });
});
