/**
 * Test Helpers
 *
 * Utility functions for testing React Native components
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import type { RenderOptions } from '@testing-library/react-native';

/**
 * Custom render function that includes providers
 */
export function renderWithProviders(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
    // Add any providers here (Navigation, Theme, etc.)
    return <>{children}</>;
  };

  return render(<AllTheProviders>{ui}</AllTheProviders>, options);
}

/**
 * Wait for a specified amount of time (useful for animations)
 */
export const wait = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Create mock player data
 */
export const createMockPlayer = (overrides = {}) => ({
  id: 1,
  epitaph: 'Test Player',
  avatar_id: 1,
  created_at: new Date().toISOString(),
  ...overrides,
});

/**
 * Create mock game data
 */
export const createMockGame = (overrides = {}) => ({
  id: 1,
  player_id: 1,
  mode: 'simple',
  grid_size: 4,
  score: 100,
  time_elapsed: 60,
  game_state: JSON.stringify({
    board: [[2, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
    score: 100,
  }),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  is_completed: false,
  ...overrides,
});

/**
 * Create mock settings
 */
export const createMockSettings = (overrides = {}) => ({
  id: 1,
  player_id: 1,
  theme: 'light',
  seasonal_theme: 'spring',
  custom_tile_colors: null,
  custom_background_color: null,
  custom_text_color: null,
  card_opacity: 14,
  sound_enabled: true,
  updated_at: new Date().toISOString(),
  ...overrides,
});

/**
 * Mock navigation
 */
export const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  reset: jest.fn(),
  dispatch: jest.fn(),
  setParams: jest.fn(),
  addListener: jest.fn(),
  removeListener: jest.fn(),
  canGoBack: jest.fn(() => true),
  isFocused: jest.fn(() => true),
};

/**
 * Mock route
 */
export const mockRoute = {
  params: {},
  key: 'test',
  name: 'TestScreen',
  path: '/test',
};

/**
 * Suppress console errors during tests
 */
export function suppressConsoleErrors() {
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });

  afterAll(() => {
    console.error = originalError;
  });
}

// Re-export everything from @testing-library/react-native
export * from '@testing-library/react-native';
