# WhatsApp Business API Integration Setup

This guide walks you through setting up WhatsApp Business API integration for your customer management system.

## Prerequisites

1. **Meta Developer Account** - [Sign up here](https://developers.facebook.com/)
2. **Business Portfolio** - Required for WhatsApp Business API
3. **WhatsApp Business Account (WABA)** - Will be created during setup
4. **Firebase Project** - With Firestore and Functions enabled

## Step 1: Create WhatsApp Business App

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Click **"My Apps"** → **"Create App"**
3. Select **"Business"** as app type
4. Fill in app details:
   - App name: `Your Company WhatsApp`
   - Contact email: Your business email
   - Business portfolio: Select or create one

## Step 2: Add WhatsApp Product

1. In your app dashboard, scroll to **"Add products to your app"**
2. Find **"WhatsApp"** and click **"Set up"**
3. Follow the prompts to:
   - Create or attach a Business Portfolio
   - Create a test WhatsApp Business Account (WABA)
   - Get a test phone number
   - Create default "hello_world" template

## Step 3: Get API Credentials

### Access Token (Temporary for Testing)
1. Go to **WhatsApp** → **API Setup**
2. Click **"Generate access token"**
3. Copy the token (valid for 24 hours)

### Permanent Access Token (Production)
1. Go to **WhatsApp** → **API Setup**
2. Click **"Generate access token"** → **"Create System User Token"**
3. Create a System User with WhatsApp permissions
4. Generate a permanent token

### Phone Number ID
1. In **WhatsApp** → **API Setup**
2. Copy the **"Phone number ID"** (not the display number)

### Webhook Verify Token
1. Create a secure random string (e.g., `mySecureWebhookToken123`)
2. Store this - you'll need it for webhook setup

## Step 4: Environment Variables

Add these to your `.env` file:

```env
# WhatsApp Business API Configuration
VITE_WHATSAPP_ACCESS_TOKEN=your_access_token_here
VITE_WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id_here
VITE_WHATSAPP_BUSINESS_ACCOUNT_ID=your_waba_id_here
VITE_WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_webhook_verify_token_here

# For Firebase Functions (functions/.env)
WHATSAPP_ACCESS_TOKEN=your_access_token_here
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id_here
WHATSAPP_BUSINESS_ACCOUNT_ID=your_waba_id_here
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_webhook_verify_token_here
```

## Step 5: Configure Webhooks

### Deploy Firebase Function
1. Update `functions/src/index.ts`:

```typescript
import { onRequest } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import admin from 'firebase-admin';

// Initialize Firebase Admin if not already done
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

export const whatsappWebhook = onRequest(async (req, res) => {
  if (req.method === 'GET') {
    // Webhook verification
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

    if (mode === 'subscribe' && token === verifyToken) {
      logger.info('Webhook verified successfully');
      res.status(200).send(challenge);
    } else {
      logger.error('Webhook verification failed');
      res.sendStatus(403);
    }
  } else if (req.method === 'POST') {
    // Handle webhook events
    try {
      const body = req.body;
      logger.info('Webhook received:', JSON.stringify(body));

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
    } catch (error) {
      logger.error('Error processing webhook:', error);
      res.status(500).send('Error processing webhook');
    }
  } else {
    res.sendStatus(405);
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
      logger.info(`Updated message ${messageId} status to ${status}`);
    }
  } catch (error) {
    logger.error('Error updating message status:', error);
  }
}

async function handleIncomingMessage(message: any, contact: any) {
  try {
    const messageData = {
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

    logger.info(`Processed incoming message from ${message.from}`);
  } catch (error) {
    logger.error('Error handling incoming message:', error);
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
    logger.error('Error updating contact:', error);
  }
}
```

2. Deploy the function:
```bash
firebase deploy --only functions
```

### Set Up Webhook in Meta Console
1. Go to **WhatsApp** → **Configuration**
2. Click **"Edit"** next to Webhook
3. Enter webhook URL: `https://your-region-your-project.cloudfunctions.net/whatsappWebhook`
4. Enter verify token: Your `WHATSAPP_WEBHOOK_VERIFY_TOKEN`
5. Subscribe to these fields:
   - `messages` (for incoming messages)
   - `message_deliveries` (for delivery status)

## Step 6: Create Message Templates

### Via Meta Business Manager
1. Go to [Business Manager](https://business.facebook.com/)
2. Navigate to **WhatsApp Manager**
3. Go to **Account Tools** → **Message Templates**
4. Click **"Create Template"**

### Example Templates

#### Welcome Template
- **Name**: `welcome_message`
- **Category**: `UTILITY`
- **Language**: `English (US)`
- **Header**: `Welcome to Our Program!`
- **Body**: `Hi {{1}}, thank you for your interest in our programs. We're excited to help you achieve your learning goals!`
- **Footer**: `Best regards, Your Education Team`

#### Program Reminder Template
- **Name**: `program_reminder`
- **Category**: `UTILITY`  
- **Language**: `English (US)`
- **Body**: `Hi {{1}}, this is a reminder that your {{2}} program starts on {{3}}. Please ensure you have completed all prerequisites.`

#### Payment Confirmation Template
- **Name**: `payment_confirmation`
- **Category**: `UTILITY`
- **Language**: `English (US)`
- **Body**: `Hi {{1}}, we have received your payment of {{2}} for {{3}}. Your enrollment is now confirmed!`

## Step 7: Firestore Security Rules

Add these rules to `firestore.rules`:

```javascript
// WhatsApp Messages
match /whatsapp_messages/{messageId} {
  allow read, write: if isAdmin() || isStaff();
  allow read: if isAuthenticated() && 
    (resource.data.customerId == getUserId() || 
     resource.data.recipientPhone == getUserPhone());
}

// WhatsApp Templates
match /whatsapp_templates/{templateId} {
  allow read: if isAuthenticated();
  allow write: if isAdmin() || isStaff();
}

// WhatsApp Contacts
match /whatsapp_contacts/{contactId} {
  allow read, write: if isAdmin() || isStaff();
}
```

## Step 8: Testing

### Send Test Message
1. Go to **WhatsApp** → **API Setup**
2. Add test phone numbers (up to 5 for free)
3. Send the `hello_world` template
4. Verify message delivery in your dashboard

### Test Webhooks
1. Reply to the WhatsApp message
2. Check Firebase Functions logs
3. Verify message appears in Firestore
4. Test message status updates

## Step 9: Go Live (Production)

### Add Real Phone Number
1. Go to **WhatsApp** → **Phone Numbers**
2. Click **"Add phone number"**
3. Complete phone number verification
4. Submit for review (may take 1-3 business days)

### Business Verification
1. Complete Business Manager verification
2. Add payment method for messaging fees
3. Set up billing alerts

### Rate Limits & Pricing
- **Messaging tier system**: Start at 250 messages/day
- **Template approval**: Required for all templates
- **Pricing**: Varies by country and message type
- **24-hour messaging window**: Free text messages only within 24h of customer message

## Troubleshooting

### Common Issues

**Webhook not receiving messages**
- Check function logs: `firebase functions:log`
- Verify webhook URL is publicly accessible
- Confirm verify token matches

**Messages not sending**
- Check access token validity
- Verify phone number status
- Ensure template is approved
- Check rate limits

**Template not approved**
- Avoid promotional language
- Use proper variable formatting `{{1}}`
- Follow WhatsApp template guidelines
- Include clear call-to-action

### Debug Commands

```bash
# Check function logs
firebase functions:log --only whatsappWebhook

# Test webhook locally
firebase functions:shell
whatsappWebhook({method: 'GET', query: {/* test data */}})

# Deploy specific function
firebase deploy --only functions:whatsappWebhook
```

## Support & Resources

- [WhatsApp Business API Documentation](https://developers.facebook.com/docs/whatsapp)
- [Template Guidelines](https://developers.facebook.com/docs/whatsapp/message-templates/guidelines)
- [Webhook Reference](https://developers.facebook.com/docs/whatsapp/webhooks)
- [Pricing Information](https://developers.facebook.com/docs/whatsapp/pricing)

## Security Best Practices

1. **Rotate access tokens** regularly
2. **Validate webhook signatures** (implement HMAC verification)
3. **Rate limit** API calls
4. **Sanitize** incoming message content
5. **Log** all API interactions for debugging
6. **Monitor** usage and costs
7. **Backup** important message data

Your WhatsApp Business API integration is now complete! You can send template messages, receive incoming messages, and track message delivery status through your customer management system. 