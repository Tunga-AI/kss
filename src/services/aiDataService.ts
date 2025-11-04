import { db } from '../config/firebase';
import { collection, getDocs, doc, getDoc, query, orderBy, limit, collectionGroup } from 'firebase/firestore';

export interface AIContextData {
  // Core Educational Collections
  learners: any[];
  applicants: any[];
  admissions: any[];
  programs: any[];
  cohorts: any[];
  intakes: any[];
  sessions: any[];
  session_content: any[];
  scheduleItems: any[];
  learning: any[];
  
  // Assessment & Testing
  competencyTests: any[];
  testAttempts: any[];
  applicationFeedback: any[];
  
  // People & Organizations
  users: any[];
  staff: any[];
  customers: any[];
  contacts: any[];
  organizations: any[];
  roles: any[];
  
  // Recruitment & Jobs
  recruitment: any[];
  jobs: any[];
  candidates: any[];
  jobApplications: any[];
  
  // Events & Communications
  events: any[];
  event_registrations: any[];
  event_attendees: any[];
  communications: any[];
  messages: any[];
  letterTemplates: any[];
  
  // Financial & Administrative
  finances: any[];
  payment_records: any[];
  settings: any[];
  
  // AI & System Collections
  ai_conversations: any[];
  verificationCodes: any[];
  
  // WhatsApp & Communication
  whatsapp_messages: any[];
  whatsapp_templates: any[];
  whatsapp_contacts: any[];
  
  // Content & Resources
  content_resources: any[];
  capstone_projects: any[];
  
  // Additional Collections (catch-all)
  [key: string]: any[];
}

export interface RolePermissions {
  admin: string[];
  staff: string[];
  instructor: string[];
  learner: string[];
  applicant: string[];
}

export class AIDataService {
  private static instance: AIDataService;
  private cache: AIContextData | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Comprehensive role-based permissions covering ALL collections
  private readonly rolePermissions: RolePermissions = {
    admin: [
      // Full access to everything
      'users', 'learners', 'applicants', 'admissions', 'staff', 'programs', 'cohorts', 'intakes',
      'sessions', 'session_content', 'scheduleItems', 'learning', 'competencyTests', 'testAttempts',
      'applicationFeedback', 'customers', 'contacts', 'organizations', 'roles', 'recruitment',
      'jobs', 'candidates', 'jobApplications', 'events', 'event_registrations', 'event_attendees',
      'communications', 'messages', 'letterTemplates', 'finances', 'payment_records', 'settings',
      'ai_conversations', 'verificationCodes', 'whatsapp_messages', 'whatsapp_templates',
      'whatsapp_contacts', 'content_resources', 'capstone_projects'
    ],
    staff: [
      // Staff access (operational - excludes teaching-specific data)
      'users', 'learners', 'applicants', 'admissions', 'staff', 'programs', 'cohorts', 'intakes',
      'customers', 'contacts', 'organizations', 'recruitment', 'jobs',
      'candidates', 'jobApplications', 'events', 'event_registrations', 'event_attendees',
      'communications', 'messages', 'letterTemplates', 'payment_records', 
      'whatsapp_messages', 'whatsapp_contacts'
    ],
    instructor: [
      // Instructor access (teaching-focused)
      'users', 'learners', 'programs', 'cohorts', 'intakes', 'sessions', 'session_content', 
      'scheduleItems', 'learning', 'competencyTests', 'testAttempts', 'applicants', 'admissions',
      'events', 'event_registrations', 'messages', 'contacts', 'content_resources', 
      'capstone_projects', 'applicationFeedback'
    ],
    learner: [
      // Learner access (education-focused with finance access)
      'users', 'learners', 'programs', 'cohorts', 'sessions', 'session_content', 'scheduleItems',
      'learning', 'competencyTests', 'testAttempts', 'events', 'event_registrations',
      'messages', 'contacts', 'content_resources', 'capstone_projects', 'payment_records', 'finances'
    ],
    applicant: [
      // Applicant access (admission-focused)
      'users', 'programs', 'events', 'event_registrations', 'applicants', 'admissions',
      'competencyTests', 'testAttempts', 'applicationFeedback', 'intakes', 'contacts',
      'communications', 'messages'
    ]
  };

  static getInstance(): AIDataService {
    if (!AIDataService.instance) {
      AIDataService.instance = new AIDataService();
    }
    return AIDataService.instance;
  }

