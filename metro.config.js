//metro.config.js
const { getDefaultConfig } = require("expo/metro-config");
const path = require('path');

const config = getDefaultConfig(__dirname);
config.resolver.unstable_enablePackageExports = false;

// Add resolver configuration to handle polyfills better
config.resolver.alias = {
  ...config.resolver.alias,
  'crypto': require.resolve('crypto-browserify'),
  'stream': require.resolve('readable-stream'),
  'buffer': require.resolve('buffer'),
};

// Detect if this is a web build - check multiple ways
const isWebBuild = process.env.EXPO_PLATFORM === 'web' || 
                   process.argv.includes('--web') || 
                   process.env.npm_lifecycle_event === 'web';

console.log(`Metro Config - Web build detected: ${isWebBuild}`);

if (isWebBuild) {
  console.log('Setting up web-specific Metro configuration...');
  
  // Completely exclude React Native specific packages from web builds
  config.resolver.alias = {
    ...config.resolver.alias,
    'react-native-libsodium': path.resolve(__dirname, 'empty-module.js'),
    'react-native-libsodium/libsodium': path.resolve(__dirname, 'empty-module.js'),
    '@burnt-labs/abstraxion-react-native': path.resolve(__dirname, 'empty-module.js'),
    '@burnt-labs/abstraxion-react-native/metro.libsodium': path.resolve(__dirname, 'empty-module.js'),
    '@burnt-labs/abstraxion-react-native/libsodiumWrapper': path.resolve(__dirname, 'empty-module.js'),
  };
  
  // Block any React Native libsodium related modules more aggressively
  config.resolver.blockList = [
    /react-native-libsodium/,
    /@burnt-labs\/abstraxion-react-native/,
    /node_modules\/react-native-libsodium/,
    /node_modules\/@burnt-labs\/abstraxion-react-native/,
    /libsodiumWrapper\.js$/,
    // Also block native layout files from being processed in web builds
    /app\/_layout\.native\.tsx$/,
  ];
  
  // Override resolver to force web-only dependencies
  config.resolver.resolverMainFields = ['browser', 'main'];
  config.resolver.platforms = ['web'];
  
  // Additional web-specific configuration
  config.resolver.sourceExts = [...config.resolver.sourceExts, 'web.js', 'web.ts', 'web.tsx'];
  config.resolver.platforms = ['web', 'native', 'ios', 'android'];
  
  // Ensure proper platform resolution priority for web
  config.resolver.platformDependencies = {
    web: {
      include: ['web'],
      exclude: ['native', 'ios', 'android']
    }
  };
}

// Only apply libsodium resolver for non-web platforms
// The web platform should use the native @burnt-labs/abstraxion without React Native specific modifications
if (!isWebBuild) {
  try {
    const {
      withLibsodiumResolver,
    } = require("@burnt-labs/abstraxion-react-native/metro.libsodium");
    
    module.exports = withLibsodiumResolver(config);
  } catch (error) {
    console.warn('Failed to load abstraxion-react-native metro config, using default:', error.message);
    module.exports = config;
  }
} else {
  module.exports = config;
}
