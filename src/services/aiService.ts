import { GoogleGenerativeAI } from '@google/generative-ai';
import aiDataService, { AIContextData } from './aiDataService';

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI('AIzaSyDYfVvZQTSdFhbF0OO-Mz-BqGpLtFXzyTg');
const model = genAI.getGenerativeModel({ 
  model: 'gemini-1.5-flash',
  generationConfig: {
    temperature: 0.7,
    topK: 40,
    topP: 0.95,
  },
});

export interface AIResponse {
  answer: string;
  relevantData?: Array<{
    collection: string;
    id: string;
    relevance: number;
    summary: string;
  }>;
  suggestions?: string[];
  confidence: number;
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  relevantData?: any[];
}

export interface Conversation {
  id: string;
  title: string;
  messages: ConversationMessage[];
  createdAt: Date;
  updatedAt: Date;
}

class AIService {
  private static instance: AIService;
  private conversations: Map<string, Conversation> = new Map();

  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  private generateConversationId(): string {
    return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async getSystemContext(categories?: string[], userRole?: string): Promise<string> {
    try {
      const data = categories ? 
        await aiDataService.getFilteredData(categories, userRole) : 
        userRole ? await aiDataService.getRoleBasedContextData(userRole) : await aiDataService.getAllContextData();
      
      const summary = await aiDataService.getDataSummary(userRole);
      
      const roleInstructions = this.getRoleBasedInstructions(userRole);
      
      // Process data to extract meaningful information
      const processedData = this.processDataForAI(data);
      
      return `You are an AI assistant for the Kenya School of Sales Learning Management System. You have access to the following data:

${summary}

Context Data Available:
${processedData}

User Role: ${userRole || 'Not specified'}

Role-Based Instructions:
${roleInstructions}

General Instructions:
1. ALWAYS provide human-readable information, not technical IDs or document structures
2. When asked about learners, provide their actual names, programs, and relevant details
3. When asked about programs, provide program names, descriptions, and enrollment numbers
4. When asked about staff, provide their names, roles, and departments
5. Use actual data values like names, titles, and descriptions - NOT document IDs
6. If you mention a count or number, also provide examples of the actual items
7. Be conversational and provide practical insights
8. Focus on meaningful business information that users can act on
9. If asked about trends or analytics, analyze the actual data patterns
10. IMPORTANT: Respect user role permissions and only provide information they have access to

Remember: Users want to know about PEOPLE, PROGRAMS, and ACTIVITIES - not database structures!

Available Collections for this user:
${userRole ? aiDataService.getAllowedCategories(userRole).map(cat => `- ${cat}`).join('\n') : 'All collections available'}`;
    } catch (error) {
      console.error('Error getting system context:', error);
      return 'I apologize, but I\'m having trouble accessing the system data right now. Please try again later.';
    }
  }

  private processDataForAI(data: any): string {
    let processedOutput = '';
    
    Object.entries(data).forEach(([collectionName, documents]) => {
      if (documents && Array.isArray(documents)) {
        processedOutput += `\n\n${collectionName.toUpperCase()} COLLECTION (${documents.length} records):\n`;
        
        documents.slice(0, 10).forEach((doc: any, index: number) => {
          processedOutput += `\n${index + 1}. `;
          
          // Extract meaningful information based on collection type
          if (collectionName === 'learners') {
            processedOutput += `Name: ${doc.firstName || 'N/A'} ${doc.lastName || 'N/A'}, `;
            processedOutput += `Email: ${doc.email || 'N/A'}, `;
            processedOutput += `Program: ${doc.program || 'N/A'}, `;
            processedOutput += `Cohort: ${doc.cohort || 'N/A'}, `;
            processedOutput += `Status: ${doc.status || 'N/A'}, `;
            processedOutput += `Student ID: ${doc.studentId || 'N/A'}`;
          } else if (collectionName === 'staff') {
            processedOutput += `Name: ${doc.firstName || 'N/A'} ${doc.lastName || 'N/A'}, `;
            processedOutput += `Role: ${doc.role || 'N/A'}, `;
            processedOutput += `Email: ${doc.email || 'N/A'}, `;
            processedOutput += `Employee ID: ${doc.employeeId || 'N/A'}`;
          } else if (collectionName === 'programs') {
            processedOutput += `Program: ${doc.name || doc.title || 'N/A'}, `;
            processedOutput += `Description: ${doc.description || 'N/A'}, `;
            processedOutput += `Duration: ${doc.duration || 'N/A'}, `;
            processedOutput += `Status: ${doc.status || 'N/A'}`;
          } else if (collectionName === 'applicants') {
            processedOutput += `Name: ${doc.firstName || 'N/A'} ${doc.lastName || 'N/A'}, `;
            processedOutput += `Email: ${doc.email || 'N/A'}, `;
            processedOutput += `Program Applied: ${doc.programApplied || 'N/A'}, `;
            processedOutput += `Status: ${doc.applicationStatus || 'N/A'}`;
          } else if (collectionName === 'events') {
            processedOutput += `Event: ${doc.title || doc.name || 'N/A'}, `;
            processedOutput += `Date: ${doc.date || 'N/A'}, `;
            processedOutput += `Type: ${doc.type || 'N/A'}, `;
            processedOutput += `Status: ${doc.status || 'N/A'}`;
          } else if (collectionName === 'cohorts') {
            processedOutput += `Cohort: ${doc.name || 'N/A'}, `;
            processedOutput += `Program: ${doc.program || 'N/A'}, `;
            processedOutput += `Start Date: ${doc.startDate || 'N/A'}, `;
            processedOutput += `Capacity: ${doc.capacity || 'N/A'}`;
          } else if (collectionName === 'sessions') {
            processedOutput += `Session: ${doc.title || doc.name || 'N/A'}, `;
            processedOutput += `Date: ${doc.date || doc.scheduledTime || 'N/A'}, `;
            processedOutput += `Cohort: ${doc.cohort || 'N/A'}, `;
            processedOutput += `Facilitator: ${doc.facilitator || 'N/A'}`;
          } else if (collectionName === 'recruitment') {
            processedOutput += `Position: ${doc.title || doc.position || 'N/A'}, `;
            processedOutput += `Company: ${doc.company || 'N/A'}, `;
            processedOutput += `Status: ${doc.status || 'N/A'}, `;
            processedOutput += `Posted: ${doc.postedDate || 'N/A'}`;
          } else if (collectionName === 'finances') {
            processedOutput += `Amount: ${doc.amount || 'N/A'}, `;
            processedOutput += `Type: ${doc.type || 'N/A'}, `;
            processedOutput += `Status: ${doc.status || 'N/A'}, `;
            processedOutput += `Date: ${doc.date || 'N/A'}`;
          } else {
            // Generic processing for other collections
            const keyFields = ['name', 'title', 'firstName', 'lastName', 'email', 'status', 'type'];
            const relevantInfo = keyFields
              .map(field => doc[field] ? `${field}: ${doc[field]}` : null)
              .filter(Boolean)
              .join(', ');
            processedOutput += relevantInfo || 'Basic record information available';
          }
        });
        
        if (documents.length > 10) {
          processedOutput += `\n... and ${documents.length - 10} more records`;
        }
      }
    });
    
    return processedOutput;
  }

  private formatRelevantDataForAI(relevantData: any[]): string {
    if (!relevantData || relevantData.length === 0) {
      return 'No specific relevant data found.';
    }

    let formattedOutput = '';
    
    relevantData.forEach((item, index) => {
      formattedOutput += `\n${index + 1}. `;
      
      const collection = item._collection;
      
      if (collection === 'learners') {
        formattedOutput += `Learner: ${item.firstName || 'N/A'} ${item.lastName || 'N/A'}`;
        if (item.email) formattedOutput += `, Email: ${item.email}`;
        if (item.program) formattedOutput += `, Program: ${item.program}`;
        if (item.cohort) formattedOutput += `, Cohort: ${item.cohort}`;
        if (item.status) formattedOutput += `, Status: ${item.status}`;
        if (item.studentId) formattedOutput += `, Student ID: ${item.studentId}`;
      } else if (collection === 'staff') {
        formattedOutput += `Staff: ${item.firstName || 'N/A'} ${item.lastName || 'N/A'}`;
        if (item.role) formattedOutput += `, Role: ${item.role}`;
        if (item.email) formattedOutput += `, Email: ${item.email}`;
        if (item.employeeId) formattedOutput += `, Employee ID: ${item.employeeId}`;
      } else if (collection === 'programs') {
        formattedOutput += `Program: ${item.name || item.title || 'N/A'}`;
        if (item.description) formattedOutput += `, Description: ${item.description}`;
        if (item.duration) formattedOutput += `, Duration: ${item.duration}`;
        if (item.status) formattedOutput += `, Status: ${item.status}`;
      } else if (collection === 'applicants') {
        formattedOutput += `Applicant: ${item.firstName || 'N/A'} ${item.lastName || 'N/A'}`;
        if (item.email) formattedOutput += `, Email: ${item.email}`;
        if (item.programApplied) formattedOutput += `, Applied for: ${item.programApplied}`;
        if (item.applicationStatus) formattedOutput += `, Status: ${item.applicationStatus}`;
      } else if (collection === 'events') {
        formattedOutput += `Event: ${item.title || item.name || 'N/A'}`;
        if (item.date) formattedOutput += `, Date: ${item.date}`;
        if (item.type) formattedOutput += `, Type: ${item.type}`;
        if (item.status) formattedOutput += `, Status: ${item.status}`;
      } else if (collection === 'cohorts') {
        formattedOutput += `Cohort: ${item.name || 'N/A'}`;
        if (item.program) formattedOutput += `, Program: ${item.program}`;
        if (item.startDate) formattedOutput += `, Start Date: ${item.startDate}`;
        if (item.capacity) formattedOutput += `, Capacity: ${item.capacity}`;
      } else if (collection === 'sessions') {
        formattedOutput += `Session: ${item.title || item.name || 'N/A'}`;
        if (item.date || item.scheduledTime) formattedOutput += `, Date: ${item.date || item.scheduledTime}`;
        if (item.cohort) formattedOutput += `, Cohort: ${item.cohort}`;
        if (item.facilitator) formattedOutput += `, Facilitator: ${item.facilitator}`;
      } else if (collection === 'recruitment') {
        formattedOutput += `Position: ${item.title || item.position || 'N/A'}`;
        if (item.company) formattedOutput += `, Company: ${item.company}`;
        if (item.status) formattedOutput += `, Status: ${item.status}`;
        if (item.postedDate) formattedOutput += `, Posted: ${item.postedDate}`;
      } else if (collection === 'finances') {
        formattedOutput += `Financial Record: ${item.type || 'N/A'}`;
        if (item.amount) formattedOutput += `, Amount: ${item.amount}`;
        if (item.status) formattedOutput += `, Status: ${item.status}`;
        if (item.date) formattedOutput += `, Date: ${item.date}`;
      } else {
        // Generic formatting for other collections
        const keyFields = ['name', 'title', 'firstName', 'lastName', 'email', 'status', 'type'];
        const relevantInfo = keyFields
          .map(field => item[field] ? `${field}: ${item[field]}` : null)
          .filter(Boolean)
          .join(', ');
        formattedOutput += relevantInfo || 'Record from ' + collection;
      }
      
      formattedOutput += ` (from ${collection} collection)`;
    });
    
    return formattedOutput;
  }

  private getRoleBasedInstructions(userRole?: string): string {
    const instructions = {
      admin: `As an administrator, you have full access to all system data including:
- All organizational data, finances, and performance metrics
- Staff information and management details
- Complete learner records and academic data
- Recruitment and hiring information
- System settings and configuration
- You can answer questions about organizational performance, budget, strategic planning, etc.`,

      staff: `As a staff member, you have access to operational data including:
- Customer management and sales CRM
- Admissions and application processes
- Recruitment and job management
- Events and communications
- Basic organizational information
- You focus on operational support and business development
- You do not have direct access to teaching materials or session content`,

      instructor: `As an instructor, you have access to teaching and educational data including:
- Complete learner information and academic records
- All programs and educational content
- Session planning and schedules
- Learning materials and resources
- Competency tests and assessments
- Capstone projects and student progress
- You focus on teaching, mentoring, and educational support
- You cannot access sales CRM, recruitment, or financial data`,

      learner: `As a learner, you have access to educational and financial information:
- Your learning progress and academic information
- Program details and educational content
- Cohort information and fellow learners
- Learning sessions and schedules
- Your payment records and financial information
- Educational events and activities
- You can view your fees, payments, and outstanding balances
- You cannot access staff information, organizational finances, or recruitment data
- Focus on your educational journey and personal financial records`,

      applicant: `As an applicant, you have limited access to public information:
- Program descriptions and requirements
- Admission processes and requirements
- General events and activities
- Application guidance and support
- You cannot access current student data, staff information, or organizational details
- Focus on helping with the application process and program information`
    };

    return instructions[userRole as keyof typeof instructions] || 'No specific role restrictions - provide general assistance based on available data.';
  }

  // Generate AI response using Google Generative AI
  private async generateAIResponse(input: {
    question: string;
    context?: string;
    categories?: string[];
    userRole?: string;
  }): Promise<AIResponse> {
    try {
      const systemContext = await this.getSystemContext(input.categories, input.userRole);
      
      // Search for relevant data with role-based filtering
      const relevantData = await aiDataService.searchInData(input.question, input.categories, input.userRole);
      
      const prompt = `${systemContext}

Previous conversation context: ${input.context || 'None'}

Question: ${input.question}

Most relevant data found:
${this.formatRelevantDataForAI(relevantData.slice(0, 10))}

IMPORTANT INSTRUCTIONS:
- Provide human-readable information with actual names, titles, and details
- DO NOT mention document IDs or technical database structures
- Focus on practical, actionable information
- Use specific examples from the data
- If counting items, also mention some examples
- Be conversational and helpful
- Respect the user's role permissions

Please respond with a clear, helpful answer that addresses the question directly using the actual data content.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const answer = response.text();

      // Generate suggestions based on the question type and role
      const suggestions = this.generateSuggestions(input.question, input.userRole);

      return {
        answer,
        relevantData: relevantData.slice(0, 5).map(item => ({
          collection: item._collection,
          id: item.id,
          relevance: item._relevance,
          summary: this.generateDataSummary(item)
        })),
        suggestions,
        confidence: 0.8 // Default confidence level
      };
    } catch (error) {
      console.error('Error generating AI response:', error);
      throw new Error('Failed to generate AI response');
    }
  }

  private generateSuggestions(question: string, userRole?: string): string[] {
    const suggestions: Record<string, string[]> = {
      admin: [
        "What's the overall organizational performance?",
        "How are our finances looking?",
        "What's the staff productivity level?",
        "Show me recruitment metrics"
      ],
      staff: [
        "How many students need attention?",
        "What's the current admission pipeline?",
        "Which programs are most popular?",
        "What events are coming up?"
      ],
      learner: [
        "What's my current progress?",
        "What learning resources are available?",
        "When are my next sessions?",
        "How can I improve my performance?"
      ],
      applicant: [
        "What are the admission requirements?",
        "When do programs start?",
        "What documents do I need?",
        "How long does the process take?"
      ]
    };

    const roleSuggestions = suggestions[userRole || 'applicant'] || suggestions.applicant;
    return roleSuggestions.slice(0, 3);
  }

  private generateDataSummary(data: any): string {
    const relevantFields = ['name', 'firstName', 'lastName', 'title', 'program', 'cohort', 'status', 'email'];
    const summary = relevantFields
      .filter(field => data[field])
      .map(field => `${field}: ${data[field]}`)
      .join(', ');
    
    return summary || 'Data record';
  }

  async askQuestion(question: string, conversationId?: string, categories?: string[], userRole?: string): Promise<{
    response: AIResponse;
    conversationId: string;
    messageId: string;
  }> {
    try {
      // Get or create conversation
      let conversation: Conversation;
      if (conversationId && this.conversations.has(conversationId)) {
        conversation = this.conversations.get(conversationId)!;
      } else {
        const newConversationId = this.generateConversationId();
        conversation = {
          id: newConversationId,
          title: question.substring(0, 50) + (question.length > 50 ? '...' : ''),
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date()
        };
        this.conversations.set(newConversationId, conversation);
        conversationId = newConversationId;
      }

      // Get conversation context
      const context = conversation.messages
        .slice(-5) // Last 5 messages for context
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n');

      // Add user message
      const userMessageId = this.generateMessageId();
      const userMessage: ConversationMessage = {
        id: userMessageId,
        role: 'user',
        content: question,
        timestamp: new Date()
      };
      conversation.messages.push(userMessage);

      // Get AI response
      const aiResponse = await this.generateAIResponse({
        question,
        context,
        categories,
        userRole
      });

      // Add AI response message
      const aiMessageId = this.generateMessageId();
      const aiMessage: ConversationMessage = {
        id: aiMessageId,
        role: 'assistant',
        content: aiResponse.answer,
        timestamp: new Date(),
        relevantData: aiResponse.relevantData
      };
      conversation.messages.push(aiMessage);

      // Update conversation
      conversation.updatedAt = new Date();
      this.conversations.set(conversationId, conversation);

      return {
        response: aiResponse,
        conversationId: conversationId,
        messageId: aiMessageId
      };
    } catch (error) {
      console.error('Error processing question:', error);
      throw new Error('Failed to process your question. Please try again.');
    }
  }

  getConversation(conversationId: string): Conversation | undefined {
    return this.conversations.get(conversationId);
  }

  getAllConversations(): Conversation[] {
    return Array.from(this.conversations.values()).sort((a, b) => 
      b.updatedAt.getTime() - a.updatedAt.getTime()
    );
  }

  deleteConversation(conversationId: string): boolean {
    return this.conversations.delete(conversationId);
  }

  clearAllConversations(): void {
    this.conversations.clear();
  }

  async getQuickInsights(): Promise<string[]> {
    try {
      const data = await aiDataService.getAllContextData();
      
      const insights = [];
      
      if (data.learners.length > 0) {
        insights.push(`You have ${data.learners.length} active learners in the system`);
      }
      
      if (data.applicants.length > 0) {
        insights.push(`${data.applicants.length} applications are pending review`);
      }
      
      if (data.staff.length > 0) {
        insights.push(`${data.staff.length} staff members are managing the system`);
      }
      
      if (data.programs.length > 0) {
        insights.push(`${data.programs.length} programs are currently offered`);
      }
      
      if (data.sessions.length > 0) {
        insights.push(`${data.sessions.length} learning sessions are scheduled`);
      }
      
      return insights;
    } catch (error) {
      console.error('Error getting quick insights:', error);
      return ['Unable to fetch system insights at the moment'];
    }
  }
}

export default AIService.getInstance(); 