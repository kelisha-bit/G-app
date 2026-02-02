// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Set project root explicitly to prevent Metro from scanning outside
config.projectRoot = __dirname;

// Limit watchFolders to only the project directory - this is critical!
config.watchFolders = [path.resolve(__dirname)];

// Get normalized project path for comparison
const projectPath = path.resolve(__dirname).replace(/\\/g, '/').toLowerCase();

// Block problematic directories that cause permission errors
config.resolver = config.resolver || {};
config.resolver.blockList = [
  // Block any path containing AppData\Local\Temp (Windows temp)
  /.*[\\/]AppData[\\/]Local[\\/]Temp[\\/].*/i,
  // Block Application Data directory
  /.*[\\/]Application Data[\\/].*/i,
  // Block specific problematic temp subdirectories
  /.*[\\/]tmpfm.*/i,
  /.*[\\/]WinSAT[\\/].*/i,
  /.*[\\/]aha[\\/].*/i,
  // Block socket files
  /.*\.sock$/i,
];

// Note: watcher.ignored is not a standard Metro config option and causes validation warnings
// The resolver.blockList above handles blocking problematic paths during bundling
// For local development, Metro's default watcher should work fine with the blockList

module.exports = config;

