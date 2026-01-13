const createExpoWebpackConfigAsync = require('@expo/webpack-config');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);
  
  // Add polyfills for Node.js core modules
  config.resolve.fallback = {
    ...config.resolve.fallback,
    crypto: require.resolve('crypto-browserify'),
    stream: require.resolve('stream-browserify'),
    buffer: require.resolve('buffer/'),
    vm: false,  // Add this line
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
    })
  );

  return config;
};