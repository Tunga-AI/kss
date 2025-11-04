import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { google } from 'googleapis';
import * as CryptoJS from 'crypto-js';
import * as nodemailer from 'nodemailer';
import * as handlebars from 'handlebars';

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// Email service configuration
const EMAIL_CONFIG = {
  clientId: functions.config().google?.client_id,
  clientSecret: functions.config().google?.client_secret,
  redirectUri: functions.config().google?.redirect_uri,
  refreshToken: functions.config().google?.refresh_token,
  fromEmail: functions.config().email?.from_email || 'noreply@kenyaschoolofsales.co.ke',
  fromName: functions.config().email?.from_name || 'Kenya School of Sales',
  verificationSecret: functions.config().email?.verification_secret || 'kss-verification-secret',
  replyToEmail: functions.config().email?.reply_to || 'support@kenyaschoolofsales.co.ke',
};

// Gmail API client
class GmailClient {
  private gmail: any;
  private oauth2Client: any;
  private transporter: nodemailer.Transporter;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      EMAIL_CONFIG.clientId,
      EMAIL_CONFIG.clientSecret,
      EMAIL_CONFIG.redirectUri
    );

    this.oauth2Client.setCredentials({
      refresh_token: EMAIL_CONFIG.refreshToken,
    });

    this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
    
    // Create nodemailer transporter for Gmail
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: EMAIL_CONFIG.fromEmail,
        clientId: EMAIL_CONFIG.clientId,
        clientSecret: EMAIL_CONFIG.clientSecret,
        refreshToken: EMAIL_CONFIG.refreshToken,
        accessToken: null, // Will be set automatically
      },
    });
  }

  async sendEmail(to: string, subject: string, htmlBody: string, textBody?: string, attachments?: any[]) {
    try {
      const mailOptions = {
        from: `"${EMAIL_CONFIG.fromName}" <${EMAIL_CONFIG.fromEmail}>`,
        to: to,
        replyTo: EMAIL_CONFIG.replyToEmail,
        subject: subject,
        html: htmlBody,
        text: textBody,
        attachments: attachments || [],
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      // Log email sent
      await this.logEmailSent(to, subject, 'success', result.messageId);
      
      return result;
    } catch (error) {
      console.error('Error sending email:', error);
      await this.logEmailSent(to, subject, 'failed', null, error);
      throw error;
    }
  }

  async sendBulkEmail(recipients: string[], subject: string, htmlBody: string, textBody?: string) {
    const results = [];
    
    for (const recipient of recipients) {
      try {
        const result = await this.sendEmail(recipient, subject, htmlBody, textBody);
        results.push({ recipient, success: true, messageId: result.messageId });
      } catch (error) {
        results.push({ recipient, success: false, error: error.message });
      }
    }
    
    return results;
  }

  private async logEmailSent(to: string, subject: string, status: 'success' | 'failed', messageId?: string, error?: any) {
    try {
      await db.collection('email_logs').add({
        to,
        subject,
        status,
        messageId,
        error: error ? (error as Error).message : undefined,
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
        fromEmail: EMAIL_CONFIG.fromEmail,
      });
    } catch (logError) {
      console.error('Error logging email:', logError);
    }
  }
}

// Enhanced Email Templates with Handlebars
export class EmailTemplates {
  private static readonly BRAND_COLORS = {
    primary: '#4590AD',
    secondary: '#BD2D2B',
    accent: '#E39E41',
    background: '#F8FAFC',
    text: '#1F2937',
    success: '#059669',
    warning: '#D97706',
    error: '#DC2626',
  };

