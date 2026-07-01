import React, { useRef } from 'react';
import { View, Text, Modal, TouchableOpacity, PanResponder } from 'react-native';
import { styles } from '../../lib/gameStyles';
import { getCardStyle, getModalStyle } from '../../lib/gameHelpers';

interface Player {
  id: number;
  epitaph: string;
  avatarId: number;
}

interface SettingsDialogProps {
  visible: boolean;
  onClose: () => void;
  player: Player | null;
  soundEnabled: boolean;
  hapticEnabled: boolean;
  debugEnabled: boolean;
  cardOpacity: number;
  seasonalTheme: string;
  exportingData: boolean;
  importingData: boolean;
  onSoundToggle: () => void;
  onHapticToggle: () => void;
  onDebugToggle: () => void;
  onCardOpacityChange: (value: number) => void;
  onSeasonalThemeChange: (season: string) => void;
  onCleanupAllData: () => void;
  onDeleteMyData: () => void;
  onExportData: () => void;
  onImportData: () => void;
  themedStyles: {
    text: object;
    textSecondary: object;
    border: object;
    secondaryBorder: object;
    toggleActive: object;
    toggleInactive: object;
    toggleTextInactive: object;
    seasonButtonActive: object;
  };
  uiColors: {
    buttonBackground: string;
  };
  opacitySliderRef: React.RefObject<View>;
  opacityPanResponder: PanResponder.Instance;
}

