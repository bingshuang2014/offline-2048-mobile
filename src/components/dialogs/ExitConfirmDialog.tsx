import React from 'react';
import { View, Text, Modal, TouchableOpacity, BackHandler } from 'react-native';
import { styles } from '../../lib/gameStyles';
import { getModalStyle, getZodiacName } from '../../lib/gameHelpers';
import { getZodiacEmoji } from '../../lib/zodiac-utils';

interface Player {
  id: number;
  epitaph: string;
  avatarId: number;
}

interface ExitConfirmDialogProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  player: Player | null;
  cardOpacity: number;
  seasonalTheme: string;
  themedStyles: {
    text: object;
    textSecondary: object;
    border: object;
    secondaryBorder: object;
  };
  uiColors: {
    text: string;
    border: string;
    buttonBackground: string;
  };
}

export function ExitConfirmDialog({
  visible,
  onClose,
  onConfirm,
  player,
  cardOpacity,
  seasonalTheme,
  themedStyles,
  uiColors,
}: ExitConfirmDialogProps) {
  const handleConfirm = () => {
    onClose();
    onConfirm();
  };

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
            <Text style={styles.gameResultEmoji}>🚪</Text>
            <Text style={[styles.gameResultTitle, themedStyles.text]}>
              退出游戏
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
                确定要退出游戏吗？
              </Text>
            </View>
          </View>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, { borderWidth: 2, borderColor: uiColors.border }]}
              onPress={onClose}
            >
              <Text style={[styles.modalButtonSecondaryText, { color: uiColors.text }]}>取消</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: uiColors.buttonBackground, borderWidth: 2, borderColor: uiColors.buttonBackground }]}
              onPress={handleConfirm}
            >
              <Text style={[styles.modalButtonText, { color: '#000000' }]}>确定</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
