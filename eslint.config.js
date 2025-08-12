// ESLint Flat Config (CommonJS)
const js = require('@eslint/js');
const importPlugin = require('eslint-plugin-import');
const security = require('eslint-plugin-security');
const globals = require('globals');

module.exports = [
  // Global ignores (public assets, build artifacts, etc.)
  { ignores: ['public/**', 'coverage/**', 'logs/**', 'node_modules/**'] },
  // Base recommended rules
  js.configs.recommended,
  // Project JS (excluding ignored paths above)
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'commonjs',
      globals: { ...globals.node, ...globals.jest }
    },
    plugins: { import: importPlugin, security },
    rules: {
      // Allow intentionally unused args when prefixed with underscore (e.g., Express next)
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }]
    }
  }
];
