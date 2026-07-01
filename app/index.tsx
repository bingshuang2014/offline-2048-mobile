/**
 * Home Screen (Setup Screen) - Expo Router
 *
 * Player setup screen where users create their profile.
 * This is the entry point of the app (index route).
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  StatusBar,
  ScrollView,
  Modal,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { createPlayer, getPlayerByEpitaph, setActivePlayer, getAllPlayers, getActivePlayer, getSettings } from '../src/services';
import { getDefaultSettings } from '../src/services/settings-service';
import { getSeasonalTheme, getThemeUIColors } from '../src/lib/seasonal-themes';
import { importData } from '../src/services/data-export-service';
import { getZodiacEmoji, getZodiacEmojiById, getAllZodiacs } from '../src/lib/zodiac-utils';
import { formatDate, formatTime } from '../src/lib/date-utils';
import { getCardStyle as getThemeCardStyle } from '../src/lib/theme-utils';
import type { Player } from '../src/lib/schema';

interface ZodiacAvatar {
  id: number;
  name: string;
  imagePath: string;
}

// Mock zodiac avatars data (will be replaced with actual data from db)
const ZODIAC_AVATARS: ZodiacAvatar[] = [
  { id: 1, name: '鼠', imagePath: '/zodiac/rat.png' },
  { id: 2, name: '牛', imagePath: '/zodiac/ox.png' },
  { id: 3, name: '虎', imagePath: '/zodiac/tiger.png' },
  { id: 4, name: '兔', imagePath: '/zodiac/rabbit.png' },
  { id: 5, name: '龙', imagePath: '/zodiac/dragon.png' },
  { id: 6, name: '蛇', imagePath: '/zodiac/snake.png' },
  { id: 7, name: '马', imagePath: '/zodiac/horse.png' },
  { id: 8, name: '羊', imagePath: '/zodiac/goat.png' },
  { id: 9, name: '猴', imagePath: '/zodiac/monkey.png' },
  { id: 10, name: '鸡', imagePath: '/zodiac/rooster.png' },
  { id: 11, name: '狗', imagePath: '/zodiac/dog.png' },
  { id: 12, name: '猪', imagePath: '/zodiac/pig.png' },
];

export default function HomeScreen() {
  const router = useRouter();
  const [epitaph, setEpitaph] = useState('');
  const [selectedAvatarId, setSelectedAvatarId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [epitaphError, setEpitaphError] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState(false);
  const [showUserList, setShowUserList] = useState(false);
  const [users, setUsers] = useState<Player[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [cardOpacity, setCardOpacity] = useState(0); // 默认0%（完全透明）
  const [seasonalTheme, setSeasonalTheme] = useState<string>('winter'); // 默认冬季
  const [hasActivePlayer, setHasActivePlayer] = useState(false); // 是否有活跃玩家

  // Shake animations
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const avatarShakeAnim = useRef(new Animated.Value(0)).current;

  // Get theme colors
  const uiColors = useMemo(() => getThemeUIColors(seasonalTheme), [seasonalTheme]);

  // Dynamic styles based on theme
  const themedStyles = useMemo(() => ({
    text: { color: uiColors.text },
    textSecondary: { color: uiColors.textSecondary },
    border: { borderColor: uiColors.border },
    button: { backgroundColor: uiColors.buttonBackground },
    buttonText: { color: uiColors.buttonText },
  }), [uiColors]);

  // Load default settings on mount
  useEffect(() => {
    checkAndNavigate();
    loadUsers();
    loadDefaultSettings();
  }, []);

  const checkAndNavigate = async () => {
    try {
      console.log('[HomeScreen] Checking for active player and game...');

      // Check if there's an active player
      const activePlayer = await getActivePlayer();

      if (!activePlayer) {
        console.log('[HomeScreen] No active player, showing setup screen');
        setHasActivePlayer(false);
        return; // Show the setup screen (default UI)
      }

      console.log('[HomeScreen] Found active player:', activePlayer.epitaph);
      setHasActivePlayer(true);

      // Check if there's an active game
      const { getActiveGame: checkActiveGame } = await import('../src/services/game-service');
      const activeGame = await checkActiveGame();

      if (activeGame && !activeGame.isCompleted) {
        const gameState = activeGame.gameState;
        const isGameRunning = gameState && !gameState.gameOver && !gameState.won;

        if (isGameRunning) {
          console.log('[HomeScreen] Found active game, navigating to game screen');
          // Navigate directly to game screen (continue game)
          router.replace('/game');
          return;
        }
      }

      // 有玩家但没有进行中的游戏，跳转到游戏页面显示模式选择
      console.log('[HomeScreen] Active player found but no active game, navigating to game page');
      router.replace('/game');
    } catch (error) {
      console.error('[HomeScreen] Error checking navigation:', error);
    }
  };

  const loadDefaultSettings = async () => {
    try {
      const defaultSettings = await getDefaultSettings();
      setCardOpacity(defaultSettings.cardOpacity);
      setSeasonalTheme(defaultSettings.seasonalTheme);
    } catch (error) {
      console.error('Failed to load default settings:', error);
    }
  };

  const loadActivePlayerSettings = async () => {
    try {
      const activePlayer = await getActivePlayer();
      if (activePlayer) {
        const settings = await getSettings(activePlayer.id);
        setCardOpacity(settings.cardOpacity ?? 0);
        setSeasonalTheme(settings.seasonalTheme ?? 'winter');
      }
    } catch (error) {
      console.error('Failed to load active player settings:', error);
    }
  };

  // Get card style for transparency
  const getCardStyle = () => {
    return getThemeCardStyle(cardOpacity, seasonalTheme);
  };

  // Shake animation function for nickname label
  const shakeLabel = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 5, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -5, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  // Shake animation function for avatar label
  const shakeAvatarLabel = () => {
    Animated.sequence([
      Animated.timing(avatarShakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(avatarShakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(avatarShakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(avatarShakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(avatarShakeAnim, { toValue: 5, duration: 50, useNativeDriver: true }),
      Animated.timing(avatarShakeAnim, { toValue: -5, duration: 50, useNativeDriver: true }),
      Animated.timing(avatarShakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const playersData = await getAllPlayers();
      setUsers(playersData);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleOpenUserList = () => {
    setShowUserList(true);
  };

  const handleSelectUser = async (userId: number, userEpitaph: string) => {
    try {
      await setActivePlayer(userId);
      setShowUserList(false);

      // 选择用户后检查是否有进行中的游戏
      const { getActiveGame: checkActiveGame } = await import('../src/services/game-service');
      const activeGame = await checkActiveGame();

      if (activeGame && !activeGame.isCompleted) {
        const gameState = activeGame.gameState;
        const isGameRunning = gameState && !gameState.gameOver && !gameState.won;

        if (isGameRunning) {
          // 有进行中的游戏，直接进入
          router.replace('/game');
          return;
        }
      }

      // 没有进行中的游戏，跳转到游戏页面显示模式选择
      router.replace('/game');
    } catch (error) {
      Alert.alert('错误', '切换用户失败');
    }
  };

  const handleImportData = async () => {
    try {
      const result = await importData();

      if (result.success) {
        Alert.alert(
          '导入成功',
          result.message || '数据已恢复，应用将重新加载',
          [
            {
              text: '确定',
              onPress: () => {
                // 重新加载应用以应用导入的数据
                router.replace('/');
              },
            },
          ]
        );
      } else {
        Alert.alert('导入失败', result.error || '未知错误');
      }
    } catch (error) {
      Alert.alert('导入失败', (error as Error).message);
    }
  };

  const validateEpitaph = (value: string, triggerShake = false): boolean => {
    if (!value) {
      setEpitaphError('请输入昵称');
      if (triggerShake) {
        shakeLabel();
      }
      return false;
    }
    if (!value.trim()) {
      setEpitaphError('昵称不能只包含空格');
      if (triggerShake) {
        shakeLabel();
      }
      return false;
    }
    if (value.length > 10) {
      setEpitaphError('昵称不能超过10个字符');
      if (triggerShake) {
        shakeLabel();
      }
      return false;
    }
    // 允许汉字、英文字母、数字
    const isValid = /^[\u4e00-\u9fa5a-zA-Z0-9]+$/.test(value);
    if (!isValid) {
      setEpitaphError('昵称只能包含汉字、英文字母和数字');
      if (triggerShake) {
        shakeLabel();
      }
      return false;
    }
    setEpitaphError(null);
    return true;
  };

  const handleEpitaphChange = (value: string) => {
    setEpitaph(value);
    validateEpitaph(value, false);
  };

  const handleAvatarSelect = (avatarId: number) => {
    setSelectedAvatarId(avatarId);
    setAvatarError(false);
  };

  const handleSubmit = async () => {
    const isValid = validateEpitaph(epitaph, true);
    if (!isValid) {
      return;
    }

    if (!selectedAvatarId) {
      setAvatarError(true);
      shakeAvatarLabel();
      return;
    }

    setCreating(true);

    try {
      console.log('Starting player creation...');

      // Check if player already exists
      const existingPlayer = await getPlayerByEpitaph(epitaph.trim());

      let player;
      if (existingPlayer) {
        // Player exists, use existing player
        console.log('Player already exists, using existing player:', existingPlayer);
        player = existingPlayer;
      } else {
        // Create new player
        player = await createPlayer({
          epitaph: epitaph.trim(),
          avatarId: selectedAvatarId,
        });

        if (!player) {
          Alert.alert('错误', '创建玩家失败，请重试');
          return;
        }
      }

      // Set as active player
      await setActivePlayer(player.id);

      console.log('Player ready:', player);

      // 跳转到游戏页面，游戏页面会显示模式选择界面
      router.replace('/game');
    } catch (error) {
      console.error('Failed to setup player:', error);
      Alert.alert('错误', '操作失败：' + (error as Error).message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: getSeasonalTheme(seasonalTheme).background }]}>
      <StatusBar barStyle="dark-content" />

      {/* 创建玩家界面 */}
      <View style={styles.contentContainer}>
          {/* Logo */}
          <TouchableOpacity
            style={styles.logoContainer}
            onPress={handleImportData}
            activeOpacity={0.7}
          >
            <View style={[styles.logoGrid, { backgroundColor: uiColors.logoGridBg }]}>
              <View style={[styles.logoTile, { backgroundColor: getSeasonalTheme(seasonalTheme).tileColors[2] }]}>
                <Text style={[styles.logoTileText, themedStyles.text]}>2</Text>
              </View>
              <View style={[styles.logoTile, { backgroundColor: getSeasonalTheme(seasonalTheme).tileColors[4] }]}>
                <Text style={[styles.logoTileText, themedStyles.text]}>4</Text>
              </View>
              <View style={[styles.logoTile, { backgroundColor: getSeasonalTheme(seasonalTheme).tileColors[8] }]}>
                <Text style={[styles.logoTileText, themedStyles.text]}>8</Text>
              </View>
              <View style={[styles.logoTile, { backgroundColor: getSeasonalTheme(seasonalTheme).tileColors[16] }]}>
                <Text style={[styles.logoTileText, themedStyles.text]}>16</Text>
              </View>
            </View>
            <Text style={[styles.title, themedStyles.text]}>2048</Text>
            <Text style={[styles.subtitle, themedStyles.textSecondary]}>离线游戏 · 随时畅玩</Text>
          </TouchableOpacity>

          {/* Form */}
          <View style={[styles.formContainer, getCardStyle()]}>
            <View style={styles.inputWrapper}>
              <Animated.Text
                style={[
                  styles.label,
                  themedStyles.text,
                  epitaphError && styles.labelError,
                  { transform: [{ translateX: shakeAnim }] }
                ]}
              >
                您的昵称
              </Animated.Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={[styles.input, themedStyles.border]}
                  placeholder="请输入昵称"
                  placeholderTextColor="#9ca3af"
                  value={epitaph}
                  onChangeText={handleEpitaphChange}
                  maxLength={10}
                  autoCapitalize="none"
                  textAlign="center"
                  textAlignVertical="center"
                />
                <TouchableOpacity
                  style={[styles.dropdownButton, themedStyles.border, themedStyles.button]}
                  onPress={handleOpenUserList}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.dropdownIcon, themedStyles.buttonText]}>▽</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Animated.Text
              style={[
                styles.label,
                styles.avatarSectionLabel,
                themedStyles.text,
                avatarError && styles.labelError,
                { transform: [{ translateX: avatarShakeAnim }] }
              ]}
            >
              选择生肖头像
            </Animated.Text>
            <View style={styles.avatarGrid}>
              {ZODIAC_AVATARS.map((avatar) => (
                <TouchableOpacity
                  key={avatar.id}
                  style={
                    selectedAvatarId === avatar.id
                      ? [styles.avatarItem, styles.avatarItemSelected, { backgroundColor: uiColors.buttonBackground, borderColor: uiColors.buttonBackground }]
                      : styles.avatarItem
                  }
                  onPress={() => handleAvatarSelect(avatar.id)}
                >
                  <Text style={styles.avatarEmoji}>{getZodiacEmojiById(avatar.id)}</Text>
                  <Text style={[styles.avatarName, themedStyles.textSecondary]}>{avatar.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={creating ? [styles.submitButton, styles.submitButtonDisabled] : [styles.submitButton, themedStyles.button]}
              onPress={handleSubmit}
              disabled={creating}
            >
              {creating ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={[styles.submitButtonText, themedStyles.buttonText]}>开始游戏</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

      {/* User List Modal */}
      {showUserList && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, getCardStyle(), themedStyles.border]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, themedStyles.textSecondary]}>选择用户</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowUserList(false)}
              >
                <Text style={[styles.modalCloseButtonText, themedStyles.textSecondary]}>✕</Text>
              </TouchableOpacity>
            </View>

            {loadingUsers ? (
              <View style={styles.userListLoading}>
                <ActivityIndicator size="large" color={uiColors.buttonBackground} />
                <Text style={[styles.userListLoadingText, themedStyles.textSecondary]}>加载中...</Text>
              </View>
            ) : users.length === 0 ? (
              <View style={styles.userListEmpty}>
                <Text style={[styles.userListEmptyText, themedStyles.textSecondary]}>暂无用户</Text>
                <Text style={[styles.userListEmptyHint, themedStyles.textSecondary]}>请先创建一个用户</Text>
              </View>
            ) : (
              <ScrollView style={styles.userListScroll}>
                <View style={styles.userListScrollContent}>
                  <Text style={{ fontSize: 12, color: uiColors.textTertiary, marginBottom: 10, textAlign: 'center' }}>
                    共 {users.length} 个用户
                  </Text>
                  {users.map((user) => (
                    <TouchableOpacity
                      key={user.id}
                      style={[styles.userItem, themedStyles.border]}
                      onPress={() => handleSelectUser(user.id, user.epitaph)}
                    >
                      <View style={styles.userItemLeft}>
                        <View style={[styles.userAvatar, { backgroundColor: uiColors.avatarBg }]}>
                          <Text style={styles.userAvatarEmoji}>
                            {getZodiacEmojiById(user.avatarId)}
                          </Text>
                        </View>
                        <Text style={[styles.userName, themedStyles.text]}>{user.epitaph}</Text>
                      </View>
                      <Text style={[styles.userCreatedAt, themedStyles.textSecondary]}>
                        {formatDate(user.createdAt)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      )}
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoGrid: {
    width: 70,
    height: 70,
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 6,
    borderRadius: 10,
    marginBottom: 12,
  },
  logoTile: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
  },
  logoTileText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 6,
  },
  formContainer: {
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  labelError: {
    color: '#ef4444',
  },
  avatarSectionLabel: {
    textAlign: 'center',
    width: '100%',
  },
  input: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    borderRightWidth: 0,
    paddingLeft: 0,
    paddingRight: 0,
    paddingTop: 0,
    paddingBottom: 0,
    fontSize: 16,
    height: 46,
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    fontSize: 13,
    color: '#ef4444',
    marginBottom: 12,
    textAlign: 'center',
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
    marginBottom: 16,
    justifyContent: 'center',
  },
  avatarItem: {
    width: 65,
    height: 72,
    margin: 5,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#d6d3d1',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEmoji: {
    fontSize: 28,
  },
  avatarName: {
    fontSize: 13,
    marginTop: 3,
  },
  submitButton: {
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    maxWidth: 300,
    width: '100%',
  },
  submitButtonDisabled: {
    backgroundColor: '#d6d3d1',
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: 'bold',
  },
  modeSelectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  modeButton: {
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginBottom: 16,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  modeButtonTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  modeButtonDesc: {
    fontSize: 14,
    opacity: 0.9,
  },
  secondaryButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    width: '100%',
    backgroundColor: 'transparent',
    borderWidth: 2,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  inputWrapper: {
    marginBottom: 20,
    width: '100%',
    alignItems: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0,
    width: '100%',
    maxWidth: 280,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownButton: {
    width: 46,
    height: 46,
    backgroundColor: '#fef3c7',
    borderWidth: 2,
    borderLeftWidth: 0,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  dropdownIcon: {
    fontSize: 18,
    fontWeight: 'bold',
    lineHeight: 20,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  modalCloseButton: {
    padding: 8,
  },
  modalCloseButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  userListLoading: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  userListLoadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  userListEmpty: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  userListEmptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  userListEmptyHint: {
    fontSize: 14,
    opacity: 0.7,
  },
  userListScroll: {
    maxHeight: 400,
  },
  userListScrollContent: {
    paddingBottom: 20,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    marginBottom: 8,
    borderWidth: 1,
    width: '100%', // 填满弹窗宽度
  },
  userItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userAvatarEmoji: {
    fontSize: 20,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  userCreatedAt: {
    fontSize: 12,
    marginLeft: 8,
    textAlign: 'right',
    flex: 1,
  },
});