  private static readonly BASE_STYLE = `
    <style>
      body { 
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
        line-height: 1.6; 
        color: ${EmailTemplates.BRAND_COLORS.text}; 
        background-color: ${EmailTemplates.BRAND_COLORS.background};
        margin: 0;
        padding: 0;
      }
      .email-container { 
        max-width: 600px; 
        margin: 0 auto; 
        background-color: white;
        border-radius: 12px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        overflow: hidden;
      }
      .header { 
        background: linear-gradient(135deg, ${EmailTemplates.BRAND_COLORS.primary}, ${EmailTemplates.BRAND_COLORS.secondary});
        color: white; 
        padding: 30px 20px; 
        text-align: center;
      }
      .header h1 { 
        margin: 0; 
        font-size: 24px; 
        font-weight: 600;
      }
      .content { 
        padding: 40px 30px; 
      }
      .verification-code { 
        background-color: ${EmailTemplates.BRAND_COLORS.background};
        border: 2px solid ${EmailTemplates.BRAND_COLORS.secondary};
        border-radius: 8px;
        padding: 20px;
        text-align: center;
        margin: 20px 0;
        font-size: 32px;
        font-weight: bold;
        letter-spacing: 8px;
        color: ${EmailTemplates.BRAND_COLORS.primary};
      }
      .button { 
        display: inline-block; 
        background-color: ${EmailTemplates.BRAND_COLORS.secondary};
        color: white; 
        padding: 12px 30px; 
        text-decoration: none; 
        border-radius: 6px; 
        font-weight: 500;
        margin: 20px 0;
      }
      .button:hover {
        background-color: #A02624;
      }
      .footer { 
        background-color: ${EmailTemplates.BRAND_COLORS.background};
        padding: 20px; 
        text-align: center; 
        color: #6B7280;
        font-size: 14px;
      }
      .warning { 
        background-color: #FEF3C7;
        border-left: 4px solid ${EmailTemplates.BRAND_COLORS.accent};
        padding: 15px;
        margin: 20px 0;
        border-radius: 4px;
      }
      .success { 
        background-color: #D1FAE5;
        border-left: 4px solid ${EmailTemplates.BRAND_COLORS.success};
        padding: 15px;
        margin: 20px 0;
        border-radius: 4px;
      }
      .error { 
        background-color: #FEE2E2;
        border-left: 4px solid ${EmailTemplates.BRAND_COLORS.error};
        padding: 15px;
        margin: 20px 0;
        border-radius: 4px;
      }
      .table {
        width: 100%;
        border-collapse: collapse;
        margin: 20px 0;
      }
      .table th, .table td {
        padding: 12px;
        text-align: left;
        border-bottom: 1px solid #E5E7EB;
      }
      .table th {
        background-color: ${EmailTemplates.BRAND_COLORS.background};
        font-weight: 600;
      }
      .amount {
        font-size: 24px;
        font-weight: bold;
        color: ${EmailTemplates.BRAND_COLORS.secondary};
      }
    </style>
  `;

