import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Banknote, 
  TrendingUp, 
  CreditCard, 
  Receipt, 
  Calendar, 
  Search, 
  Filter, 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Tag,
  PieChart,
  BarChart3,
  Eye,
  Edit,
  Download,
  AlertTriangle,
  Plus,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { FirestoreService } from '../../../services/firestore';
import { useAuthContext } from '../../../contexts/AuthContext';

/**
 * Enhanced Transaction ID System - Scalable tiered numbering
 * 
 * Tier 1 (First 999 transactions): TS001, TS002, ..., TS999
 * Tier 2 (Next 99,999 transactions): T1, T2, ..., T99999
 * Tier 3 (Next 100,000 transactions): T1B, T2B, ..., T100000B
 * Tier 4 (Next 100,000 transactions): T1C, T2C, ..., T100000C
 * And so on...
 * 
 * This system can handle millions of transactions efficiently:
 * - 999 + 99,999 + (26 × 100,000) = 2,700,998 possible unique IDs
 * - Can be extended further if needed by adding more suffix patterns
 */
const parseTransactionId = (transactionId: string) => {
  // Parse different transaction ID formats
  if (transactionId.startsWith('TS')) {
    // TS001-TS999 format (first 999 transactions)
    const numStr = transactionId.substring(2);
    const num = parseInt(numStr);
    if (!isNaN(num)) {
      return { tier: 'TS', number: num, suffix: '', totalCount: num };
    }
  } else if (transactionId.match(/^T\d+[A-Z]*$/)) {
    // T1-T99999, T1B-T99999B, T1C-T99999C format
    const match = transactionId.match(/^T(\d+)([A-Z]*)$/);
    if (match) {
      const number = parseInt(match[1]);
      const suffix = match[2];
      let totalCount = 999; // TS series count
      
      if (suffix === '') {
        // T1-T99999 (no suffix)
        totalCount += number;
      } else {
        // T1B, T1C, etc.
        totalCount += 99999; // T1-T99999 count
        const suffixIndex = suffix.charCodeAt(0) - 65; // A=0, B=1, C=2, etc.
        totalCount += (suffixIndex * 100000) + number;
      }
      
      return { tier: 'T', number, suffix, totalCount };
    }
  }
  return { tier: 'TS', number: 0, suffix: '', totalCount: 0 };
};

