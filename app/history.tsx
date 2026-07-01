/**
 * History Screen - Expo Router
 *
 * Game history screen displaying completed games.
 * Shows player epitaph, avatar, score, time, and game mode.
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { getGameHistory } from '../src/services/history-service';
import { getSeasonalTheme } from '../src/lib/seasonal-themes';
import { getSettings } from '../src/services';
import { getZodiacEmoji } from '../src/lib/zodiac-utils';

interface HistoryEntry {
  id: number;
  playerId: number;
  difficulty: string;
  gridSize: number;
  score: number;
  timeElapsed: number;
  playerEpitaph: string;
  playerAvatarId: number;
}

export default function HistoryScreen() {
  const router = useRouter();
  const [gameHistory, setGameHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyFilter, setHistoryFilter] = useState<string>('all');
  const [seasonalTheme, setSeasonalTheme] = useState<string>('winter');

  const getZodiacName = useCallback((avatarId: number | null | undefined): string => {
    if (avatarId === null || avatarId === undefined) {
      return '鼠';
    }
    const zodiacNames = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];
    const index = avatarId - 1;
    if (index < 0 || index >= zodiacNames.length) {
      return '鼠';
    }
    return zodiacNames[index] || '鼠';
  }, []);

  const theme = getSeasonalTheme(seasonalTheme);

  // Load settings
  useEffect(() => {
    async function loadSettings() {
      try {
        const { execute } = await import('../src/lib/db-expo');
        const result = await execute<{ value: string }>(
          "SELECT value FROM settings WHERE key = 'seasonalTheme'"
        );
        if (result && result.rows && result.rows._array.length > 0) {
          setSeasonalTheme(result.rows._array[0].value);
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    }
    loadSettings();
  }, []);

  // Load game history
  const loadGameHistory = useCallback(async (filter: string = 'all') => {
    if (loading) return;

    setLoading(true);
    setHistoryFilter(filter);

    try {
      let filters: any = {};

      if (filter === 'all') {
        // No filter
      } else if (filter === 'easy-3') {
        filters = { mode: 'easy', gridSize: 3 };
      } else if (filter === 'easy-4') {
        filters = { mode: 'easy', gridSize: 4 };
      } else if (filter === 'easy-5') {
        filters = { mode: 'easy', gridSize: 5 };
      } else if (filter === 'hard-3') {
        filters = { mode: 'hard', gridSize: 3 };
      } else if (filter === 'hard-4') {
        filters = { mode: 'hard', gridSize: 4 };
      }

      const history = await getGameHistory(filters);
      setGameHistory(history);
    } catch (error) {
      console.error('Failed to load game history:', error);
    } finally {
      setLoading(false);
    }
  }, [loading]);

  // Initial load
  useEffect(() => {
    loadGameHistory('all');
  }, []);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.background }]}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>← 返回</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>游戏历史</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content Container - Fixed Size */}
      <View style={styles.contentContainer}>
        <View style={[styles.historyContainer, { backgroundColor: theme.background }]}>
          {/* Filter buttons */}
          <View style={styles.historyFilterContainer}>
            <TouchableOpacity
              style={[styles.historyFilterButton, historyFilter === 'all' && styles.historyFilterButtonActive]}
              onPress={() => loadGameHistory('all')}
            >
              <Text style={[styles.historyFilterButtonText, historyFilter === 'all' && styles.historyFilterButtonTextActive]}>
                全部
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.historyFilterButton, historyFilter === 'easy-3' && styles.historyFilterButtonActiveEasy]}
              onPress={() => loadGameHistory('easy-3')}
            >
              <Text style={[styles.historyFilterButtonText, historyFilter === 'easy-3' && styles.historyFilterButtonTextActive]}>
                简单3x3
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.historyFilterButton, historyFilter === 'easy-4' && styles.historyFilterButtonActiveEasy]}
              onPress={() => loadGameHistory('easy-4')}
            >
              <Text style={[styles.historyFilterButtonText, historyFilter === 'easy-4' && styles.historyFilterButtonTextActive]}>
                简单4x4
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.historyFilterButton, historyFilter === 'easy-5' && styles.historyFilterButtonActiveEasy]}
              onPress={() => loadGameHistory('easy-5')}
            >
              <Text style={[styles.historyFilterButtonText, historyFilter === 'easy-5' && styles.historyFilterButtonTextActive]}>
                简单5x5
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.historyFilterButton, historyFilter === 'hard-3' && styles.historyFilterButtonActiveHard]}
              onPress={() => loadGameHistory('hard-3')}
            >
              <Text style={[styles.historyFilterButtonText, historyFilter === 'hard-3' && styles.historyFilterButtonTextActive]}>
                困难3x3
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.historyFilterButton, historyFilter === 'hard-4' && styles.historyFilterButtonActiveHard]}
              onPress={() => loadGameHistory('hard-4')}
            >
              <Text style={[styles.historyFilterButtonText, historyFilter === 'hard-4' && styles.historyFilterButtonTextActive]}>
                困难4x4
              </Text>
            </TouchableOpacity>
          </View>

          {/* History list or loading/empty state */}
          {loading ? (
            <View style={styles.historyLoadingContainer}>
              <ActivityIndicator size="large" color="#8f7a66" />
              <Text style={styles.historyLoadingText}>加载中...</Text>
            </View>
          ) : gameHistory.length === 0 ? (
            <View style={styles.historyEmptyContainer}>
              <Text style={styles.historyEmptyText}>暂无历史记录</Text>
            </View>
          ) : (
            <ScrollView style={styles.historyScroll} contentContainerStyle={styles.historyScrollContent}>
              {gameHistory.map((game) => (
                <View key={game.id} style={styles.historyItem}>
                  <View style={styles.historyItemAvatar}>
                    <Text style={styles.historyItemAvatarEmoji}>
                      {getZodiacEmoji(getZodiacName(game.playerAvatarId))}
                    </Text>
                  </View>
                  <View style={styles.historyItemLeft}>
                    <Text style={styles.historyItemName}>{game.playerEpitaph}</Text>
                    <Text style={styles.historyItemMode}>
                      {game.difficulty === 'easy' ? `简单 ${game.gridSize}x${game.gridSize}` : `无尽 ${game.gridSize}x${game.gridSize}`}
                    </Text>
                  </View>
                  <View style={styles.historyItemRight}>
                    <Text style={styles.historyItemScore}>{game.score} 分</Text>
                    <Text style={styles.historyItemTime}>
                      {Math.floor(game.timeElapsed / 60)}:{(game.timeElapsed % 60).toString().padStart(2, '0')}
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#faf8ef',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#bbada0',
  },
  backButton: {
    width: 80,
  },
  backButtonText: {
    fontSize: 16,
    color: '#8f7a66',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#776e65',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 80,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  historyContainer: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#bbada0',
    padding: 16,
    backgroundColor: '#faf8ef',
  },
  historyFilterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 8,
  },
  historyFilterButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#e7e5e4',
    borderWidth: 1,
    borderColor: '#d6d3d1',
    minWidth: 70,
    alignItems: 'center',
  },
  historyFilterButtonActive: {
    backgroundColor: '#8f7a66',
    borderColor: '#8f7a66',
  },
  historyFilterButtonActiveEasy: {
    backgroundColor: '#90ee90',
    borderColor: '#90ee90',
  },
  historyFilterButtonActiveHard: {
    backgroundColor: '#ef9a9a',
    borderColor: '#ef9a9a',
  },
  historyFilterButtonText: {
    fontSize: 12,
    color: '#78716c',
    fontWeight: '600',
  },
  historyFilterButtonTextActive: {
    color: '#ffffff',
  },
  historyLoadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  historyLoadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#78716c',
  },
  historyEmptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  historyEmptyText: {
    fontSize: 16,
    color: '#78716c',
  },
  historyScroll: {
    flex: 1,
  },
  historyScrollContent: {
    paddingBottom: 16,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#bbada0',
  },
  historyItemAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f2b179',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  historyItemAvatarEmoji: {
    fontSize: 20,
  },
  historyItemLeft: {
    flex: 1,
  },
  historyItemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#776e65',
  },
  historyItemMode: {
    fontSize: 12,
    color: '#776e65',
    opacity: 0.7,
    marginTop: 2,
  },
  historyItemRight: {
    alignItems: 'flex-end',
  },
  historyItemScore: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#d97706',
  },
  historyItemTime: {
    fontSize: 12,
    color: '#78716c',
    marginTop: 2,
  },
});