  static emailVerification(userName: string, verificationCode: string) {
    const template = handlebars.compile(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Email Verification</title>
        ${EmailTemplates.BASE_STYLE}
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <h1>🚀 Welcome to Kenya School of Sales!</h1>
          </div>
          <div class="content">
            <h2>Hi {{userName}},</h2>
            <p>Thank you for joining Kenya School of Sales Learning Platform! To complete your registration, please verify your email address using the code below:</p>
            
            <div class="verification-code">
              {{verificationCode}}
            </div>
            
            <p>This verification code will expire in <strong>10 minutes</strong>.</p>
            
            <div class="warning">
              <strong>Security Notice:</strong> If you didn't create an account with Kenya School of Sales, please ignore this email.
            </div>
            
            <p>Need help? Contact our support team at support@kenyaschoolofsales.co.ke</p>
            
            <p>Best regards,<br>The Kenya School of Sales Team</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Kenya School of Sales Learning Platform. All rights reserved.</p>
            <p>This email was sent from a system account. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `);

    return {
      subject: 'Verify your Kenya School of Sales account - Verification Code',
      htmlBody: template({ userName, verificationCode }),
      textBody: `
        Welcome to Kenya School of Sales!
        
        Hi ${userName},
        
        Thank you for joining Kenya School of Sales Learning Platform! To complete your registration, please verify your email address using this code:
        
        ${verificationCode}
        
        This verification code will expire in 10 minutes.
        
        If you didn't create an account with Kenya School of Sales, please ignore this email.
        
        Need help? Contact our support team at support@kenyaschoolofsales.co.ke
        
        Best regards,
        The Kenya School of Sales Team
      `,
    };
  }

  static welcomeEmail(userName: string, userRole: string) {
    const template = handlebars.compile(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome to Kenya School of Sales</title>
        ${EmailTemplates.BASE_STYLE}
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <h1>🎉 Welcome to Kenya School of Sales!</h1>
          </div>
          <div class="content">
            <h2>Hi {{userName}},</h2>
            <p>Congratulations! Your email has been verified and your account is now active. Welcome to the Kenya School of Sales Learning Platform!</p>
            
            <p>As a <strong>{{userRole}}</strong>, you now have access to:</p>
            <ul>
              <li>📚 Learning materials and resources</li>
              <li>🎥 Video conferences and live sessions</li>
              <li>📊 Progress tracking and analytics</li>
              <li>🤝 Community features and networking</li>
              <li>📱 Mobile-responsive platform</li>
            </ul>
            
            <p>If you have any questions or need assistance, don't hesitate to reach out to our support team.</p>
            
            <p>Happy learning!<br>The Kenya School of Sales Team</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Kenya School of Sales Learning Platform. All rights reserved.</p>
            <p>Visit us at <a href="https://kenyaschoolofsales.co.ke">kenyaschoolofsales.co.ke</a></p>
          </div>
        </div>
      </body>
      </html>
    `);

    return {
      subject: 'Welcome to Kenya School of Sales - Your learning journey begins!',
      htmlBody: template({ userName, userRole }),
    };
  }

  static paymentConfirmation(userName: string, amount: number, description: string, transactionId: string, paymentType: string) {
    const template = handlebars.compile(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Payment Confirmation</title>
        ${EmailTemplates.BASE_STYLE}
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <h1>✅ Payment Confirmed!</h1>
          </div>
          <div class="content">
            <h2>Hi {{userName}},</h2>
            <p>Thank you for your payment! Your transaction has been successfully processed.</p>
            
            <div class="success">
              <strong>Payment Details:</strong>
              <table class="table">
                <tr>
                  <td><strong>Amount:</strong></td>
                  <td class="amount">KES {{amount}}</td>
                </tr>
                <tr>
                  <td><strong>Description:</strong></td>
                  <td>{{description}}</td>
                </tr>
                <tr>
                  <td><strong>Transaction ID:</strong></td>
                  <td>{{transactionId}}</td>
                </tr>
                <tr>
                  <td><strong>Payment Type:</strong></td>
                  <td>{{paymentType}}</td>
                </tr>
                <tr>
                  <td><strong>Date:</strong></td>
                  <td>{{date}}</td>
                </tr>
              </table>
            </div>
            
            <p>Your payment has been recorded in our system. If you have any questions about this transaction, please contact our support team.</p>
            
            <p>Best regards,<br>The Kenya School of Sales Team</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Kenya School of Sales Learning Platform. All rights reserved.</p>
            <p>Transaction ID: {{transactionId}}</p>
          </div>
        </div>
      </body>
      </html>
    `);

    return {
      subject: 'Payment Confirmation - Kenya School of Sales Learning Platform',
      htmlBody: template({ 
        userName, 
        amount: amount.toLocaleString(), 
        description, 
        transactionId, 
        paymentType,
        date: new Date().toLocaleDateString('en-KE')
      }),
    };
  }

  static applicationStatusUpdate(userName: string, applicationNumber: string, status: string, nextSteps?: string) {
    const template = handlebars.compile(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Application Status Update</title>
        ${EmailTemplates.BASE_STYLE}
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <h1>📋 Application Update</h1>
          </div>
          <div class="content">
            <h2>Hi {{userName}},</h2>
            <p>Your application status has been updated!</p>
            
            <div class="success">
              <strong>Application Details:</strong>
              <table class="table">
                <tr>
                  <td><strong>Application Number:</strong></td>
                  <td>{{applicationNumber}}</td>
                </tr>
                <tr>
                  <td><strong>Current Status:</strong></td>
                  <td>{{status}}</td>
                </tr>
              </table>
            </div>
            
            {{#if nextSteps}}
            <div class="warning">
              <strong>Next Steps:</strong>
              <p>{{nextSteps}}</p>
            </div>
            {{/if}}
            
            <p>You can track your application progress by logging into your account.</p>
            
            <p>Best regards,<br>The Kenya School of Sales Team</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Kenya School of Sales Learning Platform. All rights reserved.</p>
            <p>Application Number: {{applicationNumber}}</p>
          </div>
        </div>
      </body>
      </html>
    `);

    return {
      subject: `Application Status Update - ${status}`,
      htmlBody: template({ userName, applicationNumber, status, nextSteps }),
    };
  }