  private async fetchCollection(collectionName: string): Promise<any[]> {
    try {
      console.log(`Fetching ${collectionName} collection...`);
      const querySnapshot = await getDocs(collection(db, collectionName));
      const docs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log(`✅ Fetched ${docs.length} documents from ${collectionName}`);
      return docs;
    } catch (error) {
      console.error(`❌ Error fetching ${collectionName}:`, error);
      return [];
    }
  }

  private async fetchRecentDocuments(collectionName: string, orderByField: string = 'createdAt', limitCount: number = 100): Promise<any[]> {
    try {
      console.log(`Fetching recent ${collectionName} collection (${limitCount} docs)...`);
      const q = query(
        collection(db, collectionName),
        orderBy(orderByField, 'desc'),
        limit(limitCount)
      );
      const querySnapshot = await getDocs(q);
      const docs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log(`✅ Fetched ${docs.length} recent documents from ${collectionName}`);
      return docs;
    } catch (error) {
      console.error(`❌ Error fetching recent ${collectionName}:`, error);
      // Fallback to regular fetch if orderBy fails
      return this.fetchCollection(collectionName);
    }
  }

  // New method to discover all collections in the database
  private async discoverCollections(): Promise<string[]> {
    try {
      console.log('🔍 Discovering all collections in Firebase...');
      
      // Try to fetch from known collections first
      const knownCollections = [
        'users', 'learners', 'applicants', 'admissions', 'staff', 'programs', 'cohorts', 'intakes',
        'sessions', 'session_content', 'scheduleItems', 'learning', 'competencyTests', 'testAttempts',
        'applicationFeedback', 'customers', 'contacts', 'organizations', 'roles', 'recruitment',
        'jobs', 'candidates', 'jobApplications', 'events', 'event_registrations', 'event_attendees',
        'communications', 'messages', 'letterTemplates', 'finances', 'payment_records', 'settings',
        'ai_conversations', 'verificationCodes', 'whatsapp_messages', 'whatsapp_templates',
        'whatsapp_contacts', 'content_resources', 'capstone_projects'
      ];

      // Test each collection to see if it exists and has data
      const existingCollections: string[] = [];
      
      for (const collectionName of knownCollections) {
        try {
          const docs = await this.fetchCollection(collectionName);
          if (docs.length > 0) {
            existingCollections.push(collectionName);
          }
        } catch (error) {
          // Collection doesn't exist or is empty, skip it
          continue;
        }
      }

      console.log(`🎯 Discovered ${existingCollections.length} existing collections:`, existingCollections);
      return existingCollections;
    } catch (error) {
      console.error('❌ Error discovering collections:', error);
      return [];
    }
  }

  async getAllContextData(): Promise<AIContextData> {
    const now = Date.now();
    
    // Return cached data if still fresh
    if (this.cache && (now - this.cacheTimestamp) < this.CACHE_DURATION) {
      console.log('📦 Using cached data');
      return this.cache;
    }

    console.log('🔄 Fetching fresh data from Firebase - ALL COLLECTIONS...');
    
    try {
      // First, discover what collections actually exist
      const existingCollections = await this.discoverCollections();
      
      // Initialize all collections as empty arrays
      const allCollections = {
        users: [],
        learners: [],
        applicants: [],
        admissions: [],
        staff: [],
        programs: [],
        cohorts: [],
        intakes: [],
        sessions: [],
        session_content: [],
        scheduleItems: [],
        learning: [],
        competencyTests: [],
        testAttempts: [],
        applicationFeedback: [],
        customers: [],
        contacts: [],
        organizations: [],
        roles: [],
        recruitment: [],
        jobs: [],
        candidates: [],
        jobApplications: [],
        events: [],
        event_registrations: [],
        event_attendees: [],
        communications: [],
        messages: [],
        letterTemplates: [],
        finances: [],
        payment_records: [],
        settings: [],
        ai_conversations: [],
        verificationCodes: [],
        whatsapp_messages: [],
        whatsapp_templates: [],
        whatsapp_contacts: [],
        content_resources: [],
        capstone_projects: []
      };

      // Fetch data from existing collections in parallel
      const fetchPromises = existingCollections.map(async (collectionName) => {
        try {
          let data: any[] = [];
          
          // Use optimized fetching for large collections
          if (['users', 'learners', 'applicants', 'sessions', 'messages', 'payment_records'].includes(collectionName)) {
            data = await this.fetchRecentDocuments(collectionName, 'createdAt', 200);
          } else if (['events', 'event_registrations', 'testAttempts'].includes(collectionName)) {
            data = await this.fetchRecentDocuments(collectionName, 'createdAt', 150);
          } else {
            data = await this.fetchCollection(collectionName);
          }
          
          return { collectionName, data };
        } catch (error) {
          console.error(`❌ Error fetching ${collectionName}:`, error);
          return { collectionName, data: [] };
        }
      });

      const results = await Promise.all(fetchPromises);
      
      // Populate the collections with fetched data
      results.forEach(({ collectionName, data }) => {
        if (collectionName in allCollections) {
          (allCollections as any)[collectionName] = data;
        }
      });

      this.cache = allCollections;
      this.cacheTimestamp = now;
      
      // Log summary of fetched data
      const totalDocs = Object.values(this.cache).reduce((sum, collection) => sum + collection.length, 0);
      console.log(`🎉 Successfully fetched ${totalDocs} total documents across ${existingCollections.length} collections`);
      
      return this.cache;
    } catch (error) {
      console.error('❌ Error fetching context data:', error);
      throw new Error('Failed to fetch context data from Firebase');
    }
  }

