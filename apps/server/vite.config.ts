/// <reference types="vitest" />
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        // Generated directories and third-party code
        'coverage/**',
        'dist/**',
        '**/node_modules/**',
        '**/encore.gen/**',
        '**/.encore/**',

        // Test files
        '**/*.spec.ts',

        // Configuration files and scripts
        '**/*.config.*',
        '**/migrations/**',
        '**/seeds/**',
        '**/factories/**',

        // Database scripts and testing utilities
        '**/db/scripts/**',
        '**/tests/**',

        // Specific files
        '**/*.types.ts',
        'inventory/secrets.ts',
        '**/encore.service.ts',
      ],
      include: [
        // Include application code
        'inventory/**/*.ts',
        'planning/**/*.ts',
        'users/**/*.ts',
        'shared/**/*.ts',
        'test-service/**/*.ts',
      ],
      // Coverage thresholds
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
      // Report coverage even if tests fail
      reportOnFailure: true,
      // Clean coverage directory before running
      cleanOnRerun: true,
    },
    // Global test configuration
    globals: true,
    environment: 'node',
    // Test timeout configuration
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 10000,
  },
  resolve: {
    alias: {
      '~encore': path.resolve(__dirname, './encore.gen'),
      '@/db': path.resolve(__dirname, './db'),
      '@/inventory': path.resolve(__dirname, './inventory'),
      '@/planning': path.resolve(__dirname, './planning'),
      '@/shared': path.resolve(__dirname, './shared'),
      '@/users': path.resolve(__dirname, './users'),
      '@/factories': path.resolve(__dirname, './tests/factories'),
      '@/tests': path.resolve(__dirname, './tests'),
    },
  },
});
