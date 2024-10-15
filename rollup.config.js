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
    resolve({
      browser: true,        // Résoudre les modules pour le navigateur
      preferBuiltins: false // Éviter les modules intégrés de Node.js
    }),
    commonjs(),
  ],
};
