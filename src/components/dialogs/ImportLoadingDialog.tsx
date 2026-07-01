import React from 'react';
import { View, Text, Modal, ActivityIndicator } from 'react-native';
import { styles } from '../../lib/gameStyles';
import { getModalStyle } from '../../lib/gameHelpers';

interface ImportLoadingDialogProps {
  visible: boolean;
  cardOpacity: number;
  seasonalTheme: string;
}

export function ImportLoadingDialog({
  visible,
  cardOpacity,
  seasonalTheme,
}: ImportLoadingDialogProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {}}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, getModalStyle(cardOpacity, seasonalTheme), styles.gameResultModalContent]}>
          <View style={styles.gameResultHeader}>
            <ActivityIndicator size="large" color="#8f7a66" />
            <Text style={[styles.gameResultTitle, { marginTop: 16 }]}>正在导入数据</Text>
          </View>

          <View style={styles.gameResultInfo}>
            <Text style={[styles.gameResultStatLabel, { textAlign: 'center' }]}>
              请稍候...
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}
