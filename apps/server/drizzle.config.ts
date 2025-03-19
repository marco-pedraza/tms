import { defineConfig } from 'drizzle-kit';
export default defineConfig({
  out: 'inventory/db/migrations',
  schema: ['inventory/db/schema.ts'],
  dialect: 'postgresql',
});
