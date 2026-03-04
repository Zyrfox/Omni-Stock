import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// Paksa baca POSTGRES_URL dari Vercel, dengan fallback ke DATABASE_URL jika ada
const connectionString = process.env.POSTGRES_URL
    || process.env.DATABASE_URL
    || "postgresql://neondb_owner:npg_HZfVMd6FW9KJ@ep-mute-mode-a1evbcx9-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const sql = neon(connectionString);
export const db = drizzle(sql, { schema });
