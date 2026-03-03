export async function sendTelegramAlert(alerts: { nama_bahan: string, current_stock: number, minimum: number, vendor_id: string }[]) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId || alerts.length === 0) return;

    const header = `🚨 *OMNI-STOCK — Draf Purchase Order*\n━━━━━━━━━━━━━━━━━━━━━━\n`;

    const itemLines = alerts.map((a, i) =>
        `${i + 1}. *${a.nama_bahan}*\n   📦 Sisa: \`${a.current_stock.toFixed(2)}\` (Min: ${a.minimum})\n   🏪 Vendor: _${a.vendor_id || 'N/A'}_`
    ).join("\n\n");

    const footer = `\n━━━━━━━━━━━━━━━━━━━━━━\n✅ Total ${alerts.length} item perlu di-restock.\n📋 Status: \`DRAFT\` — menunggu persetujuan Manajer.`;

    const fullMessage = header + itemLines + footer;
    const text = encodeURIComponent(fullMessage);
    const url = `https://api.telegram.org/bot${token}/sendMessage?chat_id=${chatId}&text=${text}&parse_mode=Markdown`;

    try {
        await fetch(url);
        console.log(`[ALERT] Sent ${alerts.length} low stock warnings to Telegram.`);
    } catch (error) {
        console.error("[ALERT] Failed to send Telegram alert:", error);
    }
}
