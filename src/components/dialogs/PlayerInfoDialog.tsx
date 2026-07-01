import React from 'react';
import { View, Text, Modal, TouchableOpacity } from 'react-native';
import { styles } from '../../lib/gameStyles';
import { getModalStyle, getZodiacName } from '../../lib/gameHelpers';
import { getZodiacEmoji } from '../../lib/zodiac-utils';

interface Player {
  id: number;
  epitaph: string;
  avatarId: number;
}

interface PlayerInfoDialogProps {
  visible: boolean;
  onClose: () => void;
  onDelete: () => void;
  onSwitchPlayer: () => void;
  player: Player | null;
  cardOpacity: number;
  seasonalTheme: string;
}

export function PlayerInfoDialog({
  visible,
  onClose,
  onDelete,
  onSwitchPlayer,
  player,
  cardOpacity,
  seasonalTheme,
}: PlayerInfoDialogProps) {
  const zodiacName = getZodiacName(player?.avatarId);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, getModalStyle(cardOpacity, seasonalTheme), styles.playerInfoModalContent]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>玩家信息</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={onClose}
            >
              <Text style={styles.modalCloseButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.playerInfoContainer}>
            <Text style={styles.playerInfoEmoji}>{getZodiacEmoji(zodiacName)}</Text>
            <View style={styles.playerInfoNameRow}>
              <Text style={styles.playerInfoName}>{player?.epitaph}</Text>
              <TouchableOpacity
                style={styles.playerInfoDeleteButton}
                onPress={onDelete}
              >
                <Text style={styles.playerInfoDeleteButtonText}>🗑️</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.playerInfoZodiac}>{zodiacName}</Text>
          </View>
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonPrimary]}
              onPress={onSwitchPlayer}
            >
              <Text style={styles.modalButtonText}>切换玩家</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonSecondary]}
              onPress={onClose}
            >
              <Text style={styles.modalButtonSecondaryText}>关闭</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
