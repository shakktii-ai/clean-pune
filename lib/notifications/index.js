import Notification, { NOTIFICATION_TYPES } from '../../models/Notification.js';
import { sendEmail } from './adapters/emailAdapter.js';
import { sendSms } from './adapters/smsAdapter.js';
import { sendWhatsApp } from './adapters/whatsappAdapter.js';

export { NOTIFICATION_TYPES };

/**
 * Dispatches multi-channel notifications across in-app, email, SMS, and WhatsApp.
 * Accurately tracks delivery states (SENT, FAILED, SIMULATED).
 */
export async function sendMultiChannelNotification({
  recipient, // User document or { _id, email, phone, name }
  type = NOTIFICATION_TYPES.STATUS_CHANGE,
  title,
  message,
  link = '',
  channels = ['in_app'],
}) {
  const deliveryReceipts = {
    inApp: null,
    email: null,
    sms: null,
    whatsapp: null,
  };

  // 1. In-App Notification (Database)
  if (channels.includes('in_app') && recipient?._id) {
    try {
      const inAppDoc = await Notification.create({
        recipient: recipient._id,
        type,
        title,
        message,
        link,
        read: false,
      });
      deliveryReceipts.inApp = {
        success: true,
        state: 'DELIVERED',
        notificationId: inAppDoc._id.toString(),
      };
    } catch (err) {
      deliveryReceipts.inApp = {
        success: false,
        state: 'FAILED',
        error: err.message,
      };
    }
  }

  // 2. Email Notification
  if (channels.includes('email') && recipient?.email) {
    try {
      deliveryReceipts.email = await sendEmail({
        to: recipient.email,
        subject: `[Pune Civic Platform] ${title}`,
        text: `${message}\n\nView details: https://punecivic.org${link}`,
      });
    } catch (err) {
      deliveryReceipts.email = { success: false, state: 'FAILED', error: err.message };
    }
  }

  // 3. SMS Notification
  if (channels.includes('sms') && recipient?.phone) {
    try {
      deliveryReceipts.sms = await sendSms({
        phone: recipient.phone,
        message: `[Pune Civic Platform] ${title}: ${message}`,
      });
    } catch (err) {
      deliveryReceipts.sms = { success: false, state: 'FAILED', error: err.message };
    }
  }

  // 4. WhatsApp Notification
  if (channels.includes('whatsapp') && recipient?.phone) {
    try {
      deliveryReceipts.whatsapp = await sendWhatsApp({
        phone: recipient.phone,
        templateName: 'civic_status_update',
        parameters: [{ title, message }],
      });
    } catch (err) {
      deliveryReceipts.whatsapp = { success: false, state: 'FAILED', error: err.message };
    }
  }

  return {
    success: true,
    title,
    receipts: deliveryReceipts,
  };
}
