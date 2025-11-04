/**
 * WhatsApp Business API Service
 * Handles sending messages, managing templates, and webhook processing
 */

import { db, functions } from '../config/firebase';
import { collection, addDoc, updateDoc, doc, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

// WhatsApp Message Types
export interface WhatsAppTemplate {
  id: string;
  name: string;
  category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
  language: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  components: Array<{
    type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS';
    format?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';
    text?: string;
    example?: {
      header_text?: string[];
      body_text?: string[][];
    };
    buttons?: Array<{
      type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER';
      text: string;
      url?: string;
      phone_number?: string;
    }>;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface WhatsAppMessage {
  id: string;
  customerId?: string;
  recipientPhone: string;
  messageType: 'template' | 'text' | 'image' | 'document';
  templateName?: string;
  templateLanguage?: string;
  templateParameters?: any[];
  content?: string;
  mediaUrl?: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  direction: 'outbound' | 'inbound';
  sentAt: Date;
  deliveredAt?: Date;
  readAt?: Date;
  whatsappMessageId?: string;
  conversationId?: string;
  sentBy: string; // User ID who sent the message
  metadata?: {
    campaignId?: string;
    automationType?: string;
    triggerEvent?: string;
  };
}

export interface WhatsAppContact {
  phone: string;
  name?: string;
  customerId?: string;
  optInStatus: 'opted_in' | 'opted_out' | 'pending';
  optInDate?: Date;
  lastMessageDate?: Date;
  conversationStatus: 'active' | 'inactive';
  tags?: string[];
}

class WhatsAppService {
  private accessToken: string;
  private phoneNumberId: string;
  private businessAccountId: string;
  private webhookVerifyToken: string;

  constructor() {
    this.accessToken = import.meta.env.VITE_WHATSAPP_ACCESS_TOKEN || '';
    this.phoneNumberId = import.meta.env.VITE_WHATSAPP_PHONE_NUMBER_ID || '';
    this.businessAccountId = import.meta.env.VITE_WHATSAPP_BUSINESS_ACCOUNT_ID || '';
    this.webhookVerifyToken = import.meta.env.VITE_WHATSAPP_WEBHOOK_VERIFY_TOKEN || '';
  }

  // Send Template Message
  async sendTemplateMessage(
    recipientPhone: string,
    templateName: string,
    language: string = 'en_US',
    parameters: any[] = [],
    customerId?: string,
    metadata?: any
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const url = `https://graph.facebook.com/v18.0/${this.phoneNumberId}/messages`;
      
      const messageData = {
        messaging_product: 'whatsapp',
        to: recipientPhone,
        type: 'template',
        template: {
          name: templateName,
          language: {
            code: language
          },
          components: parameters.length > 0 ? [
            {
              type: 'body',
              parameters: parameters.map(param => ({
                type: 'text',
                text: param
              }))
            }
          ] : []
        }
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(messageData)
      });

      const result = await response.json();

      if (response.ok && result.messages && result.messages[0]) {
        const whatsappMessageId = result.messages[0].id;
        
        // Store message in Firestore
        await this.storeMessage({
          recipientPhone,
          messageType: 'template',
          templateName,
          templateLanguage: language,
          templateParameters: parameters,
          status: 'sent',
          direction: 'outbound',
          sentAt: new Date(),
          whatsappMessageId,
          customerId,
          sentBy: 'system', // TODO: Get actual user ID
          metadata
        });

        return { success: true, messageId: whatsappMessageId };
      } else {
        console.error('WhatsApp API Error:', result);
        return { 
          success: false, 
          error: result.error?.message || 'Failed to send message' 
        };
      }
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Send Text Message (only for existing conversations)
  async sendTextMessage(
    recipientPhone: string,
    message: string,
    customerId?: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const url = `https://graph.facebook.com/v18.0/${this.phoneNumberId}/messages`;
      
      const messageData = {
        messaging_product: 'whatsapp',
        to: recipientPhone,
        type: 'text',
        text: {
          body: message
        }
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(messageData)
      });

      const result = await response.json();

      if (response.ok && result.messages && result.messages[0]) {
        const whatsappMessageId = result.messages[0].id;
        
        // Store message in Firestore
        await this.storeMessage({
          recipientPhone,
          messageType: 'text',
          content: message,
          status: 'sent',
          direction: 'outbound',
          sentAt: new Date(),
          whatsappMessageId,
          customerId,
          sentBy: 'system' // TODO: Get actual user ID
        });

        return { success: true, messageId: whatsappMessageId };
      } else {
        console.error('WhatsApp API Error:', result);
        return { 
          success: false, 
          error: result.error?.message || 'Failed to send message' 
        };
      }
    } catch (error) {
      console.error('Error sending WhatsApp text message:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Store message in Firestore
  private async storeMessage(messageData: Omit<WhatsAppMessage, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'whatsapp_messages'), {
        ...messageData,
        sentAt: messageData.sentAt,
        deliveredAt: messageData.deliveredAt || null,
        readAt: messageData.readAt || null
      });
      return docRef.id;
    } catch (error) {
      console.error('Error storing WhatsApp message:', error);
      throw error;
    }
  }

  // Get messages for a customer
  async getCustomerMessages(
    customerId: string,
    limitCount: number = 50
  ): Promise<WhatsAppMessage[]> {
    try {
      const q = query(
        collection(db, 'whatsapp_messages'),
        where('customerId', '==', customerId),
        orderBy('sentAt', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        sentAt: doc.data().sentAt?.toDate(),
        deliveredAt: doc.data().deliveredAt?.toDate(),
        readAt: doc.data().readAt?.toDate()
      })) as WhatsAppMessage[];
    } catch (error) {
      console.error('Error getting customer messages:', error);
      return [];
    }
  }

  // Get messages for a phone number
  async getPhoneMessages(
    phone: string,
    limitCount: number = 50
  ): Promise<WhatsAppMessage[]> {
    try {
      const q = query(
        collection(db, 'whatsapp_messages'),
        where('recipientPhone', '==', phone),
        orderBy('sentAt', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        sentAt: doc.data().sentAt?.toDate(),
        deliveredAt: doc.data().deliveredAt?.toDate(),
        readAt: doc.data().readAt?.toDate()
      })) as WhatsAppMessage[];
    } catch (error) {
      console.error('Error getting phone messages:', error);
      return [];
    }
  }

  // Get available templates
  async getTemplates(): Promise<WhatsAppTemplate[]> {
    try {
      const q = query(
        collection(db, 'whatsapp_templates'),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      })) as WhatsAppTemplate[];
    } catch (error) {
      console.error('Error getting templates:', error);
      return [];
    }
  }

  // Process webhook for message status updates and incoming messages
  async processWebhook(webhookData: any): Promise<void> {
    try {
      if (webhookData.entry && webhookData.entry[0]) {
        const entry = webhookData.entry[0];
        
        if (entry.changes && entry.changes[0]) {
          const change = entry.changes[0];
          
          if (change.field === 'messages') {
            const value = change.value;
            
            // Handle message status updates
            if (value.statuses) {
              for (const status of value.statuses) {
                await this.updateMessageStatus(
                  status.id,
                  status.status,
                  status.timestamp
                );
              }
            }
            
            // Handle incoming messages
            if (value.messages) {
              for (const message of value.messages) {
                await this.handleIncomingMessage(message, value.contacts?.[0]);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error processing webhook:', error);
      throw error;
    }
  }

  // Update message status
  private async updateMessageStatus(
    whatsappMessageId: string,
    status: string,
    timestamp: string
  ): Promise<void> {
    try {
      const q = query(
        collection(db, 'whatsapp_messages'),
        where('whatsappMessageId', '==', whatsappMessageId)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const messageDoc = querySnapshot.docs[0];
        const updateData: any = { status };
        
        const statusDate = new Date(parseInt(timestamp) * 1000);
        
        if (status === 'delivered') {
          updateData.deliveredAt = statusDate;
        } else if (status === 'read') {
          updateData.readAt = statusDate;
        }
        
        await updateDoc(doc(db, 'whatsapp_messages', messageDoc.id), updateData);
      }
    } catch (error) {
      console.error('Error updating message status:', error);
    }
  }

  // Handle incoming message
  private async handleIncomingMessage(message: any, contact: any): Promise<void> {
    try {
      const messageData: Omit<WhatsAppMessage, 'id'> = {
        recipientPhone: message.from,
        messageType: message.type,
        content: this.extractMessageContent(message),
        status: 'delivered',
        direction: 'inbound',
        sentAt: new Date(parseInt(message.timestamp) * 1000),
        whatsappMessageId: message.id,
        sentBy: 'customer'
      };

      // Try to find associated customer
      const customerQuery = query(
        collection(db, 'customers'),
        where('phone', '==', message.from)
      );
      
      const customerSnapshot = await getDocs(customerQuery);
      if (!customerSnapshot.empty) {
        messageData.customerId = customerSnapshot.docs[0].id;
      }

      await this.storeMessage(messageData);
      
      // Update or create WhatsApp contact
      await this.updateContact(message.from, contact?.profile?.name);
      
    } catch (error) {
      console.error('Error handling incoming message:', error);
    }
  }

  // Extract message content based on type
  private extractMessageContent(message: any): string {
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

  // Update WhatsApp contact
  private async updateContact(phone: string, name?: string): Promise<void> {
    try {
      const contactQuery = query(
        collection(db, 'whatsapp_contacts'),
        where('phone', '==', phone)
      );
      
      const contactSnapshot = await getDocs(contactQuery);
      
      if (contactSnapshot.empty) {
        // Create new contact
        await addDoc(collection(db, 'whatsapp_contacts'), {
          phone,
          name: name || '',
          optInStatus: 'opted_in', // Assuming they opted in by messaging
          optInDate: new Date(),
          lastMessageDate: new Date(),
          conversationStatus: 'active'
        });
      } else {
        // Update existing contact
        const contactDoc = contactSnapshot.docs[0];
        await updateDoc(doc(db, 'whatsapp_contacts', contactDoc.id), {
          lastMessageDate: new Date(),
          conversationStatus: 'active',
          ...(name && { name })
        });
      }
    } catch (error) {
      console.error('Error updating contact:', error);
    }
  }

  // Verify webhook token
  verifyWebhook(mode: string, token: string, challenge: string): string | null {
    if (mode === 'subscribe' && token === this.webhookVerifyToken) {
      return challenge;
    }
    return null;
  }

  // Get conversation history
  async getConversationHistory(
    phone: string,
    customerId?: string
  ): Promise<WhatsAppMessage[]> {
    try {
      let q;
      
      if (customerId) {
        q = query(
          collection(db, 'whatsapp_messages'),
          where('customerId', '==', customerId),
          orderBy('sentAt', 'asc')
        );
      } else {
        q = query(
          collection(db, 'whatsapp_messages'),
          where('recipientPhone', '==', phone),
          orderBy('sentAt', 'asc')
        );
      }
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        sentAt: doc.data().sentAt?.toDate(),
        deliveredAt: doc.data().deliveredAt?.toDate(),
        readAt: doc.data().readAt?.toDate()
      })) as WhatsAppMessage[];
    } catch (error) {
      console.error('Error getting conversation history:', error);
      return [];
    }
  }
}

export default new WhatsAppService(); 