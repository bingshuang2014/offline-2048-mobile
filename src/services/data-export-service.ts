/**
 * Data Export/Import Service
 * Handles exporting and importing all game data for backup/restore
 */

import * as FileSystem from 'expo-file-system/legacy';
import { Platform, Alert } from 'react-native';
import * as Sharing from 'expo-sharing';

export interface ExportData {
  version: string;
  exportDate: string;
  player?: {
    id: number;
    epitaph: string;
    avatarId: number;
    createdAt: string;
  };
  settings?: {
    theme: string;
    seasonalTheme: string;
    customTileColors: string | null;
    customBackgroundColor: string | null;
    customTextColor: string | null;
    cardOpacity: number;
    soundEnabled: boolean;
    hapticEnabled: boolean;
    debugEnabled: boolean;
  };
  activeGame?: {
    id: number;
    playerId: number;
    difficulty: string;
    score: number;
    timeElapsed: number;
    gameState: any;
    isCompleted: boolean;
  };
  gameHistory?: any[];
}

/**
 * Export all data to a JSON file
 */
export async function exportData(
  playerId: number | null,
  settings: any,
  activeGame: any,
  gameHistory: any[]
): Promise<{ success: boolean; error?: string; filePath?: string }> {
  try {

    // Gather all data
    const exportData: ExportData = {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      settings,
      gameHistory,
    };

    // Add player data if available
    if (playerId) {
      const { getActivePlayer } = await import('./player-service');
      const player = await getActivePlayer();
      if (player) {
        exportData.player = {
          id: player.id,
          epitaph: player.epitaph,
          avatarId: player.avatarId,
          createdAt: player.createdAt.toISOString(),
        };
      }
    }

    // Add active game if available and not completed
    if (activeGame && !activeGame.isCompleted) {
      exportData.activeGame = {
        id: activeGame.id,
        playerId: activeGame.playerId,
        difficulty: activeGame.difficulty,
        score: activeGame.score,
        timeElapsed: activeGame.timeElapsed,
        gameState: activeGame.gameState,
        isCompleted: activeGame.isCompleted,
      };
    }

    // Convert to JSON
    const jsonData = JSON.stringify(exportData, null, 2);

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `2048-backup-${timestamp}.json`;

    // Save to app's external storage directory first
    const saveDir = FileSystem.externalDirectory || FileSystem.documentDirectory || '';
    const tempFilePath = `${saveDir}${filename}`;

    // Write to file
    await FileSystem.writeAsStringAsync(tempFilePath, jsonData);

    // Try to save to Download directory using SAF (Android 11+)
    if (Platform.OS === 'android') {
      try {
        // Check if SAF is available (StorageAccessFramework)
        const SAF = FileSystem.StorageAccessFramework;
        if (SAF) {
          try {
            // Request download directory access
            const dirUri = await SAF.requestDirectoryPermissionsAsync();

            if (dirUri) {
              // Create the file in download directory
              const fileUri = await SAF.createFileAsync(
                dirUri,
                filename,
                'application/json'
              );

              // Write content to the file
              await FileSystem.writeAsStringAsync(fileUri, jsonData);


              return {
                success: true,
                filePath: `/storage/emulated/0/Download/${filename}`
              };
            }
          } catch (safError) {
          }
        }

        // Fallback: Use sharing to let user save to Downloads
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(tempFilePath, {
            mimeType: 'application/json',
            dialogTitle: '保存备份文件到下载目录',
          });

          return {
            success: true,
            filePath: '请通过分享界面保存到下载目录'
          };
        } else {
          return {
            success: true,
            filePath: tempFilePath
          };
        }
      } catch (error) {
        console.error('[ExportService] Android export error:', error);
        return {
          success: true,
          filePath: tempFilePath
        };
      }
    } else {
      // For other platforms, use sharing
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(tempFilePath, {
          mimeType: 'application/json',
          dialogTitle: '保存备份文件',
        });
        return {
          success: true,
          filePath: '已通过分享保存'
        };
      }

      return { success: true, filePath: tempFilePath };
    }
  } catch (error) {
    console.error('[ExportService] Export failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Import data from a JSON file
 */
export async function importData(
  filePath: string
): Promise<{ success: boolean; error?: string; message?: string }> {
  try {

    // Read file
    const jsonData = await FileSystem.readAsStringAsync(filePath);

    // Parse JSON
    const importData: ExportData = JSON.parse(jsonData);

    // Validate version
    if (!importData.version) {
      throw new Error('Invalid data format: missing version');
    }

    const { execute, query } = await import('../lib/db-expo');

    // Import player data
    if (importData.player) {

      // Check if player already exists
      const existingPlayers = await query(
        'SELECT id FROM players WHERE epitaph = ?',
        [importData.player.epitaph]
      );

      if (existingPlayers.length > 0) {
      } else {
        await execute(
          `INSERT INTO players (epitaph, avatar_id, created_at) VALUES (?, ?, ?)`,
          [
            importData.player.epitaph,
            importData.player.avatarId,
            new Date(importData.player.createdAt).getTime(),
          ]
        );
      }
    }

    // Import settings
    if (importData.settings) {

      // Get current player (newly imported or existing)
      const players = await query('SELECT id FROM players LIMIT 1');
      if (players.length > 0) {
        const playerId = players[0].id;
        const { updateSettings } = await import('../services/settings-service');

        await updateSettings(playerId, importData.settings);
      }
    }

    // Import active game
    if (importData.activeGame) {

      // Check if game already exists
      const existingGames = await query(
        'SELECT id FROM games WHERE id = ?',
        [importData.activeGame.id]
      );

      if (existingGames.length === 0) {
        const { startGame } = await import('../services/game-service');

        // Create a new game with imported data
        const startData = await startGame({
          mode: importData.activeGame.difficulty === 'easy' ? 'simple' : 'endless',
          gridSize: importData.activeGame.gameState?.size || 4,
        });

        if (startData) {
          await execute(
            `UPDATE games SET
              game_state = ?,
              score = ?,
              time_elapsed = ?,
              updated_at = ?
            WHERE id = ?`,
            [
              JSON.stringify(importData.activeGame.gameState),
              importData.activeGame.score,
              importData.activeGame.timeElapsed,
              new Date(importData.activeGame.updatedAt).getTime(),
              startData.game.id,
            ]
          );
        }
      }
    }

    // Note: Game history is complex to import due to foreign key constraints,
    // so we skip it for now

    return {
      success: true,
      message: '数据导入成功！应用将重新加载。',
    };
  } catch (error) {
    console.error('[ImportService] Import failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Pick a file for import (works on both platforms)
 */
export async function pickImportFile(): Promise<{ success: boolean; filePath?: string; error?: string }> {
  try {
    if (Platform.OS === 'web') {
      // Web platform - use file input
      return {
        success: false,
        error: '请在桌面端使用此功能',
      };
    }

    // Native platform - use DocumentPicker
    const { pickFile } = await import('./document-picker');
    const result = await pickFile({
      type: 'application/json',
    });

    if (result.canceled) {
      return { success: false, error: '已取消' };
    }

    const filePath = result.assets[0]?.uri;
    if (!filePath) {
      return { success: false, error: '未选择文件' };
    }

    return { success: true, filePath };
  } catch (error) {
    console.error('[ImportService] File pick failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
