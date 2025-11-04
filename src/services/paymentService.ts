/**
 * Simplified Manual Payment Service
 *
 * Supports manual payment tracking for:
 * - Customer leads (from interest to payment)
 * - Admission fees
 * - Learner tuition and fees
 * - Instructor payments
 * - General bills and expenses
 */

import { FirestoreService } from './firestore';

export interface PaymentRecord {
  id?: string;
  transactionId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerType: 'lead' | 'admission' | 'learner' | 'instructor' | 'general';
  amount: number;
  description: string;
  paymentMethod: 'cash' | 'bank_transfer' | 'mobile_money' | 'cheque' | 'other';
  status: 'pending' | 'verified' | 'rejected';
  referenceNumber?: string;
  notes?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  category: 'admission_fee' | 'tuition' | 'materials' | 'services' | 'salary' | 'bills' | 'other';
  programId?: string;
  programName?: string;
  cohort?: string;
}

export interface CustomerBalance {
  customerId: string;
  customerName: string;
  customerType: 'lead' | 'admission' | 'learner' | 'instructor';
  totalExpected: number;
  agreedPrice: number;  // The negotiated/agreed price with the customer
  totalPaid: number;
  outstandingBalance: number;
  lastPaymentDate?: string;
  programId?: string;
  programName?: string;
  agreedPriceDate?: string;  // When the agreed price was set
  agreedPriceNotes?: string;  // Notes about the agreed price (discount reason, etc.)
}


/**
 * Manual Payment Service
 */
export class PaymentService {

  /**
   * Generate unique transaction ID
   */
  static async generateTransactionId(): Promise<string> {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `TXN_${timestamp.slice(-8)}_${random}`;
  }

