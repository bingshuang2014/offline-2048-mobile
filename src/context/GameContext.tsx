"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import type { GameState } from "@/lib/game-logic";
import type { Player } from "@/lib/schema";
import {
  getActivePlayer,
  getSettings,
  updateSettings as updateSettingsService,
  getActiveGame,
  getPersonalBestByDifficulty,
} from "@/services";

// ============================================
// Type Definitions
// ============================================

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
  easy: number;
  hard: number;
}

interface GameSettings {
  theme: "light" | "dark";
  seasonalTheme: "spring" | "summer" | "autumn" | "winter";
  soundEnabled: boolean;
  hapticEnabled: boolean;
  customTileColors: Record<number, string> | null;
  customBackgroundColor: string | null;
  customTextColor: string | null;
  cardOpacity: number;
}

interface DialogStates {
  gameResult: {
    open: boolean;
    type: "victory" | "gameOver" | null;
  };
  restart: boolean;
  settings: boolean;
  history: boolean;
  playerInfo: boolean;
}

interface GameContextState {
  // Player state
  currentPlayer: Player | null;
  personalBest: PersonalBest;

  // Game state
  currentGame: ActiveGame | null;
  currentDifficulty: "easy" | "hard";
  elapsedTime: number;
  isPaused: boolean;
  isProcessingMove: boolean;
  isRestarting: boolean;
  viewReplayMode: boolean;
  replayGameData: ActiveGame | null;

  // Settings state
  settings: GameSettings;

  // Dialog states
  dialogs: DialogStates;

  // Debug state
  showDebugButtons: boolean;

  // Loading state
  loading: boolean;
}

interface GameContextActions {
  // Player actions
  selectPlayer: (player: Player | null) => void;
  updatePersonalBest: (best: PersonalBest) => void;

  // Game actions
  setCurrentGame: (game: ActiveGame | null) => void;
  setCurrentDifficulty: (difficulty: "easy" | "hard") => void;
  setElapsedTime: (time: number) => void;
  setIsPaused: (paused: boolean) => void;
  setIsProcessingMove: (processing: boolean) => void;
  setIsRestarting: (restarting: boolean) => void;
  setViewReplayMode: (mode: boolean, gameData?: ActiveGame | null) => void;

  // Settings actions
  updateSettings: (settings: Partial<GameSettings>) => void;
  resetSettings: () => void;

  // Dialog actions
  openGameResultDialog: (type: "victory" | "gameOver") => void;
  closeGameResultDialog: () => void;
  openRestartDialog: () => void;
  closeRestartDialog: () => void;
  openSettingsDialog: () => void;
  closeSettingsDialog: () => void;
  openHistoryDialog: () => void;
  closeHistoryDialog: () => void;
  openPlayerInfoDialog: () => void;
  closePlayerInfoDialog: () => void;

  // Debug actions
  toggleDebugButtons: () => void;

  // Loading action
  setLoading: (loading: boolean) => void;

  // API helper actions
  refreshActivePlayer: () => Promise<void>;
  refreshGameInit: () => Promise<void>;
  saveSettings: () => Promise<void>;
}

interface GameContextType extends GameContextState, GameContextActions {}

// ============================================
// Default Values
// ============================================

const defaultSettings: GameSettings = {
  theme: "light",
  seasonalTheme: "spring",
  soundEnabled: true,
  hapticEnabled: true,
  customTileColors: null,
  customBackgroundColor: null,
  customTextColor: null,
  cardOpacity: 100, // 100% opacity (0-100 scale)
};

const defaultDialogs: DialogStates = {
  gameResult: { open: false, type: null },
  restart: false,
  settings: false,
  history: false,
  playerInfo: false,
};

const defaultPersonalBest: PersonalBest = {
  easy: 0,
  hard: 0,
};

// ============================================
// Context Creation
// ============================================

const GameContext = createContext<GameContextType | undefined>(undefined);

// ============================================
// Provider Component
// ============================================

interface GameProviderProps {
  children: ReactNode;
}

