/**
 * Game Screen - Expo Router
 *
 * Main game screen for 2048 game.
 * Migrated from src/screens/GameScreen.tsx to use expo-router navigation.
 */

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
  StatusBar,
  ScrollView,
  BackHandler,
  PanResponder,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { GameBoard } from '../src/components/GameBoard';
import type { GameState, Tile } from '../src/lib/game-logic';
import {
  getActiveGame,
  startGame,
  makeMove as makeMoveApi,
  deleteGame,
  cheatGame,
  getActivePlayer,
  endGame,
  deletePlayer,
  getPersonalBestByMode,
  getSettings,
  updateSettings,
  getGameHistory,
  getAllPlayers,
  clearActivePlayer,
} from '../src/services';
import type { HistoryEntry } from '../src/services/history-service';
import { exportData, importData, pickImportFile } from '../src/services/data-export-service';
import { getSeasonalTheme, getTileTextColor, getThemeUIColors } from '../src/lib/seasonal-themes';
import { getSoundManager, playSound } from '../src/lib/sounds';
import { getZodiacEmoji } from '../src/lib/zodiac-utils';
import {
  playHaptic,
  setHapticEnabled,
} from '../src/lib/haptics';
import type { Player } from '../src/lib/schema';
import { styles } from '../src/lib/gameStyles';
import { getZodiacName, formatTime, getCardStyle, getModalStyle, getModeLabel } from '../src/lib/gameHelpers';
import {
  RestartConfirmDialog,
  ExitConfirmDialog,
  ContinueGameDialog,
  PlayerInfoDialog,
  DeletePlayerConfirmDialog,
  UserListDialog,
  SettingsDialog,
  GameResultDialog,
  HistoryDialog,
  ExportSuccessDialog,
  CleanupConfirmDialog,
  CleanupSuccessDialog,
  ImportLoadingDialog,
  ImportSuccessDialog,
} from '../src/components/dialogs';

