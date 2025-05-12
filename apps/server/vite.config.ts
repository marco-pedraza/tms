/// <reference types="vitest" />
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  resolve: {
    alias: {
      '~encore': path.resolve(__dirname, './encore.gen'),
      '@/db': path.resolve(__dirname, './db'),
    },
  },
});
