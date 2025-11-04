import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, MessageSquare, Send, Users, TrendingUp, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import WhatsAppService, { WhatsAppMessage, WhatsAppTemplate } from '../../../services/whatsappService';
import { FirestoreService } from '../../../services/firestore';

interface WhatsAppStats {
  totalMessages: number;
  sentToday: number;
  templatesApproved: number;
  activeConversations: number;
  deliveryRate: number;
  readRate: number;
}

const WhatsApp: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<WhatsAppStats>({
    totalMessages: 0,
    sentToday: 0,
    templatesApproved: 0,
    activeConversations: 0,
    deliveryRate: 0,
    readRate: 0
  });
  const [recentMessages, setRecentMessages] = useState<WhatsAppMessage[]>([]);
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadStats(),
        loadRecentMessages(),
        loadTemplates()
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // Get messages from the last 30 days
      const messagesResult = await FirestoreService.getAll('whatsapp_messages');
      const messages = messagesResult.data as WhatsAppMessage[] || [];
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const sentToday = messages.filter(m => {
        const sentDate = new Date(m.sentAt);
        sentDate.setHours(0, 0, 0, 0);
        return sentDate.getTime() === today.getTime() && m.direction === 'outbound';
      }).length;

      const deliveredMessages = messages.filter(m => m.status === 'delivered' || m.status === 'read').length;
      const readMessages = messages.filter(m => m.status === 'read').length;
      const outboundMessages = messages.filter(m => m.direction === 'outbound').length;

      const deliveryRate = outboundMessages > 0 ? Math.round((deliveredMessages / outboundMessages) * 100) : 0;
      const readRate = deliveredMessages > 0 ? Math.round((readMessages / deliveredMessages) * 100) : 0;

      // Get unique conversations (by phone number)
      const uniquePhones = new Set(messages.map(m => m.recipientPhone));
      
      setStats({
        totalMessages: messages.length,
        sentToday,
        templatesApproved: templates.filter(t => t.status === 'APPROVED').length,
        activeConversations: uniquePhones.size,
        deliveryRate,
        readRate
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadRecentMessages = async () => {
    try {
      const result = await FirestoreService.getAll('whatsapp_messages');
      if (result.success && result.data) {
        const messages = result.data as WhatsAppMessage[];
        const sortedMessages = messages
          .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime())
          .slice(0, 10);
        setRecentMessages(sortedMessages);
      }
    } catch (error) {
      console.error('Error loading recent messages:', error);
    }
  };

  const loadTemplates = async () => {
    try {
      const templateList = await WhatsAppService.getTemplates();
      setTemplates(templateList);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const getMessageStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <Clock className="h-3 w-3 text-yellow-500" />;
      case 'delivered':
        return <CheckCircle className="h-3 w-3 text-green-500" />;
      case 'read':
        return <CheckCircle className="h-3 w-3 text-blue-500" />;
      case 'failed':
        return <AlertTriangle className="h-3 w-3 text-red-500" />;
      default:
        return <Clock className="h-3 w-3 text-gray-400" />;
    }
  };

  const formatMessageTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) {
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else {
      return `${days}d ago`;
    }
  };

  const getMessagePreview = (message: WhatsAppMessage) => {
    if (message.messageType === 'template' && message.templateName) {
      return `📋 Template: ${message.templateName}`;
    }
    return message.content?.substring(0, 50) + (message.content && message.content.length > 50 ? '...' : '') || 'Media message';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-green-600 text-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">WhatsApp Business</h1>
            <p className="text-lg text-green-100">
              Manage your WhatsApp Business communications and templates.
            </p>
          </div>
          <div className="bg-white bg-opacity-20 p-4 rounded-xl">
            <MessageCircle className="h-8 w-8 text-white" />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-4 mt-8">
          <div className="bg-white bg-opacity-10 backdrop-blur-sm p-4 rounded-xl border border-white border-opacity-20">
            <div className="flex items-center space-x-3">
              <MessageSquare className="h-6 w-6 text-white opacity-75" />
              <div>
                <p className="text-sm font-medium text-green-100">Total Messages</p>
                <p className="text-xl font-bold text-white">{stats.totalMessages}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white bg-opacity-10 backdrop-blur-sm p-4 rounded-xl border border-white border-opacity-20">
            <div className="flex items-center space-x-3">
              <Send className="h-6 w-6 text-white opacity-75" />
              <div>
                <p className="text-sm font-medium text-green-100">Sent Today</p>
                <p className="text-xl font-bold text-white">{stats.sentToday}</p>
              </div>
            </div>
          </div>

          <div className="bg-white bg-opacity-10 backdrop-blur-sm p-4 rounded-xl border border-white border-opacity-20">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-6 w-6 text-white opacity-75" />
              <div>
                <p className="text-sm font-medium text-green-100">Templates</p>
                <p className="text-xl font-bold text-white">{stats.templatesApproved}</p>
              </div>
            </div>
          </div>

          <div className="bg-white bg-opacity-10 backdrop-blur-sm p-4 rounded-xl border border-white border-opacity-20">
            <div className="flex items-center space-x-3">
              <Users className="h-6 w-6 text-white opacity-75" />
              <div>
                <p className="text-sm font-medium text-green-100">Conversations</p>
                <p className="text-xl font-bold text-white">{stats.activeConversations}</p>
              </div>
            </div>
          </div>

          <div className="bg-white bg-opacity-10 backdrop-blur-sm p-4 rounded-xl border border-white border-opacity-20">
            <div className="flex items-center space-x-3">
              <TrendingUp className="h-6 w-6 text-white opacity-75" />
              <div>
                <p className="text-sm font-medium text-green-100">Delivery Rate</p>
                <p className="text-xl font-bold text-white">{stats.deliveryRate}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white bg-opacity-10 backdrop-blur-sm p-4 rounded-xl border border-white border-opacity-20">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-6 w-6 text-white opacity-75" />
              <div>
                <p className="text-sm font-medium text-green-100">Read Rate</p>
                <p className="text-xl font-bold text-white">{stats.readRate}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center space-x-4 mb-4">
            <div className="bg-green-100 p-3 rounded-xl">
              <MessageSquare className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Message Templates</h3>
              <p className="text-sm text-gray-600">Create and manage message templates</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/portal/whatsapp/templates')}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors duration-200"
          >
            Manage Templates
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center space-x-4 mb-4">
            <div className="bg-blue-100 p-3 rounded-xl">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Customer Messages</h3>
              <p className="text-sm text-gray-600">View customer conversations</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/portal/customers')}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            View Customers
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center space-x-4 mb-4">
            <div className="bg-purple-100 p-3 rounded-xl">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Analytics</h3>
              <p className="text-sm text-gray-600">Message performance insights</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/portal/whatsapp/analytics')}
            className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors duration-200"
          >
            View Analytics
          </button>
        </div>
      </div>

      {/* Recent Messages and Templates */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Messages */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Recent Messages</h2>
            <button
              onClick={() => navigate('/portal/customers')}
              className="text-green-600 hover:text-green-700 text-sm font-medium"
            >
              View All
            </button>
          </div>
          
          <div className="space-y-4">
            {recentMessages.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No messages yet</p>
                <p className="text-sm text-gray-400">Messages will appear here when you start communicating</p>
              </div>
            ) : (
              recentMessages.map((message) => (
                <div key={message.id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors duration-200">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                    message.direction === 'outbound' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {message.direction === 'outbound' ? '→' : '←'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {message.recipientPhone}
                      </p>
                      <div className="flex items-center space-x-1">
                        {getMessageStatusIcon(message.status)}
                        <span className="text-xs text-gray-500">
                          {formatMessageTime(new Date(message.sentAt))}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 truncate">
                      {getMessagePreview(message)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Templates Overview */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Message Templates</h2>
            <button
              onClick={() => navigate('/portal/whatsapp/templates')}
              className="text-green-600 hover:text-green-700 text-sm font-medium"
            >
              Manage All
            </button>
          </div>
          
          <div className="space-y-4">
            {templates.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No templates yet</p>
                <button
                  onClick={() => navigate('/portal/whatsapp/templates')}
                  className="mt-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200"
                >
                  Create First Template
                </button>
              </div>
            ) : (
              templates.slice(0, 5).map((template) => (
                <div key={template.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors duration-200">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      template.status === 'APPROVED' 
                        ? 'bg-green-100 text-green-600' 
                        : template.status === 'PENDING'
                        ? 'bg-yellow-100 text-yellow-600'
                        : 'bg-red-100 text-red-600'
                    }`}>
                      {template.status === 'APPROVED' && <CheckCircle className="h-4 w-4" />}
                      {template.status === 'PENDING' && <Clock className="h-4 w-4" />}
                      {template.status === 'REJECTED' && <AlertTriangle className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{template.name}</p>
                      <p className="text-xs text-gray-500">{template.category}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    template.status === 'APPROVED' 
                      ? 'bg-green-100 text-green-800' 
                      : template.status === 'PENDING'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {template.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsApp; 