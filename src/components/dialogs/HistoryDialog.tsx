import React from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { styles } from '../../lib/gameStyles';
import { getCardStyle, getModalStyle, getZodiacName } from '../../lib/gameHelpers';
import { getZodiacEmoji } from '../../lib/zodiac-utils';

interface HistoryEntry {
  id: number;
  playerEpitaph: string;
  playerAvatarId: number;
  difficulty: string;
  gridSize: number;
  score: number;
  timeElapsed: number;
  createdAt: Date;
}

interface HistoryDialogProps {
  visible: boolean;
  onClose: () => void;
  onFilterChange: (filter: string) => void;
  gameHistory: HistoryEntry[];
  historyFilter: string;
  loading: boolean;
  cardOpacity: number;
  seasonalTheme: string;
  themedStyles: {
    text: object;
    textSecondary: object;
    border: object;
    secondaryBorder: object;
    seasonButtonActive: object;
  };
}

export function HistoryDialog({
  visible,
  onClose,
  onFilterChange,
  gameHistory,
  historyFilter,
  loading,
  cardOpacity,
  seasonalTheme,
  themedStyles,
}: HistoryDialogProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, getModalStyle(cardOpacity, seasonalTheme), styles.historyModalContent]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>游戏历史</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={onClose}
            >
              <Text style={styles.modalCloseButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.historyListContainer}>
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
                  <View key={game.id} style={[styles.historyItem, getCardStyle(cardOpacity, seasonalTheme), themedStyles.border]}>
                    <View style={styles.historyItemAvatar}>
                      <Text style={styles.historyItemAvatarEmoji}>
                        {getZodiacEmoji(getZodiacName(game.playerAvatarId))}
                      </Text>
                    </View>
                    <View style={styles.historyItemLeft}>
                      <Text style={[styles.historyItemName, themedStyles.text]}>{game.playerEpitaph}</Text>
                      <Text style={[styles.historyItemMode, themedStyles.textSecondary]}>
                        {game.difficulty === 'easy' ? `简单 ${game.gridSize}x${game.gridSize}` : `无尽 ${game.gridSize}x${game.gridSize}`}
                      </Text>
                    </View>
                    <View style={styles.historyItemRight}>
                      <Text style={[styles.historyItemScore, themedStyles.text]}>{game.score} 分</Text>
                      <Text style={[styles.historyItemTime, themedStyles.textSecondary]}>
                        {Math.floor(game.timeElapsed / 60)}:{(game.timeElapsed % 60).toString().padStart(2, '0')}
                      </Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>

          <View style={styles.historyFilterContainer}>
            <View style={styles.historyFilterRow}>
              <Text style={[styles.historyFilterLabel, themedStyles.text]}>简单</Text>
              <View style={styles.historyFilterButtons}>
                {['easy-3', 'easy-4', 'easy-5'].map((filter) => (
                  <TouchableOpacity
                    key={filter}
                    style={[
                      styles.seasonButton,
                      getCardStyle(cardOpacity, seasonalTheme),
                      themedStyles.border,
                      historyFilter === filter && themedStyles.seasonButtonActive,
                    ]}
                    onPress={() => onFilterChange(filter)}
                  >
                    <Text style={[
                      styles.seasonButtonText,
                      { color: '#000000' },
                    ]}>
                      {filter === 'easy-3' ? '3x3' : filter === 'easy-4' ? '4x4' : '5x5'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.historyFilterRow}>
              <Text style={[styles.historyFilterLabel, themedStyles.text]}>无尽</Text>
              <View style={styles.historyFilterButtons}>
                {['hard-3', 'hard-4', 'hard-5'].map((filter) => (
                  <TouchableOpacity
                    key={filter}
                    style={[
                      styles.seasonButton,
                      getCardStyle(cardOpacity, seasonalTheme),
                      themedStyles.border,
                      historyFilter === filter && themedStyles.seasonButtonActive,
                    ]}
                    onPress={() => onFilterChange(filter)}
                  >
                    <Text style={[
                      styles.seasonButtonText,
                      { color: '#000000' },
                    ]}>
                      {filter === 'hard-3' ? '3x3' : filter === 'hard-4' ? '4x4' : '5x5'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
