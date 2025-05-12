/**
 * Babel configuration for HELiiX Frontend
 * 
 * This configuration supports modern JavaScript features, React, and TypeScript
 * for both application code and Jest tests.
 */

module.exports = {
  presets: [
    '@babel/preset-env',
    '@babel/preset-react',
    '@babel/preset-typescript'
  ],
  plugins: [
    '@babel/plugin-transform-runtime',
    '@babel/plugin-proposal-class-properties'
  ]
};
