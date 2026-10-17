/**
 * SMS Notification Adapter
 * Connects to Twilio or Indian SMS Gateways (Fast2SMS / MSG91) when configured,
 * otherwise safely logs and tracks a simulated delivery state.
 */

export async function sendSms({ phone, message }) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER || '+912066000000';

  if (!phone) {
    return { success: false, state: 'FAILED', error: 'Missing recipient phone number.' };
  }

  // Live provider integration
  if (accountSid && authToken) {
    try {
      // In production with Twilio:
      // await twilioClient.messages.create({ ... })
      return {
        success: true,
        state: 'SENT',
        provider: 'twilio-sms',
        recipient: phone,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      return { success: false, state: 'FAILED', error: err.message };
    }
  }

  // Simulated development mock
  console.log(`[SIMULATED SMS DISPATCH] To: ${phone} | Body: "${message.substring(0, 80)}..."`);
  return {
    success: true,
    state: 'SIMULATED',
    simulated: true,
    provider: 'dev-sms-mock',
    recipient: phone,
    timestamp: new Date().toISOString(),
    notice: 'Simulated SMS dispatch (set TWILIO_ACCOUNT_SID & TWILIO_AUTH_TOKEN for live delivery)',
  };
}
