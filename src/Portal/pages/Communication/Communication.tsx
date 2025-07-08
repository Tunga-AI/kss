import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, Users, Bell, Mail, Phone, Plus, Search, Edit, Trash2, Eye, X, Save, Calendar, Filter } from 'lucide-react';
import { FirestoreService } from '../../../services/firestore';
import { useAuthContext } from '../../../contexts/AuthContext';

interface Message {
  id: string;
  from: string;
  fromEmail: string;
  to: string;
  toEmails: string[];
  subject: string;
  content: string;
  timestamp: string;
  status: 'draft' | 'sent' | 'scheduled' | 'failed';
  type: 'message' | 'announcement' | 'notification';
  recipients: number;
  scheduledFor?: string;
  createdBy: string;
  updatedAt?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  tags?: string[];
  readBy?: string[];
}

interface Template {
  id: string;
  name: string;
  subject: string;
  content: string;
  type: 'email' | 'sms' | 'notification';
  createdBy: string;
  createdAt: string;
  usageCount: number;
}

interface MessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (messageData: Partial<Message>) => void;
  message?: Message | null;
  type: 'message' | 'announcement' | 'notification';
}

const MessageModal: React.FC<MessageModalProps> = ({ isOpen, onClose, onSave, message, type }) => {
  const { userProfile } = useAuthContext();
  const [formData, setFormData] = useState<Partial<Message>>({
    from: userProfile?.displayName || '',
    fromEmail: userProfile?.email || '',
    to: '',
    toEmails: [],
    subject: '',
    content: '',
    type,
    priority: 'normal',
    status: 'draft'
  });

  useEffect(() => {
    if (message) {
      setFormData(message);
    } else {
      setFormData({
        from: userProfile?.displayName || '',
        fromEmail: userProfile?.email || '',
        to: '',
        toEmails: [],
        subject: '',
        content: '',
        type,
        priority: 'normal',
        status: 'draft'
      });
    }
  }, [message, userProfile, type]);

  const handleSubmit = async (isDraft: boolean = true) => {
    // Validate required fields
    if (!formData.subject?.trim()) {
      alert('Please enter a subject');
      return;
    }
    
    if (!formData.content?.trim()) {
      alert('Please enter message content');
      return;
    }
    
    if (!formData.to?.trim()) {
      alert('Please enter recipients');
      return;
    }

    const messageData = {
      ...formData,
      status: (isDraft ? 'draft' : 'sent') as 'draft' | 'sent',
      timestamp: new Date().toISOString(),
      createdBy: userProfile?.uid || '',
      recipients: formData.to?.split(',').length || 1, // Count recipients based on comma-separated list
      updatedAt: new Date().toISOString()
    };

    console.log('Submitting message data:', messageData);
    onSave(messageData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-secondary-800">
              {message ? 'Edit' : 'Create'} {type.charAt(0).toUpperCase() + type.slice(1)}
            </h3>
            <button onClick={onClose} className="p-1 text-secondary-400 hover:text-secondary-600">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">From</label>
                <input
                  type="text"
                  value={formData.from || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, from: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Sender name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">Priority</label>
                <select
                  value={formData.priority || 'normal'}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">To (Recipients)</label>
              <input
                type="text"
                value={formData.to || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, to: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="e.g., All Students, Computer Science Students, Staff"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">Subject</label>
              <input
                type="text"
                value={formData.subject || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter subject"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">Message Content</label>
              <textarea
                value={formData.content || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter your message content..."
              />
            </div>

            {type === 'notification' && (
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">Schedule For (Optional)</label>
                <input
                  type="datetime-local"
                  value={formData.scheduledFor || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, scheduledFor: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-end space-x-3 mt-6">
            <button
              onClick={onClose}
              className="bg-gray-100 text-secondary-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={() => handleSubmit(true)}
              className="bg-secondary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-secondary-700 transition-colors duration-200 flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>Save Draft</span>
            </button>
            <button
              onClick={() => handleSubmit(false)}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200 flex items-center space-x-2"
            >
              <Send className="h-4 w-4" />
              <span>Send {type}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Communication: React.FC = () => {
  const { userProfile } = useAuthContext();
  const [activeTab, setActiveTab] = useState('messages');
  const [messages, setMessages] = useState<Message[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [messageModal, setMessageModal] = useState({
    isOpen: false,
    message: null as Message | null,
    type: 'message' as 'message' | 'announcement' | 'notification'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      console.log('Loading communication data...');
      
      const [messagesResult, templatesResult] = await Promise.all([
        FirestoreService.getAll('communications'),
        FirestoreService.getAll('message_templates')
      ]);

      console.log('Messages result:', messagesResult);
      console.log('Templates result:', templatesResult);

      if (messagesResult.success && messagesResult.data) {
        setMessages(messagesResult.data as Message[]);
        console.log(`Loaded ${messagesResult.data.length} messages`);
      } else {
        console.warn('Failed to load messages:', messagesResult.error);
        setMessages([]);
      }

      if (templatesResult.success && templatesResult.data) {
        setTemplates(templatesResult.data as Template[]);
        console.log(`Loaded ${templatesResult.data.length} templates`);
      } else {
        console.warn('Failed to load templates:', templatesResult.error);
        setTemplates([]);
      }
    } catch (error) {
      console.error('Error loading communication data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMessage = async (messageData: Partial<Message>) => {
    try {
      console.log('Attempting to save message:', messageData);
      
      let result;
      if (messageModal.message) {
        console.log('Updating existing message:', messageModal.message.id);
        result = await FirestoreService.update('communications', messageModal.message.id, messageData);
      } else {
        console.log('Creating new message');
        result = await FirestoreService.create('communications', messageData);
      }

      console.log('Save result:', result);

      if (result.success) {
        console.log('Message saved successfully');
        alert(`✅ ${messageModal.message ? 'Message updated' : 'Message created'} successfully!`);
        await loadData(); // Reload data
        setMessageModal({ isOpen: false, message: null, type: 'message' });
      } else {
        console.error('Failed to save message:', result.error);
        alert(`❌ Failed to save message: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error saving message:', error);
      alert(`❌ Error saving message: ${error}`);
    }
  };

  const handleDeleteMessage = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      try {
        const result = await FirestoreService.delete('communications', id);
        if (result.success) {
          await loadData();
        }
      } catch (error) {
        console.error('Error deleting message:', error);
      }
    }
  };

  const openMessageModal = (type: 'message' | 'announcement' | 'notification', message?: Message) => {
    setMessageModal({
      isOpen: true,
      message: message || null,
      type
    });
  };

  const getFilteredMessages = () => {
    let filtered = messages;

    // Filter by active tab
    if (activeTab === 'messages') {
      filtered = filtered.filter(msg => msg.type === 'message');
    } else if (activeTab === 'announcements') {
      filtered = filtered.filter(msg => msg.type === 'announcement');
    } else if (activeTab === 'notifications') {
      filtered = filtered.filter(msg => msg.type === 'notification');
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(msg =>
        msg.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        msg.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        msg.from.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(msg => msg.status === statusFilter);
    }

    return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  const getStats = () => {
    const totalMessages = messages.filter(m => m.type === 'message').length;
    const totalAnnouncements = messages.filter(m => m.type === 'announcement').length;
    const totalNotifications = messages.filter(m => m.type === 'notification').length;
    const thisWeekMessages = messages.filter(m => {
      const msgDate = new Date(m.timestamp);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return msgDate > weekAgo;
    }).length;

    return [
      { title: 'Messages', value: totalMessages.toString(), change: `+${thisWeekMessages}`, icon: MessageSquare, color: 'primary' },
      { title: 'Announcements', value: totalAnnouncements.toString(), change: `+${Math.floor(totalAnnouncements * 0.1)}`, icon: Bell, color: 'accent' },
      { title: 'Notifications', value: totalNotifications.toString(), change: `+${Math.floor(totalNotifications * 0.15)}`, icon: Mail, color: 'secondary' },
    ];
  };

  const tabs = [
    { id: 'messages', label: 'Messages' },
    { id: 'announcements', label: 'Announcements' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'templates', label: 'Templates' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-accent-100 text-accent-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'normal': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const stats = getStats();
  const filteredMessages = getFilteredMessages();

  return (
    <div className="space-y-6">
      {/* Message Modal */}
      <MessageModal
        isOpen={messageModal.isOpen}
        onClose={() => setMessageModal({ isOpen: false, message: null, type: 'message' })}
        onSave={handleSaveMessage}
        message={messageModal.message}
        type={messageModal.type}
      />

      {/* Hero Section */}
      <div className="bg-primary-600 text-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Communication</h1>
            <p className="text-lg text-primary-100">
              Send messages, announcements, and manage institutional communication.
            </p>
          </div>
          <div className="bg-white bg-opacity-20 p-4 rounded-xl">
            <MessageSquare className="h-8 w-8 text-white" />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl border border-white border-opacity-20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-primary-100">{stat.title}</p>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                    <p className="text-sm font-medium text-primary-200">
                      {stat.change} this week
                    </p>
                  </div>
                  <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-2xl shadow-lg">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-8 pt-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === tab.id
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-8">
          {(activeTab === 'messages' || activeTab === 'announcements' || activeTab === 'notifications') && (
            <div>
              {/* Actions Bar */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
                    <input
                      type="text"
                      placeholder={`Search ${activeTab}...`}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-64"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="all">All Status</option>
                    <option value="sent">Sent</option>
                    <option value="draft">Draft</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
                <button 
                  onClick={() => openMessageModal(activeTab as any)}
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200 flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>New {activeTab.slice(0, -1).charAt(0).toUpperCase() + activeTab.slice(0, -1).slice(1)}</span>
                </button>
              </div>

              {/* Messages List */}
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredMessages.map((message) => (
                    <div key={message.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow duration-300">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start space-x-4">
                          <div className="bg-primary-100 p-3 rounded-lg">
                            {message.type === 'announcement' ? (
                              <Bell className="h-6 w-6 text-primary-600" />
                            ) : message.type === 'notification' ? (
                              <Mail className="h-6 w-6 text-primary-600" />
                            ) : (
                              <MessageSquare className="h-6 w-6 text-primary-600" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-lg font-semibold text-secondary-800">{message.subject}</h3>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(message.status)}`}>
                                {message.status.charAt(0).toUpperCase() + message.status.slice(1)}
                              </span>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(message.priority)}`}>
                                {message.priority.charAt(0).toUpperCase() + message.priority.slice(1)}
                              </span>
                            </div>
                            <div className="text-sm text-secondary-600 mb-2">
                              <span className="font-medium">From:</span> {message.from} • 
                              <span className="font-medium"> To:</span> {message.to}
                            </div>
                            <p className="text-secondary-600 line-clamp-2">{message.content}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm text-secondary-500">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-1">
                            <Users className="h-4 w-4" />
                            <span>{message.recipients} recipients</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(message.timestamp).toLocaleDateString()} {new Date(message.timestamp).toLocaleTimeString()}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={() => openMessageModal(message.type, message)}
                            className="text-primary-600 hover:text-primary-700 font-medium flex items-center space-x-1"
                          >
                            <Eye className="h-4 w-4" />
                            <span>View</span>
                          </button>
                          {(message.status === 'draft' || userProfile?.role === 'admin') && (
                            <button 
                              onClick={() => openMessageModal(message.type, message)}
                              className="text-accent-600 hover:text-accent-700 font-medium flex items-center space-x-1"
                            >
                              <Edit className="h-4 w-4" />
                              <span>Edit</span>
                            </button>
                          )}
                          {userProfile?.role === 'admin' && (
                            <button 
                              onClick={() => handleDeleteMessage(message.id)}
                              className="text-red-600 hover:text-red-700 font-medium flex items-center space-x-1"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span>Delete</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {filteredMessages.length === 0 && !loading && (
                    <div className="text-center py-12">
                      {activeTab === 'messages' ? (
                        <MessageSquare className="h-16 w-16 text-secondary-300 mx-auto mb-4" />
                      ) : activeTab === 'announcements' ? (
                        <Bell className="h-16 w-16 text-secondary-300 mx-auto mb-4" />
                      ) : (
                        <Mail className="h-16 w-16 text-secondary-300 mx-auto mb-4" />
                      )}
                      <h3 className="text-xl font-semibold text-secondary-800 mb-2">No {activeTab} found</h3>
                      <p className="text-secondary-600 mb-6">Create your first {activeTab.slice(0, -1)} to get started.</p>
                      <button 
                        onClick={() => openMessageModal(activeTab as any)}
                        className="bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200 flex items-center space-x-2 mx-auto"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Create {activeTab.slice(0, -1).charAt(0).toUpperCase() + activeTab.slice(0, -1).slice(1)}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'templates' && (
            <div className="text-center py-12">
              <MessageSquare className="h-16 w-16 text-secondary-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-secondary-800 mb-2">Message Templates</h3>
              <p className="text-secondary-600 mb-6">Create and manage reusable message templates here.</p>
              <button className="bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200 flex items-center space-x-2 mx-auto">
                <Plus className="h-4 w-4" />
                <span>Create Template</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Communication;