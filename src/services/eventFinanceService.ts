import { FirestoreService } from './firestore';

/**
 * EventFinanceService
 * Handles integration between Event Attendees and Finance Module
 * When attendees make payments, they become customers in the Finance system
 */

// Transaction ID generation (copied from Finance module)
const parseTransactionId = (transactionId: string) => {
  if (transactionId.startsWith('TS')) {
    const numStr = transactionId.substring(2);
    const num = parseInt(numStr);
    if (!isNaN(num)) {
      return { tier: 'TS', number: num, suffix: '', totalCount: num };
    }
  } else if (transactionId.match(/^T\d+[A-Z]*$/)) {
    const match = transactionId.match(/^T(\d+)([A-Z]*)$/);
    if (match) {
      const number = parseInt(match[1]);
      const suffix = match[2];
      let totalCount = 999;
      
      if (suffix === '') {
        totalCount += number;
      } else {
        totalCount += 99999;
        const suffixIndex = suffix.charCodeAt(0) - 65;
        totalCount += (suffixIndex * 100000) + number;
      }
      
      return { tier: 'T', number, suffix, totalCount };
    }
  }
  return { tier: 'TS', number: 0, suffix: '', totalCount: 0 };
};

const getNextTransactionIdNumber = async () => {
  try {
    const [learnersResult, paymentResult, eventAttendeesResult] = await Promise.all([
      FirestoreService.getAll('learners'),
      FirestoreService.getAll('payment_records'),
      FirestoreService.getAll('event_registrations')
    ]);

    let maxTotalCount = 0;

    // Check learner payment records
    if (learnersResult.success && learnersResult.data) {
      learnersResult.data.forEach((learner: any) => {
        if (learner.paymentRecords && Array.isArray(learner.paymentRecords)) {
          learner.paymentRecords.forEach((payment: any) => {
            if (payment.transactionId) {
              const parsed = parseTransactionId(payment.transactionId);
              if (parsed.totalCount > maxTotalCount) {
                maxTotalCount = parsed.totalCount;
              }
            }
          });
        }
      });
    }

    // Check payment records
    if (paymentResult.success && paymentResult.data) {
      paymentResult.data.forEach((payment: any) => {
        if (payment.transactionId) {
          const parsed = parseTransactionId(payment.transactionId);
          if (parsed.totalCount > maxTotalCount) {
            maxTotalCount = parsed.totalCount;
          }
        }
      });
    }

    // Check event attendee payment records
    if (eventAttendeesResult.success && eventAttendeesResult.data) {
      eventAttendeesResult.data.forEach((attendee: any) => {
        if (attendee.paymentRecords && Array.isArray(attendee.paymentRecords)) {
          attendee.paymentRecords.forEach((payment: any) => {
            if (payment.transactionId) {
              const parsed = parseTransactionId(payment.transactionId);
              if (parsed.totalCount > maxTotalCount) {
                maxTotalCount = parsed.totalCount;
              }
            }
          });
        }
      });
    }

    return maxTotalCount + 1;
  } catch (error) {
    console.error('Error getting next transaction ID number:', error);
    return 1;
  }
};

const generateTransactionId = async () => {
  const nextCount = await getNextTransactionIdNumber();
  
  if (nextCount <= 999) {
    return `TS${nextCount.toString().padStart(3, '0')}`;
  } else if (nextCount <= 100999) {
    const tNumber = nextCount - 999;
    return `T${tNumber}`;
  } else {
    const adjustedCount = nextCount - 100999;
    const suffixIndex = Math.floor(adjustedCount / 100000);
    const numberInGroup = (adjustedCount % 100000) + 1;
    
    const suffix = String.fromCharCode(66 + suffixIndex);
    return `T${numberInGroup}${suffix}`;
  }
};

interface EventPaymentRecord {
  id: string;
  transactionId?: string;
  amount: number;
  paymentMethod: string;
  confirmationCode?: string;
  transactionDate: string;
  notes?: string;
}

