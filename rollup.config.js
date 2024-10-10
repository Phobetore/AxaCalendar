// rollup.config.js

const typescript = require('rollup-plugin-typescript2');
const resolve = require('@rollup/plugin-node-resolve').nodeResolve;
const commonjs = require('@rollup/plugin-commonjs');

/**
 * @type {import('rollup').RollupOptions}
 */
module.exports = {
  input: 'main.ts',
  output: {
    dir: 'dist',
    sourcemap: false,
    format: 'cjs', // Format CommonJS
    exports: 'default',
  },
  external: ['obsidian'],
  plugins: [
    typescript({
      tsconfig: "./tsconfig.json",
    }),
    resolve(),
    commonjs(),
  ],
};
