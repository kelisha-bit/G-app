const createExpoWebpackConfigAsync = require('@expo/webpack-config');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);
  
  // Optimize source maps for production
  // Use 'source-map' for production (smaller) or false to disable
  // 'eval-source-map' is faster for development but larger
  if (process.env.NODE_ENV === 'production' || argv.mode === 'production') {
    config.devtool = 'source-map'; // Better than 'eval-source-map' for production
  }
  
  // Add polyfills for Node.js core modules
  config.resolve.fallback = {
    ...config.resolve.fallback,
    crypto: require.resolve('crypto-browserify'),
    stream: require.resolve('stream-browserify'),
    buffer: require.resolve('buffer/'),
    vm: false,
  };

  // Optimize code splitting with more granular chunks
  config.optimization = {
    ...config.optimization,
    splitChunks: {
      chunks: 'all',
      maxInitialRequests: 25,
      maxAsyncRequests: 25,
      minSize: 20000,
      maxSize: 400000, // Split chunks larger than 400KB
      cacheGroups: {
        default: false,
        vendors: false,
        // React and React Native core - highest priority
        react: {
          name: 'react',
          test: /[\\/]node_modules[\\/](react|react-dom|react-native|scheduler)[\\/]/,
          chunks: 'all',
          priority: 40,
          reuseExistingChunk: true,
          enforce: true,
        },
        // React Navigation
        reactNavigation: {
          name: 'react-navigation',
          test: /[\\/]node_modules[\\/]@react-navigation[\\/]/,
          chunks: 'all',
          priority: 35,
          reuseExistingChunk: true,
          enforce: true,
        },
        // Firebase - separate chunk
        firebase: {
          name: 'firebase',
          test: /[\\/]node_modules[\\/]firebase[\\/]/,
          chunks: 'all',
          priority: 30,
          reuseExistingChunk: true,
          enforce: true,
        },
        // Expo packages - group together
        expo: {
          name: 'expo',
          test: /[\\/]node_modules[\\/]expo(-|_)[^/]+[\\/]/,
          chunks: 'all',
          priority: 25,
          reuseExistingChunk: true,
        },
        // React Native Web and related
        reactNativeWeb: {
          name: 'react-native-web',
          test: /[\\/]node_modules[\\/](react-native-web|react-native-gesture-handler|react-native-reanimated|react-native-safe-area-context|react-native-screens)[\\/]/,
          chunks: 'all',
          priority: 28,
          reuseExistingChunk: true,
        },
        // Polyfills
        polyfills: {
          name: 'polyfills',
          test: /[\\/]node_modules[\\/](crypto-browserify|stream-browserify|buffer)[\\/]/,
          chunks: 'all',
          priority: 20,
          reuseExistingChunk: true,
        },
        // Remaining vendor code
        vendor: {
          name: 'vendor',
          chunks: 'all',
          test: /[\\/]node_modules[\\/]/,
          priority: 10,
          reuseExistingChunk: true,
          minChunks: 1,
        },
        // Common chunk for shared app code
        common: {
          name: 'common',
          minChunks: 2,
          chunks: 'all',
          priority: 5,
          reuseExistingChunk: true,
          enforce: true,
        },
      },
    },
    // Enable minification
    minimize: true,
    // Module concatenation for better tree shaking
    concatenateModules: true,
    // Runtime chunk for webpack runtime code
    runtimeChunk: {
      name: 'runtime',
    },
  };

  // Performance hints - adjusted for realistic bundle sizes
  // Note: Large PWA images and source maps are excluded from warnings
  config.performance = {
    ...config.performance,
    maxEntrypointSize: 1024000, // 1 MB - realistic for initial load
    maxAssetSize: 1024000, // 1 MB - allows for larger chunks that are loaded on-demand
    hints: 'warning', // Keep as warning to monitor but not fail builds
    assetFilter: (assetFilename) => {
      // Exclude from performance warnings:
      // - PWA images (optimized separately)
      // - Source maps (only loaded when debugging, not by users)
      // - Other image formats
      return !assetFilename.includes('apple-touch-startup-image') && 
             !assetFilename.includes('.map') && // Exclude source maps
             !assetFilename.includes('.png') && 
             !assetFilename.includes('.jpg') &&
             !assetFilename.includes('.jpeg') &&
             !assetFilename.includes('.gif') &&
             !assetFilename.includes('.webp');
    },
  };

  // Ensure environment variables are available
  config.plugins = config.plugins || [];
  
  // DefinePlugin will inject environment variables at build time
  const webpack = require('webpack');
  config.plugins.push(
    new webpack.DefinePlugin({
      'process.env.EXPO_PUBLIC_FIREBASE_API_KEY': JSON.stringify(process.env.EXPO_PUBLIC_FIREBASE_API_KEY),
      'process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN': JSON.stringify(process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN),
      'process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID': JSON.stringify(process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID),
      'process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET': JSON.stringify(process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET),
      'process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID),
      'process.env.EXPO_PUBLIC_FIREBASE_APP_ID': JSON.stringify(process.env.EXPO_PUBLIC_FIREBASE_APP_ID),
      'process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID': JSON.stringify(process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID),
      // Payment API keys
      'process.env.EXPO_PUBLIC_FLUTTERWAVE_PUBLIC_KEY': JSON.stringify(process.env.EXPO_PUBLIC_FLUTTERWAVE_PUBLIC_KEY),
      'process.env.EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY': JSON.stringify(process.env.EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY),
    })
  );

  return config;
};