interface EventAttendee {
  id?: string;
  eventId: string;
  name: string;
  email: string;
  phone: string;
  registrationDate: string;
  status: 'registered' | 'attended' | 'no_show';
  paymentStatus?: 'pending' | 'completed' | 'failed' | 'free' | 'partially_paid';
  totalAmountDue?: number;
  totalAmountPaid?: number;
  paymentRecords?: EventPaymentRecord[];
  customResponses?: Record<string, any>;
}

interface EventData {
  id: string;
  title: string;
  price?: number;
  currency?: string;
  dates?: Array<{
    date: string;
    startTime: string;
    endTime: string;
    location: string;
  }>;
  description?: string;
}

interface FinanceCustomer {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phoneNumber: string;
  role: string;
  customerType: 'learner' | 'event_attendee';
  
  // Event-specific fields
  eventId?: string;
  eventTitle?: string;
  registrationDate?: string;
  
  // Financial fields
  totalFees: number;
  amountPaid: number;
  outstandingBalance: number;
  expectedAmount: number;
  totalAmountPaid: number;
  remainingBalance: number;
  paymentPlan?: string;
  paymentRecords: Array<{
    id: string;
    transactionId?: string;
    date: string;
    amount: number;
    type: 'event_fee' | 'registration' | 'materials' | 'other';
    status: 'paid' | 'pending' | 'overdue' | 'verified';
    description: string;
    method?: string;
    confirmationCode?: string;
    verified?: boolean;
    verifiedBy?: string;
    verifiedAt?: string;
    notes?: string;
  }>;
}