  /**
   * Record a new payment
   */
  static async recordPayment(paymentData: Omit<PaymentRecord, 'id' | 'transactionId' | 'createdAt' | 'updatedAt'>): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    try {
      const transactionId = await this.generateTransactionId();

      const paymentRecord: Omit<PaymentRecord, 'id'> = {
        ...paymentData,
        transactionId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const result = await FirestoreService.create('payment_records', paymentRecord);

      if (result.success) {
        await this.updateCustomerBalance(paymentData.customerId, paymentData.customerType);
        return { success: true, transactionId };
      }

      return { success: false, error: 'Failed to save payment record' };
    } catch (error) {
      console.error('Error recording payment:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Update payment status (verify/reject)
   */
  static async updatePaymentStatus(
    transactionId: string,
    status: 'verified' | 'rejected',
    verifiedBy: string,
    notes?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await FirestoreService.getWithQuery('payment_records', [
        { field: 'transactionId', operator: '==' as any, value: transactionId }
      ]);

      if (!result.success || !result.data || result.data.length === 0) {
        return { success: false, error: 'Payment record not found' };
      }

      const paymentRecord = result.data[0] as PaymentRecord;

      const updateData = {
        status,
        verifiedBy,
        verifiedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...(notes && { notes })
      };

      const updateResult = await FirestoreService.update('payment_records', paymentRecord.id!, updateData);

      if (updateResult.success) {
        await this.updateCustomerBalance(paymentRecord.customerId, paymentRecord.customerType);
        return { success: true };
      }

      return { success: false, error: 'Failed to update payment status' };
    } catch (error) {
      console.error('Error updating payment status:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Get payment records for a customer
   */
  static async getCustomerPayments(customerId: string): Promise<PaymentRecord[]> {
    try {
      const result = await FirestoreService.getWithQuery('payment_records', [
        { field: 'customerId', operator: '==' as any, value: customerId }
      ]);

      if (result.success && result.data) {
        return result.data as PaymentRecord[];
      }

      return [];
    } catch (error) {
      console.error('Error fetching customer payments:', error);
      return [];
    }
  }

  /**
   * Get all payment records with optional filters
   */
  static async getAllPayments(filters?: {
    customerType?: string;
    status?: string;
    category?: string;
  }): Promise<PaymentRecord[]> {
    try {
      let queryConstraints = [];

      if (filters?.customerType) {
        queryConstraints.push({ field: 'customerType', operator: '==' as any, value: filters.customerType });
      }
      if (filters?.status) {
        queryConstraints.push({ field: 'status', operator: '==' as any, value: filters.status });
      }
      if (filters?.category) {
        queryConstraints.push({ field: 'category', operator: '==' as any, value: filters.category });
      }

      const result = queryConstraints.length > 0
        ? await FirestoreService.getWithQuery('payment_records', queryConstraints)
        : await FirestoreService.getAll('payment_records');

      if (result.success && result.data) {
        return result.data as PaymentRecord[];
      }

      return [];
    } catch (error) {
      console.error('Error fetching payments:', error);
      return [];
    }
  }

  /**
   * Calculate and update customer balance
   */
  static async updateCustomerBalance(customerId: string, customerType: string): Promise<void> {
    try {
      const payments = await this.getCustomerPayments(customerId);
      const verifiedPayments = payments.filter(p => p.status === 'verified');

      const totalPaid = verifiedPayments.reduce((sum, payment) => sum + payment.amount, 0);
      const lastPaymentDate = verifiedPayments.length > 0
        ? verifiedPayments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0].createdAt
        : undefined;

      // Get expected amount based on customer type
      let totalExpected = 0;
      let customerName = '';
      let programInfo = { programId: '', programName: '' };

      if (customerType === 'learner') {
        const learnerResult = await FirestoreService.getById('learners', customerId);
        if (learnerResult.success && learnerResult.data) {
          const learner = learnerResult.data as any;
          totalExpected = learner.totalFees || learner.expectedAmount || 0;
          customerName = `${learner.firstName || ''} ${learner.lastName || ''}`.trim();
          programInfo.programId = learner.programId || '';
          programInfo.programName = learner.programName || '';
        }
      } else if (customerType === 'admission') {
        const applicantResult = await FirestoreService.getById('applicants', customerId);
        if (applicantResult.success && applicantResult.data) {
          const applicant = applicantResult.data as any;
          totalExpected = applicant.admissionFee || 0;
          customerName = `${applicant.firstName || ''} ${applicant.lastName || ''}`.trim();
          programInfo.programId = applicant.programId || '';
          programInfo.programName = applicant.programName || '';
        }
      }

      // Check if there's an existing balance with an agreed price
      const existingBalanceResult = await FirestoreService.getWithQuery('customer_balances', [
        { field: 'customerId', operator: '==' as any, value: customerId }
      ]);

      let agreedPrice = totalExpected;
      let agreedPriceDate: string | undefined;
      let agreedPriceNotes: string | undefined;

      if (existingBalanceResult.success && existingBalanceResult.data && existingBalanceResult.data.length > 0) {
        const existingBalance = existingBalanceResult.data[0] as any;
        if (existingBalance.agreedPrice !== undefined) {
          agreedPrice = existingBalance.agreedPrice;
          agreedPriceDate = existingBalance.agreedPriceDate;
          agreedPriceNotes = existingBalance.agreedPriceNotes;
        }
      }

      const balanceData: CustomerBalance = {
        customerId,
        customerName,
        customerType: customerType as any,
        totalExpected,
        agreedPrice,
        totalPaid,
        outstandingBalance: Math.max(0, agreedPrice - totalPaid),
        lastPaymentDate,
        ...programInfo,
        agreedPriceDate,
        agreedPriceNotes
      };

      // Update or create balance record
      const existingRecordResult = await FirestoreService.getWithQuery('customer_balances', [
        { field: 'customerId', operator: '==' as any, value: customerId }
      ]);

      if (existingRecordResult.success && existingRecordResult.data && existingRecordResult.data.length > 0) {
        await FirestoreService.update('customer_balances', existingRecordResult.data[0].id, balanceData);
      } else {
        await FirestoreService.create('customer_balances', balanceData);
      }
    } catch (error) {
      console.error('Error updating customer balance:', error);
    }
  }

  /**
   * Get customer balance
   */
  static async getCustomerBalance(customerId: string): Promise<CustomerBalance | null> {
    try {
      const result = await FirestoreService.getWithQuery('customer_balances', [
        { field: 'customerId', operator: '==' as any, value: customerId }
      ]);

      if (result.success && result.data && result.data.length > 0) {
        return result.data[0] as any as CustomerBalance;
      }

      return null;
    } catch (error) {
      console.error('Error fetching customer balance:', error);
      return null;
    }
  }

  /**
   * Get all customer balances
   */
  static async getAllCustomerBalances(): Promise<CustomerBalance[]> {
    try {
      const result = await FirestoreService.getAll('customer_balances');

      if (result.success && result.data) {
        return result.data as any as CustomerBalance[];
      }

      return [];
    } catch (error) {
      console.error('Error fetching customer balances:', error);
      return [];
    }
  }

  /**
   * Set agreed price for a customer
   */
  static async setAgreedPrice(
    customerId: string,
    agreedPrice: number,
    notes?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get existing balance record
      const balanceQueryResult = await FirestoreService.getWithQuery('customer_balances', [
        { field: 'customerId', operator: '==' as any, value: customerId }
      ]);

      if (!balanceQueryResult.success || !balanceQueryResult.data || balanceQueryResult.data.length === 0) {
        return { success: false, error: 'Customer balance record not found' };
      }

      const balance = balanceQueryResult.data[0];
      const updatedBalance = {
        ...balance,
        agreedPrice,
        agreedPriceDate: new Date().toISOString(),
        agreedPriceNotes: notes,
        outstandingBalance: Math.max(0, agreedPrice - (balance.totalPaid || 0)),
        updatedAt: new Date().toISOString()
      };

      const updateResult = await FirestoreService.update('customer_balances', balance.id, updatedBalance);

      if (updateResult.success) {
        return { success: true };
      }

      return { success: false, error: 'Failed to update agreed price' };
    } catch (error) {
      console.error('Error setting agreed price:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Get payment configuration for frontend display (bank details)
   */
  static getPaymentConfig() {
    return {
      bank: {
        name: 'Equity Bank Kenya',
        accountName: 'Kenya School of Sales',
        accountNumber: '1234567890',
        swiftCode: 'EQBLKENA',
        branchCode: '068'
      },
      paymentMethods: [
        { value: 'cash', label: 'Cash Payment' },
        { value: 'bank_transfer', label: 'Bank Transfer' },
        { value: 'mobile_money', label: 'Mobile Money (M-Pesa, etc.)' },
        { value: 'cheque', label: 'Cheque' },
        { value: 'other', label: 'Other' }
      ],
      categories: [
        { value: 'admission_fee', label: 'Admission Fee' },
        { value: 'tuition', label: 'Tuition Fee' },
        { value: 'materials', label: 'Materials & Resources' },
        { value: 'services', label: 'Services' },
        { value: 'salary', label: 'Salary & Compensation' },
        { value: 'bills', label: 'Bills & Expenses' },
        { value: 'other', label: 'Other' }
      ]
    };
  }
}

export default PaymentService; 