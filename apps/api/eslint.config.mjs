import tseslint from 'typescript-eslint';
import globals from 'globals';
import { baseConfig } from '../../eslint.config.mjs';

export default tseslint.config(
  { ignores: ['eslint.config.mjs', 'dist/**'] },
  ...baseConfig,
  ...tseslint.configs.recommendedTypeCheckedOnly,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
    },
  },
);