export class EventFinanceService {
  /**
   * Create or update customer in Finance system when attendee makes payment
   */
  static async createCustomerFromAttendee(
    attendee: EventAttendee, 
    eventData: EventData,
    verifiedBy?: string
  ): Promise<{ success: boolean; customerId?: string; error?: string }> {
    try {
      // Check if customer already exists
      const existingCustomer = await this.findExistingCustomer(attendee.email, attendee.eventId);
      
      if (existingCustomer) {
        // Update existing customer
        const result = await this.updateExistingCustomer(existingCustomer.id, attendee, eventData, verifiedBy);
        return result;
      } else {
        // Create new customer
        const result = await this.createNewCustomer(attendee, eventData, verifiedBy);
        return result;
      }
    } catch (error) {
      console.error('Error creating customer from attendee:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Find existing customer by email and event
   */
  private static async findExistingCustomer(email: string, eventId: string): Promise<any | null> {
    try {
      // Look in event_customers collection first
      const eventCustomersResult = await FirestoreService.getWithQuery('event_customers', [
        { field: 'email', operator: '==', value: email },
        { field: 'eventId', operator: '==', value: eventId }
      ]);

      if (eventCustomersResult.success && eventCustomersResult.data && eventCustomersResult.data.length > 0) {
        return eventCustomersResult.data[0];
      }

      return null;
    } catch (error) {
      console.error('Error finding existing customer:', error);
      return null;
    }
  }

  /**
   * Create new customer from attendee
   */
  private static async createNewCustomer(
    attendee: EventAttendee, 
    eventData: EventData,
    verifiedBy?: string
  ): Promise<{ success: boolean; customerId?: string; error?: string }> {
    try {
      const nameParts = attendee.name.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Prepare payment records with transaction IDs
      const paymentRecords = [];
      if (attendee.paymentRecords && attendee.paymentRecords.length > 0) {
        for (const payment of attendee.paymentRecords) {
          const transactionId = payment.transactionId || await generateTransactionId();
          
          paymentRecords.push({
            id: payment.id,
            transactionId: transactionId,
            date: payment.transactionDate,
            amount: payment.amount,
            type: 'event_fee' as const,
            status: 'verified' as const,
            description: `Payment for ${eventData.title}`,
            method: payment.paymentMethod,
            confirmationCode: payment.confirmationCode || '',
            verified: true,
            verifiedBy: verifiedBy || 'Event Registration System',
            verifiedAt: new Date().toISOString(),
            notes: payment.notes || `Event registration payment`
          });
        }
      }

      const customerData: FinanceCustomer = {
        id: attendee.id || `event_customer_${Date.now()}`,
        firstName: firstName,
        lastName: lastName,
        name: attendee.name,
        email: attendee.email,
        phoneNumber: attendee.phone,
        role: 'event_attendee',
        customerType: 'event_attendee',
        
        // Event-specific fields
        eventId: attendee.eventId,
        eventTitle: eventData.title,
        registrationDate: attendee.registrationDate,
        
        // Financial fields
        totalFees: attendee.totalAmountDue || eventData.price || 0,
        amountPaid: attendee.totalAmountPaid || 0,
        outstandingBalance: Math.max(0, (attendee.totalAmountDue || eventData.price || 0) - (attendee.totalAmountPaid || 0)),
        expectedAmount: attendee.totalAmountDue || eventData.price || 0,
        totalAmountPaid: attendee.totalAmountPaid || 0,
        remainingBalance: Math.max(0, (attendee.totalAmountDue || eventData.price || 0) - (attendee.totalAmountPaid || 0)),
        paymentPlan: 'event_registration',
        paymentRecords: paymentRecords
      };

      // Create customer in event_customers collection
      const result = await FirestoreService.create('event_customers', customerData);
      
      if (result.success) {
        return { success: true, customerId: result.id };
      } else {
        return { success: false, error: result.error || 'Failed to create customer' };
      }
    } catch (error) {
      console.error('Error creating new customer:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Update existing customer
   */
  private static async updateExistingCustomer(
    customerId: string,
    attendee: EventAttendee, 
    eventData: EventData,
    verifiedBy?: string
  ): Promise<{ success: boolean; customerId?: string; error?: string }> {
    try {
      // Get current customer data
      const customerResult = await FirestoreService.getById('event_customers', customerId);
      if (!customerResult.success || !customerResult.data) {
        return { success: false, error: 'Customer not found' };
      }

      const currentCustomer = customerResult.data as FinanceCustomer;

      // Merge payment records, ensuring no duplicates
      const existingPaymentIds = new Set(currentCustomer.paymentRecords.map(p => p.id));
      const newPaymentRecords = [];

      if (attendee.paymentRecords && attendee.paymentRecords.length > 0) {
        for (const payment of attendee.paymentRecords) {
          if (!existingPaymentIds.has(payment.id)) {
            const transactionId = payment.transactionId || await generateTransactionId();
            
            newPaymentRecords.push({
              id: payment.id,
              transactionId: transactionId,
              date: payment.transactionDate,
              amount: payment.amount,
              type: 'event_fee' as const,
              status: 'verified' as const,
              description: `Payment for ${eventData.title}`,
              method: payment.paymentMethod,
              confirmationCode: payment.confirmationCode || '',
              verified: true,
              verifiedBy: verifiedBy || 'Event Registration System',
              verifiedAt: new Date().toISOString(),
              notes: payment.notes || `Event registration payment`
            });
          }
        }
      }

      const allPaymentRecords = [...currentCustomer.paymentRecords, ...newPaymentRecords];
      const totalAmountPaid = attendee.totalAmountPaid || 0;
      const expectedAmount = attendee.totalAmountDue || eventData.price || 0;

      const updatedCustomer = {
        ...currentCustomer,
        totalAmountPaid: totalAmountPaid,
        amountPaid: totalAmountPaid,
        remainingBalance: Math.max(0, expectedAmount - totalAmountPaid),
        outstandingBalance: Math.max(0, expectedAmount - totalAmountPaid),
        paymentRecords: allPaymentRecords
      };

      const result = await FirestoreService.update('event_customers', customerId, updatedCustomer);
      
      if (result.success) {
        return { success: true, customerId: customerId };
      } else {
        return { success: false, error: result.error || 'Failed to update customer' };
      }
    } catch (error) {
      console.error('Error updating existing customer:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Record payment transaction for event attendee
   */
  static async recordEventPayment(
    attendeeId: string,
    paymentRecord: EventPaymentRecord,
    eventData: EventData,
    verifiedBy?: string
  ): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    try {
      // Generate transaction ID if not provided
      const transactionId = paymentRecord.transactionId || await generateTransactionId();

      // Update the payment record with transaction ID
      const updatedPaymentRecord = {
        ...paymentRecord,
        transactionId: transactionId
      };

      // Get attendee data
      const attendeeResult = await FirestoreService.getById('event_registrations', attendeeId);
      if (!attendeeResult.success || !attendeeResult.data) {
        return { success: false, error: 'Attendee not found' };
      }

      const attendee = attendeeResult.data as EventAttendee;

      // Update attendee with new payment record
      const updatedPaymentRecords = [...(attendee.paymentRecords || []), updatedPaymentRecord];
      const newTotalPaid = updatedPaymentRecords.reduce((sum, record) => sum + record.amount, 0);
      
      const updatedAttendee = {
        ...attendee,
        paymentRecords: updatedPaymentRecords,
        totalAmountPaid: newTotalPaid,
        paymentStatus: this.calculatePaymentStatus(attendee.totalAmountDue || 0, newTotalPaid)
      };

      // Update attendee in database
      const updateResult = await FirestoreService.update('event_registrations', attendeeId, updatedAttendee);
      
      if (updateResult.success) {
        // Create/update customer in Finance system
        await this.createCustomerFromAttendee(updatedAttendee, eventData, verifiedBy);
        
        return { success: true, transactionId: transactionId };
      } else {
        return { success: false, error: updateResult.error || 'Failed to update attendee' };
      }
    } catch (error) {
      console.error('Error recording event payment:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Calculate payment status based on amounts
   */
  private static calculatePaymentStatus(totalDue: number, totalPaid: number): 'pending' | 'completed' | 'failed' | 'free' | 'partially_paid' {
    if (totalDue === 0) return 'free';
    if (totalPaid === 0) return 'pending';
    if (totalPaid >= totalDue) return 'completed';
    return 'partially_paid';
  }

  /**
   * Generate receipt data for event attendee
   */
  static async generateReceiptData(attendeeId: string, paymentRecordId?: string): Promise<{
    success: boolean;
    receiptData?: any;
    error?: string;
  }> {
    try {
      const attendeeResult = await FirestoreService.getById('event_registrations', attendeeId);
      if (!attendeeResult.success || !attendeeResult.data) {
        return { success: false, error: 'Attendee not found' };
      }

      const attendee = attendeeResult.data as EventAttendee;
      
      // Get event data
      const eventResult = await FirestoreService.getById('events', attendee.eventId);
      const eventData = eventResult.success ? eventResult.data as EventData : null;

      // Get specific payment record if provided
      let selectedPayment = null;
      if (paymentRecordId && attendee.paymentRecords) {
        selectedPayment = attendee.paymentRecords.find(p => p.id === paymentRecordId);
      }

      const receiptData = {
        attendeeData: attendee,
        eventData: eventData,
        selectedPaymentRecord: selectedPayment
      };

      return { success: true, receiptData };
    } catch (error) {
      console.error('Error generating receipt data:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Generate invoice data for event attendee
   */
  static async generateInvoiceData(attendeeId: string): Promise<{
    success: boolean;
    invoiceData?: any;
    error?: string;
  }> {
    try {
      const attendeeResult = await FirestoreService.getById('event_registrations', attendeeId);
      if (!attendeeResult.success || !attendeeResult.data) {
        return { success: false, error: 'Attendee not found' };
      }

      const attendee = attendeeResult.data as EventAttendee;
      
      // Get event data
      const eventResult = await FirestoreService.getById('events', attendee.eventId);
      const eventData = eventResult.success ? eventResult.data as EventData : null;

      const invoiceData = {
        attendeeData: attendee,
        eventData: eventData
      };

      return { success: true, invoiceData };
    } catch (error) {
      console.error('Error generating invoice data:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
} 