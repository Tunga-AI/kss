"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.whatsappWebhook = exports.verifyPasswordResetCode = exports.verifyEmailCode = exports.sendBulkNotification = exports.sendInvoiceEmail = exports.sendSessionReminder = exports.sendApplicationStatusUpdate = exports.sendPaymentConfirmation = exports.sendWelcomeEmail = exports.sendVerificationEmail = exports.testPesaPalConnection = exports.getTransactionStatus = exports.submitPaymentOrder = exports.registerIPN = void 0;
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
const firebase_functions_1 = require("firebase-functions");
// Initialize Firebase Admin
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();
// Export PesaPal service functions
var pesapalService_1 = require("./pesapalService");
Object.defineProperty(exports, "registerIPN", { enumerable: true, get: function () { return pesapalService_1.registerIPN; } });
Object.defineProperty(exports, "submitPaymentOrder", { enumerable: true, get: function () { return pesapalService_1.submitPaymentOrder; } });
Object.defineProperty(exports, "getTransactionStatus", { enumerable: true, get: function () { return pesapalService_1.getTransactionStatus; } });
Object.defineProperty(exports, "testPesaPalConnection", { enumerable: true, get: function () { return pesapalService_1.testPesaPalConnection; } });
// Export Email service functions
var emailService_1 = require("./emailService");
Object.defineProperty(exports, "sendVerificationEmail", { enumerable: true, get: function () { return emailService_1.sendVerificationEmail; } });
Object.defineProperty(exports, "sendWelcomeEmail", { enumerable: true, get: function () { return emailService_1.sendWelcomeEmail; } });
Object.defineProperty(exports, "sendPaymentConfirmation", { enumerable: true, get: function () { return emailService_1.sendPaymentConfirmation; } });
Object.defineProperty(exports, "sendApplicationStatusUpdate", { enumerable: true, get: function () { return emailService_1.sendApplicationStatusUpdate; } });
Object.defineProperty(exports, "sendSessionReminder", { enumerable: true, get: function () { return emailService_1.sendSessionReminder; } });
Object.defineProperty(exports, "sendInvoiceEmail", { enumerable: true, get: function () { return emailService_1.sendInvoiceEmail; } });
Object.defineProperty(exports, "sendBulkNotification", { enumerable: true, get: function () { return emailService_1.sendBulkNotification; } });
Object.defineProperty(exports, "verifyEmailCode", { enumerable: true, get: function () { return emailService_1.verifyEmailCode; } });
Object.defineProperty(exports, "verifyPasswordResetCode", { enumerable: true, get: function () { return emailService_1.verifyPasswordResetCode; } });
// WhatsApp Webhook Function
exports.whatsappWebhook = (0, https_1.onRequest)(async (req, res) => {
    try {
        if (req.method === 'GET') {
            // Webhook verification
            const mode = req.query['hub.mode'];
            const token = req.query['hub.verify_token'];
            const challenge = req.query['hub.challenge'];
            const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
            if (mode === 'subscribe' && token === verifyToken) {
                firebase_functions_1.logger.info('WhatsApp webhook verified successfully');
                res.status(200).send(challenge);
            }
            else {
                firebase_functions_1.logger.error('WhatsApp webhook verification failed');
                res.sendStatus(403);
            }
        }
        else if (req.method === 'POST') {
            // Handle webhook events
            const body = req.body;
            firebase_functions_1.logger.info('WhatsApp webhook received:', JSON.stringify(body));
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
        }
        else {
            res.sendStatus(405);
        }
    }
    catch (error) {
        firebase_functions_1.logger.error('Error in WhatsApp webhook:', error);
        res.status(500).send('Error processing webhook');
    }
});
async function processWhatsAppMessage(value) {
    var _a;
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
                await handleIncomingMessage(message, (_a = value.contacts) === null || _a === void 0 ? void 0 : _a[0]);
            }
        }
    }
    catch (error) {
        firebase_functions_1.logger.error('Error processing WhatsApp message:', error);
    }
}
async function updateMessageStatus(messageId, status, timestamp) {
    try {
        const messagesRef = db.collection('whatsapp_messages');
        const query = messagesRef.where('whatsappMessageId', '==', messageId);
        const snapshot = await query.get();
        if (!snapshot.empty) {
            const doc = snapshot.docs[0];
            const updateData = { status };
            const statusDate = new Date(parseInt(timestamp) * 1000);
            if (status === 'delivered') {
                updateData.deliveredAt = statusDate;
            }
            else if (status === 'read') {
                updateData.readAt = statusDate;
            }
            await doc.ref.update(updateData);
            firebase_functions_1.logger.info(`Updated WhatsApp message ${messageId} status to ${status}`);
        }
    }
    catch (error) {
        firebase_functions_1.logger.error('Error updating WhatsApp message status:', error);
    }
}
async function handleIncomingMessage(message, contact) {
    var _a;
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
        await updateContact(message.from, (_a = contact === null || contact === void 0 ? void 0 : contact.profile) === null || _a === void 0 ? void 0 : _a.name);
        firebase_functions_1.logger.info(`Processed incoming WhatsApp message from ${message.from}`);
    }
    catch (error) {
        firebase_functions_1.logger.error('Error handling incoming WhatsApp message:', error);
    }
}
function extractMessageContent(message) {
    var _a, _b, _c, _d;
    switch (message.type) {
        case 'text':
            return ((_a = message.text) === null || _a === void 0 ? void 0 : _a.body) || '';
        case 'image':
            return `[Image] ${((_b = message.image) === null || _b === void 0 ? void 0 : _b.caption) || ''}`;
        case 'document':
            return `[Document] ${((_c = message.document) === null || _c === void 0 ? void 0 : _c.filename) || ''}`;
        case 'audio':
            return '[Audio Message]';
        case 'video':
            return `[Video] ${((_d = message.video) === null || _d === void 0 ? void 0 : _d.caption) || ''}`;
        default:
            return `[${message.type}]`;
    }
}
async function updateContact(phone, name) {
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
        }
        else {
            // Update existing contact
            const doc = contactSnapshot.docs[0];
            await doc.ref.update(Object.assign({ lastMessageDate: new Date(), conversationStatus: 'active' }, (name && { name })));
        }
    }
    catch (error) {
        firebase_functions_1.logger.error('Error updating WhatsApp contact:', error);
    }
}
//# sourceMappingURL=index.js.map