  static sessionReminder(userName: string, sessionTitle: string, sessionDate: string, sessionTime: string, meetingLink?: string) {
    const template = handlebars.compile(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Session Reminder</title>
        ${EmailTemplates.BASE_STYLE}
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <h1>📅 Session Reminder</h1>
          </div>
          <div class="content">
            <h2>Hi {{userName}},</h2>
            <p>This is a friendly reminder about your upcoming learning session.</p>
            
            <div class="success">
              <strong>Session Details:</strong>
              <table class="table">
                <tr>
                  <td><strong>Title:</strong></td>
                  <td>{{sessionTitle}}</td>
                </tr>
                <tr>
                  <td><strong>Date:</strong></td>
                  <td>{{sessionDate}}</td>
                </tr>
                <tr>
                  <td><strong>Time:</strong></td>
                  <td>{{sessionTime}}</td>
                </tr>
                {{#if meetingLink}}
                <tr>
                  <td><strong>Meeting Link:</strong></td>
                  <td><a href="{{meetingLink}}" class="button">Join Meeting</a></td>
                </tr>
                {{/if}}
              </table>
            </div>
            
            <p>Please ensure you're prepared and join the session on time. If you have any questions, please contact your instructor.</p>
            
            <p>Best regards,<br>The Kenya School of Sales Team</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Kenya School of Sales Learning Platform. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `);

    return {
      subject: `Session Reminder: ${sessionTitle}`,
      htmlBody: template({ userName, sessionTitle, sessionDate, sessionTime, meetingLink }),
    };
  }

  static invoiceEmail(userName: string, invoiceNumber: string, amount: number, dueDate: string, items: any[]) {
    const template = handlebars.compile(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Invoice</title>
        ${EmailTemplates.BASE_STYLE}
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <h1>📄 Invoice</h1>
          </div>
          <div class="content">
            <h2>Hi {{userName}},</h2>
            <p>Please find attached your invoice for the services provided.</p>
            
            <div class="success">
              <strong>Invoice Details:</strong>
              <table class="table">
                <tr>
                  <td><strong>Invoice Number:</strong></td>
                  <td>{{invoiceNumber}}</td>
                </tr>
                <tr>
                  <td><strong>Total Amount:</strong></td>
                  <td class="amount">KES {{amount}}</td>
                </tr>
                <tr>
                  <td><strong>Due Date:</strong></td>
                  <td>{{dueDate}}</td>
                </tr>
              </table>
            </div>
            
            <p>Please ensure payment is made by the due date to avoid any late fees.</p>
            
            <p>Best regards,<br>The Kenya School of Sales Team</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Kenya School of Sales Learning Platform. All rights reserved.</p>
            <p>Invoice Number: {{invoiceNumber}}</p>
          </div>
        </div>
      </body>
      </html>
    `);

    return {
      subject: `Invoice #${invoiceNumber} - Kenya School of Sales Learning Platform`,
      htmlBody: template({ 
        userName, 
        invoiceNumber, 
        amount: amount.toLocaleString(), 
        dueDate 
      }),
    };
  }
}

// Verification code management
export class VerificationCodeManager {
  private static readonly COLLECTION_NAME = 'verificationCodes';

  static generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  static async saveCode(email: string, code: string, type: 'email_verification' | 'password_reset', expiresInMinutes: number = 10) {
    const hashedCode = CryptoJS.SHA256(code + EMAIL_CONFIG.verificationSecret).toString();
    
    await db.collection(VerificationCodeManager.COLLECTION_NAME).add({
      email,
      code: hashedCode,
      type,
      expiresAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() + expiresInMinutes * 60 * 1000)),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      used: false,
    });
  }

