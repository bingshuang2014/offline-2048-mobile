/**
 * Players Screen - Expo Router
 *
 * This screen shows the player list and allows switching/deleting players.
 * Migrated from src/screens/PlayersScreen.tsx to use expo-router navigation.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { getAllPlayers, switchPlayer, deletePlayer, getActivePlayer, clearActivePlayer } from '../src/services/player-service';
import { getZodiacEmoji } from '../src/lib/zodiac-utils';
import { formatDate } from '../src/lib/date-utils';
import type { Player } from '../src/lib/schema';

export default function PlayersScreen() {
  console.log('[PlayersScreen] 🎯 Component mounting...');
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // State
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [showSwitchConfirm, setShowSwitchConfirm] = useState(false);
  const [activePlayerId, setActivePlayerId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load players and active player
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [playersData, activePlayer] = await Promise.all([
          getAllPlayers(),
          getActivePlayer(),
        ]);
        setPlayers(playersData);
        if (activePlayer) {
          setActivePlayerId(activePlayer.id);
        }
      } catch (e) {
        console.error('Failed to load data:', e);
        setError('加载失败，请重试');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  function getZodiacName(avatarId: number): string {
    const zodiacNames = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];
    return zodiacNames[avatarId - 1] || '鼠';
  }

  async function handleSwitchPlayer(player: Player) {
    if (player.id === activePlayerId) {
      // Already active player, go back to game
      router.back();
      return;
    }
    setSelectedPlayer(player);
    setShowSwitchConfirm(true);
    setError(null);
  }

  async function confirmSwitch() {
    if (!selectedPlayer) return;

    setError(null);
    setSwitching(selectedPlayer.id);

    try {
      const success = await switchPlayer({ playerId: selectedPlayer.id });
      if (!success) {
        setError('切换玩家失败，请重试');
        setSwitching(null);
        return;
      }

      // Close dialog and navigate to game
      setShowSwitchConfirm(false);
      router.replace('/game');
    } catch (e) {
      console.error('Failed to switch player:', e);
      setError('切换玩家失败，请重试');
      setSwitching(null);
    }
  }

  async function handleDeletePlayer(player: Player) {
    // Cannot delete active player
    if (player.id === activePlayerId) {
      Alert.alert('错误', '不能删除当前活跃的玩家');
      return;
    }

    Alert.alert(
      '确认删除',
      `确定要删除玩家 "${player.epitaph}" 吗？此操作不可撤销。`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            setDeleting(player.id);
            try {
              const success = await deletePlayer(player.id);
              if (!success) {
                Alert.alert('错误', '删除失败，请重试');
                setDeleting(null);
                return;
              }

              // Refresh player list
              const updatedPlayers = await getAllPlayers();
              setPlayers(updatedPlayers);
              setDeleting(null);
            } catch (e) {
              console.error('Failed to delete player:', e);
              Alert.alert('错误', '删除失败，请重试');
              setDeleting(null);
            }
          },
        },
      ]
    );
  }

  async function handleCreateNewPlayer() {
    try {
      console.log('[PlayersScreen] Creating new player - clearing active player...');
      // Clear current active player
      const cleared = await clearActivePlayer();
      console.log('[PlayersScreen] Active player cleared:', cleared);

      // Navigate to home screen (player creation)
      console.log('[PlayersScreen] Navigating to home screen...');
      router.replace('/');
    } catch (e) {
      console.error('Failed to clear active player:', e);
      Alert.alert('错误', '清除玩家状态失败，请重试');
    }
  }

  // Loading state
  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#d97706" />
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>选择玩家</Text>
        <Text style={styles.headerSubtitle}>切换到不同的玩家账户</Text>
      </View>

      {/* Back button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Text style={styles.backButtonText}>← 返回</Text>
      </TouchableOpacity>

      {/* Players list */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {players.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>还没有玩家</Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={handleCreateNewPlayer}
            >
              <Text style={styles.createButtonText}>创建第一个玩家</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.playersList}>
            {players.map((player) => {
              const zodiacName = getZodiacName(player.avatarId);
              const zodiacEmoji = getZodiacEmoji(zodiacName);
              const isActive = player.id === activePlayerId;
              const isSwitchingThis = switching === player.id;
              const isDeletingThis = deleting === player.id;

              return (
                <View key={player.id} style={styles.playerCardContainer}>
                  <TouchableOpacity
                    style={[styles.playerCard, isActive && styles.activePlayerCard]}
                    onPress={() => handleSwitchPlayer(player)}
                    disabled={isSwitchingThis || isDeletingThis}
                  >
                    <View style={styles.playerCardContent}>
                      {/* Avatar */}
                      <View style={styles.avatarContainer}>
                        <Text style={styles.avatarEmoji}>{zodiacEmoji}</Text>
                      </View>

                      {/* Player info */}
                      <View style={styles.playerInfo}>
                        <Text style={styles.playerName}>{player.epitaph}</Text>
                        <Text style={styles.playerDetails}>
                          {zodiacName} · 创建于 {formatDate(player.createdAt)}
                        </Text>
                        {isActive && (
                          <Text style={styles.activeBadge}>当前玩家</Text>
                        )}
                      </View>

                      {/* Action indicator */}
                      {isSwitchingThis ? (
                        <ActivityIndicator size="small" color="#d97706" />
                      ) : isDeletingThis ? (
                        <ActivityIndicator size="small" color="#dc2626" />
                      ) : (
                        <Text style={styles.arrowIndicator}>›</Text>
                      )}
                    </View>
                  </TouchableOpacity>

                  {/* Delete button (only for non-active players) */}
                  {!isActive && !isSwitchingThis && !isDeletingThis && (
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeletePlayer(player)}
                    >
                      <Text style={styles.deleteButtonText}>删除</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* Create new player button */}
        {players.length > 0 && (
          <TouchableOpacity
            style={styles.createButtonSecondary}
            onPress={handleCreateNewPlayer}
          >
            <Text style={styles.createButtonSecondaryText}>+ 创建新玩家</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Confirmation modal */}
      <Modal
        visible={showSwitchConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSwitchConfirm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>确认切换</Text>
            <Text style={styles.modalDescription}>
              确定要切换到玩家{' '}
              <Text style={styles.modalPlayerName}>{selectedPlayer?.epitaph}</Text>{' '}
              吗？
            </Text>

            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setShowSwitchConfirm(false);
                  setSelectedPlayer(null);
                  setError(null);
                  setSwitching(null);
                }}
                disabled={switching !== null}
              >
                <Text style={styles.modalButtonCancelText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={confirmSwitch}
                disabled={switching !== null}
              >
                <Text style={styles.modalButtonConfirmText}>
                  {switching ? '切换中...' : '确认切换'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#faf8ef',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#78716c',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#b45309',
  },
  backButton: {
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d97706',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    color: '#92400e',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  emptyState: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fbbf24',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyText: {
    fontSize: 18,
    color: '#92400e',
    marginBottom: 24,
    textAlign: 'center',
  },
  playersList: {
    gap: 12,
  },
  playerCardContainer: {
    position: 'relative',
  },
  playerCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#fbbf24',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activePlayerCard: {
    borderColor: '#d97706',
    backgroundColor: 'rgba(254, 243, 199, 0.9)',
  },
  playerCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEmoji: {
    fontSize: 36,
  },
  playerInfo: {
    flex: 1,
    gap: 4,
  },
  playerName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  playerDetails: {
    fontSize: 14,
    color: '#78716c',
  },
  activeBadge: {
    fontSize: 12,
    color: '#d97706',
    fontWeight: '600',
    marginTop: 4,
  },
  arrowIndicator: {
    fontSize: 32,
    color: '#78716c',
    fontWeight: '300',
  },
  deleteButton: {
    position: 'absolute',
    right: 16,
    bottom: 8,
    backgroundColor: '#fee2e2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  deleteButtonText: {
    fontSize: 12,
    color: '#dc2626',
    fontWeight: '600',
  },
  createButton: {
    backgroundColor: '#d97706',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  createButtonSecondary: {
    marginTop: 24,
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#d97706',
    alignItems: 'center',
  },
  createButtonSecondaryText: {
    color: '#92400e',
    fontSize: 16,
    fontWeight: '600',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 16,
    color: '#78716c',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  modalPlayerName: {
    fontWeight: '600',
    color: '#1f2937',
  },
  errorContainer: {
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d97706',
  },
  modalButtonCancelText: {
    color: '#92400e',
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonConfirm: {
    backgroundColor: '#d97706',
  },
  modalButtonConfirmText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
