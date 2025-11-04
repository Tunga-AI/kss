/**
 * Customer Finance Journey Service
 *
 * Tracks customers from lead generation through program completion:
 * Lead → Customer → Admission → Learner → Graduate
 */

import { FirestoreService } from './firestore';
import { PaymentService, PaymentRecord, CustomerBalance } from './paymentService';

export interface CustomerFinanceJourney {
  customerId: string;
  customerName: string;
  customerEmail: string;
  phone?: string;
  stage: 'lead' | 'customer' | 'applicant' | 'learner' | 'graduate';
  createdAt: string;
  updatedAt: string;

  // Lead stage
  leadSource?: string;
  leadStatus?: 'contacted' | 'interested' | 'converted' | 'lost';
  leadNotes?: string;

  // Customer stage (showing interest, getting quotes)
  interestedPrograms?: string[];
  quotedAmount?: number;
  quotedDate?: string;

  // Applicant stage (applied, paying admission)
  applicationId?: string;
  programId?: string;
  programName?: string;
  admissionFee?: number;
  admissionPaid?: boolean;
  admissionPaidDate?: string;

  // Learner stage (enrolled, paying tuition)
  learnerProfile?: {
    studentId?: string;
    cohort?: string;
    enrollmentDate?: string;
    expectedGraduation?: string;
    totalTuition?: number;
    tuitionPaid?: number;
    outstandingBalance?: number;
  };

  // Finance summary
  totalExpected?: number;
  totalPaid?: number;
  outstandingBalance?: number;
  lastPaymentDate?: string;
  paymentStatus?: 'not_started' | 'partial' | 'completed' | 'overdue';
}

export interface FinanceOverview {
  totalLeads: number;
  totalCustomers: number;
  totalApplicants: number;
  totalLearners: number;
  totalGraduates: number;

  revenue: {
    admissionFees: number;
    tuitionFees: number;
    otherFees: number;
    total: number;
  };

  outstanding: {
    admissionFees: number;
    tuitionFees: number;
    otherFees: number;
    total: number;
  };

  conversionRates: {
    leadToCustomer: number;
    customerToApplicant: number;
    applicantToLearner: number;
    learnerToGraduate: number;
  };
}

export interface PaymentSchedule {
  id?: string;
  customerId: string;
  customerName: string;
  customerType: 'lead' | 'admission' | 'learner' | 'instructor';
  programId?: string;
  programName?: string;
  totalAmount: number;
  installments: PaymentInstallment[];
  scheduleType: 'custom' | 'monthly' | 'quarterly' | 'semester' | 'full_payment';
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

export interface PaymentInstallment {
  id: string;
  installmentNumber: number;
  amount: number;
  dueDate: string;
  description: string;
  status: 'pending' | 'paid' | 'overdue' | 'waived';
  paidAmount?: number;
  paidDate?: string;
  paymentRecordId?: string;
  notes?: string;
}

export interface CustomerFinancialSummary {
  customerId: string;
  customerName: string;
  customerType: string;

  // Financial totals
  totalExpected: number;
  totalPaid: number;
  totalOutstanding: number;
  totalOverdue: number;

  // Payment schedule info
  hasPaymentSchedule: boolean;
  nextPaymentAmount: number;
  nextPaymentDate: string;

  // Payment history
  totalPayments: number;
  lastPaymentDate: string;
  lastPaymentAmount: number;

  // Program info
  programId?: string;
  programName?: string;

  // Status indicators
  paymentProgress: number; // percentage
  isFullyPaid: boolean;
  hasOverduePayments: boolean;
  daysSinceLastPayment: number;
}

export interface FinancialTransaction {
  id?: string;
  customerId: string;
  type: 'payment' | 'refund' | 'adjustment' | 'fee' | 'discount';
  amount: number;
  description: string;
  date: string;
  status: 'completed' | 'pending' | 'cancelled';
  reference?: string;
  relatedInstallmentId?: string;
  relatedPaymentRecordId?: string;
  createdBy: string;
  createdAt: string;
  notes?: string;
}

export class CustomerFinanceService {

