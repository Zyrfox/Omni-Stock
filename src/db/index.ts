import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// Paksa baca POSTGRES_URL dari Vercel, dengan fallback ke DATABASE_URL jika ada
const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error("Missing POSTGRES_URL or DATABASE_URL environment variable");
}

const sql = neon(connectionString);
export const db = drizzle(sql, { schema });
