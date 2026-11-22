const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Permite a Metro empaquetar archivos .wasm (requerido por expo-sqlite en web)
config.resolver.assetExts.push('wasm');

module.exports = config;
