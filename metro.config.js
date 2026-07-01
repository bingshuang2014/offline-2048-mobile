const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Ensure TypeScript files are processed
config.resolver.sourceExts = [...config.resolver.sourceExts, 'jsx', 'ts', 'tsx'];

// Add support for @/* alias
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];
config.watchFolders = [path.resolve(__dirname)];

// Enable require.context for expo-router
config.transformer.unstable_allowRequireContext = true;

const { resolver } = config;

config.resolver = {
  ...resolver,
  alias: Object({
    '@': path.resolve(__dirname, 'src'),
  }),
};

module.exports = config;
