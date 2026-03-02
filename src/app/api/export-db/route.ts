import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
    try {
        const dbPath = path.join(process.cwd(), 'sqlite.db');

        if (!fs.existsSync(dbPath)) {
            return new NextResponse('Database file not found', { status: 404 });
        }

        const fileBuffer = fs.readFileSync(dbPath);

        return new NextResponse(fileBuffer, {
            status: 200,
            headers: {
                'Content-Disposition': `attachment; filename="omni-stock-backup-${Date.now()}.db"`,
                'Content-Type': 'application/x-sqlite3',
            },
        });
    } catch (error) {
        console.error('Error exporting database:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
