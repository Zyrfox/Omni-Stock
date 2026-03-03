import { defineConfig } from 'drizzle-kit';

export default defineConfig({
    out: './drizzle',
    schema: './src/db/schema.ts',
    dialect: 'sqlite',
    dbCredentials: {
        url: process.env.TURSO_DATABASE_URL || 'file:sqlite.db',
    },
});