  async getFilteredData(categories: string[], userRole?: string): Promise<Partial<AIContextData>> {
    const allData = await this.getAllContextData();
    const filteredData: Partial<AIContextData> = {};

    categories.forEach(category => {
      if (category.toLowerCase() in allData) {
        // Check if user has permission to access this category
        if (userRole && this.hasPermission(userRole, category.toLowerCase())) {
          filteredData[category.toLowerCase() as keyof AIContextData] = allData[category.toLowerCase() as keyof AIContextData];
        } else if (!userRole) {
          // If no role specified, include all requested categories
          filteredData[category.toLowerCase() as keyof AIContextData] = allData[category.toLowerCase() as keyof AIContextData];
        }
      }
    });

    return filteredData;
  }

  private hasPermission(userRole: string, category: string): boolean {
    const permissions = this.rolePermissions[userRole as keyof RolePermissions];
    return permissions ? permissions.includes(category) : false;
  }

  getAllowedCategories(userRole: string): string[] {
    return this.rolePermissions[userRole as keyof RolePermissions] || [];
  }

  async getRoleBasedContextData(userRole: string): Promise<Partial<AIContextData>> {
    const allData = await this.getAllContextData();
    const allowedCategories = this.getAllowedCategories(userRole);
    const filteredData: Partial<AIContextData> = {};

    allowedCategories.forEach(category => {
      if (category in allData) {
        filteredData[category as keyof AIContextData] = allData[category as keyof AIContextData];
      }
    });

    return filteredData;
  }

  async searchInData(searchTerm: string, categories?: string[], userRole?: string): Promise<any[]> {
    const data = categories ? 
      await this.getFilteredData(categories, userRole) : 
      userRole ? await this.getRoleBasedContextData(userRole) : await this.getAllContextData();
    
    const results: any[] = [];
    const searchLower = searchTerm.toLowerCase();

    Object.entries(data).forEach(([collectionName, documents]) => {
      if (documents) {
        documents.forEach(doc => {
          const docString = JSON.stringify(doc).toLowerCase();
          if (docString.includes(searchLower)) {
            results.push({
              ...doc,
              _collection: collectionName,
              _relevance: this.calculateRelevance(doc, searchTerm)
            });
          }
        });
      }
    });

    return results.sort((a, b) => b._relevance - a._relevance);
  }

  private calculateRelevance(doc: any, searchTerm: string): number {
    const searchLower = searchTerm.toLowerCase();
    const docString = JSON.stringify(doc).toLowerCase();
    
    let relevance = 0;
    
    // Exact matches in important fields
    const importantFields = ['name', 'title', 'firstName', 'lastName', 'email', 'program', 'cohort', 'status', 'type'];
    importantFields.forEach(field => {
      if (doc[field] && doc[field].toString().toLowerCase().includes(searchLower)) {
        relevance += 10;
      }
    });

    // General matches
    const matches = docString.split(searchLower).length - 1;
    relevance += matches;

    return relevance;
  }

  clearCache(): void {
    this.cache = null;
    this.cacheTimestamp = 0;
    console.log('🗑️ Cache cleared');
  }

