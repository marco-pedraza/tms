import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Limit concurrency to avoid database issues
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true, // Use a single fork to avoid concurrency issues
      },
    },
    // Longer timeout for database operations
    testTimeout: 10000,
    environment: 'node',
  },
});
