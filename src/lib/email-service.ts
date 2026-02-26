import nodemailer from 'nodemailer';
import type { Firestore } from 'firebase/firestore';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

// Email Templates
export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent: string;
}

export interface EmailQueueData {
  to: string;
  subject: string;
  html: string;
  text: string;
  status: 'pending' | 'sent' | 'failed';
  priority: 'high' | 'normal' | 'low';
  metadata?: Record<string, any>;
  error?: string;
  sentAt?: any;
  createdAt: any;
}

/**
 * Queue an email to be sent
 */
export async function queueEmail(
  firestore: Firestore,
  emailData: Omit<EmailQueueData, 'createdAt' | 'status'>
) {
  try {
    const emailDoc = await addDoc(collection(firestore, 'email_queue'), {
      ...emailData,
      status: 'pending',
      createdAt: serverTimestamp(),
    });
    console.log('Email queued:', emailDoc.id);
    return emailDoc.id;
  } catch (error) {
    console.error('Error queuing email:', error);
    throw error;
  }
}

/**
 * Create a nodemailer transporter
 */
export function createEmailTransporter() {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
}

/**
 * Send an email directly (server-side only)
 */
export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  const transporter = createEmailTransporter();

  const info = await transporter.sendMail({
    from: `"${process.env.EMAIL_FROM_NAME || 'KSS Academy'}" <${process.env.EMAIL_USER}>`,
    to: options.to,
    subject: options.subject,
    text: options.text || '',
    html: options.html,
  });

  console.log('Email sent:', info.messageId);
  return info;
}

// Export all new unified email templates 
export * from './email-templates';
