const upstream = require('@expo/metro-config/babel-transformer');
const YAML = require('yaml');

module.exports.transform = ({ src, filename, options }) => {
  if (filename.endsWith('.yaml')) {
    const json = JSON.stringify(YAML.parse(src));
    return upstream.transform({ src: `module.exports = ${json};`, filename, options });
  }
  return upstream.transform({ src, filename, options });
};