interface ActiveGame {
  id: number;
  playerId: number;
  difficulty: string;
  score: number;
  timeElapsed: number;
  gameState: GameState | null;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PersonalBest {
  'easy-3': number;
  'easy-4': number;
  'easy-5': number;
  'hard-3': number;
  'hard-4': number;
  'hard-5': number;
}

const MOVE_COOLDOWN = 150; // ms between moves
const GAME_OVER_DELAY = 3000; // 3 seconds delay before showing game over

export default function GameScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ playerId?: string }>();
  const { playerId } = params;
  const insets = useSafeAreaInsets();
  const [showUserListDialog, setShowUserListDialog] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // State
  const [player, setPlayer] = useState<Player | null>(null);
  const [activeGame, setActiveGame] = useState<ActiveGame | null>(null);
  const [personalBest, setPersonalBest] = useState<PersonalBest>({
    'easy-3': 0, 'easy-4': 0, 'easy-5': 0,
    'hard-3': 0, 'hard-4': 0, 'hard-5': 0,
  });
  const [loading, setLoading] = useState(true);
  const [seasonalTheme, setSeasonalTheme] = useState<string>('winter'); // 默认冬季主题
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hapticEnabled, setHapticEnabledState] = useState(true);
  const [customTileColors, setCustomTileColors] = useState<Record<number, string> | null>(null);
  const [customBackgroundColor, setCustomBackgroundColor] = useState<string | null>(null);
  const [customTextColor, setCustomTextColor] = useState<string | null>(null);
  const [cardOpacity, setCardOpacity] = useState<number>(0); // 默认0（完全透明）

  // Dialog states
  const [gameResultDialog, setGameResultDialog] = useState<{
    open: boolean;
    type: 'victory' | 'gameOver' | null;
  }>({ open: false, type: null });
  const [restartDialogOpen, setRestartDialogOpen] = useState(false);
  const [exitConfirmDialogOpen, setExitConfirmDialogOpen] = useState(false);
  const [continueGameDialogOpen, setContinueGameDialogOpen] = useState(false);
  const [pendingNewGame, setPendingNewGame] = useState<{ difficulty: 'easy' | 'hard'; size: number } | null>(null);
  const [isPaused, setIsPausedState] = useState(false);
  const [debugEnabled, setDebugEnabled] = useState(false); // Debug feature enabled from settings
  const [showDebugPanel, setShowDebugPanel] = useState(false); // Debug panel visibility
  const [currentDifficulty, setCurrentDifficulty] = useState<'easy' | 'hard'>('easy');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [viewReplayMode, setViewReplayMode] = useState(false);
  const [replayGameData, setReplayGameData] = useState<ActiveGame | null>(null);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [gameHistory, setGameHistory] = useState<HistoryEntry[]>([]);
  const [historyFilter, setHistoryFilter] = useState<string>('all'); // 'all' means show all initially
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [playerInfoDialogOpen, setPlayerInfoDialogOpen] = useState(false);
  const [deletePlayerConfirmOpen, setDeletePlayerConfirmOpen] = useState(false);
  const [exportingData, setExportingData] = useState(false);
  const [importingData, setImportingData] = useState(false);
  const [exportSuccessDialogOpen, setExportSuccessDialogOpen] = useState(false);
  const [cleanupConfirmDialogOpen, setCleanupConfirmDialogOpen] = useState(false);
  const [importLoadingDialogOpen, setImportLoadingDialogOpen] = useState(false);
  const [importSuccessDialogOpen, setImportSuccessDialogOpen] = useState(false);
  const [importSuccessMessage, setImportSuccessMessage] = useState<string>('');
  const [cleanupSuccessDialogOpen, setCleanupSuccessDialogOpen] = useState(false);
  const exportedFilePathRef = useRef<string>('');

  // Refs
  const isNavigatingHomeRef = useRef(false);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const soundManager = useRef(getSoundManager());
  const [isProcessingMove, setIsProcessingMove] = useState(false);
  const lastMoveTimeRef = useRef<number>(0);
  const gameOverDetectedRef = useRef<number | null>(null);
  const currentGameIdRef = useRef<number | null>(null);
  const gameOverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const gameResultDataRef = useRef<{ score: number; timeElapsed: number } | null>(null);
  const [isRestarting, setIsRestarting] = useState(false);
  const pauseStartRef = useRef<number | null>(null);
  const totalPausedTimeRef = useRef<number>(0);

  const theme = useMemo(() => getSeasonalTheme(seasonalTheme), [seasonalTheme]);
  const uiColors = useMemo(() => getThemeUIColors(seasonalTheme), [seasonalTheme]);

  // Generate theme-based styles
  const themedStyles = useMemo(() => ({
    text: { color: uiColors.text },
    textSecondary: { color: uiColors.textSecondary },
    border: { borderColor: uiColors.border },
    secondaryBorder: { borderColor: uiColors.secondaryBorder },
    primaryButton: { backgroundColor: uiColors.buttonBackground },
    toggleActive: {
      backgroundColor: uiColors.buttonBackground,
      borderColor: uiColors.buttonBackground,
      borderWidth: 2,
    },
    toggleInactive: {
      backgroundColor: '#e5e7eb',
      borderColor: '#9ca3af',
    },
    toggleText: { color: uiColors.buttonBackground },
    toggleTextInactive: { color: '#6b7280' },
    seasonButtonActive: {
      backgroundColor: uiColors.buttonBackground,
      borderColor: uiColors.buttonBackground,
      borderWidth: 2,
    },
    seasonButtonInactive: {
      backgroundColor: '#f3f4f6',
      borderColor: '#d1d5db',
    },
  }), [uiColors]);

  // 透明度滑块PanResponder
  const opacitySliderRef = useRef<View>(null);
  const sliderInfoRef = useRef<{ width: number; startX: number } | null>(null);
  const startOpacityRef = useRef<number>(100);

  const updateSliderInfo = useCallback(() => {
    if (!opacitySliderRef.current) return;

    opacitySliderRef.current.measure((_x, _y, width, _height, pageX, _pageY) => {
      sliderInfoRef.current = {
        width,
        startX: pageX,
      };
    });
  }, []);

  const handleOpacityPreset = useCallback(async (value: number) => {
    setCardOpacity(value);

    if (player) {
      try {
        await updateSettings(player.id, { cardOpacity: value });
      } catch (error) {
        console.error('❌ Failed to save card opacity:', error);
      }
    }
  }, [player]);

  const handleExportData = useCallback(async () => {
    if (!player) {
      Alert.alert('错误', '请先创建玩家');
      return;
    }

    setExportingData(true);
    try {
      // Prepare settings data
      const settingsData = {
        theme: seasonalTheme,
        seasonalTheme,
        customTileColors: customTileColors ? JSON.stringify(customTileColors) : null,
        customBackgroundColor,
        customTextColor,
        cardOpacity,
        soundEnabled,
        hapticEnabled,
        debugEnabled,
      };

      const result = await exportData(
        player.id,
        settingsData,
        activeGame,
        gameHistory
      );

      if (result.success) {
        exportedFilePathRef.current = result.filePath || '';
        setExportSuccessDialogOpen(true);
      } else {
        Alert.alert('导出失败', result.error || '未知错误');
      }
    } catch (error) {
      console.error('[Export] Error:', error);
      Alert.alert('导出失败', error instanceof Error ? error.message : '未知错误');
    } finally {
      setExportingData(false);
    }
  }, [player, seasonalTheme, customTileColors, customBackgroundColor, customTextColor, cardOpacity, soundEnabled, hapticEnabled, debugEnabled, activeGame, gameHistory]);

  const handleImportData = useCallback(async () => {
    setImportingData(true);
    try {
      // Pick file
      const pickResult = await pickImportFile();

      if (!pickResult.success) {
        if (pickResult.error !== '已取消') {
          Alert.alert('选择文件失败', pickResult.error || '未知错误');
        }
        return;
      }

      if (!pickResult.filePath) {
        Alert.alert('错误', '未选择文件');
        return;
      }

      // Import data
      setImportLoadingDialogOpen(true);

      const result = await importData(pickResult.filePath);

      setImportLoadingDialogOpen(false);

      if (result.success) {
        setImportSuccessMessage(result.message || '数据导入成功');
        setImportSuccessDialogOpen(true);
      } else {
        Alert.alert('导入失败', result.error || '未知错误');
      }
    } catch (error) {
      console.error('[Import] Error:', error);
      Alert.alert('导入失败', error instanceof Error ? error.message : '未知错误');
    } finally {
      setImportingData(false);
    }
  }, []);

  const handleCleanupAllData = useCallback(async () => {
    setCleanupConfirmDialogOpen(true);
  }, []);

  const handleConfirmCleanup = useCallback(async () => {
    try {

      // Get all players
      const players = await getAllPlayers();

      // Delete all players (this will cascade delete games and settings)
      for (const player of players) {
        await deletePlayer(player.id);
      }

      // Clear active player
      await clearActivePlayer();

      // Close settings dialog and cleanup dialog
      setSettingsDialogOpen(false);
      setCleanupConfirmDialogOpen(false);

      // Show success dialog
      setCleanupSuccessDialogOpen(true);

      // Navigate to home screen after delay
      setTimeout(() => {
        router.replace('/');
      }, 1500);
    } catch (error) {
      console.error('[GameScreen] Cleanup failed:', error);
      setCleanupConfirmDialogOpen(false);
      Alert.alert('❌ 清理失败', '清理数据时出错，请重试');
    }
  }, []);

  const handleDeleteMyData = useCallback(async () => {
    if (!player) {
      Alert.alert('❌ 错误', '未找到当前玩家');
      return;
    }

    // Show confirmation dialog
    setDeletePlayerConfirmOpen(true);
  }, [player]);

  const opacityPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderStart: (event) => {
        updateSliderInfo();
        startOpacityRef.current = cardOpacity;

        // 处理点击：直接跳转到点击位置
        if (sliderInfoRef.current) {
          const { width, startX } = sliderInfoRef.current;
          const clickX = event.nativeEvent.pageX;
          const relativeX = clickX - startX;

          let newOpacity = Math.round((relativeX / width) * 100);
          newOpacity = Math.max(0, Math.min(100, newOpacity));

          setCardOpacity(newOpacity);
          startOpacityRef.current = newOpacity; // 更新起始值，从新位置开始拖动

          if (player) {
            updateSettings(player.id, { cardOpacity: newOpacity }).catch(err => {
              console.error('❌ Failed to save card opacity:', err);
            });
          }
        }
      },
      onPanResponderMove: (_event, gestureState) => {
        if (sliderInfoRef.current) {
          const { width } = sliderInfoRef.current;

          // 基于起始透明度和移动距离计算新透明度
          let newOpacity = Math.round(startOpacityRef.current + (gestureState.dx / width) * 100);
          newOpacity = Math.max(0, Math.min(100, newOpacity));

          setCardOpacity(newOpacity);
        }
      },
      onPanResponderRelease: (_event, gestureState) => {
        // 保存最终值
        if (sliderInfoRef.current && player) {
          const { width } = sliderInfoRef.current;
          let newOpacity = Math.round(startOpacityRef.current + (gestureState.dx / width) * 100);
          newOpacity = Math.max(0, Math.min(100, newOpacity));

          updateSettings(player.id, { cardOpacity: newOpacity }).catch(err => {
            console.error('❌ Failed to save card opacity:', err);
          });
        }
      },
    })
  ).current;

  // Handle seasonal theme change and persist to database
  const handleSeasonalThemeChange = useCallback(async (season: string) => {
    if (!player) return;

    setSeasonalTheme(season);

    try {
      await updateSettings(player.id, { seasonalTheme: season });
    } catch (error) {
      console.error('❌ Failed to save seasonal theme:', error);
    }
  }, [player]);

  // Start new game
  const startNewGame = useCallback(async (difficulty: 'easy' | 'hard', size?: number) => {
    try {
      // 检查是否有未完成的游戏
      if (activeGame && !activeGame.isCompleted) {
        const gameState = activeGame.gameState;
        const isGameRunning = gameState && !gameState.gameOver && !gameState.won;

        if (isGameRunning) {
          // 有未完成的游戏，显示询问对话框
          setPendingNewGame({ difficulty, size: size || (difficulty === 'easy' ? 4 : 3) });
          setContinueGameDialogOpen(true);
          return;
        }
      }


      setIsRestarting(true);
      setRestartDialogOpen(false);
      setViewReplayMode(false);
      setReplayGameData(null);
      setElapsedTime(0);
      totalPausedTimeRef.current = 0;
      pauseStartRef.current = null;

      if (currentGameIdRef.current) {
        try {
          await deleteGame(currentGameIdRef.current);
        } catch (e) {
          console.error('Failed to mark previous game as completed:', e);
        }
      }

      // Clear active game immediately to avoid showing both containers
      setActiveGame(null);
      currentGameIdRef.current = null;


      if (gameOverTimeoutRef.current) {
        clearTimeout(gameOverTimeoutRef.current);
        gameOverTimeoutRef.current = null;
      }
      gameOverDetectedRef.current = null;
      gameResultDataRef.current = null;

      const startData = await startGame({
        mode: difficulty === 'easy' ? 'simple' : 'endless',
        gridSize: (size || 4) as 3 | 4 | 5,
      });

      if (!startData) {
        console.error('Failed to start game');
        return;
      }

      const newGame: ActiveGame = {
        id: startData.game.id,
        playerId: startData.game.playerId,
        difficulty: startData.game.difficulty,
        score: startData.game.score,
        timeElapsed: startData.game.timeElapsed,
        gameState: startData.initialState,
        isCompleted: startData.game.isCompleted,
        createdAt: startData.game.createdAt.toISOString(),
        updatedAt: startData.game.updatedAt.toISOString(),
      };

      setActiveGame(newGame);
      setCurrentDifficulty(newGame.difficulty as 'easy' | 'hard');
      currentGameIdRef.current = newGame.id;
      setIsPausedState(false);
      setIsRestarting(false);

      const now = Date.now();
      const createdAt = new Date(newGame.createdAt).getTime();
      const initialElapsed = Math.floor((now - createdAt) / 1000);
      setElapsedTime(initialElapsed);
    } catch (e) {
      console.error('Failed to start new game:', e);
      setIsRestarting(false);
    }
  }, []);

  // Make move
  const makeMove = useCallback(
    async (direction: 'up' | 'down' | 'left' | 'right') => {
      if (viewReplayMode) return;
      if (isPaused) return;
      if (!activeGame || activeGame.isCompleted) return;
      if (activeGame.gameState?.gameOver || activeGame.gameState?.won) return;
      if (restartDialogOpen || gameResultDialog.open) return;
      if (isProcessingMove) return;

      const now = Date.now();
      if (now - lastMoveTimeRef.current < MOVE_COOLDOWN) return;

      setIsProcessingMove(true);
      lastMoveTimeRef.current = now;

      try {
        const updatedGame = await makeMoveApi(activeGame.id, { direction });

        if (!updatedGame) {
          const refreshedGame = await getActiveGame();
          if (refreshedGame) {
            try {
              setActiveGame({
                id: refreshedGame.id,
                playerId: refreshedGame.playerId,
                difficulty: refreshedGame.difficulty,
                score: refreshedGame.score,
                timeElapsed: refreshedGame.timeElapsed,
                gameState: refreshedGame.gameState,
                isCompleted: refreshedGame.isCompleted,
                createdAt: refreshedGame.createdAt instanceof Date
                  ? refreshedGame.createdAt.toISOString()
                  : new Date(refreshedGame.createdAt as any).toISOString(),
                updatedAt: refreshedGame.updatedAt instanceof Date
                  ? refreshedGame.updatedAt.toISOString()
                  : new Date(refreshedGame.updatedAt as any).toISOString(),
              });
            } catch (e) {
              console.error('Failed to set refreshed game:', e);
            }
          }
          return;
        }

        // Play haptic feedback (independent of sound setting)
        if (hapticEnabled) {
          void playHaptic('move');
        }

        // Play sound (independent of haptic setting)
        if (soundEnabled) {
          void playSound('move');
        }

        try {
          const updatedActiveGame = {
            id: updatedGame.id,
            playerId: updatedGame.playerId,
            difficulty: updatedGame.difficulty,
            score: updatedGame.score,
            timeElapsed: updatedGame.timeElapsed,
            gameState: updatedGame.gameState,
            isCompleted: updatedGame.isCompleted,
            createdAt: updatedGame.createdAt instanceof Date
              ? updatedGame.createdAt.toISOString()
              : new Date(updatedGame.createdAt as any).toISOString(),
            updatedAt: updatedGame.updatedAt instanceof Date
              ? updatedGame.updatedAt.toISOString()
              : new Date(updatedGame.updatedAt as any).toISOString(),
          };
          setActiveGame(updatedActiveGame);

        } catch (e) {
          console.error('Failed to set active game:', e);
          console.error('updatedGame:', updatedGame);
        }
      } catch (e) {
        console.error('Failed to make move:', e);
      } finally {
        setTimeout(() => {
          setIsProcessingMove(false);
        }, 100);
      }
    },
    [
      viewReplayMode,
      isPaused,
      activeGame,
      restartDialogOpen,
      gameResultDialog.open,
      isProcessingMove,
      soundEnabled,
      hapticEnabled,
    ]
  );

  // Prevent back button from exiting game
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        // Show confirmation dialog
        setExitConfirmDialogOpen(true);
        return true; // Prevent default back behavior
      };

      const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => backHandler.remove();
    }, [])
  );

  // Load initial data - use useFocusEffect to reload when screen gets focus
  useFocusEffect(
    useCallback(() => {
      async function loadGameInit() {
        try {
          // Reset loading state
          setLoading(true);

          const playerData = await getActivePlayer();
          if (!playerData) {
            router.replace('/');
            return;
          }

          setPlayer(playerData);

          // Load settings (including seasonal theme, sound, and haptic)
          const settingsData = await getSettings(playerData.id);
          setSeasonalTheme(settingsData.seasonalTheme);
          setSoundEnabled(settingsData.soundEnabled ?? true);
          setHapticEnabledState(settingsData.hapticEnabled ?? true);
          setHapticEnabled(settingsData.hapticEnabled ?? true); // Update haptic manager state
          setCustomTileColors(settingsData.customTileColors ? JSON.parse(settingsData.customTileColors) : null);
          setCustomBackgroundColor(settingsData.customBackgroundColor);
          setCustomTextColor(settingsData.customTextColor);
          setCardOpacity(settingsData.cardOpacity ?? 100);
          setDebugEnabled(settingsData.debugEnabled ?? false); // Load debug enabled setting

          // Load personal best scores for all modes
          const modes = [
            { difficulty: 'easy' as const, gridSize: 3 as const, key: 'easy-3' as const },
            { difficulty: 'easy' as const, gridSize: 4 as const, key: 'easy-4' as const },
            { difficulty: 'easy' as const, gridSize: 5 as const, key: 'easy-5' as const },
            { difficulty: 'hard' as const, gridSize: 3 as const, key: 'hard-3' as const },
            { difficulty: 'hard' as const, gridSize: 4 as const, key: 'hard-4' as const },
            { difficulty: 'hard' as const, gridSize: 5 as const, key: 'hard-5' as const },
          ];

          const bestScores: PersonalBest = {
            'easy-3': 0,
            'easy-4': 0,
            'easy-5': 0,
            'hard-3': 0,
            'hard-4': 0,
            'hard-5': 0,
          };

          for (const mode of modes) {
            const best = await getPersonalBestByMode(playerData.id, mode.difficulty, mode.gridSize);
            bestScores[mode.key] = best;
          }

          setPersonalBest(bestScores);

          const activeGameData = await getActiveGame();

          if (activeGameData) {
            const activeGame: ActiveGame = {
              id: activeGameData.id,
              playerId: activeGameData.playerId,
              difficulty: activeGameData.difficulty,
              score: activeGameData.score,
              timeElapsed: activeGameData.timeElapsed,
              gameState: activeGameData.gameState,
              isCompleted: activeGameData.isCompleted,
              createdAt: activeGameData.createdAt.toISOString(),
              updatedAt: activeGameData.updatedAt.toISOString(),
            };

            if (!activeGame.gameState) {
              console.warn('⚠️ [GameScreen] Active game has no gameState! Deleting corrupted game.');
              // Delete the corrupted game record and show mode selection
              await deleteGame(activeGameData.id);
              setActiveGame(null);
            } else {
              setActiveGame(activeGame);
              setCurrentDifficulty(activeGameData.difficulty as 'easy' | 'hard');
              currentGameIdRef.current = activeGameData.id;

              const now = Date.now();
              const createdAt = new Date(activeGame.createdAt).getTime();
              const initialElapsed = Math.floor((now - createdAt) / 1000);
              setElapsedTime(initialElapsed);
              totalPausedTimeRef.current = 0;
              pauseStartRef.current = Date.now(); // Start pause timer immediately
              setIsPausedState(true); // Pause the restored game by default
            }
          } else {
            // No active game, show mode selection interface in game page
            setActiveGame(null);
          }
        } catch (e) {
          console.error('❌ [GameScreen] Failed to load game init:', e);
          router.replace('/');
        } finally {
          setLoading(false);
        }
      }
      loadGameInit();
    }, [router])
  );

  // Monitor game state for game over / victory
  useEffect(() => {
    if (!activeGame || !activeGame.gameState || viewReplayMode) {
      return;
    }

    const { gameOver, won } = activeGame.gameState;

    // Show game result dialog when game ends
    if ((gameOver || won) && !gameResultDialog.open && !restartDialogOpen) {

      // Save game data for dialog before clearing activeGame
      gameResultDataRef.current = {
        score: activeGame.score,
        timeElapsed: elapsedTime,
      };

      // First, mark the game as completed in database
      // This ensures the game appears in history
      endGame(activeGame.id, activeGame.score, elapsedTime).then(async (success) => {
        if (success && player) {
          // Refresh personal best for the current mode
          const modeKey = `${activeGame.difficulty}-${activeGame.gameState?.size || 4}` as keyof PersonalBest;
          const newBest = await getPersonalBestByMode(player.id, activeGame.difficulty, (activeGame.gameState?.size || 4) as 3 | 4 | 5);


          setPersonalBest(prev => ({
            ...prev,
            [modeKey]: newBest,
          }));
        }

      }).catch((error) => {
        console.error('[GameScreen] Failed to mark game as completed:', error);
      });

      // Clear game over timeout
      if (gameOverTimeoutRef.current) {
        clearTimeout(gameOverTimeoutRef.current);
        gameOverTimeoutRef.current = null;
      }
      gameOverDetectedRef.current = null;

      // Save game state for replay viewing before clearing
      setReplayGameData({
        ...activeGame,
        timeElapsed: elapsedTime, // Use current elapsed time from state
      });

      // Clear activeGame to show mode selection background
      setActiveGame(null);
      currentGameIdRef.current = null;

      // Show game result dialog
      setGameResultDialog({
        open: true,
        type: won ? 'victory' : 'gameOver',
      });
    }
  }, [activeGame?.gameState?.gameOver, activeGame?.gameState?.won, activeGame?.id, activeGame?.score]);

  // Timer effect (simplified - just showing the structure)
  useEffect(() => {
    if (viewReplayMode) return;

    if (
      !activeGame ||
      activeGame.isCompleted ||
      isPaused ||
      activeGame.gameState?.gameOver ||
      activeGame.gameState?.won
    ) {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      if (!activeGame) {
        setElapsedTime(0);
        totalPausedTimeRef.current = 0;
        pauseStartRef.current = null;
      }
      return;
    }

    const createdAt = new Date(activeGame.createdAt).getTime();
    const now = Date.now();
    const elapsed = Math.floor((now - createdAt - totalPausedTimeRef.current) / 1000);
    setElapsedTime(elapsed);

    timerIntervalRef.current = setInterval(() => {
      const currentTime = Date.now();
      const newElapsed = Math.floor((currentTime - createdAt - totalPausedTimeRef.current) / 1000);
      setElapsedTime(newElapsed);
    }, 1000);

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [
    activeGame?.id,
    activeGame?.isCompleted,
    isPaused,
    activeGame?.gameState?.gameOver,
    activeGame?.gameState?.won,
    viewReplayMode,
  ]);

  // Handlers
  const handlePauseToggle = useCallback(() => {
    const newPaused = !isPaused;

    if (newPaused) {
      pauseStartRef.current = Date.now();
    } else {
      if (pauseStartRef.current) {
        const pauseDuration = Date.now() - pauseStartRef.current;
        totalPausedTimeRef.current += pauseDuration;
        pauseStartRef.current = null;
      }
    }

    setIsPausedState(newPaused);
  }, [isPaused]);

  const handleDebugPanelToggle = useCallback(() => {
    setShowDebugPanel(prev => !prev);
  }, []);

  const handleEndGame = useCallback(async () => {
    if (!activeGame || !player) return;
    try {

      // Mark game as completed so it appears in history
      const success = await endGame(activeGame.id, activeGame.score, elapsedTime);

      if (success) {
        // Refresh personal best for the current mode
        const modeKey = `${activeGame.difficulty}-${activeGame.gameState?.size || 4}` as keyof PersonalBest;
        const newBest = await getPersonalBestByMode(player.id, activeGame.difficulty, (activeGame.gameState?.size || 4) as 3 | 4 | 5);


        setPersonalBest(prev => ({
          ...prev,
          [modeKey]: newBest,
        }));
      }

      // DO NOT delete the game - we want to keep it in history!
      // The game is now marked as completed and will appear in history

      // Clear all game-related state
      setActiveGame(null);
      currentGameIdRef.current = null;
      setElapsedTime(0);
      totalPausedTimeRef.current = 0;
      pauseStartRef.current = null;

      // Clear any pending timeouts
      if (gameOverTimeoutRef.current) {
        clearTimeout(gameOverTimeoutRef.current);
        gameOverTimeoutRef.current = null;
      }
      gameOverDetectedRef.current = null;
      gameResultDataRef.current = null;

      // Clear game result dialog
      setGameResultDialog({ open: false, type: null });

    } catch (e) {
      console.error('Failed to end game:', e);
    }
  }, [activeGame, player]);

  const handleRestartConfirm = useCallback(async () => {
    setRestartDialogOpen(false);

    // Determine difficulty and size based on current mode
    let difficulty: 'easy' | 'hard' = currentDifficulty;
    let size: number | undefined = undefined;

    if (viewReplayMode && replayGameData?.gameState) {
      // Use replay game data
      difficulty = replayGameData.difficulty as 'easy' | 'hard';
      size = replayGameData.gameState.size;
    } else if (activeGame?.gameState) {
      // Use active game data
      difficulty = activeGame.difficulty as 'easy' | 'hard';
      size = activeGame.gameState.size;
    }

    // Exit view replay mode if active
    if (viewReplayMode) {
      setViewReplayMode(false);
      setReplayGameData(null);
    }

    await startNewGame(difficulty, size);
  }, [currentDifficulty, startNewGame, viewReplayMode, replayGameData, activeGame]);

  const handlePlayAgain = useCallback(() => {
    setGameResultDialog({ open: false, type: null });
    setRestartDialogOpen(false);

    // Determine difficulty and size based on current mode
    let difficulty: 'easy' | 'hard' = currentDifficulty;
    let size: number | undefined = undefined;

    if (replayGameData?.gameState) {
      // Use replay game data (game just ended)
      difficulty = replayGameData.difficulty as 'easy' | 'hard';
      size = replayGameData.gameState.size;
    } else if (activeGame?.gameState) {
      // Use active game data (game in progress)
      difficulty = activeGame.difficulty as 'easy' | 'hard';
      size = activeGame.gameState.size;
    }

    // Exit view replay mode if active
    if (viewReplayMode) {
      setViewReplayMode(false);
      setReplayGameData(null);
    }

    startNewGame(difficulty, size);
  }, [currentDifficulty, startNewGame, viewReplayMode, replayGameData, activeGame]);

  const handleGoHome = useCallback(async () => {
    setGameResultDialog({ open: false, type: null });
    setActiveGame(null);
    currentGameIdRef.current = null;
    setElapsedTime(0);
    totalPausedTimeRef.current = 0;
    pauseStartRef.current = null;
    router.replace('/'); // 返回到主页（选择游戏模式界面）
  }, []);

  const handleViewReplay = useCallback(() => {
    // Enter view replay mode
    setGameResultDialog({ open: false, type: null });
    setViewReplayMode(true);
    // replayGameData is already saved when game ends
  }, []);

  const handleExitViewReplay = useCallback(() => {
    // Exit view replay mode and go to mode selection
    setViewReplayMode(false);
    setReplayGameData(null);
    setActiveGame(null);
    currentGameIdRef.current = null;
  }, []);

  const handleContinueGame = useCallback(() => {
    // 用户选择继续游戏
    setContinueGameDialogOpen(false);
    setPendingNewGame(null);
    // activeGame 已经设置好了，无需操作
  }, []);

  const handleStartNewGame = useCallback(async () => {
    // 用户选择开新游戏
    setContinueGameDialogOpen(false);

    if (!pendingNewGame) {
      console.error('[GameScreen] No pending new game data');
      return;
    }

    const { difficulty, size } = pendingNewGame;
    setPendingNewGame(null);

    // 执行开始新游戏的逻辑

    setIsRestarting(true);
    setViewReplayMode(false);
    setReplayGameData(null);
    setElapsedTime(0);
    totalPausedTimeRef.current = 0;
    pauseStartRef.current = null;

    if (currentGameIdRef.current) {
      try {
        await deleteGame(currentGameIdRef.current);
      } catch (e) {
        console.error('Failed to delete previous game:', e);
      }
    }

    try {
      const startData = await startGame({
        mode: difficulty === 'easy' ? 'simple' : 'endless',
        gridSize: size as 3 | 4 | 5,
      });

      if (!startData) {
        console.error('Failed to start game');
        setIsRestarting(false);
        return;
      }

      const newGame: ActiveGame = {
        id: startData.game.id,
        playerId: startData.game.playerId,
        difficulty: startData.game.difficulty,
        score: startData.game.score,
        timeElapsed: startData.game.timeElapsed,
        gameState: startData.initialState,
        isCompleted: startData.game.isCompleted,
        createdAt: startData.game.createdAt.toISOString(),
        updatedAt: startData.game.updatedAt.toISOString(),
      };

      setActiveGame(newGame);
      setCurrentDifficulty(newGame.difficulty as 'easy' | 'hard');
      currentGameIdRef.current = newGame.id;
      setIsPausedState(false);
      setIsRestarting(false);
    } catch (error) {
      console.error('Failed to start new game:', error);
      setIsRestarting(false);
    }
  }, [pendingNewGame]);

  const handleSwitchPlayer = useCallback(async () => {
    try {
      const { execute } = await import('../src/lib/db-expo');
      await execute("DELETE FROM active_player WHERE id = 1");

      setPlayerInfoDialogOpen(false);
      setActiveGame(null);
      currentGameIdRef.current = null;
      setElapsedTime(0);
      totalPausedTimeRef.current = 0;
      pauseStartRef.current = null;

      // Navigate to setup screen using expo-router
      router.replace('/');
    } catch (e) {
      console.error('Failed to switch player:', e);
      Alert.alert('错误', '切换玩家失败，请重试');
    }
  }, [router]);

  // Open history dialog
  const handleOpenHistory = useCallback(() => {
    setHistoryDialogOpen(true);
    loadGameHistory('all');
  }, []);

  // Load game history
  const loadGameHistory = useCallback(async (filter: string = 'all') => {
    // Avoid reloading if already loading
    if (loadingHistory) return;

    // Update filter immediately for instant UI response
    setHistoryFilter(filter);

    // Don't show loading state - local DB queries are fast
    // Only show loading on initial load when no data exists yet
    if (gameHistory.length === 0) {
      setLoadingHistory(true);
    }

    try {
      let filters: any = {};

      if (filter === 'all') {
        // No filter - show all games
      } else if (filter === 'easy-3') {
        filters = { mode: 'easy', gridSize: 3 };
      } else if (filter === 'easy-4') {
        filters = { mode: 'easy', gridSize: 4 };
      } else if (filter === 'easy-5') {
        filters = { mode: 'easy', gridSize: 5 };
      } else if (filter === 'hard-3') {
        filters = { mode: 'hard', gridSize: 3 };
      } else if (filter === 'hard-4') {
        filters = { mode: 'hard', gridSize: 4 };
      } else if (filter === 'hard-5') {
        filters = { mode: 'hard', gridSize: 5 };
      }

      const history = await getGameHistory(filters);
      setGameHistory(history);
    } catch (error) {
      console.error('Failed to load game history:', error);
      Alert.alert('错误', '加载历史记录失败');
    } finally {
      setLoadingHistory(false);
    }
  }, [loadingHistory, gameHistory.length]);

  // Load all users for user list dialog
  const loadAllUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const { query } = await import('../src/lib/db-expo');
      const users = await query(`
        SELECT id, epitaph, avatar_id, created_at
        FROM players
        ORDER BY created_at DESC
      `);
      setAllUsers(users);
    } catch (e) {
      console.error('Failed to load users:', e);
      Alert.alert('错误', '加载用户列表失败');
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  // Pre-load users when screen focuses (for instant display)
  useFocusEffect(
    useCallback(() => {
      loadAllUsers();
    }, [loadAllUsers])
  );

  // Open user list dialog
  const handleOpenUserList = useCallback(() => {
    setPlayerInfoDialogOpen(false);
    setShowUserListDialog(true);
  }, []);

  // Delete current player
  const handleDeletePlayer = useCallback(async () => {
    if (!player) return;

    try {
      const success = await deletePlayer(player.id);

      if (success) {
        router.replace('/');
      } else {
        Alert.alert('错误', '删除玩家失败');
      }
    } catch (error) {
      console.error('[GameScreen] Error deleting player:', error);
      Alert.alert('错误', '删除玩家失败');
    }
  }, [player, router]);

  // Switch to selected user
  const handleSelectUser = useCallback(async (userId: number, userEpitaph: string) => {
    try {
      const { execute } = await import('../src/lib/db-expo');
      await execute("INSERT OR REPLACE INTO active_player (id, player_id) VALUES (1, ?)", [userId]);

      setShowUserListDialog(false);
      setPlayerInfoDialogOpen(false);

      // Reload current page to trigger reload with new player
      router.replace('/game');
    } catch (e) {
      console.error('Failed to switch user:', e);
      Alert.alert('错误', '切换用户失败');
    }
  }, [router]);

  const handleCheat = useCallback(
    async (value: number) => {
      if (!activeGame) return;

      try {
        const result = await cheatGame(activeGame.id, value);

        if (!result) {
          console.error('Failed to cheat - no result returned');
          Alert.alert('调试失败', '无法生成方块，棋盘可能已满');
          return;
        }


        // Use the returned game state directly instead of re-querying
        // This avoids race conditions and ensures the UI updates immediately
        const updatedGameState = result.game_state as GameState;
        const updatedTime = Date.now();

        setActiveGame({
          id: activeGame.id,
          playerId: activeGame.playerId,
          difficulty: activeGame.difficulty,
          score: updatedGameState.score,
          timeElapsed: activeGame.timeElapsed,
          gameState: updatedGameState,
          isCompleted: activeGame.isCompleted,
          createdAt: activeGame.createdAt,
          updatedAt: new Date(updatedTime).toISOString(),
        });

      } catch (e) {
        console.error('Failed to cheat:', e);
        Alert.alert('调试失败', '生成方块时出错：' + (e instanceof Error ? e.message : '未知错误'));
      }
    },
    [activeGame]
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8f7a66" />
        <Text style={styles.loadingText}>加载中...</Text>
      </View>
    );
  }

  if (!player) {
    return null;
  }

  const zodiacName = getZodiacName(player.avatarId);
  const currentTheme = getSeasonalTheme(seasonalTheme);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="dark-content" />
      {/* Top Section: Header + Scores */}
      <View style={[styles.topSection, { paddingTop: insets.top + 16 }]}>
        {/* Header */}
        <View style={[styles.header, getCardStyle(cardOpacity, seasonalTheme), themedStyles.border]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.avatarButton}
            onPress={handleOpenUserList}
          >
            <Text style={styles.avatarEmoji}>{getZodiacEmoji(zodiacName)}</Text>
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={[styles.playerName, themedStyles.text]}>{player.epitaph}</Text>
            <Text style={[styles.modeLabel, themedStyles.textSecondary]}>
              {viewReplayMode ? '查看对局' : getModeLabel(activeGame)}
            </Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.iconButton, themedStyles.border]}
            onPress={() => setSoundEnabled(!soundEnabled)}
          >
            <Text style={styles.iconText}>{soundEnabled ? '🔊' : '🔇'}</Text>
          </TouchableOpacity>
          {debugEnabled && (
            <TouchableOpacity
              style={[styles.iconButton, themedStyles.border]}
              onPress={handleDebugPanelToggle}
            >
              <Text style={styles.iconText}>🐛</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.iconButton, themedStyles.border]}
            onPress={() => setSettingsDialogOpen(true)}
          >
            <Text style={styles.iconText}>⚙️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Debug buttons panel - floating overlay, top edge aligned with score container */}
      {debugEnabled && showDebugPanel && activeGame && !viewReplayMode && (
        <View style={[
          styles.debugPanelOverlay,
          {
            top: insets.top + 112, // header (80) + marginBottom (16) + topSection paddingTop (16) = insets.top + 112
          }
        ]}>
          <View style={[styles.debugPanel, getCardStyle(cardOpacity, seasonalTheme), themedStyles.border]}>
            <Text style={[styles.debugPanelTitle, themedStyles.textSecondary]}>调试工具</Text>
            <View style={styles.debugButtonGrid}>
              {[4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048].map((value) => {
                const bgColor = theme.tileColors[value] || '#eee4da';
                const textColor = getTileTextColor(value, seasonalTheme);
                return (
                  <TouchableOpacity
                    key={value}
                    style={[styles.debugTileButton, { backgroundColor: bgColor }]}
                    onPress={() => handleCheat(value)}
                  >
                    <Text style={[styles.debugTileButtonText, { color: textColor }]}>{value}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      )}

      {/* Score, Best, Timer */}
      <View style={[styles.scoreContainer, getCardStyle(cardOpacity, seasonalTheme), themedStyles.border]}>
        <View style={styles.scoreItem}>
          <Text style={[styles.scoreLabel, themedStyles.textSecondary]}>当前得分</Text>
          <Text style={[styles.scoreValue, themedStyles.text]}>
            {viewReplayMode && replayGameData ? replayGameData.score : (activeGame?.score ?? 0)}
          </Text>
        </View>
        <View style={[styles.scoreItem, styles.scoreDivider, themedStyles.border]}>
          <Text style={[styles.scoreLabel, themedStyles.textSecondary]}>最佳纪录</Text>
          <Text style={[styles.scoreValue, themedStyles.text]}>
            {(() => {
              const game = viewReplayMode ? replayGameData : activeGame;
              if (!game) return '无';
              const modeKey = `${game.difficulty}-${game.gameState?.size || 4}` as keyof PersonalBest;
              return personalBest[modeKey] || '无';
            })()}
          </Text>
        </View>
        <View style={styles.scoreItem}>
          <Text style={[styles.scoreLabel, themedStyles.textSecondary]}>耗时</Text>
          <Text style={[styles.scoreValue, themedStyles.text]}>
            {viewReplayMode && replayGameData
              ? formatTime(replayGameData.timeElapsed)
              : activeGame ? formatTime(elapsedTime) : '0:00'}
          </Text>
        </View>
      </View>
      </View>

      {/* Middle Section: Game board (centered) */}
      <View style={styles.middleSection}>
        {(() => {
          if (viewReplayMode && replayGameData && replayGameData.gameState) {
            return (
              <View style={[styles.boardContainer, { backgroundColor: theme.background }, themedStyles.border, styles.containerShadow]}>
                <GameBoard
                  key={`replay-${replayGameData.gameId}`}
                  grid={replayGameData.gameState.grid}
                  size={replayGameData.gameState.grid.length}
                  seasonalTheme={seasonalTheme}
                  customTileColors={customTileColors}
                  customTextColor={customTextColor}
                  cardStyle={getCardStyle(cardOpacity, seasonalTheme)}
                />
              </View>
            );
          } else if (activeGame && activeGame.gameState) {
            return (
              <View style={[styles.boardContainer, { backgroundColor: theme.background }, themedStyles.border, styles.containerShadow]}>
                <GameBoard
                  key={activeGame.id}
                  grid={activeGame.gameState.grid}
                  size={activeGame.gameState.grid.length}
                  seasonalTheme={seasonalTheme}
                  customTileColors={customTileColors}
                  customTextColor={customTextColor}
                  onMove={makeMove}
                  cardStyle={getCardStyle(cardOpacity, seasonalTheme)}
                />
                {isPaused && (
                  <View style={styles.pauseOverlay}>
                    <Text style={styles.pauseEmoji}>⏸️</Text>
                    <Text style={styles.pauseText}>游戏已暂停</Text>
                    <Text style={styles.pauseSubtext}>点击"继续"按钮恢复游戏</Text>
                  </View>
                )}
              </View>
            );
          } else {
            return (
              <View style={[styles.modeSelection, { backgroundColor: theme.background }, themedStyles.border, styles.containerShadow]}>
                <Text style={[styles.modeSelectionTitle, themedStyles.text]}>选择游戏模式</Text>
                <Text style={[styles.modeSelectionSubtitle, themedStyles.textSecondary]}>选择难度和网格大小开始新游戏</Text>

                <View style={styles.modeSection}>
                  <Text style={[styles.modeTitle, themedStyles.text]}>简单模式</Text>
                  <View style={styles.sizeButtons}>
                    {[3, 4, 5].map((size) => {
                      // 简单模式使用数值2的格子颜色
                      const bgColor = theme.tileColors[2];
                      const textColor = getTileTextColor(2, seasonalTheme);

                      return (
                        <TouchableOpacity
                          key={size}
                          style={[
                            styles.sizeButton,
                            themedStyles.border,
                            { backgroundColor: bgColor },
                          ]}
                          onPress={() => startNewGame('easy', size)}
                        >
                          <Text style={[styles.sizeButtonText, { color: textColor }]}>{size}x{size}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                <View style={[styles.modeSection, styles.modeSectionBorder, themedStyles.border]}>
                  <Text style={[styles.modeTitle, themedStyles.text]}>无尽模式</Text>
                  <View style={styles.sizeButtons}>
                    {[3, 4, 5].map((size) => {
                      // 无尽模式使用数值4的格子颜色
                      const bgColor = theme.tileColors[4];
                      const textColor = getTileTextColor(4, seasonalTheme);

                      return (
                        <TouchableOpacity
                          key={size}
                          style={[
                            styles.sizeButton,
                            themedStyles.border,
                            { backgroundColor: bgColor },
                          ]}
                          onPress={() => startNewGame('hard', size)}
                        >
                          <Text style={[styles.sizeButtonText, { color: textColor }]}>{size}x{size}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </View>
            );
          }
        })()}
      </View>

      {/* Bottom Section: Action buttons */}
      <View style={styles.bottomSection}>
        <View style={styles.actionButtons}>
          {viewReplayMode ? (
            <>
              {/* View replay mode buttons */}
              <TouchableOpacity
                style={[styles.actionButton, getCardStyle(cardOpacity, seasonalTheme), themedStyles.border, styles.actionButtonDisabled]}
                onPress={handlePauseToggle}
                disabled={true}
              >
                <Text style={[styles.actionButtonText, themedStyles.text, styles.actionButtonTextDisabled]}>
                  暂停
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, getCardStyle(cardOpacity, seasonalTheme), themedStyles.border]}
                onPress={handleExitViewReplay}
              >
                <Text style={[styles.actionButtonText, themedStyles.text]}>结束游戏</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, getCardStyle(cardOpacity, seasonalTheme), themedStyles.border]}
                onPress={() => {
                  setRestartDialogOpen(true);
                }}
              >
                <Text style={[styles.actionButtonText, themedStyles.text]}>再玩一局</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, getCardStyle(cardOpacity, seasonalTheme), themedStyles.border]}
                onPress={handleOpenHistory}
              >
                <Text style={[styles.actionButtonText, themedStyles.text]}>游戏历史</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {/* Normal game buttons */}
              <TouchableOpacity
                style={[styles.actionButton, getCardStyle(cardOpacity, seasonalTheme), themedStyles.border, (!activeGame) && styles.actionButtonDisabled]}
                onPress={handlePauseToggle}
                disabled={!activeGame}
              >
                <Text style={[styles.actionButtonText, themedStyles.text, (!activeGame) && styles.actionButtonTextDisabled]}>
                  {isPaused ? '继续' : '暂停'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, getCardStyle(cardOpacity, seasonalTheme), themedStyles.border, (!activeGame || isPaused) && styles.actionButtonDisabled]}
                onPress={handleEndGame}
                disabled={!activeGame || isPaused}
              >
                <Text style={[styles.actionButtonText, themedStyles.text, (!activeGame || isPaused) && styles.actionButtonTextDisabled]}>
                  结束游戏
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, getCardStyle(cardOpacity, seasonalTheme), themedStyles.border, (!activeGame) && styles.actionButtonDisabled]}
                onPress={() => setRestartDialogOpen(true)}
                disabled={!activeGame}
              >
                <Text style={[styles.actionButtonText, themedStyles.text, (!activeGame) && styles.actionButtonTextDisabled]}>
                  重新开始
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, getCardStyle(cardOpacity, seasonalTheme), themedStyles.border]}
                onPress={handleOpenHistory}
              >
                <Text style={[styles.actionButtonText, themedStyles.text]}>
                  游戏历史
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* Restart Confirm Dialog */}
      <RestartConfirmDialog
        visible={restartDialogOpen}
        onClose={() => setRestartDialogOpen(false)}
        onConfirm={handleRestartConfirm}
        viewReplayMode={viewReplayMode}
        replayGameData={replayGameData}
        activeGame={activeGame}
        elapsedTime={elapsedTime}
        cardOpacity={cardOpacity}
        seasonalTheme={seasonalTheme}
        themedStyles={themedStyles}
      />

      {/* Exit Confirm Dialog */}
      <ExitConfirmDialog
        visible={exitConfirmDialogOpen}
        onClose={() => setExitConfirmDialogOpen(false)}
        onConfirm={() => {
          setActiveGame(null);
          currentGameIdRef.current = null;
          BackHandler.exitApp();
        }}
        player={player}
        cardOpacity={cardOpacity}
        seasonalTheme={seasonalTheme}
        themedStyles={themedStyles}
        uiColors={uiColors}
      />

      {/* Continue or Start New Game Dialog */}
      <ContinueGameDialog
        visible={continueGameDialogOpen}
        onClose={() => {
          setContinueGameDialogOpen(false);
          setPendingNewGame(null);
        }}
        onContinue={handleContinueGame}
        onStartNew={handleStartNewGame}
        player={player}
        cardOpacity={cardOpacity}
        seasonalTheme={seasonalTheme}
        themedStyles={themedStyles}
      />

      <PlayerInfoDialog
        visible={playerInfoDialogOpen}
        onClose={() => setPlayerInfoDialogOpen(false)}
        onDelete={() => setDeletePlayerConfirmOpen(true)}
        onSwitchPlayer={handleOpenUserList}
        player={player}
        cardOpacity={cardOpacity}
        seasonalTheme={seasonalTheme}
      />

      <DeletePlayerConfirmDialog
        visible={deletePlayerConfirmOpen}
        onClose={() => setDeletePlayerConfirmOpen(false)}
        onConfirm={handleDeletePlayer}
        player={player}
        cardOpacity={cardOpacity}
        seasonalTheme={seasonalTheme}
      />

      <UserListDialog
        visible={showUserListDialog}
        onClose={() => setShowUserListDialog(false)}
        onSelectUser={handleSelectUser}
        onCreateNewPlayer={async () => {
          try {
            setShowUserListDialog(false);
            const { clearActivePlayer } = await import('../src/services/player-service');
            await clearActivePlayer();
            router.replace('/');
          } catch (e) {
            console.error('Failed to clear active player:', e);
            Alert.alert('错误', '清除玩家状态失败，请重试');
          }
        }}
        users={allUsers}
        loading={loadingUsers}
        cardOpacity={cardOpacity}
        seasonalTheme={seasonalTheme}
        themedStyles={themedStyles}
        uiColors={uiColors}
      />

      <SettingsDialog
        visible={settingsDialogOpen}
        onClose={() => setSettingsDialogOpen(false)}
        player={player}
        soundEnabled={soundEnabled}
        hapticEnabled={hapticEnabled}
        debugEnabled={debugEnabled}
        cardOpacity={cardOpacity}
        seasonalTheme={seasonalTheme}
        exportingData={exportingData}
        importingData={importingData}
        onSoundToggle={async () => {
          const newValue = !soundEnabled;
          setSoundEnabled(newValue);
          if (player) {
            try {
              await updateSettings(player.id, { soundEnabled: newValue });
            } catch (error) {
              console.error('Failed to save sound setting:', error);
            }
          }
        }}
        onHapticToggle={async () => {
          const newValue = !hapticEnabled;
          setHapticEnabledState(newValue);
          setHapticEnabled(newValue);
          if (player) {
            try {
              await updateSettings(player.id, { hapticEnabled: newValue });
            } catch (error) {
              console.error('Failed to save haptic setting:', error);
            }
          }
        }}
        onDebugToggle={async () => {
          const newValue = !debugEnabled;
          setDebugEnabled(newValue);
          if (player) {
            try {
              await updateSettings(player.id, { debugEnabled: newValue });
            } catch (error) {
              console.error('Failed to save debug setting:', error);
            }
          }
        }}
        onCardOpacityChange={handleOpacityPreset}
        onSeasonalThemeChange={handleSeasonalThemeChange}
        onCleanupAllData={handleCleanupAllData}
        onDeleteMyData={handleDeleteMyData}
        onExportData={handleExportData}
        onImportData={handleImportData}
        themedStyles={themedStyles}
        uiColors={uiColors}
        opacitySliderRef={opacitySliderRef}
        opacityPanResponder={opacityPanResponder}
      />

      <GameResultDialog
        visible={gameResultDialog.open}
        type={gameResultDialog.type}
        onClose={() => setGameResultDialog({ open: false, type: null })}
        onGoHome={handleGoHome}
        onViewReplay={handleViewReplay}
        onPlayAgain={handlePlayAgain}
        player={player}
        score={gameResultDataRef.current?.score ?? 0}
        timeElapsed={gameResultDataRef.current?.timeElapsed ?? 0}
        currentDifficulty={currentDifficulty}
        activeGame={activeGame}
        personalBest={personalBest}
        cardOpacity={cardOpacity}
        seasonalTheme={seasonalTheme}
        themedStyles={themedStyles}
      />

      <HistoryDialog
        visible={historyDialogOpen}
        onClose={() => setHistoryDialogOpen(false)}
        onFilterChange={loadGameHistory}
        gameHistory={gameHistory}
        historyFilter={historyFilter}
        loading={loadingHistory}
        cardOpacity={cardOpacity}
        seasonalTheme={seasonalTheme}
        themedStyles={themedStyles}
      />

      <ExportSuccessDialog
        visible={exportSuccessDialogOpen}
        onClose={() => setExportSuccessDialogOpen(false)}
        filePath={exportedFilePathRef.current}
        cardOpacity={cardOpacity}
        seasonalTheme={seasonalTheme}
      />

      <CleanupConfirmDialog
        visible={cleanupConfirmDialogOpen}
        onClose={() => setCleanupConfirmDialogOpen(false)}
        onConfirm={handleConfirmCleanup}
        cardOpacity={cardOpacity}
        seasonalTheme={seasonalTheme}
      />

      <CleanupSuccessDialog
        visible={cleanupSuccessDialogOpen}
        onClose={() => setCleanupSuccessDialogOpen(false)}
        cardOpacity={cardOpacity}
        seasonalTheme={seasonalTheme}
      />

      <ImportLoadingDialog
        visible={importLoadingDialogOpen}
        cardOpacity={cardOpacity}
        seasonalTheme={seasonalTheme}
      />

      <ImportSuccessDialog
        visible={importSuccessDialogOpen}
        onClose={() => {
          setImportSuccessDialogOpen(false);
          router.replace('/');
        }}
        message={importSuccessMessage}
        cardOpacity={cardOpacity}
        seasonalTheme={seasonalTheme}
      />
    </View>
  );
}

