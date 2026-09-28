// Scenarios, rubrics and mock transcripts are YAML so judges can read them without
// reading code. This teaches Metro to import them as plain objects instead of assets.
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
config.resolver.assetExts = config.resolver.assetExts.filter((ext) => ext !== 'yaml');
config.resolver.sourceExts.push('yaml');
config.transformer.babelTransformerPath = require.resolve('./metro.yaml-transformer.js');

module.exports = config;
