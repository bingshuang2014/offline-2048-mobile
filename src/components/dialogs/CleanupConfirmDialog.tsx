import React from 'react';
import { View, Text, Modal, TouchableOpacity } from 'react-native';
import { styles } from '../../lib/gameStyles';
import { getModalStyle } from '../../lib/gameHelpers';

interface CleanupConfirmDialogProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  cardOpacity: number;
  seasonalTheme: string;
}

export function CleanupConfirmDialog({
  visible,
  onClose,
  onConfirm,
  cardOpacity,
  seasonalTheme,
}: CleanupConfirmDialogProps) {
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
            <Text style={styles.gameResultEmoji}>🗑️</Text>
            <Text style={styles.gameResultTitle}>清理所有数据</Text>
          </View>

          <View style={styles.gameResultInfo}>
            <Text style={[styles.gameResultPlayerName, { textAlign: 'center', marginBottom: 16 }]}>
              此操作将删除：
            </Text>
            <View style={{ alignItems: 'flex-start', marginLeft: 40, marginBottom: 16 }}>
              <Text style={[styles.gameResultStatLabel, { marginBottom: 8 }]}>• 所有玩家账户</Text>
              <Text style={[styles.gameResultStatLabel, { marginBottom: 8 }]}>• 所有游戏记录</Text>
              <Text style={[styles.gameResultStatLabel, { marginBottom: 8 }]}>• 所有个人设置</Text>
            </View>
            <Text style={[styles.gameResultStatLabel, { textAlign: 'center', color: '#ef4444' }]}>
              此操作不可撤销
            </Text>
          </View>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonSecondary, { flex: 1 }]}
              onPress={onClose}
            >
              <Text style={styles.modalButtonSecondaryText}>取消</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: '#ef4444', flex: 1 }]}
              onPress={onConfirm}
            >
              <Text style={styles.modalButtonText}>确定清理</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
