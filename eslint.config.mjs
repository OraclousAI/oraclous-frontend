import parserTypescript from '@typescript-eslint/parser';
import pluginTypescript from '@typescript-eslint/eslint-plugin';
import pluginReactHooks from 'eslint-plugin-react-hooks';
import pluginReactRefresh from 'eslint-plugin-react-refresh';
import pluginAstro from 'eslint-plugin-astro';

export default [
  { ignores: ['**/dist/**', '**/node_modules/**', '**/.astro/**'] },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: parserTypescript,
      parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
    },
    plugins: {
      '@typescript-eslint': pluginTypescript,
      'react-hooks': pluginReactHooks,
      'react-refresh': pluginReactRefresh,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
  // Astro components (apps/marketing): real linting for .astro markup + frontmatter,
  // closing the .astro gate blind spot (build-spec §7/R9).
  ...pluginAstro.configs.recommended,
];
