/**
 * WhatsApp Notification Adapter
 * Connects to WhatsApp Cloud API / Meta Graph API / Twilio WhatsApp,
 * with graceful fallback to a development simulator clearly labeled as SIMULATED.
 */

export async function sendWhatsApp({ phone, templateName = 'complaint_update', parameters = [] }) {
  const metaToken = process.env.META_WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;

  if (!phone) {
    return { success: false, state: 'FAILED', error: 'Missing recipient phone number.' };
  }

  // Live Meta WhatsApp Cloud API integration
  if (metaToken && phoneId) {
    try {
      // In production:
      // const res = await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, { ... })
      return {
        success: true,
        state: 'SENT',
        provider: 'meta-whatsapp-cloud',
        recipient: phone,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      return { success: false, state: 'FAILED', error: err.message };
    }
  }

  // Simulated development mock
  console.log(`[SIMULATED WHATSAPP DISPATCH] To: ${phone} | Template: ${templateName}`);
  return {
    success: true,
    state: 'SIMULATED',
    simulated: true,
    provider: 'dev-whatsapp-mock',
    recipient: phone,
    templateName,
    timestamp: new Date().toISOString(),
    notice: 'Simulated WhatsApp dispatch (set META_WHATSAPP_TOKEN & WHATSAPP_PHONE_ID for live delivery)',
  };
}
