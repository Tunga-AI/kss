import { GoogleGenerativeAI } from '@google/generative-ai';
import aiEnhancedDataService from './aiEnhancedDataService';

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI('AIzaSyDYfVvZQTSdFhbF0OO-Mz-BqGpLtFXzyTg');
const model = genAI.getGenerativeModel({
  model: 'gemini-pro',
  generationConfig: {
    temperature: 0.7,
    topK: 40,
    topP: 0.95,
  },
});

export interface EnhancedAIResponse {
  answer: string;
  relevantData?: Array<{
    collection: string;
    records: any[];
    summary: string;
    insights: any;
  }>;
  workflowSuggestions?: Array<{
    workflow: string;
    currentStep: string;
    nextActions: string[];
  }>;
  relatedItems?: Array<{
    type: string;
    data: any;
    relationship: string;
  }>;
  actionableInsights?: string[];
  confidence: number;
  dataFreshness: Date;
}

class AIEnhancedService {
  private static instance: AIEnhancedService;

  static getInstance(): AIEnhancedService {
    if (!AIEnhancedService.instance) {
      AIEnhancedService.instance = new AIEnhancedService();
    }
    return AIEnhancedService.instance;
  }

  async askEnhancedQuestion(
    question: string,
    userRole: string,
    context?: {
      workflowFocus?: string;
      includeRelationships?: boolean;
      includeInsights?: boolean;
      searchMode?: boolean;
    }
  ): Promise<EnhancedAIResponse> {
    try {
      // Get complete context including schema, data, relationships, and workflows
      const completeContext = await aiEnhancedDataService.getCompleteContext(userRole);

      // Prepare enhanced system prompt
      const systemPrompt = this.buildEnhancedSystemPrompt(completeContext, userRole, context);

      // Generate response with complete context
      const response = await this.generateContextualResponse(question, systemPrompt, completeContext);

      return response;
    } catch (error) {
      console.error('Enhanced AI Service Error:', error);
      return {
        answer: 'I apologize, but I encountered an error processing your question. Please try again.',
        confidence: 0,
        dataFreshness: new Date()
      };
    }
  }

