import { FirestoreService } from './firestore';

export interface InvoiceData {
  invoiceNumber: string;
  applicantData: {
    applicationNumber?: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    programId: string;
    amountPaid: number;
    paymentMethod: 'mpesa' | 'bank_transfer' | 'cash' | 'other';
    confirmationCode: string;
    submittedDate: string;
  };
  programData?: {
    programName: string;
    programCode?: string;
  };
  cohortData?: {
    name: string;
    startDate: string;
  };
}

export interface ReceiptData {
  receiptNumber: string;
  paymentData: {
    applicationNumber?: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    amountPaid: number;
    paymentMethod: 'mpesa' | 'bank_transfer' | 'cash' | 'other';
    confirmationCode: string;
    paymentDate: string;
  };
  programData?: {
    programName: string;
    programCode?: string;
  };
}

export class InvoiceReceiptService {
  // Generate unique invoice number
  static generateInvoiceNumber(): string {
    const timestamp = new Date().getTime();
    const randomSuffix = Math.floor(Math.random() * 1000);
    const combined = timestamp + randomSuffix;
    const numericPart = (combined % 999) + 1;
    return `IN${numericPart.toString().padStart(3, '0')}`;
  }

  // Generate unique receipt number
  static generateReceiptNumber(): string {
    const timestamp = new Date().getTime();
    const randomSuffix = Math.floor(Math.random() * 1000);
    const combined = timestamp + randomSuffix;
    const numericPart = (combined % 999) + 1;
    return `RC${numericPart.toString().padStart(3, '0')}`;
  }

  // Save invoice to database
  static async saveInvoice(invoiceData: InvoiceData) {
    try {
      const result = await FirestoreService.create('invoices', invoiceData);
      return result;
    } catch (error) {
      console.error('Error saving invoice:', error);
      return { success: false, error: 'Failed to save invoice' };
    }
  }

  // Save receipt to database
  static async saveReceipt(receiptData: ReceiptData) {
    try {
      const result = await FirestoreService.create('receipts', receiptData);
      return result;
    } catch (error) {
      console.error('Error saving receipt:', error);
      return { success: false, error: 'Failed to save receipt' };
    }
  }

  // Get invoice by number
  static async getInvoiceByNumber(invoiceNumber: string) {
    try {
      const result = await FirestoreService.getWithQuery('invoices', [
        { field: 'invoiceNumber', operator: '==', value: invoiceNumber }
      ]);
      return result;
    } catch (error) {
      console.error('Error fetching invoice:', error);
      return { success: false, error: 'Failed to fetch invoice' };
    }
  }

  // Get receipt by number
  static async getReceiptByNumber(receiptNumber: string) {
    try {
      const result = await FirestoreService.getWithQuery('receipts', [
        { field: 'receiptNumber', operator: '==', value: receiptNumber }
      ]);
      return result;
    } catch (error) {
      console.error('Error fetching receipt:', error);
      return { success: false, error: 'Failed to fetch receipt' };
    }
  }

  // Generate public invoice URL
  static getPublicInvoiceUrl(invoiceNumber: string): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}/invoice/${invoiceNumber}`;
  }

  // Generate public receipt URL
  static getPublicReceiptUrl(receiptNumber: string): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}/receipt/${receiptNumber}`;
  }

  // Copy to clipboard helper
  static async copyToClipboard(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    }
  }
}