import { db } from '../config/firebase';
import { collection, getDocs, doc, getDoc, query, orderBy, limit, where, collectionGroup, Timestamp } from 'firebase/firestore';

// Comprehensive database schema definition
export interface DatabaseSchema {
  collections: {
    [collectionName: string]: {
      fields: string[];
      relationships: {
        [field: string]: {
          collection: string;
          type: 'one-to-one' | 'one-to-many' | 'many-to-many';
        };
      };
      indexes?: string[];
      description: string;
    };
  };
  workflows: WorkflowDefinition[];
}

export interface WorkflowDefinition {
  name: string;
  description: string;
  steps: WorkflowStep[];
  collections: string[];
}

export interface WorkflowStep {
  order: number;
  action: string;
  collection: string;
  nextSteps?: string[];
  conditions?: any;
}

export class AIEnhancedDataService {
  private static instance: AIEnhancedDataService;
  private contextCache: Map<string, any> = new Map();
  private cacheTimestamp: number = 0;
  private readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
  private loadingPromise: Promise<any> | null = null;

  // Complete database schema definition
  private readonly databaseSchema: DatabaseSchema = {
    collections: {
      // User Management
      users: {
        fields: ['email', 'name', 'role', 'status', 'createdAt', 'updatedAt', 'lastLogin', 'profileComplete'],
        relationships: {
          role: { collection: 'roles', type: 'one-to-one' }
        },
        description: 'Core user authentication and profile data'
      },

      // Educational Core
      programs: {
        fields: ['name', 'description', 'type', 'duration', 'fee', 'status', 'startDate', 'endDate', 'maxParticipants', 'currentEnrollment'],
        relationships: {
          intakes: { collection: 'intakes', type: 'one-to-many' },
          learners: { collection: 'learners', type: 'one-to-many' },
          sessions: { collection: 'sessions', type: 'one-to-many' }
        },
        description: 'Educational programs and courses offered'
      },

      intakes: {
        fields: ['name', 'programId', 'startDate', 'endDate', 'applicationDeadline', 'maxCapacity', 'status', 'enrolled'],
        relationships: {
          programId: { collection: 'programs', type: 'one-to-one' },
          cohorts: { collection: 'cohorts', type: 'one-to-many' },
          applicants: { collection: 'applicants', type: 'one-to-many' }
        },
        description: 'Program intake periods and enrollment cycles'
      },

      cohorts: {
        fields: ['name', 'intakeId', 'programId', 'startDate', 'endDate', 'status', 'learnerCount'],
        relationships: {
          intakeId: { collection: 'intakes', type: 'one-to-one' },
          programId: { collection: 'programs', type: 'one-to-one' },
          learners: { collection: 'learners', type: 'one-to-many' }
        },
        description: 'Student groups within intakes'
      },

      learners: {
        fields: ['userId', 'firstName', 'lastName', 'email', 'phone', 'programId', 'cohortId', 'intakeId', 'status', 'enrollmentDate', 'completionDate', 'grade', 'attendance'],
        relationships: {
          userId: { collection: 'users', type: 'one-to-one' },
          programId: { collection: 'programs', type: 'one-to-one' },
          cohortId: { collection: 'cohorts', type: 'one-to-one' },
          intakeId: { collection: 'intakes', type: 'one-to-one' },
          paymentRecords: { collection: 'payment_records', type: 'one-to-many' }
        },
        description: 'Enrolled students and their academic records'
      },

      applicants: {
        fields: ['firstName', 'lastName', 'email', 'phone', 'programId', 'intakeId', 'status', 'applicationDate', 'reviewDate', 'score', 'feedback'],
        relationships: {
          programId: { collection: 'programs', type: 'one-to-one' },
          intakeId: { collection: 'intakes', type: 'one-to-one' },
          testAttempts: { collection: 'testAttempts', type: 'one-to-many' }
        },
        description: 'Program applicants and their application status'
      },

      // Learning & Content
      sessions: {
        fields: ['programId', 'cohortId', 'title', 'description', 'date', 'startTime', 'endTime', 'instructor', 'location', 'type', 'status', 'attendanceCount'],
        relationships: {
          programId: { collection: 'programs', type: 'one-to-one' },
          cohortId: { collection: 'cohorts', type: 'one-to-one' },
          instructorId: { collection: 'instructors', type: 'one-to-one' },
          content: { collection: 'session_content', type: 'one-to-many' }
        },
        description: 'Class sessions and lectures'
      },

      session_content: {
        fields: ['sessionId', 'title', 'type', 'content', 'url', 'duration', 'order'],
        relationships: {
          sessionId: { collection: 'sessions', type: 'one-to-one' }
        },
        description: 'Learning materials and content for sessions'
      },

      // Assessment
      competencyTests: {
        fields: ['title', 'description', 'programId', 'questions', 'passingScore', 'timeLimit', 'status', 'attempts'],
        relationships: {
          programId: { collection: 'programs', type: 'one-to-one' },
          attempts: { collection: 'testAttempts', type: 'one-to-many' }
        },
        description: 'Competency assessments and tests'
      },

      testAttempts: {
        fields: ['testId', 'applicantId', 'learnerId', 'score', 'passed', 'startTime', 'endTime', 'answers'],
        relationships: {
          testId: { collection: 'competencyTests', type: 'one-to-one' },
          applicantId: { collection: 'applicants', type: 'one-to-one' },
          learnerId: { collection: 'learners', type: 'one-to-one' }
        },
        description: 'Test attempt records and results'
      },

      // Staff & Instructors
      staff: {
        fields: ['userId', 'employeeId', 'firstName', 'lastName', 'email', 'department', 'position', 'startDate', 'status'],
        relationships: {
          userId: { collection: 'users', type: 'one-to-one' }
        },
        description: 'Staff members and employees'
      },

      instructors: {
        fields: ['userId', 'firstName', 'lastName', 'email', 'specialization', 'qualifications', 'experience', 'rating', 'status'],
        relationships: {
          userId: { collection: 'users', type: 'one-to-one' },
          sessions: { collection: 'sessions', type: 'one-to-many' }
        },
        description: 'Instructors and teaching staff'
      },

      // Events
      events: {
        fields: ['title', 'description', 'type', 'date', 'startTime', 'endTime', 'location', 'maxAttendees', 'registeredCount', 'status', 'fee'],
        relationships: {
          registrations: { collection: 'event_registrations', type: 'one-to-many' }
        },
        description: 'Events and activities'
      },

      event_registrations: {
        fields: ['eventId', 'userId', 'name', 'email', 'phone', 'status', 'registrationDate', 'paymentStatus'],
        relationships: {
          eventId: { collection: 'events', type: 'one-to-one' },
          userId: { collection: 'users', type: 'one-to-one' }
        },
        description: 'Event registration records'
      },

      // Recruitment
      jobs: {
        fields: ['title', 'description', 'company', 'location', 'type', 'salary', 'requirements', 'status', 'postedDate', 'deadline'],
        relationships: {
          organizationId: { collection: 'organizations', type: 'one-to-one' },
          applications: { collection: 'jobApplications', type: 'one-to-many' }
        },
        description: 'Job opportunities and postings'
      },

      candidates: {
        fields: ['firstName', 'lastName', 'email', 'phone', 'resume', 'skills', 'experience', 'education', 'status'],
        relationships: {
          applications: { collection: 'jobApplications', type: 'one-to-many' }
        },
        description: 'Job candidates profiles'
      },

      jobApplications: {
        fields: ['jobId', 'candidateId', 'applicationDate', 'status', 'coverLetter', 'resume', 'interviewDate', 'feedback'],
        relationships: {
          jobId: { collection: 'jobs', type: 'one-to-one' },
          candidateId: { collection: 'candidates', type: 'one-to-one' }
        },
        description: 'Job application records'
      },

      organizations: {
        fields: ['name', 'type', 'industry', 'size', 'location', 'website', 'contactPerson', 'email', 'phone', 'status'],
        relationships: {
          jobs: { collection: 'jobs', type: 'one-to-many' }
        },
        description: 'Partner organizations and employers'
      },

      // Customer Management
      customers: {
        fields: ['name', 'email', 'phone', 'type', 'company', 'source', 'status', 'createdAt', 'lastContact'],
        relationships: {
          leads: { collection: 'b2b_leads', type: 'one-to-many' },
          invoices: { collection: 'invoices', type: 'one-to-many' }
        },
        description: 'Customer records for B2C and B2B'
      },

      b2b_leads: {
        fields: ['company', 'contactPerson', 'email', 'phone', 'industry', 'size', 'needs', 'status', 'source', 'assignedTo'],
        relationships: {
          customerId: { collection: 'customers', type: 'one-to-one' }
        },
        description: 'Business-to-business leads and opportunities'
      },

      // Financial
      payment_records: {
        fields: ['learnerId', 'amount', 'type', 'method', 'status', 'transactionId', 'date', 'description'],
        relationships: {
          learnerId: { collection: 'learners', type: 'one-to-one' }
        },
        description: 'Payment transactions and records'
      },

      invoices: {
        fields: ['customerId', 'invoiceNumber', 'amount', 'items', 'status', 'dueDate', 'paidDate'],
        relationships: {
          customerId: { collection: 'customers', type: 'one-to-one' }
        },
        description: 'Invoice records'
      },

      // Communication
      whatsapp_messages: {
        fields: ['from', 'to', 'message', 'type', 'status', 'timestamp', 'mediaUrl'],
        relationships: {
          contactId: { collection: 'whatsapp_contacts', type: 'one-to-one' }
        },
        description: 'WhatsApp message history'
      },

      whatsapp_contacts: {
        fields: ['phoneNumber', 'name', 'status', 'lastMessage', 'tags'],
        relationships: {
          messages: { collection: 'whatsapp_messages', type: 'one-to-many' }
        },
        description: 'WhatsApp contact list'
      },

      // Media
      media: {
        fields: ['title', 'description', 'type', 'url', 'thumbnailUrl', 'tags', 'views', 'likes', 'status', 'authorId'],
        relationships: {
          authorId: { collection: 'users', type: 'one-to-one' },
          comments: { collection: 'mediaComments', type: 'one-to-many' }
        },
        description: 'Media content (albums, blogs, videos)'
      },

      // System
      settings: {
        fields: ['category', 'key', 'value', 'type', 'description', 'updatedBy', 'updatedAt'],
        relationships: {},
        description: 'System configuration and settings'
      },

      ai_conversations: {
        fields: ['userId', 'title', 'messages', 'context', 'status', 'createdAt', 'updatedAt'],
        relationships: {
          userId: { collection: 'users', type: 'one-to-one' }
        },
        description: 'AI assistant conversation history'
      }
    },

    workflows: [
      {
        name: 'Student Enrollment Journey',
        description: 'Complete flow from application to graduation',
        steps: [
          { order: 1, action: 'apply', collection: 'applicants' },
          { order: 2, action: 'take_test', collection: 'testAttempts' },
          { order: 3, action: 'review_application', collection: 'applicants' },
          { order: 4, action: 'send_admission', collection: 'communications' },
          { order: 5, action: 'enroll', collection: 'learners' },
          { order: 6, action: 'assign_cohort', collection: 'cohorts' },
          { order: 7, action: 'attend_sessions', collection: 'sessions' },
          { order: 8, action: 'complete_assessments', collection: 'testAttempts' },
          { order: 9, action: 'graduate', collection: 'learners' }
        ],
        collections: ['applicants', 'testAttempts', 'learners', 'cohorts', 'sessions']
      },
      {
        name: 'Recruitment Process',
        description: 'Job posting to placement workflow',
        steps: [
          { order: 1, action: 'post_job', collection: 'jobs' },
          { order: 2, action: 'receive_applications', collection: 'jobApplications' },
          { order: 3, action: 'screen_candidates', collection: 'candidates' },
          { order: 4, action: 'schedule_interviews', collection: 'jobApplications' },
          { order: 5, action: 'make_offer', collection: 'jobApplications' },
          { order: 6, action: 'onboard', collection: 'organizations' }
        ],
        collections: ['jobs', 'jobApplications', 'candidates', 'organizations']
      },
      {
        name: 'Customer Acquisition',
        description: 'Lead generation to customer conversion',
        steps: [
          { order: 1, action: 'capture_lead', collection: 'b2b_leads' },
          { order: 2, action: 'qualify_lead', collection: 'b2b_leads' },
          { order: 3, action: 'send_proposal', collection: 'communications' },
          { order: 4, action: 'negotiate', collection: 'b2b_leads' },
          { order: 5, action: 'close_deal', collection: 'customers' },
          { order: 6, action: 'generate_invoice', collection: 'invoices' }
        ],
        collections: ['b2b_leads', 'customers', 'invoices', 'communications']
      }
    ]
  };