  private buildEnhancedSystemPrompt(completeContext: any, userRole: string, options?: any): string {
    const { schema, data, relationships, workflows, statistics } = completeContext;

    return `You are an advanced AI assistant for the Kenya School of Sales Learning Management System with comprehensive access to the entire system's database and workflows.

## SYSTEM OVERVIEW
You have complete understanding of:
- **Database Schema**: ${Object.keys(schema).length} collections with full relationship mappings
- **Live Data**: ${Object.entries(statistics).map(([name, stats]: [string, any]) => `${name}: ${stats.count} records`).join(', ')}
- **Business Workflows**: ${workflows.length} defined workflows for operational processes
- **Data Relationships**: Complete relationship graph between all entities

## USER CONTEXT
- **Role**: ${userRole}
- **Access Level**: ${this.getAccessDescription(userRole)}
- **Data Scope**: Access to ${Object.keys(data).length} collections

## COLLECTION SCHEMA & CURRENT DATA
${Object.entries(data).map(([collectionName, records]: [string, any]) => {
  const schemaInfo = schema[collectionName];
  return `
### ${collectionName.toUpperCase()} (${Array.isArray(records) ? records.length : 0} records)
**Description**: ${schemaInfo?.description || 'No description'}
**Key Fields**: ${schemaInfo?.fields?.join(', ') || 'Unknown'}
**Relationships**: ${Object.keys(schemaInfo?.relationships || {}).join(', ') || 'None'}
**Recent Data Sample**: ${this.formatDataSample(records, 3)}
`;
}).join('')}

## BUSINESS WORKFLOWS AVAILABLE
${workflows.map((workflow: any) => `
**${workflow.name}**
- Description: ${workflow.description}
- Steps: ${workflow.steps.map((s: any) => `${s.order}. ${s.action} (${s.collection})`).join(' → ')}
- Collections: ${workflow.collections.join(', ')}
`).join('')}

## RELATIONSHIP MAPPINGS
${Object.entries(relationships).map(([collection, rels]: [string, any]) =>
  `**${collection}**: ${Object.keys(rels).join(', ')}`
).join('\n')}

## AI CAPABILITIES & INSTRUCTIONS

### Core Capabilities:
1. **Complete Data Understanding**: Access to all ${Object.keys(data).length} collections with live data
2. **Relationship Navigation**: Can traverse all entity relationships automatically
3. **Workflow Intelligence**: Understands all business processes and can guide users through them
4. **Predictive Insights**: Can identify patterns and suggest actions based on current data
5. **Cross-Collection Analysis**: Can analyze data across multiple related collections

### Response Guidelines:
1. **Use Real Names & Data**: Always provide actual names, titles, and meaningful details from the database
2. **Show Relationships**: When discussing an entity, include related information (e.g., learner's program, cohort, payments)
3. **Provide Context**: Explain not just what, but why something matters in the business context
4. **Suggest Actions**: Based on the data, suggest specific next steps or actions
5. **Identify Patterns**: Point out trends, anomalies, or opportunities in the data
6. **Respect Permissions**: Only share information accessible to the user's role
7. **Be Proactive**: Anticipate follow-up questions and provide comprehensive answers

### Data Analysis Instructions:
- When showing counts, also provide examples of actual items
- For learners: Show names, programs, cohorts, status, and progress
- For programs: Show enrollment numbers, active cohorts, revenue, completion rates
- For staff: Show names, roles, departments, and current assignments
- For applicants: Show application status, test scores, and intake assignments
- For financial data: Show payment status, amounts, and trends
- For events: Show attendance, registrations, and feedback

### Workflow Guidance:
- Understand where users are in business processes
- Suggest next steps in workflows
- Identify bottlenecks or delays in processes
- Recommend process improvements based on data patterns

### Advanced Features:
- Search across all collections simultaneously
- Identify data inconsistencies or missing information
- Generate comprehensive reports combining multiple data sources
- Provide predictive insights based on historical patterns

Remember: You're not just answering questions about data - you're providing business intelligence that helps users make better decisions and improve operations.

Current system status: All data is live and current as of ${new Date().toISOString()}.`;
  }

  private async generateContextualResponse(
    question: string,
    systemPrompt: string,
    completeContext: any
  ): Promise<EnhancedAIResponse> {
    try {
      const chat = model.startChat({
        history: [{
          role: 'user',
          parts: [{ text: systemPrompt }]
        }, {
          role: 'model',
          parts: [{ text: 'I understand. I have comprehensive access to your Kenya School of Sales system with complete database schema, live data from all collections, relationship mappings, and business workflows. I can provide detailed insights, navigate relationships, guide through processes, and offer actionable recommendations based on your actual data. How can I help you today?' }]
        }]
      });

      const result = await chat.sendMessage(question);
      const response = result.response.text();

      // Analyze the question to identify relevant data and relationships
      const relevantCollections = this.identifyRelevantCollections(question, completeContext);
      const workflowSuggestions = this.identifyRelevantWorkflows(question, completeContext);
      const relatedItems = this.findRelatedItems(question, completeContext, relevantCollections);
      const insights = await this.generateActionableInsights(question, completeContext, relevantCollections);

      return {
        answer: response,
        relevantData: relevantCollections.map(collection => ({
          collection: collection.name,
          records: collection.records,
          summary: collection.summary,
          insights: collection.insights
        })),
        workflowSuggestions,
        relatedItems,
        actionableInsights: insights,
        confidence: 0.9, // High confidence with comprehensive data
        dataFreshness: new Date()
      };
    } catch (error) {
      console.error('Error generating contextual response:', error);
      throw error;
    }
  }

