/**
 * Player Service - Service layer for player operations
 *
 * This service provides a clean abstraction for player CRUD operations,
 * routing to the appropriate backend based on platform:
 * - Web: Next.js API routes
 * - Native: Capacitor SQLite database
 */

import { Platform } from "react-native";
import type { Player } from "@/lib/schema";

// ============================================================================
// Type Definitions
// ============================================================================

export interface CreatePlayerRequest {
  epitaph: string;
  avatarId: number;
}

export interface SwitchPlayerRequest {
  playerId: number;
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
// Player Service Methods
// ============================================================================

/**
 * Get all players
 * @returns Array of all players
 */
export async function getAllPlayers(): Promise<Player[]> {
  try {
    if (Platform.OS === "web") {
      const response = await apiFetch<{ players: Player[] }>("/api/players");
      return response.players || [];
    } else {
      // Use Expo SQLite on native
      const { query } = await import("@/lib/db-expo");
      const players = await query<Player>(
        "SELECT id, epitaph, avatar_id as avatarId, created_at as createdAt FROM players ORDER BY created_at DESC"
      );
      return players.map((p) => ({
        ...p,
        avatarId: Number(p.avatarId),
        createdAt: new Date(p.createdAt as unknown as string),
      }));
    }
  } catch (error) {
    console.error("[PlayerService] Error fetching players:", error);
    return [];
  }
}

/**
 * Get player by epitaph
 * @param epitaph - Player's epitaph
 * @returns Player data or null if not found
 */
export async function getPlayerByEpitaph(epitaph: string): Promise<Player | null> {
  try {
    if (Platform.OS === "web") {
      const response = await apiFetch<{ player: Player }>(
        `/api/players/by-epitaph/${encodeURIComponent(epitaph)}`
      );
      return response.player;
    } else {
      const { query } = await import("@/lib/db-expo");
      const players = await query<Player>(
        "SELECT id, epitaph, avatar_id as avatarId, created_at as createdAt FROM players WHERE epitaph = ?",
        [epitaph]
      );
      if (players[0]) {
        return {
          ...players[0],
          avatarId: Number(players[0].avatarId),
          createdAt: new Date(players[0].createdAt as unknown as string),
        };
      }
      return null;
    }
  } catch (error) {
    console.error("[PlayerService] Error fetching player by epitaph:", error);
    return null;
  }
}

/**
 * Create a new player
 * @param request - Player creation request
 * @returns Created player data or null on error
 */
export async function createPlayer(request: CreatePlayerRequest): Promise<Player | null> {
  try {

    if (Platform.OS === "web") {
      const response = await apiFetch<{ player: Player }>("/api/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ epitaph: request.epitaph, avatar_id: request.avatarId }),
      });
      return response.player;
    } else {
      const { execute, lastInsertId, query } = await import("@/lib/db-expo");

      await execute("INSERT INTO players (epitaph, avatar_id) VALUES (?, ?)", [
        request.epitaph,
        request.avatarId,
      ]);

      const id = await lastInsertId();

      if (!id || id === 0) {
        console.error('[PlayerService] Failed to get valid insert ID');
        return null;
      }

      // Create default settings
      await execute(
        "INSERT INTO settings (player_id, theme, seasonal_theme, sound_enabled, haptic_enabled, card_opacity) VALUES (?, ?, ?, ?, ?, ?)",
        [id, "light", "winter", 1, 1, 0]
      );

      // Fetch the created player
      const players = await query<Player>(
        "SELECT id, epitaph, avatar_id as avatarId, created_at as createdAt FROM players WHERE id = ?",
        [id]
      );


      if (players && players[0]) {
        const player = {
          ...players[0],
          avatarId: Number(players[0].avatarId),
          createdAt: new Date(players[0].createdAt as unknown as string),
        };
        return player;
      }

      console.error('[PlayerService] Player not found after insert');
      return null;
    }
  } catch (error) {
    console.error("[PlayerService] Error creating player:", error);
    return null;
  }
}

/**
 * Delete a player
 * @param playerId - Player ID to delete
 * @returns true if successful, false otherwise
 */
