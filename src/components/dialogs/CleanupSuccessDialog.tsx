import React from 'react';
import { View, Text, Modal } from 'react-native';
import { styles } from '../../lib/gameStyles';
import { getModalStyle } from '../../lib/gameHelpers';

interface CleanupSuccessDialogProps {
  visible: boolean;
  onClose: () => void;
  cardOpacity: number;
  seasonalTheme: string;
}

export function CleanupSuccessDialog({
  visible,
  onClose,
  cardOpacity,
  seasonalTheme,
}: CleanupSuccessDialogProps) {
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
            <Text style={styles.gameResultEmoji}>✅</Text>
            <Text style={styles.gameResultTitle}>清理完成</Text>
          </View>

          <View style={styles.gameResultInfo}>
            <Text style={[styles.gameResultPlayerName, { textAlign: 'center' }]}>
              所有数据已成功清理
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}
