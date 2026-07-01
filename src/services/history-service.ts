/**
 * History Service - Service layer for game history queries
 *
 * This service provides a clean abstraction for game history operations,
 * routing to the appropriate backend based on platform:
 * - Web: Next.js API routes
 * - Native: Capacitor SQLite database
 */

import { Platform } from "react-native";
import type { Game } from "@/lib/schema";

// ============================================================================
// Type Definitions
// ============================================================================

export interface HistoryFilters {
  mode?: "simple" | "endless";
  gridSize?: 3 | 4 | 5;
  epitaph?: string;
  playerId?: number;
}

export interface HistoryEntry extends Game {
  playerEpitaph: string;
  playerAvatarId: number;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Fetch wrapper for API calls (web platform)
 */
async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    throw error;
  }
}

// ============================================================================
// History Service Methods
// ============================================================================

/**
 * Get game history with optional filters
 * @param filters - Optional filters for mode, grid size, epitaph, or player ID
 * @returns Array of game history entries
 */
export async function getGameHistory(filters?: HistoryFilters): Promise<HistoryEntry[]> {

  try {
    const params = new URLSearchParams();
    if (filters?.mode) params.set("mode", filters.mode);
    if (filters?.gridSize) params.set("gridSize", filters.gridSize.toString());
    if (filters?.epitaph) params.set("epitaph", filters.epitaph);
    if (filters?.playerId) params.set("playerId", filters.playerId.toString());

    if (Platform.OS === "web") {
      const response = await apiFetch<{ games: HistoryEntry[] }>(
        `/api/history${params.toString() ? `?${params.toString()}` : ""}`
      );
      return response.games || [];
    } else {
      const { query } = await import("@/lib/db-expo");

      // Build SQL query with filters
      let sql = `
        SELECT g.*, p.epitaph as playerEpitaph, p.avatar_id as playerAvatarId
        FROM games g
        JOIN players p ON g.player_id = p.id
        WHERE g.is_completed = 1
      `;
      const params_arr: any[] = [];

      if (filters?.mode) {
        sql += " AND g.difficulty = ?";
        params_arr.push(filters.mode);
      }

      if (filters?.gridSize) {
        sql += " AND g.grid_size = ?";
        params_arr.push(filters.gridSize);
      }

      if (filters?.epitaph) {
        sql += " AND p.epitaph = ?";
        params_arr.push(filters.epitaph);
      }

      if (filters?.playerId) {
        sql += " AND g.player_id = ?";
        params_arr.push(filters.playerId);
      }

      sql += " ORDER BY g.score DESC, g.created_at DESC";


      const games = await query<any>(sql, params_arr);


      // Transform column names to match Drizzle schema
      const transformed = games.map((g: any) => ({
        id: g.id,
        playerId: g.player_id,
        difficulty: g.difficulty,
        gridSize: g.grid_size,
        score: g.score,
        timeElapsed: g.time_elapsed,
        gameState: g.game_state,
        createdAt: new Date(g.created_at),
        updatedAt: new Date(g.updated_at),
        lastMoveAt: g.last_move_at ? new Date(g.last_move_at) : null,
        isCompleted: (Number(g.is_completed) === 1),
        playerEpitaph: g.playerEpitaph,
        playerAvatarId: g.playerAvatarId,
      })) as HistoryEntry[];

      return transformed;
    }
  } catch (error) {
    console.error("[HistoryService] Error fetching game history:", error);
    return [];
  }
}

/**
 * Get game history for a specific player
 * @param playerId - Player ID
 * @param filters - Optional filters for mode and grid size
 * @returns Array of game history entries for the player
 */
export async function getPlayerHistory(
  playerId: number,
  filters?: Pick<HistoryFilters, "mode" | "gridSize">
): Promise<HistoryEntry[]> {
  return getGameHistory({ ...filters, playerId });
}

/**
 * Get game history grouped by mode and grid size
 * @returns Object with games grouped by category (e.g., "simple-3x3", "endless-4x4")
 */