export async function deletePlayer(playerId: number): Promise<boolean> {
  try {
    if (Platform.OS === "web") {
      await apiFetch(`/api/players/${playerId}`, { method: "DELETE" });
      return true;
    } else {
      const { execute } = await import("@/lib/db-expo");
      await execute("DELETE FROM players WHERE id = ?", [playerId]);
      return true;
    }
  } catch (error) {
    console.error("[PlayerService] Error deleting player:", error);
    return false;
  }
}

/**
 * Switch active player
 * @param request - Switch player request
 * @returns true if successful, false otherwise
 */
export async function switchPlayer(request: SwitchPlayerRequest): Promise<boolean> {
  try {
    if (Platform.OS === "web") {
      await apiFetch("/api/players/switch", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId: request.playerId }),
      });
      return true;
    } else {
      const { execute } = await import("@/lib/db-expo");
      await execute("INSERT OR REPLACE INTO active_player (id, player_id) VALUES (1, ?)", [
        request.playerId,
      ]);
      return true;
    }
  } catch (error) {
    console.error("[PlayerService] Error switching player:", error);
    return false;
  }
}

/**
 * Get active player
 * @returns Active player data or null if none
 */
export async function getActivePlayer(): Promise<Player | null> {
  try {
    if (Platform.OS === "web") {
      const response = await apiFetch<{ player: Player | null }>("/api/active-player");
      return response.player;
    } else {
      const { query } = await import("@/lib/db-expo");
      const activePlayers = await query<{ player_id: number }>(
        "SELECT player_id FROM active_player WHERE id = 1"
      );
      if (activePlayers[0]) {
        const players = await query<Player>(
          "SELECT id, epitaph, avatar_id as avatarId, created_at as createdAt FROM players WHERE id = ?",
          [activePlayers[0].player_id]
        );
        if (players[0]) {
          return {
            ...players[0],
            avatarId: Number(players[0].avatarId),
            createdAt: new Date(players[0].createdAt as unknown as string),
          };
        }
      }
      return null;
    }
  } catch (error) {
    console.error("[PlayerService] Error fetching active player:", error);
    return null;
  }
}

/**
 * Set active player
 * @param playerId - Player ID to set as active
 * @returns true if successful, false otherwise
 */
export async function setActivePlayer(playerId: number): Promise<boolean> {
  try {
    if (Platform.OS === "web") {
      await apiFetch("/api/active-player", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId }),
      });
      return true;
    } else {
      const { execute } = await import("@/lib/db-expo");
      await execute("INSERT OR REPLACE INTO active_player (id, player_id) VALUES (1, ?)", [
        playerId,
      ]);
      return true;
    }
  } catch (error) {
    console.error("[PlayerService] Error setting active player:", error);
    return false;
  }
}

/**
 * Clear active player (logout)
 * @returns true if successful, false otherwise
 */
export async function clearActivePlayer(): Promise<boolean> {
  try {
    if (Platform.OS === "web") {
      await apiFetch("/api/active-player", { method: "DELETE" });
      return true;
    } else {
      const { execute } = await import("@/lib/db-expo");
      await execute("DELETE FROM active_player WHERE id = 1");
      return true;
    }
  } catch (error) {
    console.error("[PlayerService] Error clearing active player:", error);
    return false;
  }
}

// ============================================================================
// Avatar Service Methods
// ============================================================================

export interface ZodiacAvatar {
  id: number;
  name: string;
  imagePath: string;
  isBuiltin: boolean;
}

/**
 * Get all zodiac avatars
 * @returns Array of zodiac avatars
 */
export async function getAllAvatars(): Promise<ZodiacAvatar[]> {
  try {
    if (Platform.OS === "web") {
      const response = await apiFetch<{ avatars: ZodiacAvatar[] }>("/api/avatars");
      return response.avatars || [];
    } else {
      const { query } = await import("@/lib/db-expo");
      const avatars = await query<any>(
        "SELECT id, name, image_path as imagePath, is_builtin as isBuiltin FROM zodiac_avatars ORDER BY id"
      );
      // Convert string to boolean
      return avatars.map((a) => ({
        ...a,
        isBuiltin: (Number(a.isBuiltin) === 1),
      }));
    }
  } catch (error) {
    console.error("[PlayerService] Error fetching avatars:", error);
    return [];
  }
}
