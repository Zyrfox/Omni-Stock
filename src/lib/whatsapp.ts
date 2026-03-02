export async function sendWhatsAppMessage(phoneNumber: string, message: string) {
    const WHATSAPP_API_TOKEN = process.env.WHATSAPP_API_TOKEN;
    const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!WHATSAPP_API_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
        console.warn("WhatsApp API credentials missing, simulating message dispatch.");
        console.log(`[WhatsApp Mock to ${phoneNumber}]:\n${message}`);
        return { success: true, simulated: true };
    }

    try {
        const response = await fetch(`https://graph.facebook.com/v17.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${WHATSAPP_API_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messaging_product: "whatsapp",
                to: phoneNumber,
                type: "text",
                text: {
                    body: message
                }
            })
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(`WhatsApp API error: ${JSON.stringify(data)}`);
        }

        return { success: true, simulated: false, data };
    } catch (error) {
        console.error("Failed to send WhatsApp Message:", error);
        return { success: false, error };
    }
}
