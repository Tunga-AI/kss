import React, { useState, useEffect, useRef } from 'react';
import {
  Brain, MessageCircle, Settings, HelpCircle, Sparkles, Search, RefreshCw,
  Database, Bot, User, Send, Plus, Trash2, ChevronDown, ChevronUp,
  Zap, TrendingUp, Users, BookOpen, Calendar, DollarSign, Target,
  Workflow, Link2, BarChart3, AlertCircle, CheckCircle, Clock
} from 'lucide-react';
import { useAuthContext } from '../../../contexts/AuthContext';
import aiEnhancedService from '../../../services/aiEnhancedService';
import aiEnhancedDataService from '../../../services/aiEnhancedDataService';
import LoadingSpinner from '../../../components/LoadingSpinner';

interface EnhancedMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  relevantData?: any[];
  workflowSuggestions?: any[];
  relatedItems?: any[];
  actionableInsights?: string[];
  confidence?: number;
}

const EnhancedAI: React.FC = () => {
  const { userProfile } = useAuthContext();
  const [messages, setMessages] = useState<EnhancedMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [systemContext, setSystemContext] = useState<any>(null);
  const [contextLoading, setContextLoading] = useState(true);
  const [showSystemInfo, setShowSystemInfo] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'search' | 'workflows' | 'insights'>('chat');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any>(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState<string>('');
  const [insights, setInsights] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const userRole = userProfile?.role || 'applicant';

  useEffect(() => {
    loadSystemContext();
  }, [userRole]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadSystemContext = async () => {
    try {
      setContextLoading(true);
      const context = await aiEnhancedDataService.getCompleteContext(userRole);
      setSystemContext(context);

      // Add welcome message with system overview
      const welcomeMessage: EnhancedMessage = {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: `Welcome to your Enhanced AI Assistant! 🚀

I now have comprehensive access to your entire Kenya School of Sales system:

📊 **System Overview:**
- **${Object.keys(context.data).length} Collections** with live data
- **${Object.values(context.statistics).reduce((sum: number, stat: any) => sum + stat.count, 0)} Total Records** across all collections
- **${context.workflows.length} Business Workflows** for operational guidance
- **Complete Relationship Mapping** between all entities

🎯 **What I can help you with:**
- **Deep Data Analysis**: Search across all collections simultaneously
- **Business Intelligence**: Get insights from your actual data patterns
- **Workflow Guidance**: Navigate through business processes step-by-step
- **Predictive Insights**: Identify trends and recommend actions
- **Cross-Reference Analysis**: Find connections between different data points

💡 **Try asking me:**
- "Show me learner enrollment trends this month"
- "What applicants need follow-up?"
- "Guide me through the recruitment workflow"
- "Search for John across all records"
- "What are the payment collection issues?"

Your role (${userRole}) gives you access to ${Object.keys(context.data).length} collections. How can I help you today?`,
        timestamp: new Date(),
        confidence: 1.0,
        actionableInsights: [
          `You have access to ${Object.keys(context.data).length} data collections`,
          `${context.workflows.length} workflows available for process guidance`,
          'AI can now search across all your data simultaneously'
        ]
      };

      setMessages([welcomeMessage]);
    } catch (error) {
      console.error('Error loading system context:', error);
    } finally {
      setContextLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: EnhancedMessage = {
      id: `msg_${Date.now()}_user`,
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await aiEnhancedService.askEnhancedQuestion(
        inputValue.trim(),
        userRole,
        {
          includeRelationships: true,
          includeInsights: true
        }
      );

      const assistantMessage: EnhancedMessage = {
        id: `msg_${Date.now()}_assistant`,
        role: 'assistant',
        content: response.answer,
        timestamp: new Date(),
        relevantData: response.relevantData,
        workflowSuggestions: response.workflowSuggestions,
        relatedItems: response.relatedItems,
        actionableInsights: response.actionableInsights,
        confidence: response.confidence
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: EnhancedMessage = {
        id: `msg_${Date.now()}_error`,
        role: 'assistant',
        content: 'I apologize, but I encountered an error processing your request. Please try again.',
        timestamp: new Date(),
        confidence: 0
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim() || isLoading) return;

    setIsLoading(true);
    try {
      const results = await aiEnhancedService.searchSystem(searchTerm, userRole, {
        includeRelationships: true
      });
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWorkflowGuidance = async (workflowName: string) => {
    if (!workflowName || isLoading) return;

    setIsLoading(true);
    try {
      const guidance = await aiEnhancedService.getWorkflowGuidance(workflowName, userRole);

      const workflowMessage: EnhancedMessage = {
        id: `msg_${Date.now()}_workflow`,
        role: 'assistant',
        content: guidance.answer,
        timestamp: new Date(),
        workflowSuggestions: guidance.workflowSuggestions,
        relevantData: guidance.relevantData,
        confidence: guidance.confidence
      };

      setMessages(prev => [...prev, workflowMessage]);
      setActiveTab('chat');
    } catch (error) {
      console.error('Workflow guidance error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadInsights = async () => {
    setIsLoading(true);
    try {
      const insightsData = await aiEnhancedDataService.getInsights();
      setInsights(insightsData);
    } catch (error) {
      console.error('Insights error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (contextLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-primary-600 text-white rounded-2xl shadow-lg p-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Enhanced AI Assistant</h1>
              <p className="text-lg text-primary-100">Loading comprehensive system context...</p>
            </div>
            <div className="bg-white bg-opacity-20 p-4 rounded-xl">
              <Brain className="h-8 w-8 text-white animate-pulse" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12 text-center">
          <LoadingSpinner />
          <p className="mt-4 text-gray-600">Initializing AI with complete database schema and relationships...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2 flex items-center">
              <Sparkles className="h-10 w-10 mr-3" />
              Enhanced AI Assistant
            </h1>
            <p className="text-lg text-purple-100">
              Comprehensive database understanding • Workflow intelligence • Predictive insights
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowSystemInfo(!showSystemInfo)}
              className="bg-white bg-opacity-20 p-3 rounded-xl hover:bg-opacity-30 transition-colors duration-200"
              title="System Information"
            >
              <Database className="h-6 w-6 text-white" />
            </button>
            <button
              onClick={loadSystemContext}
              className="bg-white bg-opacity-20 p-3 rounded-xl hover:bg-opacity-30 transition-colors duration-200"
              title="Refresh Context"
            >
              <RefreshCw className="h-6 w-6 text-white" />
            </button>
          </div>
        </div>

        {/* System Info */}
        {showSystemInfo && systemContext && (
          <div className="mt-6 bg-white bg-opacity-10 rounded-xl p-4 backdrop-blur-sm">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{Object.keys(systemContext.data).length}</div>
                <div className="text-sm text-purple-200">Collections</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {Object.values(systemContext.statistics).reduce((sum: number, stat: any) => sum + stat.count, 0)}
                </div>
                <div className="text-sm text-purple-200">Total Records</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{systemContext.workflows.length}</div>
                <div className="text-sm text-purple-200">Workflows</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{userRole}</div>
                <div className="text-sm text-purple-200">Access Level</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200">
        <div className="flex border-b border-gray-200">
          {[
            { id: 'chat', label: 'AI Chat', icon: MessageCircle },
            { id: 'search', label: 'System Search', icon: Search },
            { id: 'workflows', label: 'Workflow Guide', icon: Workflow },
            { id: 'insights', label: 'Data Insights', icon: BarChart3 }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center space-x-2 py-4 px-6 font-medium text-sm transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'text-purple-600 bg-purple-50 border-b-2 border-purple-500'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {/* Chat Tab */}
          {activeTab === 'chat' && (
            <div className="space-y-4">
              {/* Messages */}
              <div className="h-96 overflow-y-auto space-y-4 border border-gray-200 rounded-lg p-4 bg-gray-50">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-3xl p-4 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-purple-600 text-white'
                          : 'bg-white border border-gray-200 shadow-sm'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        {message.role === 'assistant' && (
                          <div className="bg-purple-100 p-2 rounded-full">
                            <Bot className="h-4 w-4 text-purple-600" />
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="prose prose-sm max-w-none">
                            <div className="whitespace-pre-wrap">{message.content}</div>
                          </div>

                          {/* Actionable Insights */}
                          {message.actionableInsights && message.actionableInsights.length > 0 && (
                            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                              <div className="flex items-center space-x-2 mb-2">
                                <Zap className="h-4 w-4 text-blue-600" />
                                <span className="text-sm font-medium text-blue-800">Key Insights</span>
                              </div>
                              <ul className="text-sm text-blue-700 space-y-1">
                                {message.actionableInsights.map((insight, idx) => (
                                  <li key={idx} className="flex items-start space-x-2">
                                    <CheckCircle className="h-3 w-3 text-blue-500 mt-0.5 flex-shrink-0" />
                                    <span>{insight}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Relevant Data */}
                          {message.relevantData && message.relevantData.length > 0 && (
                            <div className="mt-4 space-y-2">
                              <span className="text-xs font-medium text-gray-500 uppercase">Relevant Data</span>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {message.relevantData.map((data, idx) => (
                                  <div key={idx} className="p-2 bg-gray-100 rounded text-xs">
                                    <div className="font-medium">{data.collection}</div>
                                    <div className="text-gray-600">{data.summary}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Workflow Suggestions */}
                          {message.workflowSuggestions && message.workflowSuggestions.length > 0 && (
                            <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                              <div className="flex items-center space-x-2 mb-2">
                                <Target className="h-4 w-4 text-green-600" />
                                <span className="text-sm font-medium text-green-800">Suggested Actions</span>
                              </div>
                              {message.workflowSuggestions.map((suggestion, idx) => (
                                <div key={idx} className="text-sm text-green-700">
                                  <div className="font-medium">{suggestion.workflow}</div>
                                  <div className="text-xs text-green-600">
                                    Next: {suggestion.nextActions?.join(' → ')}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                            <span>{message.timestamp.toLocaleTimeString()}</span>
                            {message.confidence !== undefined && (
                              <span className="flex items-center space-x-1">
                                <span>Confidence:</span>
                                <span className={`font-medium ${
                                  message.confidence > 0.8 ? 'text-green-600' :
                                  message.confidence > 0.6 ? 'text-yellow-600' : 'text-red-600'
                                }`}>
                                  {Math.round(message.confidence * 100)}%
                                </span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-gray-200 shadow-sm p-4 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="bg-purple-100 p-2 rounded-full">
                          <Bot className="h-4 w-4 text-purple-600 animate-pulse" />
                        </div>
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask me anything about your system data, workflows, or insights..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  disabled={isLoading}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <Send className="h-4 w-4" />
                  <span>Send</span>
                </button>
              </div>
            </div>
          )}

          {/* Search Tab */}
          {activeTab === 'search' && (
            <div className="space-y-4">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search across all collections (names, emails, titles, etc.)"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
                <button
                  onClick={handleSearch}
                  disabled={!searchTerm.trim() || isLoading}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </button>
              </div>

              {searchResults && (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="prose prose-sm max-w-none">
                      <div className="whitespace-pre-wrap">{searchResults.answer}</div>
                    </div>
                  </div>

                  {searchResults.relevantData && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {searchResults.relevantData.map((data: any, idx: number) => (
                        <div key={idx} className="border border-gray-200 rounded-lg p-4">
                          <h3 className="font-medium text-gray-900 mb-2 capitalize">{data.collection}</h3>
                          <p className="text-sm text-gray-600 mb-3">{data.summary}</p>
                          <div className="space-y-2">
                            {data.records.slice(0, 5).map((record: any, recordIdx: number) => (
                              <div key={recordIdx} className="text-xs bg-gray-50 p-2 rounded">
                                {Object.entries(record)
                                  .filter(([key]) => !key.startsWith('_') && key !== 'id')
                                  .slice(0, 3)
                                  .map(([key, value]) => `${key}: ${String(value).slice(0, 30)}`)
                                  .join(' | ')}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Workflows Tab */}
          {activeTab === 'workflows' && systemContext?.workflows && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {systemContext.workflows.map((workflow: any, idx: number) => (
                  <div key={idx} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
                    <h3 className="font-medium text-gray-900 mb-2">{workflow.name}</h3>
                    <p className="text-sm text-gray-600 mb-3">{workflow.description}</p>
                    <div className="text-xs text-gray-500 mb-4">
                      {workflow.steps.length} steps • {workflow.collections.join(', ')}
                    </div>
                    <button
                      onClick={() => handleWorkflowGuidance(workflow.name)}
                      disabled={isLoading}
                      className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      Get Guidance
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Insights Tab */}
          {activeTab === 'insights' && (
            <div className="space-y-4">
              <button
                onClick={loadInsights}
                disabled={isLoading}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <BarChart3 className="h-4 w-4" />}
                {isLoading ? 'Loading...' : 'Generate Insights'}
              </button>

              {insights && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(insights).map(([collection, data]: [string, any], idx: number) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 mb-2 capitalize">{collection}</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Records:</span>
                          <span className="font-medium">{data.totalCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Recent Activity:</span>
                          <span className="font-medium">{data.recentActivity}</span>
                        </div>
                        {data.summary && Object.entries(data.summary).map(([key, value]: [string, any], summaryIdx: number) => (
                          <div key={summaryIdx} className="flex justify-between">
                            <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                            <span className="font-medium">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedAI;