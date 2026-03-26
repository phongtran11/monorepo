// @ts-check
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import simpleImportSort from 'eslint-plugin-simple-import-sort';

import withNuxt from './.nuxt/eslint.config.mjs';

export default withNuxt(eslintPluginPrettierRecommended, {
  plugins: {
    'simple-import-sort': simpleImportSort,
  },
  rules: {
    'no-console': 'warn',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      },
    ],
    'prettier/prettier': ['error', { endOfLine: 'auto' }],
    'simple-import-sort/imports': 'error',
    'simple-import-sort/exports': 'error',
  },
});