const getNextTransactionIdNumber = async () => {
  try {
    // Get all existing transactions to find the highest count
    const [learnersResult, paymentResult, eventCustomersResult] = await Promise.all([
      FirestoreService.getAll('learners'),
      FirestoreService.getAll('payment_records'),
      FirestoreService.getAll('event_customers')
    ]);

    let maxTotalCount = 0;

    // Check learner payment records for existing transaction IDs
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

    // Check payment records for existing transaction IDs
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

    // Check event customer payment records for existing transaction IDs
    if (eventCustomersResult.success && eventCustomersResult.data) {
      eventCustomersResult.data.forEach((customer: any) => {
        if (customer.paymentRecords && Array.isArray(customer.paymentRecords)) {
          customer.paymentRecords.forEach((payment: any) => {
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

    // If no existing transaction IDs found, try to estimate from the number of records
    if (maxTotalCount === 0) {
      let totalRecords = 0;
      
      if (learnersResult.success && learnersResult.data) {
        learnersResult.data.forEach((learner: any) => {
          if (learner.paymentRecords && Array.isArray(learner.paymentRecords)) {
            totalRecords += learner.paymentRecords.length;
          }
        });
      }
      
      if (paymentResult.success && paymentResult.data) {
        totalRecords += paymentResult.data.length;
      }
      
      if (eventCustomersResult.success && eventCustomersResult.data) {
        eventCustomersResult.data.forEach((customer: any) => {
          if (customer.paymentRecords && Array.isArray(customer.paymentRecords)) {
            totalRecords += customer.paymentRecords.length;
          }
        });
      }
      
      // Use the total number of records as a starting point
      maxTotalCount = totalRecords;
    }

    console.log('Next transaction ID will be:', maxTotalCount + 1);
    return maxTotalCount + 1;
  } catch (error) {
    console.error('Error getting next transaction ID number:', error);
    return 1;
  }
};

const generateTransactionId = async () => {
  const nextCount = await getNextTransactionIdNumber();
  
  if (nextCount <= 999) {
    // TS001-TS999 format for first 999 transactions
    return `TS${nextCount.toString().padStart(3, '0')}`;
  } else if (nextCount <= 100999) {
    // T1-T99999 format for next 99,999 transactions (1000-100999)
    const tNumber = nextCount - 999;
    return `T${tNumber}`;
  } else {
    // T1B-T99999B, T1C-T99999C format for subsequent groups of 100,000
    const adjustedCount = nextCount - 100999; // Remove TS and T series
    const suffixIndex = Math.floor(adjustedCount / 100000); // Which letter suffix (0=B, 1=C, etc.)
    const numberInGroup = (adjustedCount % 100000) + 1; // Number within the group (1-100000)
    
    const suffix = String.fromCharCode(66 + suffixIndex); // B=66, C=67, etc.
    return `T${numberInGroup}${suffix}`;
  }
};

interface Transaction {
  id: string;
  transactionId: string; // New sequential transaction ID (TS001, TS002, etc.)
  learnerId: string;
  learnerName: string;
  learnerEmail: string;
  amount: number;
  type: 'tuition' | 'fees' | 'materials' | 'other';
  status: 'paid' | 'pending' | 'overdue' | 'verified' | 'failed' | 'processing';
  description: string;
  method?: string;
  confirmationCode?: string;
  date: string;
  verified?: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  studentId?: string;
  programId?: string;
  programName?: string;
  cohort?: string;
  totalFees: number;
  amountPaid: number;
  outstandingBalance: number;
  paymentStatus: 'not_paid' | 'partial' | 'paid';
  lastPaymentDate?: string;
  enrollmentDate: string;
  academicStatus?: string;
}

interface FinancialStats {
  totalRevenue: number;
  monthlyRevenue: number;
  outstandingBalance: number;
  verifiedPayments: number;
  pendingVerification: number;
  totalCustomers: number;
  activeCustomers: number;
  fullyPaidCustomers: number;
  overduePayments: number;
}

const Finance: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [verifyingTransaction, setVerifyingTransaction] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15);
  
  // Data states
  const [stats, setStats] = useState<FinancialStats>({
    totalRevenue: 0,
    monthlyRevenue: 0,
    outstandingBalance: 0,
    verifiedPayments: 0,
    pendingVerification: 0,
    totalCustomers: 0,
    activeCustomers: 0,
    fullyPaidCustomers: 0,
    overduePayments: 0
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  
  const { userProfile } = useAuthContext();

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'transactions', label: 'Transactions', icon: CreditCard },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'reports', label: 'Reports', icon: PieChart },
  ];

  useEffect(() => {
    loadFinanceData();
  }, []);

  useEffect(() => {
    // Reset to first page when search term or filter changes
    setCurrentPage(1);
  }, [searchTerm, filterStatus]);

  const loadFinanceData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadTransactions(),
        loadCustomers(),
        calculateStats()
      ]);
    } catch (error) {
      console.error('Error loading finance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async () => {
    try {
      setLoading(true);
      
      // Get the starting transaction ID number
      const startingId = await getNextTransactionIdNumber();
      let transactionCounter = startingId;
      
      // Load learner payment records
      const learners = await FirestoreService.getAll('learners');
      const learnerTransactions: Transaction[] = [];
      
      if (learners.success && learners.data) {
        learners.data.forEach((learner: any) => {
          if (learner.paymentRecords && Array.isArray(learner.paymentRecords)) {
            learner.paymentRecords.forEach((payment: any) => {
              const transactionId = payment.transactionId || `TS${transactionCounter.toString().padStart(3, '0')}`;
              if (!payment.transactionId) {
                transactionCounter++;
              }
              
              learnerTransactions.push({
                id: `learner_${learner.id}_${payment.id}`,
                transactionId: transactionId,
                learnerId: learner.id,
                learnerName: `${learner.firstName || ''} ${learner.lastName || ''}`.trim() || learner.name || 'Unknown',
                learnerEmail: learner.email || '',
                amount: payment.amount || 0,
                type: payment.type || 'tuition',
                status: payment.status || 'pending',
                description: payment.description || 'Tuition payment',
                method: payment.method || 'manual',
                confirmationCode: payment.confirmationCode || '',
                date: payment.date?.toDate ? payment.date.toDate().toISOString() :
                      typeof payment.date === 'string' ? payment.date :
                      payment.createdAt?.toDate ? payment.createdAt.toDate().toISOString() :
                      typeof payment.createdAt === 'string' ? payment.createdAt :
                      payment.updatedAt?.toDate ? payment.updatedAt.toDate().toISOString() :
                      typeof payment.updatedAt === 'string' ? payment.updatedAt :
                      new Date().toISOString(),
                verified: payment.verified || false,
                verifiedBy: payment.verifiedBy || '',
                verifiedAt: payment.verifiedAt || ''
              });
            });
          }
        });
      }


      // Load event customer transactions
      const eventCustomers = await FirestoreService.getAll('event_customers');
      const eventTransactions: Transaction[] = [];
      
      if (eventCustomers.success && eventCustomers.data) {
        eventCustomers.data.forEach((customer: any) => {
          if (customer.paymentRecords && Array.isArray(customer.paymentRecords)) {
            customer.paymentRecords.forEach((payment: any) => {
              const eventTransactionId = payment.transactionId || `TS${transactionCounter.toString().padStart(3, '0')}`;
              if (!payment.transactionId) {
                transactionCounter++;
              }
              
              eventTransactions.push({
                id: `event_${customer.id}_${payment.id}`,
                transactionId: eventTransactionId,
                learnerId: customer.id,
                learnerName: customer.name || `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'Unknown',
                learnerEmail: customer.email || '',
                amount: payment.amount || 0,
                type: payment.type || 'fees',
                status: payment.status || 'verified',
                description: payment.description || `Payment for ${customer.eventTitle || 'Event'}`,
                method: payment.method || 'manual',
                confirmationCode: payment.confirmationCode || '',
                date: payment.date?.toDate ? payment.date.toDate().toISOString() :
                      typeof payment.date === 'string' ? payment.date :
                      payment.createdAt?.toDate ? payment.createdAt.toDate().toISOString() :
                      typeof payment.createdAt === 'string' ? payment.createdAt :
                      payment.updatedAt?.toDate ? payment.updatedAt.toDate().toISOString() :
                      typeof payment.updatedAt === 'string' ? payment.updatedAt :
                      new Date().toISOString(),
                verified: payment.verified || true,
                verifiedBy: payment.verifiedBy || 'Event System',
                verifiedAt: payment.verifiedAt || payment.date || new Date().toISOString()
              });
            });
          }
        });
      }

      // Load M-Pesa STK Push transactions
      const mpesaTransactions: Transaction[] = [];
      const mpesaResult = await FirestoreService.getAll('mpesa_transactions');
      
      if (mpesaResult.success && mpesaResult.data) {
        mpesaResult.data.forEach((mpesa: any) => {
          const mpesaTransactionId = `TS${transactionCounter.toString().padStart(3, '0')}`;
          transactionCounter++;
          
          mpesaTransactions.push({
            id: `mpesa_${mpesa.id}`,
            transactionId: mpesaTransactionId,
            learnerId: mpesa.userId || 'unknown',
            learnerName: mpesa.customerName || 'M-Pesa Customer',
            learnerEmail: mpesa.customerEmail || '',
            amount: mpesa.amount || 0,
            type: 'fees',
            status: mpesa.status === 'completed' ? 'verified' : 
                   mpesa.status === 'failed' || mpesa.status === 'cancelled' || mpesa.status === 'timeout' ? 'failed' :
                   'pending',
            description: mpesa.narration || `M-Pesa payment - ${mpesa.reference}`,
            method: 'mpesa_stk',
            confirmationCode: mpesa.mpesaReceiptNumber || mpesa.checkoutRequestId || '',
            date: mpesa.completedAt || mpesa.initiatedAt || new Date().toISOString(),
            verified: mpesa.status === 'completed',
            verifiedBy: mpesa.status === 'completed' ? 'M-Pesa System' : '',
            verifiedAt: mpesa.completedAt || ''
          });
        });
      }

      // Combine all transactions and sort by date (most recent first)
      const allTransactions = [...learnerTransactions, ...eventTransactions, ...mpesaTransactions]
        .sort((a, b) => {
          // Handle Firestore timestamps and various date formats
          const getValidDate = (dateValue: any) => {
            if (!dateValue) return 0;
            if (dateValue.toDate) return dateValue.toDate().getTime();
            if (typeof dateValue === 'string') {
              const parsed = new Date(dateValue);
              return isNaN(parsed.getTime()) ? 0 : parsed.getTime();
            }
            return 0;
          };
          
          const dateA = getValidDate(a.date);
          const dateB = getValidDate(b.date);
          return dateB - dateA; // Most recent first
        });

      // Debug: Log the first few transactions to see their dates
      console.log('First 5 transactions after sorting:', allTransactions.slice(0, 5).map(t => ({
        id: t.transactionId,
        date: t.date,
        timestamp: new Date(t.date).getTime(),
        name: t.learnerName
      })));

      setTransactions(allTransactions);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomers = async () => {
    try {
      const [learnersResult, programsResult, eventCustomersResult] = await Promise.all([
        FirestoreService.getAll('learners'),
        FirestoreService.getAll('programs'),
        FirestoreService.getAll('event_customers')
      ]);
      
      if (learnersResult.success && learnersResult.data) {
        const programs = programsResult.success && programsResult.data ? programsResult.data : [];
        
        const customerData: Customer[] = learnersResult.data.map((learner: any) => {
          const totalFees = learner.totalFees || learner.expectedAmount || 0;
          const amountPaid = learner.amountPaid || learner.totalAmountPaid || 0;
          const outstandingBalance = Math.max(0, totalFees - amountPaid);
          
          let paymentStatus: 'not_paid' | 'partial' | 'paid' = 'not_paid';
          if (amountPaid === 0) {
            paymentStatus = 'not_paid';
          } else if (amountPaid >= totalFees) {
            paymentStatus = 'paid';
          } else {
            paymentStatus = 'partial';
          }
          
          const program = programs.find((p: any) => p.id === learner.programId) as any;
          
          // Get last payment date
          let lastPaymentDate: string | undefined;
          if (learner.paymentRecords && Array.isArray(learner.paymentRecords) && learner.paymentRecords.length > 0) {
            const sortedPayments = [...learner.paymentRecords].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            lastPaymentDate = sortedPayments[0].date;
          }
          
          return {
            id: learner.id,
            name: `${learner.firstName || ''} ${learner.lastName || ''}`.trim(),
            email: learner.email,
            studentId: learner.studentId,
            programId: learner.programId,
            programName: program?.programName || 'N/A',
            cohort: learner.cohort || learner.cohortName,
            totalFees,
            amountPaid,
            outstandingBalance,
            paymentStatus,
            lastPaymentDate,
            enrollmentDate: learner.enrollmentDate || '',
            academicStatus: learner.academicStatus
          };
        });
        
        // Add event customers
        let eventCustomerData: Customer[] = [];
        if (eventCustomersResult.success && eventCustomersResult.data) {
          eventCustomerData = eventCustomersResult.data.map((eventCustomer: any) => {
            const amountPaid = eventCustomer.totalAmountPaid || 0;
            const totalFees = eventCustomer.totalFees || eventCustomer.expectedAmount || 0;
            
            let paymentStatus: 'not_paid' | 'partial' | 'paid' = 'not_paid';
            if (amountPaid === 0) {
              paymentStatus = 'not_paid';
            } else if (amountPaid >= totalFees) {
              paymentStatus = 'paid';
            } else {
              paymentStatus = 'partial';
            }

            // Get last payment date
            let lastPaymentDate: string | undefined;
            if (eventCustomer.paymentRecords && Array.isArray(eventCustomer.paymentRecords) && eventCustomer.paymentRecords.length > 0) {
              const sortedPayments = [...eventCustomer.paymentRecords].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
              lastPaymentDate = sortedPayments[0].date;
            }

            return {
              id: eventCustomer.id,
              name: eventCustomer.name || `${eventCustomer.firstName || ''} ${eventCustomer.lastName || ''}`.trim() || 'Unknown',
              email: eventCustomer.email || '',
              studentId: `EVT-${eventCustomer.id.substring(0, 6)}`,
              programId: eventCustomer.eventId,
              programName: eventCustomer.eventTitle || 'Event Registration',
              cohort: eventCustomer.eventTitle,
              totalFees,
              amountPaid,
              outstandingBalance: Math.max(0, totalFees - amountPaid),
              paymentStatus,
              lastPaymentDate,
              enrollmentDate: eventCustomer.registrationDate || '',
              academicStatus: 'event_attendee'
            };
          });
        }
        
        // Combine learner and event customers
        const allCustomers = [...customerData, ...eventCustomerData];
        setCustomers(allCustomers);
      }
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  const calculateStats = async () => {
    try {
      // This would be calculated from the loaded data
      // For now, we'll calculate from the transactions and customers
      let totalRevenue = 0;
      let monthlyRevenue = 0;
      let verifiedPayments = 0;
      let pendingVerification = 0;
      let overduePayments = 0;
      
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      transactions.forEach(transaction => {
        const transactionDate = new Date(transaction.date);
        
        if (transaction.status === 'verified' || transaction.status === 'paid') {
          totalRevenue += transaction.amount;
          verifiedPayments++;
          
          if (transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear) {
            monthlyRevenue += transaction.amount;
          }
        } else if (transaction.status === 'pending' || transaction.status === 'processing') {
          pendingVerification++;
        } else if (transaction.status === 'overdue' || transaction.status === 'failed') {
          overduePayments++;
        }
      });
      
      const outstandingBalance = customers.reduce((total, customer) => total + customer.outstandingBalance, 0);
      const totalCustomers = customers.length;
      const activeCustomers = customers.filter(c => c.academicStatus === 'active').length;
      const fullyPaidCustomers = customers.filter(c => c.paymentStatus === 'paid').length;
      
      setStats({
        totalRevenue,
        monthlyRevenue,
        outstandingBalance,
        verifiedPayments,
        pendingVerification,
        totalCustomers,
        activeCustomers,
        fullyPaidCustomers,
        overduePayments
      });
    } catch (error) {
      console.error('Error calculating stats:', error);
    }
  };

  const handleVerifyTransaction = async (transactionId: string, verify: boolean) => {
    setVerifyingTransaction(transactionId);
    
    try {
      // Find the transaction and corresponding learner
      const transaction = transactions.find(t => t.id === transactionId);
      if (!transaction) return;
      
      const learnerResult = await FirestoreService.getById('learners', transaction.learnerId);
      if (!learnerResult.success || !learnerResult.data) return;
      
      const learnerData = learnerResult.data as any;
      const updatedPaymentRecords = learnerData.paymentRecords.map((payment: any) => {
        if (payment.id === transactionId || `${learnerData.id}-${payment.date}` === transactionId) {
          return {
            ...payment,
            status: verify ? 'verified' : 'rejected',
            verified: verify,
            verifiedBy: userProfile?.displayName || 'Finance Team',
            verifiedAt: new Date().toISOString()
          };
        }
        return payment;
      });
      
      await FirestoreService.update('learners', transaction.learnerId, {
        paymentRecords: updatedPaymentRecords
      });
      
      // Reload data
      await loadFinanceData();
      
      alert(`Transaction ${verify ? 'verified' : 'rejected'} successfully!`);
      
    } catch (error) {
      console.error('Error verifying transaction:', error);
      alert('Error processing verification. Please try again.');
    } finally {
      setVerifyingTransaction(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
      case 'paid': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-orange-100 text-orange-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'tuition': return 'bg-primary-100 text-primary-800';
      case 'fees': return 'bg-secondary-100 text-secondary-800';
      case 'materials': return 'bg-purple-100 text-purple-800';
      case 'other': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'partial': return 'bg-yellow-100 text-yellow-800';
      case 'not_paid': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.learnerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.learnerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.transactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || transaction.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (customer.studentId && customer.studentId.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = filterStatus === 'all' || customer.paymentStatus === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Pagination calculations
  const totalTransactions = filteredTransactions.length;
  const totalPages = Math.ceil(totalTransactions / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);

  const totalCustomersFiltered = filteredCustomers.length;
  const totalCustomerPages = Math.ceil(totalCustomersFiltered / itemsPerPage);
  const customerStartIndex = (currentPage - 1) * itemsPerPage;
  const customerEndIndex = customerStartIndex + itemsPerPage;
  const paginatedCustomers = filteredCustomers.slice(customerStartIndex, customerEndIndex);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="bg-primary-600 text-white rounded-2xl shadow-lg p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Finance Management</h1>
            <p className="text-lg text-primary-100">
              Comprehensive financial oversight, transaction verification, and customer management
            </p>
          </div>
          <div className="bg-white bg-opacity-20 p-4 rounded-xl">
            <Banknote className="h-8 w-8 text-white" />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl border border-white border-opacity-20">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:justify-between">
              <div>
                <p className="text-sm font-medium text-primary-100">Total Revenue</p>
                <p className="text-2xl font-bold text-white">KES {stats.totalRevenue.toLocaleString()}</p>
                <p className="text-sm font-medium text-primary-200 flex items-center">
                  <ArrowUpRight className="h-4 w-4 mr-1" />
                  {stats.verifiedPayments} verified
                </p>
              </div>
              <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
          
          <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl border border-white border-opacity-20">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:justify-between">
              <div>
                <p className="text-sm font-medium text-primary-100">Monthly Revenue</p>
                <p className="text-2xl font-bold text-white">KES {stats.monthlyRevenue.toLocaleString()}</p>
                <p className="text-sm font-medium text-primary-200 flex items-center">
                  <ArrowUpRight className="h-4 w-4 mr-1" />
                  This month
                </p>
              </div>
              <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                <Calendar className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
          
          <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl border border-white border-opacity-20">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:justify-between">
                  <div>
                <p className="text-sm font-medium text-primary-100">Outstanding</p>
                <p className="text-2xl font-bold text-white">KES {stats.outstandingBalance.toLocaleString()}</p>
                <p className="text-sm font-medium text-primary-200 flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  {stats.overduePayments} overdue
                    </p>
                  </div>
                  <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                <Receipt className="h-6 w-6 text-white" />
              </div>
                  </div>
                </div>
          
          <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl border border-white border-opacity-20">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:justify-between">
              <div>
                <p className="text-sm font-medium text-primary-100">Pending Verification</p>
                <p className="text-2xl font-bold text-white">{stats.pendingVerification}</p>
                <p className="text-sm font-medium text-primary-200 flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  Needs review
                </p>
              </div>
              <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                <CreditCard className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-2xl shadow-lg">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-8 pt-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                  className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-gray-300'
                }`}
              >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
              </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-8">
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Financial Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="p-6 border border-gray-200 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-green-100">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-secondary-600">Verified Payments</p>
                      <p className="text-xl font-bold text-secondary-800">{stats.verifiedPayments}</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-6 border border-gray-200 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-blue-100">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-secondary-600">Total Customers</p>
                      <p className="text-xl font-bold text-secondary-800">{stats.totalCustomers}</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-6 border border-gray-200 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-purple-100">
                      <Tag className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-secondary-600">Fully Paid</p>
                      <p className="text-xl font-bold text-secondary-800">{stats.fullyPaidCustomers}</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-6 border border-gray-200 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-orange-100">
                      <Clock className="h-5 w-5 text-orange-600" />
                    </div>
            <div>
                      <p className="text-sm text-secondary-600">Active Customers</p>
                      <p className="text-xl font-bold text-secondary-800">{stats.activeCustomers}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Distribution */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-xl font-semibold text-secondary-800 mb-4">Payment Status Distribution</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-4 h-4 bg-green-500 rounded"></div>
                        <span className="text-sm text-secondary-600">Fully Paid</span>
                      </div>
                      <span className="text-sm font-medium">{stats.fullyPaidCustomers} customers</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                        <span className="text-sm text-secondary-600">Partial Payment</span>
                      </div>
                      <span className="text-sm font-medium">{customers.filter(c => c.paymentStatus === 'partial').length} customers</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-4 h-4 bg-red-500 rounded"></div>
                        <span className="text-sm text-secondary-600">Not Paid</span>
                      </div>
                      <span className="text-sm font-medium">{customers.filter(c => c.paymentStatus === 'not_paid').length} customers</span>
                    </div>
                  </div>
                        </div>
                
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-xl font-semibold text-secondary-800 mb-4">Recent Activity</h3>
                  <div className="space-y-4">
                    {transactions.slice(0, 5).map((transaction, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-secondary-800">{transaction.learnerName}</p>
                          <p className="text-xs text-secondary-500">{transaction.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-secondary-800">KES {transaction.amount.toLocaleString()}</p>
                          <p className="text-xs text-secondary-500">{new Date(transaction.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                      </div>
                    </div>
              </div>
            </div>
          )}

          {activeTab === 'transactions' && (
            <div className="space-y-6">
              {/* Actions Bar */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search transactions..."
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-64"
                    />
                  </div>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="verified">Verified</option>
                    <option value="paid">Paid</option>
                    <option value="failed">Failed</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>
                
                <div className="text-sm text-secondary-600">
                  Showing {startIndex + 1}-{Math.min(endIndex, totalTransactions)} of {totalTransactions} transactions
                </div>
              </div>

              {/* Transactions Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Transaction ID</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Learner</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Type</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Amount</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Method</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Date</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedTransactions.map((transaction) => (
                      <tr key={transaction.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200">
                        <td className="py-4 px-4 font-medium text-secondary-800">{transaction.transactionId}</td>
                        <td className="py-4 px-4">
                          <div>
                            <div className="font-medium text-secondary-800">{transaction.learnerName}</div>
                            <div className="text-sm text-secondary-500">{transaction.learnerEmail}</div>
                            <div className="text-xs text-secondary-400">{transaction.description}</div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(transaction.type)}`}>
                            {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                          </span>
                        </td>
                        <td className="py-4 px-4 font-medium text-secondary-800">KES {transaction.amount.toLocaleString()}</td>
                        <td className="py-4 px-4">
                          <div className="text-sm text-secondary-600">
                            {transaction.method ? transaction.method.replace('_', ' ').toUpperCase() : 'N/A'}
                          </div>
                          {transaction.confirmationCode && (
                            <div className="text-xs text-secondary-400">
                              Ref: {transaction.confirmationCode}
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                            {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                          </span>
                          {transaction.verified && transaction.verifiedBy && (
                            <div className="text-xs text-secondary-400 mt-1">
                              Verified by {transaction.verifiedBy}
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-4 text-secondary-600">
                          {new Date(transaction.date).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-4">
                          {transaction.status === 'pending' && (
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleVerifyTransaction(transaction.id, true)}
                                disabled={verifyingTransaction === transaction.id}
                                className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 disabled:opacity-50 transition-colors duration-200"
                              >
                                <CheckCircle className="h-3 w-3" />
                                <span>Verify</span>
                              </button>
                              <button
                                onClick={() => handleVerifyTransaction(transaction.id, false)}
                                disabled={verifyingTransaction === transaction.id}
                                className="flex items-center space-x-1 px-3 py-1 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 disabled:opacity-50 transition-colors duration-200"
                              >
                                <XCircle className="h-3 w-3" />
                                <span>Reject</span>
                              </button>
                            </div>
                          )}
                          {transaction.status === 'verified' && (
                            <div className="flex items-center text-green-600">
                              <CheckCircle className="h-4 w-4" />
                            </div>
                          )}
                          {verifyingTransaction === transaction.id && (
                            <div className="flex items-center text-blue-600">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {totalTransactions === 0 && (
                  <div className="text-center py-12">
                    <CreditCard className="h-16 w-16 text-secondary-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-secondary-800 mb-2">No Transactions Found</h3>
                    <p className="text-secondary-600">
                      {searchTerm || filterStatus !== 'all' 
                        ? 'Try adjusting your search or filter criteria.' 
                        : 'No payment transactions have been recorded yet.'}
                    </p>
                  </div>
                )}

                {/* Pagination Controls for Transactions */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                    <div className="text-sm text-secondary-600">
                      Page {currentPage} of {totalPages}
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-secondary-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      
                      {/* Page numbers */}
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                          if (pageNum > totalPages) return null;
                          
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`px-3 py-1 rounded-lg text-sm font-medium ${
                                currentPage === pageNum
                                  ? 'bg-primary-600 text-white'
                                  : 'text-secondary-600 hover:bg-gray-50'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>
                      
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-secondary-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'customers' && (
            <div className="space-y-6">
              {/* Actions Bar */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search customers..."
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-64"
                    />
                  </div>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="all">All Status</option>
                    <option value="paid">Fully Paid</option>
                    <option value="partial">Partial Payment</option>
                    <option value="not_paid">Not Paid</option>
                  </select>
                </div>
                
                <div className="text-sm text-secondary-600">
                  Showing {customerStartIndex + 1}-{Math.min(customerEndIndex, totalCustomersFiltered)} of {totalCustomersFiltered} customers
                </div>
              </div>

              {/* Customers Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                                    <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Customer</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Student ID</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Program</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Total Fees</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Amount Paid</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Outstanding</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Payment Status</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Last Payment</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedCustomers.map((customer) => (
                      <tr key={customer.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200">
                        <td className="py-4 px-4">
                          <div>
                            <div className="font-medium text-secondary-800">{customer.name}</div>
                            <div className="text-sm text-secondary-500">{customer.email}</div>
                            {customer.cohort && (
                              <div className="text-xs text-secondary-400">Cohort: {customer.cohort}</div>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-secondary-600">{customer.studentId || 'N/A'}</td>
                        <td className="py-4 px-4 text-secondary-600">{customer.programName || 'N/A'}</td>
                        <td className="py-4 px-4 font-medium text-secondary-800">
                          KES {customer.totalFees.toLocaleString()}
                        </td>
                        <td className="py-4 px-4 font-medium text-green-600">
                          KES {customer.amountPaid.toLocaleString()}
                        </td>
                        <td className="py-4 px-4 font-medium text-red-600">
                          KES {customer.outstandingBalance.toLocaleString()}
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(customer.paymentStatus)}`}>
                            {customer.paymentStatus === 'not_paid' ? 'Not Paid' : 
                             customer.paymentStatus === 'partial' ? 'Partial' : 'Fully Paid'}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-secondary-600">
                          {customer.lastPaymentDate ? new Date(customer.lastPaymentDate).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => navigate(`/portal/finance/customer/${customer.id}`)}
                              className="flex items-center space-x-1 px-3 py-1 border border-gray-300 rounded-lg text-xs font-medium text-secondary-600 hover:bg-gray-100 transition-colors duration-200"
                            >
                              <Eye className="h-3 w-3" />
                              <span>View</span>
                            </button>
                            {customer.outstandingBalance > 0 && (
                              <button
                                onClick={() => {
                                  // Send reminder email logic would go here
                                  alert(`Reminder sent to ${customer.email}`);
                                }}
                                className="flex items-center space-x-1 px-3 py-1 bg-orange-600 text-white rounded-lg text-xs font-medium hover:bg-orange-700 transition-colors duration-200"
                              >
                                <Clock className="h-3 w-3" />
                                <span>Remind</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {totalCustomersFiltered === 0 && (
                  <div className="text-center py-12">
                    <Users className="h-16 w-16 text-secondary-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-secondary-800 mb-2">No Customers Found</h3>
                    <p className="text-secondary-600">
                      {searchTerm || filterStatus !== 'all' 
                        ? 'Try adjusting your search or filter criteria.' 
                        : 'No customers have been registered yet.'}
                    </p>
                  </div>
                )}

                {/* Pagination Controls for Customers */}
                {totalCustomerPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                    <div className="text-sm text-secondary-600">
                      Page {currentPage} of {totalCustomerPages}
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-secondary-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      
                      {/* Page numbers */}
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: Math.min(5, totalCustomerPages) }, (_, i) => {
                          const pageNum = Math.max(1, Math.min(totalCustomerPages - 4, currentPage - 2)) + i;
                          if (pageNum > totalCustomerPages) return null;
                          
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`px-3 py-1 rounded-lg text-sm font-medium ${
                                currentPage === pageNum
                                  ? 'bg-primary-600 text-white'
                                  : 'text-secondary-600 hover:bg-gray-50'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>
                      
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalCustomerPages))}
                        disabled={currentPage === totalCustomerPages}
                        className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-secondary-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="space-y-8">
              {/* Report Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-100">Collection Rate</p>
                      <p className="text-3xl font-bold text-white">
                        {stats.totalCustomers > 0 ? Math.round((stats.verifiedPayments / stats.totalCustomers) * 100) : 0}%
                      </p>
                      <p className="text-sm text-blue-200">Payment success rate</p>
                    </div>
                    <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-100">Revenue Growth</p>
                      <p className="text-3xl font-bold text-white">
                        {stats.monthlyRevenue > 0 ? '+' : ''}
                        {stats.totalRevenue > 0 ? Math.round((stats.monthlyRevenue / stats.totalRevenue) * 100) : 0}%
                      </p>
                      <p className="text-sm text-green-200">Monthly vs total</p>
                    </div>
                    <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                      <Tag className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-100">Avg. Payment Amount</p>
                      <p className="text-3xl font-bold text-white">
                        KES {stats.verifiedPayments > 0 ? Math.round(stats.totalRevenue / stats.verifiedPayments).toLocaleString() : '0'}
                      </p>
                      <p className="text-sm text-purple-200">Per transaction</p>
                    </div>
                    <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                      <Receipt className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Financial Reports */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-secondary-800 mb-6">Payment Method Distribution</h4>
                  <div className="space-y-4">
                    {['mpesa_stk', 'mpesa', 'bank_transfer', 'cash'].map((method) => {
                      const count = transactions.filter(t => t.method === method).length;
                      const percentage = transactions.length > 0 ? (count / transactions.length) * 100 : 0;
                      
                      const methodDisplayName = method === 'mpesa_stk' ? 'M-Pesa STK Push' :
                                               method === 'mpesa' ? 'M-Pesa Manual' :
                                               method === 'bank_transfer' ? 'Bank Transfer' :
                                               method === 'cash' ? 'Cash' : method;
                      
                      return (
                        <div key={method} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`w-4 h-4 rounded ${
                              method === 'mpesa_stk' ? 'bg-green-600' :
                              method === 'mpesa' ? 'bg-green-400' :
                              method === 'bank_transfer' ? 'bg-blue-500' : 'bg-gray-500'
                            }`}></div>
                            <span className="text-sm text-secondary-600">
                              {methodDisplayName}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-medium text-secondary-800">{count} transactions</span>
                            <div className="text-xs text-secondary-400">{percentage.toFixed(1)}%</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-secondary-800 mb-6">Transaction Status Overview</h4>
                  <div className="space-y-4">
                    {['verified', 'pending', 'overdue'].map((status) => {
                      const count = transactions.filter(t => t.status === status).length;
                      const amount = transactions
                        .filter(t => t.status === status)
                        .reduce((sum, t) => sum + t.amount, 0);
                      
                      return (
                        <div key={status} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`w-4 h-4 rounded ${
                              status === 'verified' ? 'bg-green-500' :
                              status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                            }`}></div>
                            <span className="text-sm text-secondary-600 capitalize">{status}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-medium text-secondary-800">
                              KES {amount.toLocaleString()}
                            </span>
                            <div className="text-xs text-secondary-400">{count} transactions</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Export Options */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-secondary-800 mb-4">Export Reports</h4>
                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={() => {
                      // Export transactions logic would go here
                      alert('Exporting transaction report...');
                    }}
                    className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200"
                  >
                    <Download className="h-4 w-4" />
                    <span>Export Transactions</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      // Export customers logic would go here
                      alert('Exporting customer report...');
                    }}
                    className="flex items-center space-x-2 px-4 py-2 bg-accent-600 text-white rounded-lg hover:bg-accent-700 transition-colors duration-200"
                  >
                    <Download className="h-4 w-4" />
                    <span>Export Customers</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      // Export financial summary logic would go here
                      alert('Exporting financial summary...');
                    }}
                    className="flex items-center space-x-2 px-4 py-2 bg-secondary-600 text-white rounded-lg hover:bg-secondary-700 transition-colors duration-200"
                  >
                    <Download className="h-4 w-4" />
                    <span>Export Summary</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="text-center py-12">
              <TrendingUp className="h-16 w-16 text-secondary-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-secondary-800 mb-2">Financial Reports</h3>
              <p className="text-secondary-600">Generate and view detailed financial reports here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Finance;