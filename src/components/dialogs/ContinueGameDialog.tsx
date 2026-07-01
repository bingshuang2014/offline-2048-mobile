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

interface ContinueGameDialogProps {
  visible: boolean;
  onClose: () => void;
  onContinue: () => void;
  onStartNew: () => void;
  player: Player | null;
  cardOpacity: number;
  seasonalTheme: string;
  themedStyles: {
    text: object;
    textSecondary: object;
    border: object;
    secondaryBorder: object;
  };
}

export function ContinueGameDialog({
  visible,
  onClose,
  onContinue,
  onStartNew,
  player,
  cardOpacity,
  seasonalTheme,
  themedStyles,
}: ContinueGameDialogProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, getModalStyle(cardOpacity, seasonalTheme), styles.gameResultModalContent]}>
          <View style={styles.gameResultHeader}>
            <Text style={styles.gameResultEmoji}>🎮</Text>
            <Text style={[styles.gameResultTitle, themedStyles.text]}>
              发现未完成的游戏
            </Text>
          </View>

          <View style={styles.gameResultInfo}>
            <View style={styles.gameResultAvatar}>
              <Text style={styles.gameResultAvatarEmoji}>
                {getZodiacEmoji(getZodiacName(player?.avatarId))}
              </Text>
            </View>
            <Text style={[styles.gameResultPlayerName, themedStyles.text]}>{player?.epitaph}</Text>
            <View style={styles.confirmMessageContainer}>
              <Text style={[styles.confirmMessage, themedStyles.text]}>
                有一局未完成的游戏，您想继续游戏还是开新的一局？
              </Text>
            </View>
          </View>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, themedStyles.border]}
              onPress={onClose}
            >
              <Text style={[styles.modalButtonSecondaryText, { color: '#000000' }]}>取消</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonSecondary]}
              onPress={onContinue}
            >
              <Text style={styles.modalButtonSecondaryText}>继续游戏</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonPrimary]}
              onPress={onStartNew}
            >
              <Text style={styles.modalButtonText}>开新局</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