  static async verifyCode(email: string, code: string, type: 'email_verification' | 'password_reset'): Promise<boolean> {
    const hashedCode = CryptoJS.SHA256(code + EMAIL_CONFIG.verificationSecret).toString();
    
    const querySnapshot = await db.collection(VerificationCodeManager.COLLECTION_NAME)
      .where('email', '==', email)
      .where('code', '==', hashedCode)
      .where('type', '==', type)
      .where('used', '==', false)
      .get();
    
    if (querySnapshot.empty) {
      return false;
    }

    const doc = querySnapshot.docs[0];
    const data = doc.data();
    
    // Check if code is expired
    if (data.expiresAt.toDate() < new Date()) {
      return false;
    }

    // Mark code as used
    await doc.ref.update({ used: true });
    
    return true;
  }
}

// Main email service
export class EmailService {
  private static gmailClient: GmailClient;

  static async initialize() {
    if (!EmailService.gmailClient) {
      EmailService.gmailClient = new GmailClient();
    }
  }

  static async sendVerificationEmail(email: string, userName: string): Promise<string> {
    await EmailService.initialize();
    
    const verificationCode = VerificationCodeManager.generateCode();
    const template = EmailTemplates.emailVerification(userName, verificationCode);
    
    // Save code to database
    await VerificationCodeManager.saveCode(email, verificationCode, 'email_verification', 10);
    
    // Send email
    await EmailService.gmailClient.sendEmail(email, template.subject, template.htmlBody, template.textBody);
    
    return verificationCode;
  }

  static async sendWelcomeEmail(email: string, userName: string, userRole: string) {
    await EmailService.initialize();
    
    const template = EmailTemplates.welcomeEmail(userName, userRole);
    await EmailService.gmailClient.sendEmail(email, template.subject, template.htmlBody);
  }

  static async sendPaymentConfirmation(email: string, userName: string, amount: number, description: string, transactionId: string, paymentType: string) {
    await EmailService.initialize();
    
    const template = EmailTemplates.paymentConfirmation(userName, amount, description, transactionId, paymentType);
    await EmailService.gmailClient.sendEmail(email, template.subject, template.htmlBody);
  }

  static async sendApplicationStatusUpdate(email: string, userName: string, applicationNumber: string, status: string, nextSteps?: string) {
    await EmailService.initialize();
    
    const template = EmailTemplates.applicationStatusUpdate(userName, applicationNumber, status, nextSteps);
    await EmailService.gmailClient.sendEmail(email, template.subject, template.htmlBody);
  }

  static async sendSessionReminder(email: string, userName: string, sessionTitle: string, sessionDate: string, sessionTime: string, meetingLink?: string) {
    await EmailService.initialize();
    
    const template = EmailTemplates.sessionReminder(userName, sessionTitle, sessionDate, sessionTime, meetingLink);
    await EmailService.gmailClient.sendEmail(email, template.subject, template.htmlBody);
  }

