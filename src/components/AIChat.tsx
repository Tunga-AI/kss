import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Plus, Trash2, MessageCircle, ChevronDown, ChevronUp, Sparkles, Brain, RefreshCw } from 'lucide-react';
import aiService, { Conversation, ConversationMessage, AIResponse } from '../services/aiService';

interface AIChatProps {
  selectedConversationId?: string;
  onConversationSelect?: (conversationId: string) => void;
  categories?: string[];
  userRole?: string;
}

const AIChat: React.FC<AIChatProps> = ({ selectedConversationId, onConversationSelect, categories, userRole }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>(selectedConversationId);
  const [currentMessages, setCurrentMessages] = useState<ConversationMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [insights, setInsights] = useState<string[]>([]);
  const [showInsights, setShowInsights] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    loadConversations();
    loadInsights();
  }, []);

  useEffect(() => {
    if (selectedConversationId) {
      setCurrentConversationId(selectedConversationId);
      loadConversation(selectedConversationId);
    }
  }, [selectedConversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [currentMessages]);

  const loadConversations = () => {
    const allConversations = aiService.getAllConversations();
    setConversations(allConversations);
  };

  const loadConversation = (conversationId: string) => {
    const conversation = aiService.getConversation(conversationId);
    if (conversation) {
      setCurrentMessages(conversation.messages);
    }
  };

  const loadInsights = async () => {
    try {
      const quickInsights = await aiService.getQuickInsights();
      setInsights(quickInsights);
    } catch (error) {
      console.error('Error loading insights:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const question = inputValue.trim();
    setInputValue('');
    setIsLoading(true);

    try {
      const result = await aiService.askQuestion(question, currentConversationId, categories, userRole);
      
      setCurrentConversationId(result.conversationId);
      onConversationSelect?.(result.conversationId);
      
      // Reload conversation to get updated messages
      loadConversation(result.conversationId);
      loadConversations();
    } catch (error) {
      console.error('Error sending message:', error);
      // Add error message to UI
      const errorMessage: ConversationMessage = {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: 'I apologize, but I encountered an error while processing your question. Please try again.',
        timestamp: new Date()
      };
      setCurrentMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const startNewConversation = () => {
    setCurrentConversationId(undefined);
    setCurrentMessages([]);
    onConversationSelect?.('');
  };

  const selectConversation = (conversationId: string) => {
    setCurrentConversationId(conversationId);
    loadConversation(conversationId);
    onConversationSelect?.(conversationId);
  };

  const deleteConversation = (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this conversation?')) {
      aiService.deleteConversation(conversationId);
      loadConversations();
      if (currentConversationId === conversationId) {
        startNewConversation();
      }
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = (message: ConversationMessage) => {
    const isUser = message.role === 'user';
    
    return (
      <div key={message.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`flex max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
            isUser ? 'bg-primary-500 ml-2' : 'bg-gray-600 mr-2'
          }`}>
            {isUser ? <User size={16} className="text-white" /> : <Bot size={16} className="text-white" />}
          </div>
          <div className={`rounded-lg p-3 ${
            isUser 
              ? 'bg-primary-500 text-white' 
              : 'bg-gray-100 text-gray-900 border border-gray-200'
          }`}>
            <div className="whitespace-pre-wrap">{message.content}</div>
            {message.relevantData && message.relevantData.length > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-300">
                <div className="text-xs text-gray-600 mb-1">Relevant data sources:</div>
                <div className="flex flex-wrap gap-1">
                  {message.relevantData.map((data, index) => (
                    <span key={index} className="text-xs bg-primary-100 text-primary-800 px-2 py-1 rounded">
                      {data.collection}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className={`text-xs mt-1 ${isUser ? 'text-primary-100' : 'text-gray-500'}`}>
              {formatTimestamp(message.timestamp)}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Remove the unused getRoleBasedQuestions function
  // const getRoleBasedQuestions = (role?: string) => {
  //   const questions = {
  //     admin: [
  //       "How many learners are currently enrolled?",
  //       "What's the current staff composition?",
  //       "Show me recent admissions data",
  //       "What's the financial overview?",
  //       "What recruitment activities are ongoing?",
  //       "Show me upcoming learning sessions",
  //       "What's the organizational performance?",
  //       "How are our programs performing?",
  //       "How many event registrations do we have?",
  //       "What's the event attendance rate?",
  //       "Show me event registration trends",
  //       "Which events are most popular?",
  //     ],
  //     staff: [
  //       "How many learners are currently enrolled?",
  //       "What programs are available?",
  //       "Show me recent admissions data",
  //       "What's the current staff composition?",
  //       "How many applications are pending?",
  //       "What recruitment activities are ongoing?",
  //       "Show me upcoming learning sessions",
  //       "How are our cohorts performing?",
  //       "How many people registered for events?",
  //       "What's the event registration status?",
  //       "Show me event attendance data",
  //       "Which events need more promotion?",
  //     ],
  //     learner: [
  //       "What programs are available?",
  //       "Show me my learning progress",
  //       "What events are coming up?",
  //       "Who are my cohort members?",
  //       "What learning sessions are scheduled?",
  //       "How can I improve my performance?",
  //       "What cohorts am I part of?",
  //       "What learning resources are available?",
  //       "What events can I register for?",
  //       "Show me my event registrations",
  //       "What events have I attended?",
  //       "How do I register for events?",
  //     ],
  //     applicant: [
  //       "What programs are available?",
  //       "How do I apply for admission?",
  //       "What are the admission requirements?",
  //       "What events can I attend?",
  //       "When do programs start?",
  //       "What is the application process?",
  //       "How long does admission take?",
  //       "What documents do I need?",
  //       "What events are open for registration?",
  //       "How do I register for events?",
  //       "What's the cost of events?",
  //       "Are there any free events?",
  //     ]
  //   };
    
  //   return questions[role as keyof typeof questions] || questions.applicant;
  // };

  // Remove suggested questions - we'll use a cleaner welcome message instead
  // const suggestedQuestions = getRoleBasedQuestions(userRole);

  return (
    <div className="flex h-[600px] bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Sidebar */}
      <div className={`${showSidebar ? 'w-80' : 'w-0'} transition-all duration-300 overflow-hidden border-r border-gray-200 flex flex-col`}>
        <div className="p-4 border-b border-gray-200">
          <button
            onClick={startNewConversation}
            className="w-full flex items-center justify-center gap-2 bg-primary-500 text-white p-3 rounded-lg hover:bg-primary-600 transition-colors"
          >
            <Plus size={16} />
            New Conversation
          </button>
        </div>
        
        {/* Insights Section */}
        <div className="p-4 border-b border-gray-200">
          <button
            onClick={() => setShowInsights(!showInsights)}
            className="w-full flex items-center justify-between text-left text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            <div className="flex items-center gap-2">
              <Sparkles size={16} />
              Quick Insights
            </div>
            {showInsights ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {showInsights && (
            <div className="mt-2 space-y-1">
              {insights.map((insight, index) => (
                <div key={index} className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                  {insight}
                </div>
              ))}
              <button
                onClick={loadInsights}
                className="w-full flex items-center justify-center gap-1 text-xs text-primary-600 hover:text-primary-700 mt-2"
              >
                <RefreshCw size={12} />
                Refresh
              </button>
            </div>
          )}
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Recent Conversations</h3>
          {conversations.length === 0 ? (
            <div className="text-sm text-gray-500 text-center py-8">
              No conversations yet
            </div>
          ) : (
            <div className="space-y-2">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                    currentConversationId === conversation.id
                      ? 'bg-primary-50 border-l-4 border-primary-500'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => selectConversation(conversation.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <MessageCircle size={14} className="text-gray-400" />
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {conversation.title}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {conversation.updatedAt.toLocaleDateString()}
                    </div>
                  </div>
                  <button
                    onClick={(e) => deleteConversation(conversation.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:text-red-700 transition-opacity"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <MessageCircle size={20} />
              </button>
              <div className="flex items-center gap-2">
                <Brain size={20} className="text-primary-500" />
                <h2 className="text-lg font-semibold text-gray-900">AI Assistant</h2>
                {userRole && (
                  <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded capitalize">
                    {userRole} View
                  </span>
                )}
              </div>
            </div>
            {categories && categories.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {categories.map((category) => (
                  <span key={category} className="text-xs bg-primary-100 text-primary-800 px-2 py-1 rounded">
                    {category}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4">
          {currentMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="bg-gradient-to-br from-primary-100 to-primary-50 p-8 rounded-2xl mb-6">
                <Bot size={48} className="text-primary-600 mx-auto mb-4" />
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                  Welcome to AI Assistant
                </h3>
                <p className="text-gray-700 mb-4 max-w-lg leading-relaxed">
                  {userRole === 'admin' && 'I have access to your complete organizational data. Ask me about learners, staff, finances, programs, events, and performance metrics.'}
                  {userRole === 'staff' && 'I can help you with learner management, admissions, events, and operational insights. What would you like to know?'}
                  {userRole === 'learner' && 'I\'m here to support your learning journey. Ask me about your progress, upcoming sessions, events, and educational resources.'}
                  {userRole === 'applicant' && 'I can guide you through the application process and help you learn about our programs and events. What information do you need?'}
                  {!userRole && 'I can help you with questions about learners, admissions, staff, recruitment, learning sessions, events, and more.'}
                </p>
                <div className="flex items-center justify-center gap-2 text-sm text-primary-600">
                  <Sparkles size={16} />
                  <span>Start by asking me anything!</span>
                </div>
              </div>
              
              {/* Quick Start Tips */}
              <div className="max-w-2xl w-full">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h4 className="text-sm font-medium text-gray-800 mb-3 text-center">💡 Quick Start Tips</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-gray-600">
                    <div className="flex items-start gap-2">
                      <span className="text-primary-500">•</span>
                      <span>Be specific in your questions for better answers</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-primary-500">•</span>
                      <span>Use filters above to focus on specific data areas</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-primary-500">•</span>
                      <span>Ask follow-up questions to dive deeper</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-primary-500">•</span>
                      <span>Include time ranges like "this week" or "last month"</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div>
              {currentMessages.map(renderMessage)}
              {isLoading && (
                <div className="flex justify-start mb-4">
                  <div className="flex max-w-[80%]">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gray-600 mr-2">
                      <Bot size={16} className="text-white" />
                    </div>
                    <div className="bg-gray-100 rounded-lg p-3 border border-gray-200">
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-500"></div>
                        <span className="text-gray-600">Thinking...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything about your learning management system..."
                className="w-full resize-none border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                rows={1}
                style={{ minHeight: '44px', maxHeight: '120px' }}
              />
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="flex items-center justify-center w-11 h-11 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChat; 