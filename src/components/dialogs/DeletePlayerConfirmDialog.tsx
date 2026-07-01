import React from 'react';
import { View, Text, Modal, TouchableOpacity } from 'react-native';
import { styles } from '../../lib/gameStyles';
import { getModalStyle } from '../../lib/gameHelpers';

interface Player {
  id: number;
  epitaph: string;
  avatarId: number;
}

interface DeletePlayerConfirmDialogProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  player: Player | null;
  cardOpacity: number;
  seasonalTheme: string;
}

export function DeletePlayerConfirmDialog({
  visible,
  onClose,
  onConfirm,
  player,
  cardOpacity,
  seasonalTheme,
}: DeletePlayerConfirmDialogProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, getModalStyle(cardOpacity, seasonalTheme)]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>确认删除</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={onClose}
            >
              <Text style={styles.modalCloseButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.confirmDialogContent}>
            <Text style={styles.confirmDialogMessage}>
              确定要删除玩家"{player?.epitaph}"吗？
            </Text>
            <Text style={styles.confirmDialogWarning}>
              此操作无法撤销，所有游戏数据将被永久删除。
            </Text>
          </View>
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonSecondary]}
              onPress={onClose}
            >
              <Text style={styles.modalButtonSecondaryText}>取消</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonDanger]}
              onPress={onConfirm}
            >
              <Text style={styles.modalButtonText}>确定删除</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
