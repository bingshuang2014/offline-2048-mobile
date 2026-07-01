import React from 'react';
import { View, Text, Modal, TouchableOpacity } from 'react-native';
import { styles } from '../../lib/gameStyles';
import { getModalStyle } from '../../lib/gameHelpers';

interface ImportSuccessDialogProps {
  visible: boolean;
  onClose: () => void;
  message: string;
  cardOpacity: number;
  seasonalTheme: string;
}

export function ImportSuccessDialog({
  visible,
  onClose,
  message,
  cardOpacity,
  seasonalTheme,
}: ImportSuccessDialogProps) {
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
            <Text style={styles.gameResultEmoji}>📥</Text>
            <Text style={styles.gameResultTitle}>导入成功</Text>
          </View>

          <View style={styles.gameResultInfo}>
            <Text style={[styles.gameResultPlayerName, { textAlign: 'center', marginBottom: 16 }]}>
              {message}
            </Text>
            <Text style={[styles.gameResultStatLabel, { textAlign: 'center', color: '#78716c' }]}>
              应用将重新加载...
            </Text>
          </View>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonPrimary, { flex: 1 }]}
              onPress={onClose}
            >
              <Text style={styles.modalButtonText}>确定</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