  private identifyRelevantCollections(question: string, context: any): any[] {
    const questionLower = question.toLowerCase();
    const relevantCollections: any[] = [];

    // Keywords to collection mapping
    const keywordMappings: { [key: string]: string[] } = {
      'student': ['learners', 'applicants', 'cohorts'],
      'learner': ['learners', 'cohorts', 'sessions', 'payment_records'],
      'program': ['programs', 'cohorts', 'intakes', 'learners'],
      'applicant': ['applicants', 'testAttempts', 'intakes'],
      'staff': ['staff', 'users', 'instructors'],
      'instructor': ['instructors', 'sessions', 'learners'],
      'payment': ['payment_records', 'invoices', 'learners'],
      'event': ['events', 'event_registrations'],
      'job': ['jobs', 'jobApplications', 'candidates', 'organizations'],
      'customer': ['customers', 'b2b_leads', 'invoices'],
      'session': ['sessions', 'session_content', 'cohorts'],
      'test': ['competencyTests', 'testAttempts', 'applicants'],
      'cohort': ['cohorts', 'learners', 'sessions'],
      'intake': ['intakes', 'applicants', 'cohorts', 'programs']
    };

    // Find relevant collections based on keywords
    const identifiedCollections = new Set<string>();

    Object.entries(keywordMappings).forEach(([keyword, collections]) => {
      if (questionLower.includes(keyword)) {
        collections.forEach(col => identifiedCollections.add(col));
      }
    });

    // If no specific keywords found, include core collections
    if (identifiedCollections.size === 0) {
      ['learners', 'programs', 'staff', 'events'].forEach(col => identifiedCollections.add(col));
    }

    // Build relevant collections with data and insights
    identifiedCollections.forEach(collectionName => {
      const data = context.data[collectionName] || [];
      const schema = context.schema[collectionName] || {};

      relevantCollections.push({
        name: collectionName,
        records: data.slice(0, 50), // Limit for performance
        summary: `${data.length} ${collectionName} records available`,
        insights: this.generateCollectionInsights(collectionName, data)
      });
    });

    return relevantCollections;
  }

  private identifyRelevantWorkflows(question: string, context: any): any[] {
    const questionLower = question.toLowerCase();
    const workflowKeywords = {
      'enroll': 'Student Enrollment Journey',
      'application': 'Student Enrollment Journey',
      'admission': 'Student Enrollment Journey',
      'job': 'Recruitment Process',
      'recruitment': 'Recruitment Process',
      'hire': 'Recruitment Process',
      'customer': 'Customer Acquisition',
      'lead': 'Customer Acquisition',
      'sale': 'Customer Acquisition'
    };

    const suggestions: any[] = [];

    Object.entries(workflowKeywords).forEach(([keyword, workflowName]) => {
      if (questionLower.includes(keyword)) {
        const workflow = context.workflows.find((w: any) => w.name === workflowName);
        if (workflow) {
          suggestions.push({
            workflow: workflow.name,
            currentStep: 'Identifying current step...',
            nextActions: workflow.steps.slice(0, 3).map((s: any) => s.action)
          });
        }
      }
    });

    return suggestions;
  }

  private findRelatedItems(question: string, context: any, relevantCollections: any[]): any[] {
    const relatedItems: any[] = [];

    // Use relationship graph to find connected data
    relevantCollections.forEach(collection => {
      const relationships = context.relationships[collection.name];
      if (relationships) {
        Object.entries(relationships).forEach(([field, relationInfo]: [string, any]) => {
          const relatedData = context.data[relationInfo.collection];
          if (relatedData && relatedData.length > 0) {
            relatedItems.push({
              type: relationInfo.collection,
              data: relatedData.slice(0, 5), // Sample
              relationship: `${collection.name}.${field} → ${relationInfo.collection}`
            });
          }
        });
      }
    });

    return relatedItems;
  }

