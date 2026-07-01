import React from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { styles } from '../../lib/gameStyles';
import { getCardStyle, getModalStyle, getZodiacName } from '../../lib/gameHelpers';
import { getZodiacEmoji } from '../../lib/zodiac-utils';

interface User {
  id: number;
  epitaph: string;
  avatar_id: number;
}

interface UserListDialogProps {
  visible: boolean;
  onClose: () => void;
  onSelectUser: (userId: number, epitaph: string) => void;
  onCreateNewPlayer: () => void;
  users: User[];
  loading: boolean;
  cardOpacity: number;
  seasonalTheme: string;
  themedStyles: {
    text: object;
    textSecondary: object;
    border: object;
    secondaryBorder: object;
  };
  uiColors: {
    avatarBg: string;
  };
}

export function UserListDialog({
  visible,
  onClose,
  onSelectUser,
  onCreateNewPlayer,
  users,
  loading,
  cardOpacity,
  seasonalTheme,
  themedStyles,
  uiColors,
}: UserListDialogProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, getModalStyle(cardOpacity, seasonalTheme), { maxHeight: '70%' }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>选择玩家</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={onClose}
            >
              <Text style={styles.modalCloseButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.userListLoading}>
              <ActivityIndicator size="large" color="#8f7a66" />
              <Text style={styles.userListLoadingText}>加载中...</Text>
            </View>
          ) : (
            <ScrollView style={styles.userListScroll}>
              <TouchableOpacity
                style={[styles.userItem, getCardStyle(cardOpacity, seasonalTheme), themedStyles.border]}
                onPress={onCreateNewPlayer}
              >
                <View style={[styles.userAvatar, { backgroundColor: uiColors.avatarBg }]}>
                  <Text style={styles.userAvatarEmoji}>➕</Text>
                </View>
                <View style={styles.userInfo}>
                  <Text style={[styles.userName, themedStyles.text]}>新建玩家</Text>
                  <Text style={[styles.userZodiac, themedStyles.textSecondary]}>创建新账户</Text>
                </View>
              </TouchableOpacity>

              {users.length === 0 ? (
                <View style={styles.userListEmpty}>
                  <Text style={[styles.userListEmptyText, themedStyles.textSecondary]}>暂无其他玩家</Text>
                </View>
              ) : (
                users.map((user) => (
                  <TouchableOpacity
                    key={user.id}
                    style={[styles.userItem, getCardStyle(cardOpacity, seasonalTheme), themedStyles.border]}
                    onPress={() => onSelectUser(user.id, user.epitaph)}
                  >
                    <View style={[styles.userAvatar, { backgroundColor: uiColors.avatarBg }]}>
                      <Text style={styles.userAvatarEmoji}>
                        {getZodiacEmoji(getZodiacName(user.avatar_id))}
                      </Text>
                    </View>
                    <View style={styles.userInfo}>
                      <Text style={[styles.userName, themedStyles.text]}>{user.epitaph}</Text>
                      <Text style={[styles.userZodiac, themedStyles.textSecondary]}>{getZodiacName(user.avatar_id)}</Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}