  async getDataSummary(userRole?: string): Promise<string> {
    const data = userRole ? await this.getRoleBasedContextData(userRole) : await this.getAllContextData();
    
    let summary = `📊 Database Summary (${userRole ? `${userRole} view` : 'full access'}):\n\n`;
    
    const summaryItems = [
      // Core Educational Data
      { key: 'learners', label: '👨‍🎓 Learners', category: 'Education' },
      { key: 'applicants', label: '📝 Applicants', category: 'Education' },
      { key: 'admissions', label: '🎓 Admissions', category: 'Education' },
      { key: 'programs', label: '📚 Programs', category: 'Education' },
      { key: 'cohorts', label: '👥 Cohorts', category: 'Education' },
      { key: 'intakes', label: '📅 Intakes', category: 'Education' },
      
      // Learning & Assessment
      { key: 'sessions', label: '🏫 Class Sessions', category: 'Learning' },
      { key: 'session_content', label: '📄 Session Content', category: 'Learning' },
      { key: 'scheduleItems', label: '⏰ Schedule Items', category: 'Learning' },
      { key: 'competencyTests', label: '📊 Competency Tests', category: 'Assessment' },
      { key: 'testAttempts', label: '✍️ Test Attempts', category: 'Assessment' },
      { key: 'applicationFeedback', label: '💬 Application Feedback', category: 'Assessment' },
      
      // People & Organizations
      { key: 'staff', label: '👨‍💼 Staff', category: 'People' },
      { key: 'customers', label: '🏢 Customers', category: 'People' },
      { key: 'contacts', label: '📞 Contacts', category: 'People' },
      { key: 'organizations', label: '🏛️ Organizations', category: 'People' },
      { key: 'roles', label: '🔑 Roles', category: 'People' },
      
      // Recruitment & Jobs
      { key: 'jobs', label: '💼 Jobs', category: 'Recruitment' },
      { key: 'candidates', label: '👤 Candidates', category: 'Recruitment' },
      { key: 'jobApplications', label: '📋 Job Applications', category: 'Recruitment' },
      
      // Events & Communications
      { key: 'events', label: '🎉 Events', category: 'Events' },
      { key: 'event_registrations', label: '🎫 Event Registrations', category: 'Events' },
      { key: 'communications', label: '📧 Communications', category: 'Communications' },
      { key: 'messages', label: '💌 Messages', category: 'Communications' },
      { key: 'letterTemplates', label: '📄 Letter Templates', category: 'Communications' },
      
      // Financial & Administrative
      { key: 'payment_records', label: '💰 Payment Records', category: 'Finance' },
      { key: 'finances', label: '💳 Finance Records', category: 'Finance' },
      { key: 'settings', label: '⚙️ Settings', category: 'System' }
    ];

    // Group by category
    const categories: { [key: string]: typeof summaryItems } = {};
    summaryItems.forEach(item => {
      if (data[item.key as keyof typeof data]) {
        if (!categories[item.category]) {
          categories[item.category] = [];
        }
        categories[item.category].push(item);
      }
    });

    // Build summary by category
    Object.entries(categories).forEach(([categoryName, items]) => {
      summary += `📂 ${categoryName}:\n`;
      items.forEach(item => {
        const count = data[item.key as keyof typeof data]?.length || 0;
        summary += `   ${item.label}: ${count} records\n`;
      });
      summary += '\n';
    });

    const totalRecords = Object.values(data).reduce((sum, collection) => sum + (collection?.length || 0), 0);
    summary += `🎯 Total Records Available: ${totalRecords}\n`;
    summary += `🔄 Data Last Updated: ${new Date().toLocaleString()}\n`;

    return summary;
  }

  // New method to get collection statistics
  async getCollectionStats(): Promise<{ [key: string]: number }> {
    const data = await this.getAllContextData();
    const stats: { [key: string]: number } = {};
    
    Object.entries(data).forEach(([key, collection]) => {
      stats[key] = collection?.length || 0;
    });
    
    return stats;
  }

  // New method to validate data integrity
  async validateDataIntegrity(): Promise<{ isValid: boolean; issues: string[] }> {
    const data = await this.getAllContextData();
    const issues: string[] = [];
    
    // Check for empty critical collections
    const criticalCollections = ['users', 'programs', 'settings'];
    criticalCollections.forEach(collection => {
      if (!data[collection as keyof AIContextData] || data[collection as keyof AIContextData].length === 0) {
        issues.push(`Critical collection '${collection}' is empty`);
      }
    });
    
    // Check for data consistency
    if (data.learners.length > 0 && data.programs.length === 0) {
      issues.push('Learners exist but no programs are defined');
    }
    
    if (data.applicants.length > 0 && data.intakes.length === 0) {
      issues.push('Applicants exist but no intakes are defined');
    }
    
    return {
      isValid: issues.length === 0,
      issues
    };
  }
}

export default AIDataService.getInstance(); 