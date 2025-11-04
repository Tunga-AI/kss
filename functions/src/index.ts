import * as admin from 'firebase-admin';
import { onRequest } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();


// Export Email service functions
export { 
  sendVerificationEmail,
  sendWelcomeEmail,
  sendPaymentConfirmation,
  sendApplicationStatusUpdate,
  sendSessionReminder,
  sendInvoiceEmail,
  sendBulkNotification,
  verifyEmailCode,
  verifyPasswordResetCode
} from './emailService';

// WhatsApp Webhook Function
export const whatsappWebhook = onRequest(async (req, res) => {
  try {
    if (req.method === 'GET') {
      // Webhook verification
      const mode = req.query['hub.mode'];
      const token = req.query['hub.verify_token'];
      const challenge = req.query['hub.challenge'];

      const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

      if (mode === 'subscribe' && token === verifyToken) {
        logger.info('WhatsApp webhook verified successfully');
        res.status(200).send(challenge);
      } else {
        logger.error('WhatsApp webhook verification failed');
        res.sendStatus(403);
      }
    } else if (req.method === 'POST') {
      // Handle webhook events
      const body = req.body;
      logger.info('WhatsApp webhook received:', JSON.stringify(body));

      if (body.entry && body.entry.length > 0) {
        for (const entry of body.entry) {
          if (entry.changes && entry.changes.length > 0) {
            for (const change of entry.changes) {
              if (change.field === 'messages') {
                await processWhatsAppMessage(change.value);
              }
            }
          }
        }
      }

      res.status(200).send('OK');
    } else {
      res.sendStatus(405);
    }
  } catch (error) {
    logger.error('Error in WhatsApp webhook:', error);
    res.status(500).send('Error processing webhook');
  }
});

async function processWhatsAppMessage(value: any) {
  try {
    // Handle message status updates
    if (value.statuses) {
      for (const status of value.statuses) {
        await updateMessageStatus(status.id, status.status, status.timestamp);
      }
    }

    // Handle incoming messages
    if (value.messages) {
      for (const message of value.messages) {
        await handleIncomingMessage(message, value.contacts?.[0]);
      }
    }
  } catch (error) {
    logger.error('Error processing WhatsApp message:', error);
  }
}

async function updateMessageStatus(messageId: string, status: string, timestamp: string) {
  try {
    const messagesRef = db.collection('whatsapp_messages');
    const query = messagesRef.where('whatsappMessageId', '==', messageId);
    const snapshot = await query.get();

    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      const updateData: any = { status };

      const statusDate = new Date(parseInt(timestamp) * 1000);
      if (status === 'delivered') {
        updateData.deliveredAt = statusDate;
      } else if (status === 'read') {
        updateData.readAt = statusDate;
      }

      await doc.ref.update(updateData);
      logger.info(`Updated WhatsApp message ${messageId} status to ${status}`);
    }
  } catch (error) {
    logger.error('Error updating WhatsApp message status:', error);
  }
}

async function handleIncomingMessage(message: any, contact: any) {
  try {
    const messageData: any = {
      recipientPhone: message.from,
      messageType: message.type,
      content: extractMessageContent(message),
      status: 'delivered',
      direction: 'inbound',
      sentAt: new Date(parseInt(message.timestamp) * 1000),
      whatsappMessageId: message.id,
      sentBy: 'customer'
    };

    // Try to find associated customer
    const customersRef = db.collection('customers');
    const customerQuery = customersRef.where('whatsappNumber', '==', message.from);
    const customerSnapshot = await customerQuery.get();

    if (!customerSnapshot.empty) {
      messageData.customerId = customerSnapshot.docs[0].id;
    }

    // Store the message
    await db.collection('whatsapp_messages').add(messageData);

    // Update or create WhatsApp contact
    await updateContact(message.from, contact?.profile?.name);

    logger.info(`Processed incoming WhatsApp message from ${message.from}`);
  } catch (error) {
    logger.error('Error handling incoming WhatsApp message:', error);
  }
}

function extractMessageContent(message: any): string {
  switch (message.type) {
    case 'text':
      return message.text?.body || '';
    case 'image':
      return `[Image] ${message.image?.caption || ''}`;
    case 'document':
      return `[Document] ${message.document?.filename || ''}`;
    case 'audio':
      return '[Audio Message]';
    case 'video':
      return `[Video] ${message.video?.caption || ''}`;
    default:
      return `[${message.type}]`;
  }
}

async function updateContact(phone: string, name?: string) {
  try {
    const contactsRef = db.collection('whatsapp_contacts');
    const contactQuery = contactsRef.where('phone', '==', phone);
    const contactSnapshot = await contactQuery.get();

    if (contactSnapshot.empty) {
      // Create new contact
      await contactsRef.add({
        phone,
        name: name || '',
        optInStatus: 'opted_in',
        optInDate: new Date(),
        lastMessageDate: new Date(),
        conversationStatus: 'active'
      });
    } else {
      // Update existing contact
      const doc = contactSnapshot.docs[0];
      await doc.ref.update({
        lastMessageDate: new Date(),
        conversationStatus: 'active',
        ...(name && { name })
      });
    }
  } catch (error) {
    logger.error('Error updating WhatsApp contact:', error);
  }
} 