import React from 'react';
import { View, Text, Modal, TouchableOpacity, Platform } from 'react-native';
import { styles } from '../../lib/gameStyles';
import { getModalStyle } from '../../lib/gameHelpers';

interface ExportSuccessDialogProps {
  visible: boolean;
  onClose: () => void;
  filePath: string;
  cardOpacity: number;
  seasonalTheme: string;
}

export function ExportSuccessDialog({
  visible,
  onClose,
  filePath,
  cardOpacity,
  seasonalTheme,
}: ExportSuccessDialogProps) {
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
            <Text style={styles.gameResultEmoji}>📤</Text>
            <Text style={styles.gameResultTitle}>导出成功</Text>
          </View>

          <View style={styles.gameResultInfo}>
            <Text style={[styles.gameResultPlayerName, { textAlign: 'center', marginBottom: 16 }]}>
              游戏数据已导出至：
            </Text>
            <Text style={[styles.gameResultStatLabel, {
              textAlign: 'center',
              fontSize: 12,
              color: '#78716c',
              backgroundColor: '#f3f4f6',
              padding: 12,
              borderRadius: 8,
              fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace'
            }]}>
              {filePath}
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
