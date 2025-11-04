/**
 * DEPRECATED: Daraja Service
 *
 * This service has been deprecated in favor of manual payment tracking.
 * Mobile money payments should be recorded manually through the PaymentService.
 */

import { FirestoreService } from './firestore';

export interface STKPushRequest {
  phoneNumber: string;
  amount: number;
  reference: string;
  narration?: string;
  accountReference?: string;
}

export interface STKPushResponse {
  success: boolean;
  message: string;
  data?: {
    MerchantRequestID: string;
    CheckoutRequestID: string;
    ResponseCode: string;
    ResponseDescription: string;
    CustomerMessage: string;
  };
  error?: string;
}

export interface STKPushCallbackData {
  Body: {
    stkCallback: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number;
      ResultDesc: string;
      CallbackMetadata?: {
        Item: Array<{
          Name: string;
          Value: string | number;
        }>;
      };
    };
  };
}

export interface MpesaTransactionRecord {
  id?: string;
  merchantRequestId: string;
  checkoutRequestId: string;
  phoneNumber: string;
  amount: number;
  reference: string;
  narration: string;
  status: 'initiated' | 'pending' | 'completed' | 'failed' | 'cancelled' | 'timeout';
  mpesaReceiptNumber?: string;
  transactionDate?: string;
  accountBalance?: number;
  initiatedAt: string;
  completedAt?: string;
  resultCode?: number;
  resultDescription?: string;
  customerMessage?: string;
  eventId?: string;
  userId?: string;
  registrationId?: string;
}

class DarajaService {
  private readonly baseUrl: string;

  constructor() {
    // Use current domain for API calls (works with monolith server pattern)
    this.baseUrl = window.location.origin;
  }

