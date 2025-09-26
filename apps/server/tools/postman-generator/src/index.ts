#!/usr/bin/env tsx
/**
 * Postman Collection Generator
 *
 * This tool analyzes Encore API endpoints and generates a comprehensive Postman collection
 * with proper folder structure, environment variables, and request examples.
 *
 * Usage:
 *   npm run generate-postman-collection
 *   npm run generate-postman-collection -- --base-dir=/path/to/project
 */
import { generatePostmanCollection } from './generate-postman-collection';

function main() {
  try {
    console.log('🚀 Starting Postman collection generation...');

    // Get base directory from CLI args or environment variable
    const baseDir = getBaseDirectory();

    generatePostmanCollection(baseDir);

    console.log('✅ Postman collection generated successfully!');
  } catch (error) {
    console.error('❌ Error generating Postman collection:', error);
    process.exit(1);
  }
}

/**
 * Gets the base directory from CLI arguments
 * @returns Base directory path or undefined to use process.cwd()
 */
function getBaseDirectory(): string | undefined {
  // Check for --base-dir CLI argument
  const baseDirArg = process.argv.find((arg) => arg.startsWith('--base-dir='));
  if (baseDirArg) {
    return baseDirArg.split('=')[1];
  }

  // Return undefined to use process.cwd() as default
  return undefined;
}

// Run the generator
main();
