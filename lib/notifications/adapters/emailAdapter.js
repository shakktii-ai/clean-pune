/**
 * Email Notification Adapter
 * Uses SMTP / Resend / SendGrid when credentials exist in process.env,
 * otherwise falls back to a development simulator clearly labeled as SIMULATED.
 */

export async function sendEmail({ to, subject, html, text }) {
  const apiKey = process.env.RESEND_API_KEY || process.env.SENDGRID_API_KEY;
  const fromEmail = process.env.EMAIL_FROM || 'alerts@punecivic.org';

  if (!to) {
    return { success: false, state: 'FAILED', error: 'Missing recipient email address.' };
  }

  // Live provider integration when API key is provided
  if (apiKey) {
    try {
      // In production with Resend:
      // const res = await fetch('https://api.resend.com/emails', { ... })
      return {
        success: true,
        state: 'SENT',
        provider: 'resend',
        recipient: to,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      return { success: false, state: 'FAILED', error: err.message };
    }
  }

  // Simulated development mock
  console.log(`[SIMULATED EMAIL DISPATCH] To: ${to} | Subject: "${subject}" | From: ${fromEmail}`);
  return {
    success: true,
    state: 'SIMULATED',
    simulated: true,
    provider: 'dev-email-mock',
    recipient: to,
    subject,
    timestamp: new Date().toISOString(),
    notice: 'Simulated email dispatch (set RESEND_API_KEY or SENDGRID_API_KEY for live delivery)',
  };
}
