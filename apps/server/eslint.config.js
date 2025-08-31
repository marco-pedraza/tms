import { config } from '@repo/eslint-config/base';

/** @type {import("eslint").Linter.Config} */
export default [
  ...config,
  {
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'error',
    },
  },
  {
    ignores: ['**/.turbo/**', '**/encore.gen/**', '**/.encore/**'],
  },
];