export async function getGroupedHistory(): Promise<Record<string, HistoryEntry[]>> {
  try {
    const allGames = await getGameHistory();

    const grouped: Record<string, HistoryEntry[]> = {};

    for (const game of allGames) {
      const key = `${game.difficulty}-${game.gridSize}x${game.gridSize}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(game);
    }

    return grouped;
  } catch (error) {
    console.error("[HistoryService] Error fetching grouped history:", error);
    return {};
  }
}

/**
 * Search history by epitaph
 * @param epitaph - Player epitaph to search for
 * @returns Array of game history entries matching the epitaph
 */
export async function searchHistoryByEpitaph(epitaph: string): Promise<HistoryEntry[]> {
  return getGameHistory({ epitaph });
}

/**
 * Batch delete history entries
 * @param gameIds - Array of game IDs to delete
 * @returns true if successful, false otherwise
 */
export async function batchDeleteHistory(gameIds: number[]): Promise<boolean> {
  try {
    // Validate input - ensure all IDs are numbers
    if (!Array.isArray(gameIds) || gameIds.length === 0) {
      console.error('[HistoryService] Invalid gameIds:', gameIds);
      return false;
    }

    // Ensure all IDs are valid numbers
    const validIds = gameIds.filter(id => typeof id === 'number' && !isNaN(id) && id > 0);
    if (validIds.length !== gameIds.length) {
      console.error('[HistoryService] Some invalid gameIds were filtered out');
      return false;
    }

    if (Platform.OS === "web") {
      await apiFetch("/api/history/batch", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameIds: validIds }),
      });
      return true;
    } else {
      const { execute } = await import("@/lib/db-expo");

      // Build placeholders for IN clause using parameterized query
      const placeholders = validIds.map(() => "?").join(",");
      await execute(`DELETE FROM games WHERE id IN (${placeholders})`, validIds);

      return true;
    }
  } catch (error) {
    console.error("[HistoryService] Error batch deleting history:", error);
    return false;
  }
}

/**
 * Delete a single history entry
 * @param gameId - Game ID to delete
 * @returns true if successful, false otherwise
 */
export async function deleteHistoryEntry(gameId: number): Promise<boolean> {
  try {
    if (Platform.OS === "web") {
      await apiFetch(`/api/games/${gameId}`, { method: "DELETE" });
      return true;
    } else {
      const { execute } = await import("@/lib/db-expo");
      await execute("DELETE FROM games WHERE id = ?", [gameId]);
      return true;
    }
  } catch (error) {
    console.error("[HistoryService] Error deleting history entry:", error);
    return false;
  }
}

/**
 * Get personal best score for a player
 * @param playerId - Player ID
 * @param mode - Game mode
 * @param gridSize - Grid size
 * @returns Personal best score or 0 if no games found
 */
export async function getPersonalBest(
  playerId: number,
  mode: "simple" | "endless",
  gridSize: 3 | 4 | 5
): Promise<number> {
  try {
    const history = await getPlayerHistory(playerId, { mode, gridSize });
    return history.length > 0 ? (history[0]?.score ?? 0) : 0;
  } catch (error) {
    console.error("[HistoryService] Error fetching personal best:", error);
    return 0;
  }
}

/**
 * Get personal best scores by difficulty (sum of all games for legacy compatibility)
 * @param playerId - Player ID
 * @returns Object with easy and hard best scores
 */
export async function getPersonalBestByDifficulty(
  playerId: number
): Promise<{ easy: number; hard: number }> {
  try {
    if (Platform.OS === "web") {
      const response = await apiFetch<{ easy: number; hard: number }>(
        `/api/players/${playerId}/personal-best`
      );
      return response;
    } else {
      const { query } = await import("@/lib/db-expo");

      const result = await query<{
        easy_best: number;
        hard_best: number;
      }>(
        `
        SELECT
          SUM(CASE WHEN difficulty = 'easy' THEN score ELSE 0 END) as easy_best,
          SUM(CASE WHEN difficulty = 'hard' THEN score ELSE 0 END) as hard_best
        FROM games
        WHERE player_id = ?
          AND is_completed = 1
      `,
        [playerId]
      );

      return {
        easy: result[0]?.easy_best ?? 0,
        hard: result[0]?.hard_best ?? 0,
      };
    }
  } catch (error) {
    console.error("[HistoryService] Error fetching personal best by difficulty:", error);
    return { easy: 0, hard: 0 };
  }
}