  static async sendInvoiceEmail(email: string, userName: string, invoiceNumber: string, amount: number, dueDate: string, items: any[], pdfAttachment?: Buffer) {
    await EmailService.initialize();
    
    const template = EmailTemplates.invoiceEmail(userName, invoiceNumber, amount, dueDate, items);
    
    const attachments = [];
    if (pdfAttachment) {
      attachments.push({
        filename: `invoice-${invoiceNumber}.pdf`,
        content: pdfAttachment,
        contentType: 'application/pdf'
      });
    }
    
    await EmailService.gmailClient.sendEmail(email, template.subject, template.htmlBody, undefined, attachments);
  }

  static async sendBulkNotification(recipients: string[], subject: string, message: string, actionUrl?: string) {
    await EmailService.initialize();
    
    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Notification</title>
        <style>
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            color: #1F2937; 
            background-color: #F8FAFC;
            margin: 0;
            padding: 0;
          }
          .email-container { 
            max-width: 600px; 
            margin: 0 auto; 
            background-color: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          .header { 
            background: linear-gradient(135deg, #4590AD, #BD2D2B);
            color: white; 
            padding: 30px 20px; 
            text-align: center;
          }
          .header h1 { 
            margin: 0; 
            font-size: 24px; 
            font-weight: 600;
          }
          .content { 
            padding: 40px 30px; 
          }
          .button { 
            display: inline-block; 
            background-color: #BD2D2B;
            color: white; 
            padding: 12px 30px; 
            text-decoration: none; 
            border-radius: 6px; 
            font-weight: 500;
            margin: 20px 0;
          }
          .button:hover {
            background-color: #A02624;
          }
          .footer { 
            background-color: #F8FAFC;
            padding: 20px; 
            text-align: center; 
            color: #6B7280;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <h1>📢 Notification</h1>
          </div>
          <div class="content">
            <h2>Hello,</h2>
            <p>${message}</p>
            ${actionUrl ? `<a href="${actionUrl}" class="button">Take Action</a>` : ''}
            <p>Best regards,<br>The Kenya School of Sales Team</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Kenya School of Sales Learning Platform. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    return await EmailService.gmailClient.sendBulkEmail(recipients, subject, htmlBody);
  }

  static async verifyEmailCode(email: string, code: string): Promise<boolean> {
    return await VerificationCodeManager.verifyCode(email, code, 'email_verification');
  }

  static async verifyPasswordResetCode(email: string, code: string): Promise<boolean> {
    return await VerificationCodeManager.verifyCode(email, code, 'password_reset');
  }
}

// Firebase Functions for email operations
export const sendVerificationEmail = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { email, userName } = data;
    if (!email || !userName) {
      throw new functions.https.HttpsError('invalid-argument', 'Email and userName are required');
    }

    const verificationCode = await EmailService.sendVerificationEmail(email, userName);
    
    return {
      success: true,
      message: 'Verification email sent successfully',
      verificationCode // Remove this in production
    };
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw new functions.https.HttpsError('internal', 
      `Failed to send verification email: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
});

export const sendWelcomeEmail = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { email, userName, userRole } = data;
    if (!email || !userName || !userRole) {
      throw new functions.https.HttpsError('invalid-argument', 'Email, userName, and userRole are required');
    }

    await EmailService.sendWelcomeEmail(email, userName, userRole);
    
    return {
      success: true,
      message: 'Welcome email sent successfully'
    };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    throw new functions.https.HttpsError('internal', 
      `Failed to send welcome email: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
});

export const sendPaymentConfirmation = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { email, userName, amount, description, transactionId, paymentType } = data;
    if (!email || !userName || !amount || !description || !transactionId || !paymentType) {
      throw new functions.https.HttpsError('invalid-argument', 'All payment confirmation fields are required');
    }

    await EmailService.sendPaymentConfirmation(email, userName, amount, description, transactionId, paymentType);
    