  private async generateActionableInsights(
    question: string,
    context: any,
    relevantCollections: any[]
  ): Promise<string[]> {
    const insights: string[] = [];

    // Generate insights based on data patterns
    relevantCollections.forEach(collection => {
      const data = collection.records;
      const collectionName = collection.name;

      if (collectionName === 'learners' && data.length > 0) {
        const activeCount = data.filter((l: any) => l.status === 'active').length;
        const completedCount = data.filter((l: any) => l.status === 'completed').length;
        const dropoutRate = data.length > 0 ? ((data.filter((l: any) => l.status === 'dropped').length / data.length) * 100).toFixed(1) : '0';

        insights.push(`Current learner retention: ${dropoutRate}% dropout rate with ${activeCount} active learners`);
        if (completedCount > 0) {
          insights.push(`${completedCount} learners have successfully completed programs`);
        }
      }

      if (collectionName === 'applicants' && data.length > 0) {
        const pending = data.filter((a: any) => a.status === 'pending').length;
        const approved = data.filter((a: any) => a.status === 'approved').length;

        if (pending > 10) {
          insights.push(`${pending} applications are pending review - consider prioritizing admission decisions`);
        }
        if (approved > 0) {
          insights.push(`${approved} approved applicants may need enrollment follow-up`);
        }
      }

      if (collectionName === 'payment_records' && data.length > 0) {
        const pendingPayments = data.filter((p: any) => p.status === 'pending').length;
        const totalRevenue = data.filter((p: any) => p.status === 'success').reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

        if (pendingPayments > 0) {
          insights.push(`${pendingPayments} payments are pending - follow up needed for cash flow`);
        }
        insights.push(`Total revenue tracked: KES ${totalRevenue.toLocaleString()}`);
      }
    });

    return insights;
  }

