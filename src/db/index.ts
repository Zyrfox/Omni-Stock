import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// Production: use Vercel Postgres Storage via Neon HTTP
// Provide a fallback connection string for Next.js static build phase when env isn't loaded yet
const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL || "postgresql://dummy:dummy@ep-dummy.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";
const sql = neon(connectionString);

export const db = drizzle(sql, { schema });
