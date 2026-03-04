import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// Provide a fallback connection string for Next.js static build phase when env isn't loaded yet
const getDbUrl = () => {
    if (process.env.POSTGRES_URL && process.env.POSTGRES_URL.length > 5) return process.env.POSTGRES_URL;
    if (process.env.DATABASE_URL && process.env.DATABASE_URL.length > 5) return process.env.DATABASE_URL;
    return "postgresql://dummy:dummy@ep-dummy.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";
};

const sql = neon(getDbUrl());
export const db = drizzle(sql, { schema });