  private generateCollectionInsights(collectionName: string, data: any[]): any {
    if (!Array.isArray(data) || data.length === 0) return { count: 0, insights: [] };

    const insights = {
      count: data.length,
      insights: [] as string[],
      recentActivity: 0
    };

    // Calculate recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    insights.recentActivity = data.filter(item => {
      const createdAt = item.createdAt?.toDate ? item.createdAt.toDate() : new Date(item.createdAt);
      return createdAt && createdAt > sevenDaysAgo;
    }).length;

    // Generate specific insights based on collection type
    switch (collectionName) {
      case 'learners':
        const statusCounts = data.reduce((acc: any, learner: any) => {
          acc[learner.status] = (acc[learner.status] || 0) + 1;
          return acc;
        }, {});
        insights.insights.push(`Status breakdown: ${Object.entries(statusCounts).map(([status, count]) => `${status}: ${count}`).join(', ')}`);
        break;

      case 'programs':
        const activePrograms = data.filter(p => p.status === 'active').length;
        insights.insights.push(`${activePrograms} programs are currently active`);
        break;

      case 'events':
        const upcomingEvents = data.filter(e => new Date(e.date) > new Date()).length;
        insights.insights.push(`${upcomingEvents} upcoming events scheduled`);
        break;
    }

    return insights;
  }

  private formatDataSample(records: any[], limit: number = 3): string {
    if (!Array.isArray(records) || records.length === 0) return 'No data available';

    return records.slice(0, limit).map(record => {
      // Format each record showing key identifiable information
      const keys = Object.keys(record).filter(k => !k.startsWith('_') && k !== 'id');
      const importantFields = keys.slice(0, 3);
      return importantFields.map(field => {
        const value = record[field];
        if (typeof value === 'object' && value?.toDate) {
          return `${field}: ${value.toDate().toLocaleDateString()}`;
        }
        return `${field}: ${String(value).slice(0, 30)}`;
      }).join(', ');
    }).join(' | ');
  }

  private getAccessDescription(role: string): string {
    const descriptions: { [key: string]: string } = {
      admin: 'Full system access - all collections and workflows',
      staff: 'Operational access - student management, events, recruitment, customer data',
      instructor: 'Educational access - learners, programs, sessions, assessments',
      learner: 'Student access - own records, programs, sessions, payments',
      applicant: 'Limited access - application status, programs, tests'
    };
    return descriptions[role] || 'Standard access level';
  }

  // Search functionality
  async searchSystem(searchTerm: string, userRole: string, options?: {
    collections?: string[];
    includeRelationships?: boolean;
  }): Promise<EnhancedAIResponse> {
    try {
      const searchResults = await aiEnhancedDataService.searchAcrossCollections(
        searchTerm,
        options?.collections
      );

      const completeContext = await aiEnhancedDataService.getCompleteContext(userRole);

      const searchPrompt = `Based on the search term "${searchTerm}", I found the following results across the system:

${Object.entries(searchResults).map(([collection, matches]: [string, any]) => `
**${collection}**: ${matches.length} matches
${matches.slice(0, 5).map((item: any) => `- ${this.formatSearchResult(item, collection)}`).join('\n')}
`).join('')}

Please provide a comprehensive summary of these search results, highlighting the most relevant findings and any connections between the different types of records found.`;

      const chat = model.startChat({
        history: [{
          role: 'user',
          parts: [{ text: this.buildEnhancedSystemPrompt(completeContext, userRole) }]
        }, {
          role: 'model',
          parts: [{ text: 'I understand the system completely and can help with your search.' }]
        }]
      });

      const result = await chat.sendMessage(searchPrompt);

      return {
        answer: result.response.text(),
        relevantData: Object.entries(searchResults).map(([collection, matches]: [string, any]) => ({
          collection,
          records: matches,
          summary: `${matches.length} matches in ${collection}`,
          insights: this.generateCollectionInsights(collection, matches)
        })),
        confidence: 0.85,
        dataFreshness: new Date()
      };
    } catch (error) {
      console.error('Search error:', error);
      throw error;
    }
  }

  private formatSearchResult(item: any, collection: string): string {
    const identifierFields: { [key: string]: string[] } = {
      learners: ['firstName', 'lastName', 'email'],
      staff: ['firstName', 'lastName', 'position'],
      programs: ['name', 'type'],
      events: ['title', 'date'],
      jobs: ['title', 'company'],
      applicants: ['firstName', 'lastName', 'status']
    };

    const fields = identifierFields[collection] || ['name', 'title', 'id'];
    const values = fields.map(field => item[field]).filter(Boolean);
    return values.length > 0 ? values.join(' - ') : `${collection} record`;
  }

  // Get workflow guidance
  async getWorkflowGuidance(workflowName: string, userRole: string, currentData?: any): Promise<EnhancedAIResponse> {
    try {
      const workflowContext = await aiEnhancedDataService.getWorkflowContext(workflowName);
      const completeContext = await aiEnhancedDataService.getCompleteContext(userRole);

      if (!workflowContext) {
        return {
          answer: `I don't have information about the workflow "${workflowName}". Available workflows are: ${completeContext.workflows.map((w: any) => w.name).join(', ')}`,
          confidence: 0.5,
          dataFreshness: new Date()
        };
      }

      const workflowPrompt = `Please provide comprehensive guidance for the "${workflowName}" workflow based on the current system state and data.

Workflow Details:
- Description: ${workflowContext.workflow.description}
- Steps: ${workflowContext.workflow.steps.map((s: any) => `${s.order}. ${s.action} (${s.collection})`).join(' → ')}

Current Data Context:
${Object.entries(workflowContext.data).map(([collection, data]: [string, any]) =>
  `${collection}: ${Array.isArray(data) ? data.length : 0} records`
).join(', ')}

Please provide:
1. Overview of the current workflow status
2. Specific next actions based on current data
3. Any bottlenecks or issues identified
4. Recommendations for improvement`;

      const chat = model.startChat({
        history: [{
          role: 'user',
          parts: [{ text: this.buildEnhancedSystemPrompt(completeContext, userRole) }]
        }, {
          role: 'model',
          parts: [{ text: 'I can provide detailed workflow guidance based on your system data.' }]
        }]
      });

      const result = await chat.sendMessage(workflowPrompt);

      return {
        answer: result.response.text(),
        workflowSuggestions: [{
          workflow: workflowName,
          currentStep: 'Analyzing current position...',
          nextActions: workflowContext.workflow.steps.slice(0, 3).map((s: any) => s.action)
        }],
        relevantData: Object.entries(workflowContext.data).map(([collection, data]: [string, any]) => ({
          collection,
          records: Array.isArray(data) ? data.slice(0, 20) : [],
          summary: `${Array.isArray(data) ? data.length : 0} ${collection} records`,
          insights: this.generateCollectionInsights(collection, data)
        })),
        confidence: 0.9,
        dataFreshness: new Date()
      };
    } catch (error) {
      console.error('Workflow guidance error:', error);
      throw error;
    }
  }
}

export default AIEnhancedService.getInstance();