export function SettingsDialog({
  visible,
  onClose,
  player,
  soundEnabled,
  hapticEnabled,
  debugEnabled,
  cardOpacity,
  seasonalTheme,
  exportingData,
  importingData,
  onSoundToggle,
  onHapticToggle,
  onDebugToggle,
  onCardOpacityChange,
  onSeasonalThemeChange,
  onCleanupAllData,
  onDeleteMyData,
  onExportData,
  onImportData,
  themedStyles,
  uiColors,
  opacitySliderRef,
  opacityPanResponder,
}: SettingsDialogProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, getModalStyle(cardOpacity, seasonalTheme)]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>设置</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={onClose}
            >
              <Text style={styles.modalCloseButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Sound Toggle */}
          <View style={[styles.settingRow, themedStyles.secondaryBorder]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, themedStyles.text]}>声音</Text>
              <Text style={[styles.settingDescription, themedStyles.textSecondary]}>游戏音效</Text>
            </View>
            <TouchableOpacity
              style={[
                styles.settingToggle,
                soundEnabled ? themedStyles.toggleActive : themedStyles.toggleInactive
              ]}
              onPress={onSoundToggle}
            >
              <Text style={[
                styles.settingToggleText,
                soundEnabled ? { color: '#000000', fontWeight: 'bold' } : themedStyles.toggleTextInactive
              ]}>
                {soundEnabled ? '开' : '关'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Haptic Toggle */}
          <View style={[styles.settingRow, themedStyles.secondaryBorder]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, themedStyles.text]}>震动</Text>
              <Text style={[styles.settingDescription, themedStyles.textSecondary]}>触觉反馈</Text>
            </View>
            <TouchableOpacity
              style={[
                styles.settingToggle,
                hapticEnabled ? themedStyles.toggleActive : themedStyles.toggleInactive
              ]}
              onPress={onHapticToggle}
            >
              <Text style={[
                styles.settingToggleText,
                hapticEnabled ? { color: '#000000', fontWeight: 'bold' } : themedStyles.toggleTextInactive
              ]}>
                {hapticEnabled ? '开' : '关'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Debug Feature Toggle */}
          <View style={[styles.settingRow, themedStyles.secondaryBorder]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, themedStyles.text]}>调试功能</Text>
              <Text style={[styles.settingDescription, themedStyles.textSecondary]}>显示生成方块工具</Text>
            </View>
            <TouchableOpacity
              style={[
                styles.settingToggle,
                debugEnabled ? themedStyles.toggleActive : themedStyles.toggleInactive
              ]}
              onPress={onDebugToggle}
            >
              <Text style={[
                styles.settingToggleText,
                debugEnabled ? { color: '#000000', fontWeight: 'bold' } : themedStyles.toggleTextInactive
              ]}>
                {debugEnabled ? '开' : '关'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Cleanup Data Button */}
          <View style={[styles.settingRow, themedStyles.secondaryBorder]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, themedStyles.text]}>
                {player?.epitaph === 'admin' ? '清理所有数据' : '删除我的数据'}
              </Text>
              <Text style={[styles.settingDescription, themedStyles.textSecondary]}>
                {player?.epitaph === 'admin'
                  ? '删除全部玩家、游戏记录和设置'
                  : '删除当前玩家的游戏记录和设置'}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.dangerButton]}
              onPress={player?.epitaph === 'admin' ? onCleanupAllData : onDeleteMyData}
            >
              <Text style={styles.dangerButtonText}>
                {player?.epitaph === 'admin' ? '清理' : '删除'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Card Opacity */}
          <View style={[styles.settingRow, themedStyles.secondaryBorder]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, themedStyles.text]}>卡片透明度</Text>
              <Text style={[styles.settingDescription, themedStyles.textSecondary]}>{cardOpacity}%</Text>
            </View>
            <View style={styles.opacitySliderWrapper}>
              <View
                ref={opacitySliderRef}
                style={styles.opacitySliderTrack}
                {...opacityPanResponder.panHandlers}
              >
                <View style={[styles.opacitySliderFill, { width: `${cardOpacity}%`, backgroundColor: uiColors.buttonBackground }]} />
                <View
                  style={[styles.opacitySliderThumb, { left: `${cardOpacity}%`, backgroundColor: uiColors.buttonBackground }]}
                >
                  <View style={styles.thumbInner} />
                </View>
              </View>
              <View style={styles.opacityMarkers}>
                <TouchableOpacity onPress={() => onCardOpacityChange(0)}>
                  <Text style={[styles.opacityMarkerText, themedStyles.textSecondary]}>0%</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => onCardOpacityChange(50)}>
                  <Text style={[styles.opacityMarkerText, themedStyles.textSecondary]}>50%</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => onCardOpacityChange(100)}>
                  <Text style={[styles.opacityMarkerText, themedStyles.textSecondary]}>100%</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Seasonal Theme */}
          <View style={[styles.settingRow, themedStyles.secondaryBorder]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, themedStyles.text]}>季节主题</Text>
              <Text style={[styles.settingDescription, themedStyles.textSecondary]}>春 / 夏 / 秋 / 冬</Text>
            </View>
            <View style={styles.settingButtons}>
              {['spring', 'summer', 'autumn', 'winter'].map((season) => (
                <TouchableOpacity
                  key={season}
                  style={[
                    styles.seasonButton,
                    getCardStyle(cardOpacity, seasonalTheme),
                    themedStyles.border,
                    seasonalTheme === season && themedStyles.seasonButtonActive,
                  ]}
                  onPress={() => onSeasonalThemeChange(season)}
                >
                  <Text style={[
                    styles.seasonButtonText,
                    { color: '#000000' },
                  ]}>
                    {season === 'spring' ? '春' : season === 'summer' ? '夏' : season === 'autumn' ? '秋' : '冬'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Data Management */}
          <View style={styles.settingSection}>
            <Text style={[styles.settingSectionTitle, themedStyles.text]}>数据管理</Text>
            <View style={styles.dataManagementButtons}>
              <TouchableOpacity
                style={[styles.dataButton, getCardStyle(cardOpacity, seasonalTheme), themedStyles.border]}
                onPress={onExportData}
                disabled={exportingData}
              >
                <Text style={[styles.dataButtonText, { color: '#000000' }]}>
                  {exportingData ? '导出中...' : '📤 导出数据'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dataButton, getCardStyle(cardOpacity, seasonalTheme), themedStyles.border]}
                onPress={onImportData}
                disabled={importingData}
              >
                <Text style={[styles.dataButtonText, { color: '#000000' }]}>
                  {importingData ? '导入中...' : '📥 导入数据'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