    return {
      success: true,
      message: 'Payment confirmation email sent successfully'
    };
  } catch (error) {
    console.error('Error sending payment confirmation:', error);
    throw new functions.https.HttpsError('internal', 
      `Failed to send payment confirmation: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
});

export const sendApplicationStatusUpdate = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { email, userName, applicationNumber, status, nextSteps } = data;
    if (!email || !userName || !applicationNumber || !status) {
      throw new functions.https.HttpsError('invalid-argument', 'Email, userName, applicationNumber, and status are required');
    }

    await EmailService.sendApplicationStatusUpdate(email, userName, applicationNumber, status, nextSteps);
    
    return {
      success: true,
      message: 'Application status update email sent successfully'
    };
  } catch (error) {
    console.error('Error sending application status update:', error);
    throw new functions.https.HttpsError('internal', 
      `Failed to send application status update: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
});

export const sendSessionReminder = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { email, userName, sessionTitle, sessionDate, sessionTime, meetingLink } = data;
    if (!email || !userName || !sessionTitle || !sessionDate || !sessionTime) {
      throw new functions.https.HttpsError('invalid-argument', 'All session reminder fields are required');
    }

    await EmailService.sendSessionReminder(email, userName, sessionTitle, sessionDate, sessionTime, meetingLink);
    
    return {
      success: true,
      message: 'Session reminder email sent successfully'
    };
  } catch (error) {
    console.error('Error sending session reminder:', error);
    throw new functions.https.HttpsError('internal', 
      `Failed to send session reminder: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
});

export const sendInvoiceEmail = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { email, userName, invoiceNumber, amount, dueDate, items, pdfAttachment } = data;
    if (!email || !userName || !invoiceNumber || !amount || !dueDate || !items) {
      throw new functions.https.HttpsError('invalid-argument', 'All invoice email fields are required');
    }

    let pdfBuffer: Buffer | undefined;
    if (pdfAttachment) {
      pdfBuffer = Buffer.from(pdfAttachment, 'base64');
    }

    await EmailService.sendInvoiceEmail(email, userName, invoiceNumber, amount, dueDate, items, pdfBuffer);
    
    return {
      success: true,
      message: 'Invoice email sent successfully'
    };
  } catch (error) {
    console.error('Error sending invoice email:', error);
    throw new functions.https.HttpsError('internal', 
      `Failed to send invoice email: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
});

export const sendBulkNotification = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { recipients, subject, message, actionUrl } = data;
    if (!recipients || !Array.isArray(recipients) || !subject || !message) {
      throw new functions.https.HttpsError('invalid-argument', 'Recipients array, subject, and message are required');
    }

    const results = await EmailService.sendBulkNotification(recipients, subject, message, actionUrl);
    
    return {
      success: true,
      message: 'Bulk notification sent successfully',
      results
    };
  } catch (error) {
    console.error('Error sending bulk notification:', error);
    throw new functions.https.HttpsError('internal', 
      `Failed to send bulk notification: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
});

export const verifyEmailCode = functions.https.onCall(async (data, context) => {
  try {
    const { email, code } = data;
    if (!email || !code) {
      throw new functions.https.HttpsError('invalid-argument', 'Email and code are required');
    }

    const isValid = await EmailService.verifyEmailCode(email, code);
    
    return {
      success: true,
      isValid
    };
  } catch (error) {
    console.error('Error verifying email code:', error);
    throw new functions.https.HttpsError('internal', 
      `Failed to verify email code: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
});

export const verifyPasswordResetCode = functions.https.onCall(async (data, context) => {
  try {
    const { email, code } = data;
    if (!email || !code) {
      throw new functions.https.HttpsError('invalid-argument', 'Email and code are required');
    }

    const isValid = await EmailService.verifyPasswordResetCode(email, code);
    
    return {
      success: true,
      isValid
    };
  } catch (error) {
    console.error('Error verifying password reset code:', error);
    throw new functions.https.HttpsError('internal', 
      `Failed to verify password reset code: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}); 