export function GameProvider({ children }: GameProviderProps) {
  // Player state
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [personalBest, setPersonalBestState] = useState<PersonalBest>(defaultPersonalBest);

  // Game state
  const [currentGame, setCurrentGameState] = useState<ActiveGame | null>(null);
  const [currentDifficulty, setCurrentDifficultyState] = useState<"easy" | "hard">("easy");
  const [elapsedTime, setElapsedTimeState] = useState(0);
  const [isPaused, setIsPausedState] = useState(false);
  const [isProcessingMove, setIsProcessingMoveState] = useState(false);
  const [isRestarting, setIsRestartingState] = useState(false);
  const [viewReplayMode, setViewReplayModeState] = useState(false);
  const [replayGameData, setReplayGameDataState] = useState<ActiveGame | null>(null);

  // Settings state
  const [settings, setSettingsState] = useState<GameSettings>(defaultSettings);

  // Dialog states
  const [dialogs, setDialogs] = useState<DialogStates>(defaultDialogs);

  // Debug state
  const [showDebugButtons, setShowDebugButtons] = useState(false);

  // Loading state
  const [loading, setLoading] = useState(true);

  // ============================================
  // Player Actions
  // ============================================

  const selectPlayer = useCallback((player: Player | null) => {
    setCurrentPlayer(player);
  }, []);

  const updatePersonalBest = useCallback((best: PersonalBest) => {
    setPersonalBestState(best);
  }, []);

  // ============================================
  // Game Actions
  // ============================================

  const setCurrentGame = useCallback((game: ActiveGame | null) => {
    setCurrentGameState(game);
    if (game?.difficulty) {
      setCurrentDifficultyState(game.difficulty as "easy" | "hard");
    }
  }, []);

  const setCurrentDifficulty = useCallback((difficulty: "easy" | "hard") => {
    setCurrentDifficultyState(difficulty);
  }, []);

  const setElapsedTime = useCallback((time: number) => {
    setElapsedTimeState(time);
  }, []);

  const setIsPaused = useCallback((paused: boolean) => {
    setIsPausedState(paused);
  }, []);

  const setIsProcessingMove = useCallback((processing: boolean) => {
    setIsProcessingMoveState(processing);
  }, []);

  const setIsRestarting = useCallback((restarting: boolean) => {
    setIsRestartingState(restarting);
  }, []);

  const setViewReplayMode = useCallback((mode: boolean, gameData?: ActiveGame | null) => {
    setViewReplayModeState(mode);
    setReplayGameDataState(gameData || null);
  }, []);

  // ============================================
  // Settings Actions
  // ============================================

  const updateSettings = useCallback((newSettings: Partial<GameSettings>) => {
    setSettingsState((prev) => ({ ...prev, ...newSettings }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettingsState(defaultSettings);
  }, []);

  // ============================================
  // Dialog Actions
  // ============================================

  const openGameResultDialog = useCallback((type: "victory" | "gameOver") => {
    setDialogs((prev) => ({ ...prev, gameResult: { open: true, type } }));
  }, []);

  const closeGameResultDialog = useCallback(() => {
    setDialogs((prev) => ({ ...prev, gameResult: { open: false, type: null } }));
  }, []);

  const openRestartDialog = useCallback(() => {
    setDialogs((prev) => ({ ...prev, restart: true }));
  }, []);

  const closeRestartDialog = useCallback(() => {
    setDialogs((prev) => ({ ...prev, restart: false }));
  }, []);

  const openSettingsDialog = useCallback(() => {
    setDialogs((prev) => ({ ...prev, settings: true }));
  }, []);

  const closeSettingsDialog = useCallback(() => {
    setDialogs((prev) => ({ ...prev, settings: false }));
  }, []);

  const openHistoryDialog = useCallback(() => {
    setDialogs((prev) => ({ ...prev, history: true }));
  }, []);

  const closeHistoryDialog = useCallback(() => {
    setDialogs((prev) => ({ ...prev, history: false }));
  }, []);

  const openPlayerInfoDialog = useCallback(() => {
    setDialogs((prev) => ({ ...prev, playerInfo: true }));
  }, []);

  const closePlayerInfoDialog = useCallback(() => {
    setDialogs((prev) => ({ ...prev, playerInfo: false }));
  }, []);

  // ============================================
  // Debug Actions
  // ============================================

  const toggleDebugButtons = useCallback(() => {
    setShowDebugButtons((prev) => !prev);
  }, []);

  // ============================================
  // API Helper Actions
  // ============================================

  const refreshActivePlayer = useCallback(async () => {
    try {
      const player = await getActivePlayer();
      if (player) {
        setCurrentPlayer(player);
      }
    } catch (error) {
      console.error("Failed to refresh active player:", error);
    }
  }, []);

  const refreshGameInit = useCallback(async () => {
    try {
      // Get active player first
      const player = await getActivePlayer();
      if (!player) {
        throw new Error("No active player found");
      }

      setCurrentPlayer(player);

      // Get personal best scores
      const personalBestData = await getPersonalBestByDifficulty(player.id);
      setPersonalBestState(personalBestData);

      // Get settings
      const settingsData = await getSettings(player.id);
      setSettingsState((prev) => ({
        ...prev,
        theme: (settingsData.theme || prev.theme) as "light" | "dark",
        seasonalTheme: (settingsData.seasonalTheme || prev.seasonalTheme) as "spring" | "summer" | "autumn" | "winter",
        soundEnabled: settingsData.soundEnabled !== undefined ? settingsData.soundEnabled : prev.soundEnabled,
        customTileColors: settingsData.customTileColors ? JSON.parse(settingsData.customTileColors) : null,
        customBackgroundColor: settingsData.customBackgroundColor,
        customTextColor: settingsData.customTextColor,
        cardOpacity: settingsData.cardOpacity ?? prev.cardOpacity,
      }));

      // Get active game
      const activeGame = await getActiveGame();
      if (activeGame) {
        setCurrentGameState({
          id: activeGame.id,
          playerId: activeGame.playerId,
          difficulty: activeGame.difficulty,
          score: activeGame.score,
          timeElapsed: activeGame.timeElapsed,
          gameState: activeGame.gameState,
          isCompleted: activeGame.isCompleted,
          createdAt: activeGame.createdAt.toISOString(),
          updatedAt: activeGame.updatedAt.toISOString(),
        });
        setCurrentDifficultyState(activeGame.difficulty as "easy" | "hard");
      }
    } catch (error) {
      console.error("Failed to refresh game init:", error);
    }
  }, []);

  const saveSettings = useCallback(async () => {
    try {
      const player = await getActivePlayer();
      if (!player) {
        throw new Error("No active player found");
      }

      await updateSettingsService(player.id, {
        theme: settings.theme,
        seasonalTheme: settings.seasonalTheme,
        soundEnabled: settings.soundEnabled,
        customTileColors: settings.customTileColors ? JSON.stringify(settings.customTileColors) : null,
        customBackgroundColor: settings.customBackgroundColor,
        customTextColor: settings.customTextColor,
        cardOpacity: settings.cardOpacity,
      });
    } catch (error) {
      console.error("Failed to save settings:", error);
    }
  }, [settings]);

  // ============================================
  // Context Value
  // ============================================

  const value: GameContextType = {
    // State
    currentPlayer,
    personalBest,
    currentGame,
    currentDifficulty,
    elapsedTime,
    isPaused,
    isProcessingMove,
    isRestarting,
    viewReplayMode,
    replayGameData,
    settings,
    dialogs,
    showDebugButtons,
    loading,

    // Actions
    selectPlayer,
    updatePersonalBest,
    setCurrentGame,
    setCurrentDifficulty,
    setElapsedTime,
    setIsPaused,
    setIsProcessingMove,
    setIsRestarting,
    setViewReplayMode,
    updateSettings,
    resetSettings,
    openGameResultDialog,
    closeGameResultDialog,
    openRestartDialog,
    closeRestartDialog,
    openSettingsDialog,
    closeSettingsDialog,
    openHistoryDialog,
    closeHistoryDialog,
    openPlayerInfoDialog,
    closePlayerInfoDialog,
    toggleDebugButtons,
    setLoading,
    refreshActivePlayer,
    refreshGameInit,
    saveSettings,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

// ============================================
// Custom Hook
// ============================================

export function useGameContext(): GameContextType {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error("useGameContext must be used within a GameProvider");
  }
  return context;
}

// ============================================
// Utility Hooks for Specific State
// ============================================

export function usePlayer() {
  const { currentPlayer, selectPlayer, personalBest, updatePersonalBest, refreshActivePlayer } =
    useGameContext();
  return { currentPlayer, selectPlayer, personalBest, updatePersonalBest, refreshActivePlayer };
}

export function useGameState() {
  const {
    currentGame,
    setCurrentGame,
    currentDifficulty,
    setCurrentDifficulty,
    elapsedTime,
    setElapsedTime,
    isPaused,
    setIsPaused,
    isProcessingMove,
    setIsProcessingMove,
    isRestarting,
    setIsRestarting,
    viewReplayMode,
    setViewReplayMode,
    replayGameData,
  } = useGameContext();
  return {
    currentGame,
    setCurrentGame,
    currentDifficulty,
    setCurrentDifficulty,
    elapsedTime,
    setElapsedTime,
    isPaused,
    setIsPaused,
    isProcessingMove,
    setIsProcessingMove,
    isRestarting,
    setIsRestarting,
    viewReplayMode,
    setViewReplayMode,
    replayGameData,
  };
}

export function useGameSettings() {
  const { settings, updateSettings, resetSettings, saveSettings } = useGameContext();
  return { settings, updateSettings, resetSettings, saveSettings };
}

export function useDialogs() {
  const {
    dialogs,
    openGameResultDialog,
    closeGameResultDialog,
    openRestartDialog,
    closeRestartDialog,
    openSettingsDialog,
    closeSettingsDialog,
    openHistoryDialog,
    closeHistoryDialog,
    openPlayerInfoDialog,
    closePlayerInfoDialog,
  } = useGameContext();
  return {
    dialogs,
    openGameResultDialog,
    closeGameResultDialog,
    openRestartDialog,
    closeRestartDialog,
    openSettingsDialog,
    closeSettingsDialog,
    openHistoryDialog,
    closeHistoryDialog,
    openPlayerInfoDialog,
    closePlayerInfoDialog,
  };
}