  /**
   * Create a payment schedule for a customer
   */
  static async createPaymentSchedule(
    customerId: string,
    customerName: string,
    customerType: string,
    totalAmount: number,
    scheduleType: PaymentSchedule['scheduleType'],
    programInfo?: { programId: string; programName: string },
    customInstallments?: Omit<PaymentInstallment, 'id' | 'status'>[]
  ): Promise<{ success: boolean; scheduleId?: string; error?: string }> {
    try {
      let installments: PaymentInstallment[] = [];

      if (customInstallments && customInstallments.length > 0) {
        // Use custom installments
        installments = customInstallments.map((inst, index) => ({
          ...inst,
          id: `inst_${Date.now()}_${index}`,
          status: 'pending' as const
        }));
      } else {
        // Generate default installments based on schedule type
        installments = this.generateDefaultInstallments(totalAmount, scheduleType);
      }

      const schedule: Omit<PaymentSchedule, 'id'> = {
        customerId,
        customerName,
        customerType: customerType as any,
        programId: programInfo?.programId,
        programName: programInfo?.programName,
        totalAmount,
        installments,
        scheduleType,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const result = await FirestoreService.create('payment_schedules', schedule);

      if (result.success) {
        await this.updateCustomerFinancialSummary(customerId);
        return { success: true, scheduleId: result.id };
      }

      return { success: false, error: 'Failed to create payment schedule' };
    } catch (error) {
      console.error('Error creating payment schedule:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Generate default installments based on schedule type
   */
  private static generateDefaultInstallments(
    totalAmount: number,
    scheduleType: PaymentSchedule['scheduleType']
  ): PaymentInstallment[] {
    const installments: PaymentInstallment[] = [];
    const baseDate = new Date();

    switch (scheduleType) {
      case 'full_payment':
        installments.push({
          id: `inst_${Date.now()}_1`,
          installmentNumber: 1,
          amount: totalAmount,
          dueDate: new Date(baseDate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
          description: 'Full Payment',
          status: 'pending'
        });
        break;

      case 'monthly':
        const monthlyAmount = Math.ceil(totalAmount / 3); // 3 months default
        for (let i = 0; i < 3; i++) {
          const amount = i === 2 ? totalAmount - (monthlyAmount * 2) : monthlyAmount; // Last installment gets remainder
          const dueDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + i + 1, baseDate.getDate());

          installments.push({
            id: `inst_${Date.now()}_${i + 1}`,
            installmentNumber: i + 1,
            amount,
            dueDate: dueDate.toISOString(),
            description: `Monthly Installment ${i + 1}`,
            status: 'pending'
          });
        }
        break;

      case 'quarterly':
        const quarterlyAmount = Math.ceil(totalAmount / 2); // 2 quarters default
        for (let i = 0; i < 2; i++) {
          const amount = i === 1 ? totalAmount - quarterlyAmount : quarterlyAmount;
          const dueDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + (i + 1) * 3, baseDate.getDate());

          installments.push({
            id: `inst_${Date.now()}_${i + 1}`,
            installmentNumber: i + 1,
            amount,
            dueDate: dueDate.toISOString(),
            description: `Quarterly Installment ${i + 1}`,
            status: 'pending'
          });
        }
        break;

      case 'semester':
        const semesterAmount = Math.ceil(totalAmount / 2); // 2 semesters
        for (let i = 0; i < 2; i++) {
          const amount = i === 1 ? totalAmount - semesterAmount : semesterAmount;
          const dueDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + (i + 1) * 6, baseDate.getDate());

          installments.push({
            id: `inst_${Date.now()}_${i + 1}`,
            installmentNumber: i + 1,
            amount,
            dueDate: dueDate.toISOString(),
            description: `Semester ${i + 1} Payment`,
            status: 'pending'
          });
        }
        break;

      default:
        // Custom - single payment due in 30 days
        installments.push({
          id: `inst_${Date.now()}_1`,
          installmentNumber: 1,
          amount: totalAmount,
          dueDate: new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          description: 'Payment Due',
          status: 'pending'
        });
    }

    return installments;
  }

  /**
   * Get customer's payment schedule
   */
  static async getCustomerPaymentSchedule(customerId: string): Promise<PaymentSchedule | null> {
    try {
      const result = await FirestoreService.getWithQuery('payment_schedules', [
        { field: 'customerId', operator: '==', value: customerId }
      ]);

      if (result.success && result.data && result.data.length > 0) {
        // Return the most recent active schedule
        const schedules = result.data as PaymentSchedule[];
        const activeSchedule = schedules
          .filter(s => s.status === 'active')
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

        return activeSchedule || null;
      }

      return null;
    } catch (error) {
      console.error('Error fetching payment schedule:', error);
      return null;
    }
  }

  /**
   * Record payment against a schedule installment
   */
  static async recordScheduledPayment(
    customerId: string,
    installmentId: string,
    paymentAmount: number,
    paymentData: {
      description: string;
      paymentMethod: string;
      reference?: string;
      notes?: string;
    }
  ): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    try {
      // Get the payment schedule
      const schedule = await this.getCustomerPaymentSchedule(customerId);
      if (!schedule) {
        return { success: false, error: 'Payment schedule not found' };
      }

      // Find the installment
      const installment = schedule.installments.find(inst => inst.id === installmentId);
      if (!installment) {
        return { success: false, error: 'Installment not found' };
      }

      // Record the payment using PaymentService
      const paymentResult = await PaymentService.recordPayment({
        customerId,
        customerName: schedule.customerName,
        customerEmail: '', // Would need to fetch from customer data
        customerType: schedule.customerType,
        amount: paymentAmount,
        description: `${paymentData.description} - ${installment.description}`,
        paymentMethod: paymentData.paymentMethod as any,
        status: 'verified', // Assuming manual verification
        category: 'tuition',
        programId: schedule.programId,
        programName: schedule.programName,
        referenceNumber: paymentData.reference,
        notes: paymentData.notes
      });

      if (!paymentResult.success) {
        return paymentResult;
      }

      // Update the installment status
      const updatedInstallments = schedule.installments.map(inst => {
        if (inst.id === installmentId) {
          const totalPaid = (inst.paidAmount || 0) + paymentAmount;
          return {
            ...inst,
            paidAmount: totalPaid,
            paidDate: new Date().toISOString(),
            status: totalPaid >= inst.amount ? 'paid' as const : 'pending' as const,
            paymentRecordId: paymentResult.transactionId
          };
        }
        return inst;
      });

      // Update schedule status if all installments are paid
      const allPaid = updatedInstallments.every(inst => inst.status === 'paid');
      const scheduleStatus = allPaid ? 'completed' : 'active';

      // Update the schedule
      await FirestoreService.update('payment_schedules', schedule.id!, {
        installments: updatedInstallments,
        status: scheduleStatus,
        updatedAt: new Date().toISOString()
      });

      // Update financial summary
      await this.updateCustomerFinancialSummary(customerId);

      return { success: true, transactionId: paymentResult.transactionId };
    } catch (error) {
      console.error('Error recording scheduled payment:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Get comprehensive financial summary for a customer
   */
  static async getCustomerFinancialSummary(customerId: string): Promise<CustomerFinancialSummary | null> {
    try {
      // Get payment schedule
      const schedule = await this.getCustomerPaymentSchedule(customerId);

      // Get payment records
      const payments = await PaymentService.getCustomerPayments(customerId);
      const verifiedPayments = payments.filter(p => p.status === 'verified');

      // Get customer balance
      const balance = await PaymentService.getCustomerBalance(customerId);

      if (!balance) {
        return null;
      }

      // Calculate financial metrics
      const totalPaid = verifiedPayments.reduce((sum, p) => sum + p.amount, 0);
      const totalExpected = balance.totalExpected;
      const totalOutstanding = Math.max(0, totalExpected - totalPaid);

      // Calculate overdue amount
      let totalOverdue = 0;
      let nextPaymentAmount = 0;
      let nextPaymentDate = '';

      if (schedule) {
        const today = new Date();
        const overdueInstallments = schedule.installments.filter(inst =>
          inst.status === 'pending' && new Date(inst.dueDate) < today
        );
        totalOverdue = overdueInstallments.reduce((sum, inst) => sum + inst.amount, 0);

        // Find next payment
        const upcomingInstallments = schedule.installments
          .filter(inst => inst.status === 'pending')
          .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

        if (upcomingInstallments.length > 0) {
          nextPaymentAmount = upcomingInstallments[0].amount;
          nextPaymentDate = upcomingInstallments[0].dueDate;
        }
      }

      // Last payment info
      const lastPayment = verifiedPayments
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

      const lastPaymentDate = lastPayment ? lastPayment.createdAt : '';
      const lastPaymentAmount = lastPayment ? lastPayment.amount : 0;

      // Days since last payment
      const daysSinceLastPayment = lastPaymentDate
        ? Math.floor((Date.now() - new Date(lastPaymentDate).getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      // Payment progress
      const paymentProgress = totalExpected > 0 ? (totalPaid / totalExpected) * 100 : 0;

      const summary: CustomerFinancialSummary = {
        customerId: balance.customerId,
        customerName: balance.customerName,
        customerType: balance.customerType,

        totalExpected,
        totalPaid,
        totalOutstanding,
        totalOverdue,

        hasPaymentSchedule: !!schedule,
        nextPaymentAmount,
        nextPaymentDate,

        totalPayments: verifiedPayments.length,
        lastPaymentDate,
        lastPaymentAmount,

        programId: balance.programId,
        programName: balance.programName,

        paymentProgress: Math.min(100, paymentProgress),
        isFullyPaid: totalOutstanding === 0,
        hasOverduePayments: totalOverdue > 0,
        daysSinceLastPayment
      };

      return summary;
    } catch (error) {
      console.error('Error getting financial summary:', error);
      return null;
    }
  }

  /**
   * Update customer financial summary
   */
  static async updateCustomerFinancialSummary(customerId: string): Promise<void> {
    try {
      const summary = await this.getCustomerFinancialSummary(customerId);
      if (!summary) return;

      // Check if summary record exists
      const existingResult = await FirestoreService.getWithQuery('customer_financial_summaries', [
        { field: 'customerId', operator: '==', value: customerId }
      ]);

      const summaryData = {
        ...summary,
        updatedAt: new Date().toISOString()
      };

      if (existingResult.success && existingResult.data && existingResult.data.length > 0) {
        await FirestoreService.update('customer_financial_summaries', existingResult.data[0].id, summaryData);
      } else {
        await FirestoreService.create('customer_financial_summaries', {
          ...summaryData,
          createdAt: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error updating customer financial summary:', error);
    }
  }

  /**
   * Get overdue payments across all customers
   */
  static async getOverduePayments(): Promise<{
    customerId: string;
    customerName: string;
    installmentId: string;
    amount: number;
    dueDate: string;
    daysPastDue: number;
    description: string;
  }[]> {
    try {
      const result = await FirestoreService.getWithQuery('payment_schedules', [
        { field: 'status', operator: '==', value: 'active' }
      ]);

      if (!result.success || !result.data) return [];

      const schedules = result.data as PaymentSchedule[];
      const overduePayments: any[] = [];
      const today = new Date();

      schedules.forEach(schedule => {
        schedule.installments.forEach(installment => {
          if (installment.status === 'pending') {
            const dueDate = new Date(installment.dueDate);
            if (dueDate < today) {
              const daysPastDue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

              overduePayments.push({
                customerId: schedule.customerId,
                customerName: schedule.customerName,
                installmentId: installment.id,
                amount: installment.amount,
                dueDate: installment.dueDate,
                daysPastDue,
                description: installment.description
              });
            }
          }
        });
      });

      return overduePayments.sort((a, b) => b.daysPastDue - a.daysPastDue);
    } catch (error) {
      console.error('Error getting overdue payments:', error);
      return [];
    }
  }

  /**
   * Generate financial report for a customer
   */
  static async generateCustomerFinancialReport(customerId: string): Promise<{
    summary: CustomerFinancialSummary;
    schedule: PaymentSchedule | null;
    payments: PaymentRecord[];
    transactions: FinancialTransaction[];
  } | null> {
    try {
      const [summary, schedule, payments] = await Promise.all([
        this.getCustomerFinancialSummary(customerId),
        this.getCustomerPaymentSchedule(customerId),
        PaymentService.getCustomerPayments(customerId)
      ]);

      // Get financial transactions
      const transactionsResult = await FirestoreService.getWithQuery('financial_transactions', [
        { field: 'customerId', operator: '==', value: customerId }
      ]);

      const transactions = transactionsResult.success && transactionsResult.data
        ? transactionsResult.data as FinancialTransaction[]
        : [];

      if (!summary) return null;

      return {
        summary,
        schedule,
        payments,
        transactions
      };
    } catch (error) {
      console.error('Error generating financial report:', error);
      return null;
    }
  }

  /**
   * Create or update customer finance journey
   */
  static async createOrUpdateJourney(journeyData: Partial<CustomerFinanceJourney>): Promise<{ success: boolean; error?: string }> {
    try {
      if (!journeyData.customerId) {
        return { success: false, error: 'Customer ID is required' };
      }

      // Check if journey already exists
      const existingResult = await FirestoreService.getWithQuery('customer_finance_journey', [
        { field: 'customerId', operator: '==' as any, value: journeyData.customerId }
      ]);

      const journeyRecord: CustomerFinanceJourney = {
        customerId: journeyData.customerId,
        customerName: journeyData.customerName || '',
        customerEmail: journeyData.customerEmail || '',
        stage: journeyData.stage || 'lead',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...journeyData
      };

      if (existingResult.success && existingResult.data && existingResult.data.length > 0) {
        // Update existing journey
        const existingJourney = existingResult.data[0] as any;
        journeyRecord.createdAt = existingJourney.createdAt;
        journeyRecord.updatedAt = new Date().toISOString();

        const result = await FirestoreService.update('customer_finance_journey', existingJourney.id, journeyRecord);
        return { success: result.success, error: result.success ? undefined : 'Failed to update journey' };
      } else {
        // Create new journey
        const result = await FirestoreService.create('customer_finance_journey', journeyRecord);
        return { success: result.success, error: result.success ? undefined : 'Failed to create journey' };
      }
    } catch (error) {
      console.error('Error creating/updating customer journey:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Get customer journey by ID
   */
  static async getCustomerJourney(customerId: string): Promise<CustomerFinanceJourney | null> {
    try {
      const result = await FirestoreService.getWithQuery('customer_finance_journey', [
        { field: 'customerId', operator: '==' as any, value: customerId }
      ]);

      if (result.success && result.data && result.data.length > 0) {
        return result.data[0] as any as CustomerFinanceJourney;
      }

      return null;
    } catch (error) {
      console.error('Error fetching customer journey:', error);
      return null;
    }
  }

  /**
   * Get all journeys by stage
   */
  static async getJourneysByStage(stage: string): Promise<CustomerFinanceJourney[]> {
    try {
      const result = await FirestoreService.getWithQuery('customer_finance_journey', [
        { field: 'stage', operator: '==' as any, value: stage }
      ]);

      if (result.success && result.data) {
        return result.data as any as CustomerFinanceJourney[];
      }

      return [];
    } catch (error) {
      console.error('Error fetching journeys by stage:', error);
      return [];
    }
  }

  /**
   * Move customer to next stage
   */
  static async moveToNextStage(
    customerId: string,
    nextStage: 'customer' | 'applicant' | 'learner' | 'graduate',
    additionalData?: Partial<CustomerFinanceJourney>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const currentJourney = await this.getCustomerJourney(customerId);

      if (!currentJourney) {
        return { success: false, error: 'Customer journey not found' };
      }

      const updateData: Partial<CustomerFinanceJourney> = {
        stage: nextStage,
        updatedAt: new Date().toISOString(),
        ...additionalData
      };

      return await this.createOrUpdateJourney({
        ...currentJourney,
        ...updateData
      });
    } catch (error) {
      console.error('Error moving customer to next stage:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Update finance information from payment records
   */
  static async updateFinanceFromPayments(customerId: string): Promise<void> {
    try {
      const payments = await PaymentService.getCustomerPayments(customerId);
      const verifiedPayments = payments.filter(p => p.status === 'verified');

      const totalPaid = verifiedPayments.reduce((sum, payment) => sum + payment.amount, 0);
      const lastPaymentDate = verifiedPayments.length > 0
        ? verifiedPayments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0].createdAt
        : undefined;

      // Calculate totals by category
      const admissionPaid = verifiedPayments
        .filter(p => p.category === 'admission_fee')
        .reduce((sum, p) => sum + p.amount, 0);

      const tuitionPaid = verifiedPayments
        .filter(p => p.category === 'tuition')
        .reduce((sum, p) => sum + p.amount, 0);

      const journey = await this.getCustomerJourney(customerId);

      if (journey) {
        const updateData: Partial<CustomerFinanceJourney> = {
          totalPaid,
          lastPaymentDate,
          admissionPaid: admissionPaid > 0,
          admissionPaidDate: admissionPaid > 0 ? lastPaymentDate : undefined,
          learnerProfile: journey.learnerProfile ? {
            ...journey.learnerProfile,
            tuitionPaid
          } : undefined
        };

        await this.createOrUpdateJourney({
          ...journey,
          ...updateData
        });
      }
    } catch (error) {
      console.error('Error updating finance from payments:', error);
    }
  }

  /**
   * Get comprehensive finance overview
   */
  static async getFinanceOverview(): Promise<FinanceOverview> {
    try {
      const [journeysResult, paymentsResult] = await Promise.all([
        FirestoreService.getAll('customer_finance_journey'),
        PaymentService.getAllPayments()
      ]);

      const journeys = (journeysResult.success && journeysResult.data)
        ? journeysResult.data as any as CustomerFinanceJourney[]
        : [];

      const verifiedPayments = paymentsResult.filter(p => p.status === 'verified');

      // Count by stage
      const totalLeads = journeys.filter(j => j.stage === 'lead').length;
      const totalCustomers = journeys.filter(j => j.stage === 'customer').length;
      const totalApplicants = journeys.filter(j => j.stage === 'applicant').length;
      const totalLearners = journeys.filter(j => j.stage === 'learner').length;
      const totalGraduates = journeys.filter(j => j.stage === 'graduate').length;

      // Calculate revenue by category
      const admissionRevenue = verifiedPayments
        .filter(p => p.category === 'admission_fee')
        .reduce((sum, p) => sum + p.amount, 0);

      const tuitionRevenue = verifiedPayments
        .filter(p => p.category === 'tuition')
        .reduce((sum, p) => sum + p.amount, 0);

      const otherRevenue = verifiedPayments
        .filter(p => !['admission_fee', 'tuition'].includes(p.category))
        .reduce((sum, p) => sum + p.amount, 0);

      // Calculate outstanding amounts
      const balances = await PaymentService.getAllCustomerBalances();
      const outstandingAdmission = balances
        .filter(b => b.customerType === 'admission')
        .reduce((sum, b) => sum + b.outstandingBalance, 0);

      const outstandingTuition = balances
        .filter(b => b.customerType === 'learner')
        .reduce((sum, b) => sum + b.outstandingBalance, 0);

      // Calculate conversion rates
      const conversionRates = {
        leadToCustomer: totalLeads > 0 ? (totalCustomers / totalLeads) * 100 : 0,
        customerToApplicant: totalCustomers > 0 ? (totalApplicants / totalCustomers) * 100 : 0,
        applicantToLearner: totalApplicants > 0 ? (totalLearners / totalApplicants) * 100 : 0,
        learnerToGraduate: totalLearners > 0 ? (totalGraduates / totalLearners) * 100 : 0
      };

      return {
        totalLeads,
        totalCustomers,
        totalApplicants,
        totalLearners,
        totalGraduates,
        revenue: {
          admissionFees: admissionRevenue,
          tuitionFees: tuitionRevenue,
          otherFees: otherRevenue,
          total: admissionRevenue + tuitionRevenue + otherRevenue
        },
        outstanding: {
          admissionFees: outstandingAdmission,
          tuitionFees: outstandingTuition,
          otherFees: 0, // Not tracking other outstanding for now
          total: outstandingAdmission + outstandingTuition
        },
        conversionRates
      };
    } catch (error) {
      console.error('Error getting finance overview:', error);
      return {
        totalLeads: 0,
        totalCustomers: 0,
        totalApplicants: 0,
        totalLearners: 0,
        totalGraduates: 0,
        revenue: { admissionFees: 0, tuitionFees: 0, otherFees: 0, total: 0 },
        outstanding: { admissionFees: 0, tuitionFees: 0, otherFees: 0, total: 0 },
        conversionRates: { leadToCustomer: 0, customerToApplicant: 0, applicantToLearner: 0, learnerToGraduate: 0 }
      };
    }
  }

  /**
   * Sync existing data to create customer journeys
   */
  static async syncExistingData(): Promise<{ success: boolean; synced: number; error?: string }> {
    try {
      let syncedCount = 0;

      // Sync leads from customers collection
      const customersResult = await FirestoreService.getAll('customers');
      if (customersResult.success && customersResult.data) {
        for (const customer of customersResult.data) {
          const journey: Partial<CustomerFinanceJourney> = {
            customerId: customer.id,
            customerName: customer.name || `${customer.firstName || ''} ${customer.lastName || ''}`.trim(),
            customerEmail: customer.email,
            phone: customer.phone,
            stage: 'lead',
            leadSource: customer.source || 'Unknown',
            leadStatus: customer.status === 'converted' ? 'converted' : 'interested',
            leadNotes: customer.notes,
            interestedPrograms: customer.interestedPrograms || [],
            createdAt: customer.createdAt || new Date().toISOString()
          };

          await this.createOrUpdateJourney(journey);
          syncedCount++;
        }
      }

      // Sync applicants
      const applicantsResult = await FirestoreService.getAll('applicants');
      if (applicantsResult.success && applicantsResult.data) {
        for (const applicant of applicantsResult.data as any[]) {
          await this.moveToNextStage(applicant.id, 'applicant', {
            applicationId: applicant.id,
            programId: applicant.programId,
            programName: applicant.programName,
            admissionFee: applicant.admissionFee || 0,
            customerName: `${applicant.firstName || ''} ${applicant.lastName || ''}`.trim(),
            customerEmail: applicant.email
          });
          syncedCount++;
        }
      }

      // Sync learners
      const learnersResult = await FirestoreService.getAll('learners');
      if (learnersResult.success && learnersResult.data) {
        for (const learner of learnersResult.data as any[]) {
          await this.moveToNextStage(learner.id, 'learner', {
            programId: learner.programId,
            programName: learner.programName,
            customerName: `${learner.firstName || ''} ${learner.lastName || ''}`.trim(),
            customerEmail: learner.email,
            learnerProfile: {
              studentId: learner.studentId,
              cohort: learner.cohort,
              enrollmentDate: learner.enrollmentDate,
              totalTuition: learner.totalFees || learner.expectedAmount || 0,
              tuitionPaid: learner.amountPaid || learner.totalAmountPaid || 0,
              outstandingBalance: Math.max(0, (learner.totalFees || 0) - (learner.amountPaid || 0))
            }
          });
          syncedCount++;
        }
      }

      return { success: true, synced: syncedCount };
    } catch (error) {
      console.error('Error syncing existing data:', error);
      return { success: false, synced: 0, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

export default CustomerFinanceService;