  /**
   * Format phone number to international format (254...)
   */
  private formatPhoneNumber(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.startsWith('0')) {
      return '254' + cleaned.substring(1);
    } else if (cleaned.startsWith('254')) {
      return cleaned;
    } else if (cleaned.startsWith('+254')) {
      return cleaned.substring(1);
    } else if (cleaned.length === 9) {
      // Assume it's a Kenyan number without country code
      return '254' + cleaned;
    } else {
      return '254' + cleaned;
    }
  }

  /**
   * Validate phone number for M-Pesa compatibility
   */
  private validatePhoneNumber(phone: string): boolean {
    const formatted = this.formatPhoneNumber(phone);
    // Kenyan numbers: 254 followed by 9 digits starting with 7, 1, or 0
    return /^254[710]\d{8}$/.test(formatted);
  }

  /**
   * Generate a unique transaction reference
   */
  private generateTransactionReference(prefix: string = 'KSS'): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}_${timestamp.slice(-8)}_${random}`;
  }

  /**
   * Initiate STK Push payment
   */
  async initiateSTKPush(request: STKPushRequest): Promise<STKPushResponse> {
    try {
      // Validate inputs
      if (!request.phoneNumber || !request.amount || !request.reference) {
        return {
          success: false,
          message: 'Missing required fields: phoneNumber, amount, or reference',
          error: 'Validation error'
        };
      }

      // Validate amount (minimum 1 KES)
      if (request.amount < 1) {
        return {
          success: false,
          message: 'Amount must be at least 1 KES',
          error: 'Invalid amount'
        };
      }

      // Validate and format phone number
      if (!this.validatePhoneNumber(request.phoneNumber)) {
        return {
          success: false,
          message: 'Invalid phone number. Please use a valid Kenyan mobile number (e.g., 0712345678)',
          error: 'Invalid phone number'
        };
      }

      const formattedPhoneNumber = this.formatPhoneNumber(request.phoneNumber);

      // Prepare payload for the monolith server
      const payload = {
        phoneNumber: formattedPhoneNumber,
        amount: Math.round(request.amount), // Ensure integer amount
        reference: request.accountReference || request.reference,
        narration: request.narration || 'Payment to Kenya School of Sales'
      };

      console.log('🚀 Initiating STK Push:', {
        phoneNumber: formattedPhoneNumber,
        amount: payload.amount,
        reference: payload.reference
      });

      // Make request to monolith server
      const response = await fetch(`${this.baseUrl}/api/stkpush`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json() as STKPushResponse;

      // Store transaction record in Firestore
      if (result.success && result.data) {
        const transactionRecord: Omit<MpesaTransactionRecord, 'id'> = {
          merchantRequestId: result.data.MerchantRequestID,
          checkoutRequestId: result.data.CheckoutRequestID,
          phoneNumber: formattedPhoneNumber,
          amount: payload.amount,
          reference: request.reference,
          narration: payload.narration,
          status: 'initiated',
          initiatedAt: new Date().toISOString(),
          customerMessage: result.data.CustomerMessage,
          eventId: request.reference.includes('EVENT_') ? request.reference : undefined,
          userId: undefined, // Will be set by the calling component if available
          registrationId: undefined // Will be set by the calling component if available
        };

        try {
          await FirestoreService.create('mpesa_transactions', transactionRecord);
          console.log('✅ Transaction record saved to Firestore');
        } catch (firestoreError) {
          console.error('❌ Failed to save transaction record:', firestoreError);
          // Don't fail the STK push if Firestore fails
        }
      }

      return result;
    } catch (error) {
      console.error('❌ STK Push error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        error: 'Network or server error'
      };
    }
  }

  /**
   * Query STK Push status
   */
  async querySTKPushStatus(checkoutRequestId: string): Promise<any> {
    try {
      if (!checkoutRequestId) {
        throw new Error('CheckoutRequestID is required');
      }

      console.log('🔍 Querying STK Push status:', checkoutRequestId);

      const response = await fetch(`${this.baseUrl}/api/stkpush/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ checkoutRequestId })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('📊 STK Push query result:', result);

      return result;
    } catch (error) {
      console.error('❌ Query STK Push error:', error);
      throw error;
    }
  }

  /**
   * Get transaction record from Firestore
   */
  async getTransactionRecord(checkoutRequestId: string): Promise<MpesaTransactionRecord | null> {
    try {
      const result = await FirestoreService.getWithQuery('mpesa_transactions', [
        { field: 'checkoutRequestId', operator: '==', value: checkoutRequestId }
      ]);

      if (result.success && result.data && result.data.length > 0) {
        return result.data[0] as MpesaTransactionRecord;
      }

      return null;
    } catch (error) {
      console.error('❌ Error fetching transaction record:', error);
      return null;
    }
  }

  /**
   * Update transaction status based on callback
   */
  async updateTransactionStatus(
    checkoutRequestId: string, 
    callbackData: STKPushCallbackData
  ): Promise<boolean> {
    try {
      const callback = callbackData.Body.stkCallback;
      
      // Get existing transaction record
      const existingRecord = await this.getTransactionRecord(checkoutRequestId);
      if (!existingRecord) {
        console.error('❌ Transaction record not found for:', checkoutRequestId);
        return false;
      }

      // Prepare update data
      const updateData: Partial<MpesaTransactionRecord> = {
        resultCode: callback.ResultCode,
        resultDescription: callback.ResultDesc,
        completedAt: new Date().toISOString()
      };

      // Update status based on result code
      if (callback.ResultCode === 0) {
        // Success
        updateData.status = 'completed';
        
        // Extract transaction details from callback metadata
        if (callback.CallbackMetadata?.Item) {
          const metadata = callback.CallbackMetadata.Item;
          
          const receiptNumber = metadata.find(item => item.Name === 'MpesaReceiptNumber')?.Value;
          const transactionDate = metadata.find(item => item.Name === 'TransactionDate')?.Value;
          const accountBalance = metadata.find(item => item.Name === 'Balance')?.Value;
          
          if (receiptNumber) updateData.mpesaReceiptNumber = receiptNumber.toString();
          if (transactionDate) updateData.transactionDate = transactionDate.toString();
          if (accountBalance) updateData.accountBalance = Number(accountBalance);
        }
      } else {
        // Failed, cancelled, or timeout
        if (callback.ResultCode === 1032) {
          updateData.status = 'cancelled';
        } else if (callback.ResultCode === 1037) {
          updateData.status = 'timeout';
        } else {
          updateData.status = 'failed';
        }
      }

      // Update the transaction record
      const result = await FirestoreService.getWithQuery('mpesa_transactions', [
        { field: 'checkoutRequestId', operator: '==', value: checkoutRequestId }
      ]);

      if (result.success && result.data && result.data.length > 0) {
        const transactionId = result.data[0].id;
        await FirestoreService.update('mpesa_transactions', transactionId, updateData);
        console.log('✅ Transaction status updated:', updateData.status);
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Error updating transaction status:', error);
      return false;
    }
  }

  /**
   * Get all transactions for a user or event
   */
  async getTransactions(filters: {
    userId?: string;
    eventId?: string;
    phoneNumber?: string;
    status?: string;
  } = {}): Promise<MpesaTransactionRecord[]> {
    try {
      const queryConstraints = [];

      if (filters.userId) {
        queryConstraints.push({ field: 'userId', operator: '==', value: filters.userId });
      }
      if (filters.eventId) {
        queryConstraints.push({ field: 'eventId', operator: '==', value: filters.eventId });
      }
      if (filters.phoneNumber) {
        const formatted = this.formatPhoneNumber(filters.phoneNumber);
        queryConstraints.push({ field: 'phoneNumber', operator: '==', value: formatted });
      }
      if (filters.status) {
        queryConstraints.push({ field: 'status', operator: '==', value: filters.status });
      }

      const result = queryConstraints.length > 0 
        ? await FirestoreService.getWithQuery('mpesa_transactions', queryConstraints)
        : await FirestoreService.getAll('mpesa_transactions');

      if (result.success && result.data) {
        return result.data as MpesaTransactionRecord[];
      }

      return [];
    } catch (error) {
      console.error('❌ Error fetching transactions:', error);
      return [];
    }
  }

  /**
   * Check server health
   */
  async checkServerHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/health`);
      if (response.ok) {
        const data = await response.json();
        console.log('🏥 Server health:', data);
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Server health check failed:', error);
      return false;
    }
  }

  /**
   * Utility method to get payment status display text
   */
  getStatusDisplayText(status: string): { text: string; color: string } {
    switch (status) {
      case 'completed':
        return { text: 'Payment Successful', color: 'green' };
      case 'initiated':
        return { text: 'Payment Initiated', color: 'blue' };
      case 'pending':
        return { text: 'Payment Pending', color: 'yellow' };
      case 'failed':
        return { text: 'Payment Failed', color: 'red' };
      case 'cancelled':
        return { text: 'Payment Cancelled', color: 'gray' };
      case 'timeout':
        return { text: 'Payment Timeout', color: 'orange' };
      default:
        return { text: 'Unknown Status', color: 'gray' };
    }
  }
}

// Export singleton instance
export const darajaService = new DarajaService();

// Export types for use in other components
export type { STKPushRequest, STKPushResponse, MpesaTransactionRecord, STKPushCallbackData };