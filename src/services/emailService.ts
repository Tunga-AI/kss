// Client-side Email Service - Integrates with Firebase Functions Gmail Service
import { db, functions } from '../config/firebase';
import { collection, addDoc, query, where, getDocs, updateDoc, doc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

// Email service configuration
const EMAIL_CONFIG = {
  fromEmail: import.meta.env.VITE_SYSTEM_EMAIL || 'noreply@kenyaschoolofsales.co.ke',
  fromName: import.meta.env.VITE_SYSTEM_NAME || 'Kenya School of Sales',
};

// Email template types
export interface EmailTemplate {
  subject: string;
  htmlBody: string;
  textBody?: string;
}

// Email templates (for reference - actual templates are in Firebase Functions)
export class EmailTemplates {
  private static readonly BRAND_COLORS = {
    primary: '#4590AD',
    secondary: '#BD2D2B',
    accent: '#E39E41',
    background: '#F8FAFC',
    text: '#1F2937',
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
    </style>
  `;

  static emailVerification(userName: string, verificationCode: string): EmailTemplate {
    return {
      subject: 'Verify your Kenya School of Sales account - Verification Code',
      htmlBody: `
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
              <h2>Hi ${userName},</h2>
              <p>Thank you for joining Kenya School of Sales! To complete your registration, please verify your email address using the code below:</p>
              
              <div class="verification-code">
                ${verificationCode}
              </div>
              
              <p>This verification code will expire in <strong>10 minutes</strong>.</p>
              
              <div class="warning">
                <strong>Security Notice:</strong> If you didn't create an account with Kenya School of Sales, please ignore this email.
              </div>
              
              <p>Need help? Contact our support team at support@kenyaschoolofsales.co.ke</p>
              
              <p>Best regards,<br>The Kenya School of Sales Team</p>
            </div>
            <div class="footer">
              <p>&copy; 2024 Kenya School of Sales. All rights reserved.</p>
              <p>This email was sent from a system account. Please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      textBody: `
        Welcome to Kenya School of Sales!
        
        Hi ${userName},
        
        Thank you for joining Kenya School of Sales! To complete your registration, please verify your email address using this code:
        
        ${verificationCode}
        
        This verification code will expire in 10 minutes.
        
        If you didn't create an account with Kenya School of Sales, please ignore this email.
        
        Need help? Contact our support team at support@kenyaschoolofsales.co.ke
        
        Best regards,
        The Kenya School of Sales Team
      `,
    };
  }

  static welcomeEmail(userName: string, userRole: string): EmailTemplate {
    return {
      subject: 'Welcome to Kenya School of Sales!',
      htmlBody: `
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
              <h2>Hi ${userName},</h2>
              <p>Your email has been successfully verified and you're now ready to start your learning journey with Kenya School of Sales!</p>
              
              <p>As a ${userRole}, you have access to:</p>
              <ul>
                <li>Comprehensive learning resources</li>
                <li>Interactive course content</li>
                <li>Community discussions</li>
                <li>Progress tracking</li>
              </ul>
              
              <p>Get started by logging into your account and exploring the platform.</p>
              
              <p>Best regards,<br>The Kenya School of Sales Team</p>
            </div>
            <div class="footer">
              <p>&copy; 2024 Kenya School of Sales. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };
  }
}

// Simple verification code manager using client-side storage
export class VerificationCodeManager {
  private static readonly COLLECTION_NAME = 'verificationCodes';
  private static readonly SECRET_KEY = import.meta.env.VITE_VERIFICATION_SECRET || 'kss-verification-secret';

  static generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  static async saveCode(email: string, code: string, type: 'email_verification' | 'password_reset', expiresInMinutes: number = 10) {
    try {
      const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);
      
      await addDoc(collection(db, VerificationCodeManager.COLLECTION_NAME), {
        email,
        code,
        type,
        expiresAt,
        createdAt: serverTimestamp(),
        used: false
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error saving verification code:', error);
      return { success: false, error: 'Failed to save verification code' };
    }
  }

  static async verifyCode(email: string, code: string, type: 'email_verification' | 'password_reset'): Promise<boolean> {
    try {
      const q = query(
        collection(db, VerificationCodeManager.COLLECTION_NAME),
        where('email', '==', email),
        where('code', '==', code),
        where('type', '==', type),
        where('used', '==', false)
      );

      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return false;
      }

      const doc = querySnapshot.docs[0];
      const data = doc.data();
      
      // Check if code has expired
      if (data.expiresAt && data.expiresAt.toDate() < new Date()) {
        return false;
      }

      // Mark code as used
      await updateDoc(doc.ref, { used: true });
      
      return true;
    } catch (error) {
      console.error('Error verifying code:', error);
      return false;
    }
  }
}

// Client-side Email Service - Integrates with Firebase Functions
export class EmailService {
  // Firebase Functions callable functions
  private static sendVerificationEmailFunction = httpsCallable(functions, 'sendVerificationEmail');
  private static sendWelcomeEmailFunction = httpsCallable(functions, 'sendWelcomeEmail');
  private static sendPaymentConfirmationFunction = httpsCallable(functions, 'sendPaymentConfirmation');
  private static sendApplicationStatusUpdateFunction = httpsCallable(functions, 'sendApplicationStatusUpdate');
  private static sendSessionReminderFunction = httpsCallable(functions, 'sendSessionReminder');
  private static sendInvoiceEmailFunction = httpsCallable(functions, 'sendInvoiceEmail');
  private static sendBulkNotificationFunction = httpsCallable(functions, 'sendBulkNotification');
  private static verifyEmailCodeFunction = httpsCallable(functions, 'verifyEmailCode');
  private static verifyPasswordResetCodeFunction = httpsCallable(functions, 'verifyPasswordResetCode');

  // Send verification email via Firebase Functions
  static async sendVerificationEmail(email: string, userName: string): Promise<string> {
    try {
      console.log('📧 Email Service: Sending verification email to', email);
      
      const result = await EmailService.sendVerificationEmailFunction({ email, userName });
      const data = result.data as any;
      
      if (data.success) {
        console.log('✅ Verification email sent successfully');
        return data.verificationCode || 'sent'; // Remove verificationCode in production
      } else {
        throw new Error(data.error || 'Failed to send verification email');
      }
    } catch (error) {
      console.error('Error sending verification email:', error);
      throw error;
    }
  }

  // Send welcome email via Firebase Functions
  static async sendWelcomeEmail(email: string, userName: string, userRole: string) {
    try {
      console.log('📧 Email Service: Sending welcome email to', email);
      
      const result = await EmailService.sendWelcomeEmailFunction({ email, userName, userRole });
      const data = result.data as any;
      
      if (data.success) {
        console.log('✅ Welcome email sent successfully');
        return { success: true };
      } else {
        throw new Error(data.error || 'Failed to send welcome email');
      }
    } catch (error) {
      console.error('Error sending welcome email:', error);
      throw error;
    }
  }

  // Send payment confirmation email via Firebase Functions
  static async sendPaymentConfirmation(email: string, userName: string, amount: number, description: string, transactionId: string, paymentType: string) {
    try {
      console.log('📧 Email Service: Sending payment confirmation to', email);
      
      const result = await EmailService.sendPaymentConfirmationFunction({ 
        email, 
        userName, 
        amount, 
        description, 
        transactionId, 
        paymentType 
      });
      const data = result.data as any;
      
      if (data.success) {
        console.log('✅ Payment confirmation email sent successfully');
        return { success: true };
      } else {
        throw new Error(data.error || 'Failed to send payment confirmation');
      }
    } catch (error) {
      console.error('Error sending payment confirmation:', error);
      throw error;
    }
  }

  // Send application status update email via Firebase Functions
  static async sendApplicationStatusUpdate(email: string, userName: string, applicationNumber: string, status: string, nextSteps?: string) {
    try {
      console.log('📧 Email Service: Sending application status update to', email);
      
      const result = await EmailService.sendApplicationStatusUpdateFunction({ 
        email, 
        userName, 
        applicationNumber, 
        status, 
        nextSteps 
      });
      const data = result.data as any;
      
      if (data.success) {
        console.log('✅ Application status update email sent successfully');
        return { success: true };
      } else {
        throw new Error(data.error || 'Failed to send application status update');
      }
    } catch (error) {
      console.error('Error sending application status update:', error);
      throw error;
    }
  }

  // Send session reminder email via Firebase Functions
  static async sendSessionReminder(email: string, userName: string, sessionTitle: string, sessionDate: string, sessionTime: string, meetingLink?: string) {
    try {
      console.log('📧 Email Service: Sending session reminder to', email);
      
      const result = await EmailService.sendSessionReminderFunction({ 
        email, 
        userName, 
        sessionTitle, 
        sessionDate, 
        sessionTime, 
        meetingLink 
      });
      const data = result.data as any;
      
      if (data.success) {
        console.log('✅ Session reminder email sent successfully');
        return { success: true };
      } else {
        throw new Error(data.error || 'Failed to send session reminder');
      }
    } catch (error) {
      console.error('Error sending session reminder:', error);
      throw error;
    }
  }

  // Send invoice email via Firebase Functions
  static async sendInvoiceEmail(email: string, userName: string, invoiceNumber: string, amount: number, dueDate: string, items: any[], pdfAttachment?: Buffer) {
    try {
      console.log('📧 Email Service: Sending invoice email to', email);
      
      const result = await EmailService.sendInvoiceEmailFunction({ 
        email, 
        userName, 
        invoiceNumber, 
        amount, 
        dueDate, 
        items, 
        pdfAttachment: pdfAttachment ? pdfAttachment.toString('base64') : undefined
      });
      const data = result.data as any;
      
      if (data.success) {
        console.log('✅ Invoice email sent successfully');
        return { success: true };
      } else {
        throw new Error(data.error || 'Failed to send invoice email');
      }
    } catch (error) {
      console.error('Error sending invoice email:', error);
      throw error;
    }
  }

  // Send bulk notification via Firebase Functions
  static async sendBulkNotification(recipients: string[], subject: string, message: string, actionUrl?: string) {
    try {
      console.log('📧 Email Service: Sending bulk notification to', recipients.length, 'recipients');
      
      const result = await EmailService.sendBulkNotificationFunction({ 
        recipients, 
        subject, 
        message, 
        actionUrl 
      });
      const data = result.data as any;
      
      if (data.success) {
        console.log('✅ Bulk notification sent successfully');
        return { success: true, results: data.results };
      } else {
        throw new Error(data.error || 'Failed to send bulk notification');
      }
    } catch (error) {
      console.error('Error sending bulk notification:', error);
      throw error;
    }
  }

  // Verify email code via Firebase Functions
  static async verifyEmailCode(email: string, code: string): Promise<boolean> {
    try {
      console.log('🔐 Email Service: Verifying email code for', email);
      
      const result = await EmailService.verifyEmailCodeFunction({ email, code });
      const data = result.data as any;
      
      if (data.success) {
        console.log('✅ Email code verification result:', data.isValid);
        return data.isValid;
      } else {
        throw new Error(data.error || 'Failed to verify email code');
      }
    } catch (error) {
      console.error('Error verifying email code:', error);
      return false;
    }
  }

  // Verify password reset code via Firebase Functions
  static async verifyPasswordResetCode(email: string, code: string): Promise<boolean> {
    try {
      console.log('🔐 Email Service: Verifying password reset code for', email);
      
      const result = await EmailService.verifyPasswordResetCodeFunction({ email, code });
      const data = result.data as any;
      
      if (data.success) {
        console.log('✅ Password reset code verification result:', data.isValid);
        return data.isValid;
      } else {
        throw new Error(data.error || 'Failed to verify password reset code');
      }
    } catch (error) {
      console.error('Error verifying password reset code:', error);
      return false;
    }
  }

  // Legacy methods for backward compatibility (development fallback)
  static async sendPasswordResetEmail(email: string, userName: string): Promise<string> {
    try {
      console.log('📧 Email Service: Sending password reset email to', email);
      
      const code = VerificationCodeManager.generateCode();
      await VerificationCodeManager.saveCode(email, code, 'password_reset', 15);
      
      console.log('🔐 Password reset code for', email, ':', code);
      localStorage.setItem(`reset_code_${email}`, code);
      
      return code;
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw error;
    }
  }

  static async sendInvoiceEmailLegacy(email: string, userName: string, invoiceNumber: string, amount: number, dueDate: string) {
    try {
      console.log('📧 Email Service: Sending invoice email to', email);
      return { success: true };
    } catch (error) {
      console.error('Error sending invoice email:', error);
      throw error;
    }
  }

  static async sendNotificationEmail(email: string, userName: string, title: string, message: string, actionUrl?: string) {
    try {
      console.log('📧 Email Service: Sending notification email to', email);
      return { success: true };
    } catch (error) {
      console.error('Error sending notification email:', error);
      throw error;
    }
  }
}

// Development helper to show verification codes
if (import.meta.env.DEV) {
  console.log('🔧 Development Mode: Email verification codes will be logged to console and stored in localStorage');
} 