  static getInstance(): AIEnhancedDataService {
    if (!AIEnhancedDataService.instance) {
      AIEnhancedDataService.instance = new AIEnhancedDataService();
    }
    return AIEnhancedDataService.instance;
  }

  // Get complete context with relationships
  async getCompleteContext(userRole: string): Promise<any> {
    const cacheKey = `context_${userRole}`;

    // Check if we have a valid cached context
    if (this.contextCache.has(cacheKey)) {
      const cached = this.contextCache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.CACHE_DURATION) {
        console.log('📦 Using cached context for', userRole);
        return cached.data;
      }
    }

    // If already loading, wait for existing promise
    if (this.loadingPromise) {
      console.log('⏳ Waiting for existing context load...');
      return this.loadingPromise;
    }

    // Start loading context
    this.loadingPromise = this.loadContextData(userRole);

    try {
      const context = await this.loadingPromise;

      // Cache the result
      this.contextCache.set(cacheKey, {
        data: context,
        timestamp: Date.now()
      });

      return context;
    } finally {
      this.loadingPromise = null;
    }
  }

  private async loadContextData(userRole: string): Promise<any> {
    const allowedCollections = this.getCollectionsByRole(userRole);
    const context: any = {
      schema: {},
      data: {},
      relationships: {},
      workflows: [],
      statistics: {}
    };

    // Build schema information
    for (const collectionName of allowedCollections) {
      if (this.databaseSchema.collections[collectionName]) {
        context.schema[collectionName] = this.databaseSchema.collections[collectionName];
      }
    }

    // Fetch actual data
    for (const collectionName of allowedCollections) {
      try {
        const data = await this.fetchCollectionData(collectionName);
        context.data[collectionName] = data;
        context.statistics[collectionName] = {
          count: data.length,
          lastUpdated: new Date()
        };
      } catch (error) {
        console.error(`Error fetching ${collectionName}:`, error);
      }
    }

    // Add relevant workflows
    context.workflows = this.databaseSchema.workflows.filter(workflow =>
      workflow.collections.some(col => allowedCollections.includes(col))
    );

    // Build relationship graph
    context.relationships = this.buildRelationshipGraph(context.data);

    return context;
  }

  // Fetch collection data with smart loading
  private async fetchCollectionData(collectionName: string, maxDocs: number = 500): Promise<any[]> {
    const cacheKey = `collection_${collectionName}`;

    // Check cache
    if (this.contextCache.has(cacheKey)) {
      const cached = this.contextCache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.CACHE_DURATION) {
        return cached.data;
      }
    }

    try {
      // Determine if we should fetch all or recent data based on collection size
      const sizeSensitiveCollections = ['whatsapp_messages', 'ai_conversations', 'payment_records'];

      let data: any[] = [];

      if (sizeSensitiveCollections.includes(collectionName)) {
        // Fetch only recent data for large collections
        const q = query(
          collection(db, collectionName),
          orderBy('createdAt', 'desc'),
          limit(maxDocs)
        );
        const snapshot = await getDocs(q);
        data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      } else {
        // Fetch all data for smaller collections
        const snapshot = await getDocs(collection(db, collectionName));
        data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      }

      // Cache the data
      this.contextCache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });

      return data;
    } catch (error) {
      console.error(`Error fetching ${collectionName}:`, error);
      return [];
    }
  }

  // Build relationship graph from data
  private buildRelationshipGraph(data: any): any {
    const graph: any = {};

    for (const [collectionName, documents] of Object.entries(data)) {
      if (!Array.isArray(documents)) continue;

      const schema = this.databaseSchema.collections[collectionName];
      if (!schema || !schema.relationships) continue;

      graph[collectionName] = {};

      for (const [field, relationship] of Object.entries(schema.relationships)) {
        const relatedCollection = relationship.collection;
        const relatedData = data[relatedCollection];

        if (!relatedData) continue;

        // Build relationship mappings
        graph[collectionName][field] = {
          collection: relatedCollection,
          type: relationship.type,
          mappings: this.createRelationshipMappings(
            documents,
            relatedData,
            field,
            relationship.type
          )
        };
      }
    }

    return graph;
  }

  private createRelationshipMappings(
    sourceData: any[],
    targetData: any[],
    field: string,
    type: 'one-to-one' | 'one-to-many' | 'many-to-many'
  ): any {
    const mappings: any = {};

    for (const sourceDoc of sourceData) {
      const fieldValue = sourceDoc[field];
      if (!fieldValue) continue;

      if (type === 'one-to-one') {
        const target = targetData.find(t => t.id === fieldValue);
        if (target) {
          mappings[sourceDoc.id] = target;
        }
      } else if (type === 'one-to-many') {
        mappings[sourceDoc.id] = targetData.filter(t =>
          t[field] === sourceDoc.id || t.id === fieldValue
        );
      }
    }

    return mappings;
  }

  // Get collections accessible by role
  private getCollectionsByRole(role: string): string[] {
    const rolePermissions: { [key: string]: string[] } = {
      admin: Object.keys(this.databaseSchema.collections),
      staff: [
        'users', 'learners', 'applicants', 'programs', 'cohorts', 'intakes',
        'staff', 'events', 'event_registrations', 'customers', 'b2b_leads',
        'organizations', 'jobs', 'candidates', 'jobApplications', 'payment_records',
        'invoices', 'whatsapp_messages', 'whatsapp_contacts', 'media'
      ],
      instructor: [
        'users', 'learners', 'programs', 'cohorts', 'intakes', 'sessions',
        'session_content', 'competencyTests', 'testAttempts', 'events',
        'instructors', 'media'
      ],
      learner: [
        'programs', 'cohorts', 'sessions', 'session_content', 'events',
        'event_registrations', 'competencyTests', 'testAttempts', 'payment_records',
        'media'
      ],
      applicant: [
        'programs', 'intakes', 'events', 'competencyTests', 'testAttempts',
        'applicants'
      ]
    };

    return rolePermissions[role] || rolePermissions.applicant;
  }

  // Get workflow context for specific action
  async getWorkflowContext(workflowName: string, currentStep?: number): Promise<any> {
    const workflow = this.databaseSchema.workflows.find(w => w.name === workflowName);
    if (!workflow) return null;

    const context: any = {
      workflow: workflow,
      currentStep: currentStep || 1,
      data: {}
    };

    // Fetch data for all collections in the workflow
    for (const collectionName of workflow.collections) {
      context.data[collectionName] = await this.fetchCollectionData(collectionName, 100);
    }

    return context;
  }

  // Get insights and analytics
  async getInsights(collectionName?: string): Promise<any> {
    const insights: any = {};

    if (collectionName) {
      const data = await this.fetchCollectionData(collectionName);
      insights[collectionName] = this.generateCollectionInsights(collectionName, data);
    } else {
      // Generate insights for all collections
      for (const [name, schema] of Object.entries(this.databaseSchema.collections)) {
        const data = await this.fetchCollectionData(name, 100);
        insights[name] = this.generateCollectionInsights(name, data);
      }
    }

    return insights;
  }

  private generateCollectionInsights(collectionName: string, data: any[]): any {
    const insights: any = {
      totalCount: data.length,
      recentActivity: 0,
      trends: {},
      summary: {}
    };

    // Calculate recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    insights.recentActivity = data.filter(item => {
      const createdAt = item.createdAt?.toDate ? item.createdAt.toDate() : new Date(item.createdAt);
      return createdAt > sevenDaysAgo;
    }).length;

    // Generate collection-specific insights
    switch (collectionName) {
      case 'learners':
        insights.summary = {
          active: data.filter(l => l.status === 'active').length,
          completed: data.filter(l => l.status === 'completed').length,
          dropped: data.filter(l => l.status === 'dropped').length
        };
        break;

      case 'applicants':
        insights.summary = {
          pending: data.filter(a => a.status === 'pending').length,
          approved: data.filter(a => a.status === 'approved').length,
          rejected: data.filter(a => a.status === 'rejected').length
        };
        break;

      case 'payment_records':
        const total = data.reduce((sum, p) => sum + (p.amount || 0), 0);
        insights.summary = {
          totalRevenue: total,
          successfulPayments: data.filter(p => p.status === 'success').length,
          pendingPayments: data.filter(p => p.status === 'pending').length
        };
        break;
    }

    return insights;
  }

  // Search across multiple collections
  async searchAcrossCollections(searchTerm: string, collections?: string[]): Promise<any> {
    const results: any = {};
    const targetCollections = collections || Object.keys(this.databaseSchema.collections);

    for (const collectionName of targetCollections) {
      const data = await this.fetchCollectionData(collectionName);

      // Simple text search across all string fields
      const matches = data.filter(item => {
        return Object.values(item).some(value => {
          if (typeof value === 'string') {
            return value.toLowerCase().includes(searchTerm.toLowerCase());
          }
          return false;
        });
      });

      if (matches.length > 0) {
        results[collectionName] = matches;
      }
    }

    return results;
  }

  // Clear cache
  clearCache(): void {
    this.contextCache.clear();
    this.cacheTimestamp = 0;
  }
}

export default AIEnhancedDataService.getInstance();