export const dynamic = 'force-dynamic';
// @ts-nocheck
import { NextResponse } from 'next/server';
import Imap from 'node-imap';
import { simpleParser } from 'mailparser';
import * as xlsx from 'xlsx';
import { matchKartuStok } from '@/lib/engine';

export async function POST(req: Request): Promise<NextResponse> {
    const imapConfig = {
        user: process.env.IMAP_USER || '',
        password: process.env.IMAP_PASSWORD || '',
        host: process.env.IMAP_HOST || 'imap.gmail.com',
        port: parseInt(process.env.IMAP_PORT || '993'),
        tls: true,
        tlsOptions: { rejectUnauthorized: false }
    };

    if (!imapConfig.user || !imapConfig.password) {
        return NextResponse.json({ error: 'IMAP configuration missing' }, { status: 500 });
    }

    return new Promise<NextResponse>((resolve) => {
        const imap = new Imap(imapConfig);

        imap.once('ready', () => {
            imap.openBox('INBOX', false, (err, box) => {
                if (err) {
                    imap.end();
                    return resolve(NextResponse.json({ error: 'Error opening inbox' }, { status: 500 }));
                }

                // Search for unread emails with Pawoon attachment
                imap.search(['UNSEEN', ['SUBJECT', 'Pawoon Sales Report']], (err, results) => {
                    if (err || !results || results.length === 0) {
                        imap.end();
                        return resolve(NextResponse.json({ message: 'No new Pawoon reports found' }));
                    }

                    const fetch = imap.fetch(results, { bodies: '' });

                    fetch.on('message', (msg) => {
                        msg.on('body', (stream) => {
                            simpleParser(stream as any, async (err, parsed) => {
                                if (err) return;

                                const attachment = parsed.attachments.find(a => a.filename?.endsWith('.xls') || a.filename?.endsWith('.xlsx'));

                                if (attachment) {
                                    try {
                                        const workbook = xlsx.read(attachment.content, { type: 'buffer' });
                                        const sheetName = workbook.SheetNames[0];
                                        const sheet = workbook.Sheets[sheetName];

                                        const rawData = xlsx.utils.sheet_to_json(sheet, { header: 1 });
                                        const actualDataRows = rawData.slice(7); // Skip 7 rows

                                        const parsedSales = actualDataRows.map((row: any) => ({
                                            nama_menu: row[0] || "Unknown",
                                            qty_sold: parseInt(row[4] || 0),
                                            harga_jual: parseFloat(row[5] || 0),
                                            traffic_source: row[8] || "Dine-in"
                                        })).filter(r => r.qty_sold > 0);

                                        // Mark as read and process (ephemeral, no DB writes)
                                        await matchKartuStok(parsedSales as any, "Auto-Email System");
                                    } catch (e) {
                                        console.error("[IMAP] Error parsing or processing attached Excel:", e);
                                    }
                                }
                            });
                        });

                        // Mark email as SEEN
                        msg.once('attributes', (attrs) => {
                            imap.addFlags(attrs.uid, ['\\Seen'], (err) => {
                                if (err) console.error("Could not mark as seen", err);
                            });
                        });
                    });

                    fetch.once('end', () => {
                        imap.end();
                        resolve(NextResponse.json({ success: true, message: 'Processed latest Pawoon reports' }));
                    });
                });
            });
        });

        imap.once('error', (err: any) => {
            console.error("[IMAP] connection error", err);
            resolve(NextResponse.json({ error: 'IMAP Connection Error' }, { status: 500 }));
        });

        imap.connect();
    });
}

