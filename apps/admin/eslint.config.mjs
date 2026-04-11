import { baseConfig } from '@lam-thinh-ecommerce/eslint-config/base.mjs';
import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const eslintConfig = defineConfig([
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts']),
  ...baseConfig,
  ...nextVitals,
  ...nextTs,
]);

export default eslintConfig;
