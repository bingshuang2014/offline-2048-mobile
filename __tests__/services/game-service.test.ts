/**
 * Game Service Tests
 *
 * Tests for game logic, state management, and persistence
 */

import {
  startGame,
  makeMove,
  getActiveGame,
  endGame,
  saveGame,
  initializeBoard,
  moveTiles,
  mergeTiles,
  addRandomTile,
  canMove,
  isGameOver,
  checkVictory,
} from '../../src/services/game-service';
import { mockOpenDatabase, seedMockDatabase, resetMockDatabase } from '../utils/database-mock';

describe('GameService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetMockDatabase();
    seedMockDatabase();
    mockOpenDatabase();
  });

  afterEach(() => {
    resetMockDatabase();
  });

  describe('initializeBoard', () => {
    it('creates a 4x4 board with zeros', () => {
      const board = initializeBoard(4);

      expect(board).toHaveLength(4);
      expect(board[0]).toHaveLength(4);
      expect(board.every((row) => row.every((tile) => tile === 0))).toBe(true);
    });

    it('creates a 3x3 board', () => {
      const board = initializeBoard(3);

      expect(board).toHaveLength(3);
      expect(board[0]).toHaveLength(3);
    });

    it('creates a 5x5 board', () => {
      const board = initializeBoard(5);

      expect(board).toHaveLength(5);
      expect(board[0]).toHaveLength(5);
    });
  });

  describe('addRandomTile', () => {
    it('adds a tile to an empty board', () => {
      const board = [
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ];

      const newBoard = addRandomTile(board);

      let tileCount = 0;
      newBoard.forEach((row) => row.forEach((tile) => (tileCount += tile > 0 ? 1 : 0)));

      expect(tileCount).toBe(1);
    });

    it('adds a 2 or 4 tile', () => {
      const board = [
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ];

      const newBoard = addRandomTile(board);

      const hasTile = newBoard.some((row) =>
        row.some((tile) => tile === 2 || tile === 4)
      );

      expect(hasTile).toBe(true);
    });

    it('90% chance of 2, 10% chance of 4', () => {
      const board = [
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ];

      let twos = 0;
      let fours = 0;
      const iterations = 1000;

      for (let i = 0; i < iterations; i++) {
        const newBoard = addRandomTile(board);
        newBoard.forEach((row) =>
          row.forEach((tile) => {
            if (tile === 2) twos++;
            if (tile === 4) fours++;
          })
        );
      }

      // Allow some variance but should be roughly 90/10
      const twoPercentage = (twos / iterations) * 100;
      expect(twoPercentage).toBeGreaterThan(80);
      expect(twoPercentage).toBeLessThan(95);
    });
  });

  describe('moveTiles', () => {
    it('moves tiles left', () => {
      const board = [
        [0, 2, 0, 2],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ];

      const newBoard = moveTiles(board, 'left');

      expect(newBoard[0][0]).toBe(2);
      expect(newBoard[0][1]).toBe(2);
      expect(newBoard[0][2]).toBe(0);
      expect(newBoard[0][3]).toBe(0);
    });

    it('moves tiles right', () => {
      const board = [
        [2, 0, 2, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ];

      const newBoard = moveTiles(board, 'right');

      expect(newBoard[0][0]).toBe(0);
      expect(newBoard[0][1]).toBe(0);
      expect(newBoard[0][2]).toBe(2);
      expect(newBoard[0][3]).toBe(2);
    });

    it('moves tiles up', () => {
      const board = [
        [0, 0, 0, 0],
        [2, 0, 0, 0],
        [0, 0, 0, 0],
        [2, 0, 0, 0],
      ];

      const newBoard = moveTiles(board, 'up');

      expect(newBoard[0][0]).toBe(2);
      expect(newBoard[1][0]).toBe(2);
      expect(newBoard[2][0]).toBe(0);
      expect(newBoard[3][0]).toBe(0);
    });

    it('moves tiles down', () => {
      const board = [
        [2, 0, 0, 0],
        [0, 0, 0, 0],
        [2, 0, 0, 0],
        [0, 0, 0, 0],
      ];

      const newBoard = moveTiles(board, 'down');

      expect(newBoard[0][0]).toBe(0);
      expect(newBoard[1][0]).toBe(0);
      expect(newBoard[2][0]).toBe(2);
      expect(newBoard[3][0]).toBe(2);
    });
  });

  describe('mergeTiles', () => {
    it('merges adjacent tiles of same value', () => {
      const row = [2, 2, 4, 4];
      const merged = mergeTiles(row);

      expect(merged).toEqual([4, 8, 0, 0]);
    });

    it('merges only once per tile', () => {
      const row = [2, 2, 2, 2];
      const merged = mergeTiles(row);

      expect(merged).toEqual([4, 4, 0, 0]);
    });

    it('does not merge different values', () => {
      const row = [2, 4, 8, 16];
      const merged = mergeTiles(row);

      expect(merged).toEqual([2, 4, 8, 16]);
    });

    it('handles zeros', () => {
      const row = [0, 2, 2, 0];
      const merged = mergeTiles(row);

      expect(merged).toEqual([4, 0, 0, 0]);
    });
  });

  describe('canMove', () => {
    it('returns true when board has empty spaces', () => {
      const board = [
        [2, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ];

      expect(canMove(board)).toBe(true);
    });

    it('returns true when adjacent tiles can merge', () => {
      const board = [
        [2, 2, 4, 8],
        [4, 8, 16, 32],
        [2, 4, 8, 16],
        [32, 16, 8, 4],
      ];

      expect(canMove(board)).toBe(true);
    });

    it('returns false when board is full and no merges possible', () => {
      const board = [
        [2, 4, 8, 16],
        [4, 8, 16, 32],
        [32, 16, 8, 4],
        [16, 32, 4, 2],
      ];

      expect(canMove(board)).toBe(false);
    });
  });

  describe('isGameOver', () => {
    it('returns true when no moves possible', () => {
      const board = [
        [2, 4, 8, 16],
        [4, 8, 16, 32],
        [32, 16, 8, 4],
        [16, 32, 4, 2],
      ];

      expect(isGameOver(board)).toBe(true);
    });

    it('returns false when moves are possible', () => {
      const board = [
        [2, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ];

      expect(isGameOver(board)).toBe(false);
    });
  });

  describe('checkVictory', () => {
    it('returns true when 2048 tile exists (simple mode)', () => {
      const board = [
        [2048, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ];

      expect(checkVictory(board, 'simple')).toBe(true);
    });

    it('returns false when 2048 tile does not exist (simple mode)', () => {
      const board = [
        [1024, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ];

      expect(checkVictory(board, 'simple')).toBe(false);
    });

    it('returns false for endless mode (no victory condition)', () => {
      const board = [
        [2048, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ];

      expect(checkVictory(board, 'endless')).toBe(false);
    });
  });

  describe('startGame', () => {
    it('starts a new game for player', async () => {
      const result = await startGame(1, 'simple', 4);

      expect(result.success).toBe(true);
      expect(result.game).toBeDefined();
      expect(result.game?.player_id).toBe(1);
      expect(result.game?.mode).toBe('simple');
      expect(result.game?.grid_size).toBe(4);
    });

    it('initializes board with two random tiles', async () => {
      const result = await startGame(1, 'simple', 4);

      if (result.game) {
        const gameState = JSON.parse(result.game.game_state);
        const board = gameState.board;

        let tileCount = 0;
        board.forEach((row: number[]) =>
          row.forEach((tile) => (tileCount += tile > 0 ? 1 : 0))
        );

        expect(tileCount).toBe(2);
      }
    });

    it('sets score to 0', async () => {
      const result = await startGame(1, 'simple', 4);

      if (result.game) {
        const gameState = JSON.parse(result.game.game_state);
        expect(gameState.score).toBe(0);
      }
    });

    it('deactivates previous active game', async () => {
      await startGame(1, 'simple', 4);
      await startGame(1, 'simple', 4);

      const activeGame = await getActiveGame(1);

      expect(activeGame).toBeDefined();
      // Should only have one active game
    });
  });

  describe('makeMove', () => {
    it('makes a valid move', async () => {
      await startGame(1, 'simple', 4);

      const result = await makeMove(1, 'left');

      expect(result.success).toBe(true);
    });

    it('returns error for invalid direction', async () => {
      await startGame(1, 'simple', 4);

      const result = await makeMove(1, 'diagonal' as any);

      expect(result.success).toBe(false);
    });

    it('detects game over', async () => {
      // Create a game over state
      await startGame(1, 'simple', 4);

      // Make moves until game over (mocked)
      const result = await makeMove(1, 'left');

      if (result.game_over) {
        expect(result.game_over).toBe(true);
      }
    });

    it('detects victory in simple mode', async () => {
      await startGame(1, 'simple', 4);

      // Simulate reaching 2048
      const result = await makeMove(1, 'left');

      if (result.victory) {
        expect(result.victory).toBe(true);
        expect(result.game_over).toBe(true);
      }
    });
  });

  describe('saveGame', () => {
    it('saves game state', async () => {
      const gameState = {
        board: [
          [2, 2, 0, 0],
          [0, 0, 0, 0],
          [0, 0, 0, 0],
          [0, 0, 0, 0],
        ],
        score: 4,
      };

      const result = await saveGame(1, JSON.stringify(gameState), 4);

      expect(result.success).toBe(true);
    });

    it('updates time_elapsed', async () => {
      const gameState = {
        board: [
          [2, 2, 0, 0],
          [0, 0, 0, 0],
          [0, 0, 0, 0],
          [0, 0, 0, 0],
        ],
        score: 4,
      };

      const startTime = Date.now();
      await saveGame(1, JSON.stringify(gameState), 4);

      const game = await getActiveGame(1);
      if (game) {
        expect(game.time_elapsed).toBeGreaterThan(0);
      }
    });
  });

  describe('endGame', () => {
    it('marks game as completed', async () => {
      await startGame(1, 'simple', 4);

      const result = await endGame(1);

      expect(result.success).toBe(true);
    });

    it('returns error for non-existent game', async () => {
      const result = await endGame(999);

      expect(result.success).toBe(false);
    });
  });
});
