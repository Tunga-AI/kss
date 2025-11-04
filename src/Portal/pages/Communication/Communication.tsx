import React, { useState, useEffect, useCallback } from 'react';
import { 
  MessageSquare, 
  Send, 
  Users, 
  Bell, 
  Mail, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  X, 
  Calendar, 
  Filter,
  UserPlus,
  CheckCircle,
  Circle,
  Clock,
  Star,
  Archive,
  Reply,
  Forward,
  MoreHorizontal,
  Paperclip,
  Smile,
  AlertCircle,
  Info,
  CheckSquare,
  UserCircle,
  Phone,
  Video,
  Settings
} from 'lucide-react';
import { FirestoreService } from '../../../services/firestore';
import { useAuthContext } from '../../../contexts/AuthContext';

interface User {
  id: string;
  displayName: string;
  email: string;
  role: string;
  photoURL?: string;
  isOnline?: boolean;
  lastSeen?: string;
}

interface Message {
  id: string;
  fromId: string;
  fromName: string;
  fromEmail: string;
  toIds: string[];
  toNames: string[];
  subject: string;
  content: string;
  timestamp: string;
  status: 'draft' | 'sent' | 'delivered' | 'read' | 'failed';
  type: 'direct' | 'announcement' | 'notification' | 'broadcast';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  attachments?: string[];
  readBy?: { userId: string; readAt: string }[];
  replyTo?: string;
  isStarred?: boolean;
  isArchived?: boolean;
  tags?: string[];
  scheduledFor?: string;
  conversationId?: string;
}

interface Conversation {
  id: string;
  participants: string[];
  participantNames: string[];
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isGroup: boolean;
  groupName?: string;
  createdBy: string;
  createdAt: string;
}

interface NotificationSettings {
  email: boolean;
  push: boolean;
  sms: boolean;
  inApp: boolean;
  messageTypes: {
    direct: boolean;
    announcement: boolean;
    notification: boolean;
    broadcast: boolean;
  };
}

const Communication: React.FC = () => {
  const { userProfile } = useAuthContext();
  const [activeTab, setActiveTab] = useState('conversations');
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isComposing, setIsComposing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  const [composeForm, setComposeForm] = useState({
    recipients: [] as User[],
    subject: '',
    content: '',
    type: 'direct' as 'direct' | 'announcement' | 'notification' | 'broadcast',
    priority: 'normal' as 'low' | 'normal' | 'high' | 'urgent',
    scheduledFor: '',
    replyTo: ''
  });

  const [recipientSearch, setRecipientSearch] = useState('');
  const [showRecipientDropdown, setShowRecipientDropdown] = useState(false);

  const tabs = [
    { id: 'conversations', label: 'Conversations', icon: MessageSquare },
    { id: 'sent', label: 'Sent', icon: Send },
    { id: 'starred', label: 'Starred', icon: Star },
    { id: 'archived', label: 'Archived', icon: Archive },
    { id: 'inbox', label: 'Inbox', icon: Mail },
    { id: 'announcements', label: 'Announcements', icon: Bell },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  useEffect(() => {
    loadData();
    // Set up real-time listeners
    const interval = setInterval(loadData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadMessages(),
        loadConversations(),
        loadUsers()
      ]);
    } catch (error) {
      console.error('Error loading communication data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMessages = async () => {
    try {
      const result = await FirestoreService.getAll('messages');
      if (result.success && result.data) {
        setMessages(result.data as Message[]);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const loadConversations = async () => {
    try {
      const result = await FirestoreService.getAll('conversations');
      if (result.success && result.data) {
        setConversations(result.data as Conversation[]);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const result = await FirestoreService.getAll('users');
      if (result.success && result.data) {
        const usersData = result.data as User[];
        // Simulate online status
        const usersWithStatus = usersData.map(user => ({
          ...user,
          isOnline: Math.random() > 0.7,
          lastSeen: new Date(Date.now() - Math.random() * 3600000).toISOString()
        }));
        setUsers(usersWithStatus);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const sendMessage = async () => {
    if (!composeForm.subject || !composeForm.content || composeForm.recipients.length === 0) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSending(true);
    try {
      const messageData = {
        fromId: userProfile?.uid || '',
        fromName: userProfile?.displayName || '',
        fromEmail: userProfile?.email || '',
        toIds: composeForm.recipients.map(r => r.id),
        toNames: composeForm.recipients.map(r => r.displayName),
        subject: composeForm.subject,
        content: composeForm.content,
        timestamp: new Date().toISOString(),
        status: 'sent',
        type: composeForm.type,
        priority: composeForm.priority,
        replyTo: composeForm.replyTo,
        isStarred: false,
        isArchived: false,
        readBy: []
      };

      const result = await FirestoreService.create('messages', messageData);
      if (result.success) {
        await loadMessages();
        resetCompose();
        setIsComposing(false);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error sending message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const resetCompose = () => {
    setComposeForm({
      recipients: [],
      subject: '',
      content: '',
      type: 'direct',
      priority: 'normal',
      scheduledFor: '',
      replyTo: ''
    });
    setRecipientSearch('');
    setShowRecipientDropdown(false);
  };

  const addRecipient = (user: User) => {
    if (!composeForm.recipients.find(r => r.id === user.id)) {
      setComposeForm(prev => ({
        ...prev,
        recipients: [...prev.recipients, user]
      }));
    }
    setRecipientSearch('');
    setShowRecipientDropdown(false);
  };

  const removeRecipient = (userId: string) => {
    setComposeForm(prev => ({
      ...prev,
      recipients: prev.recipients.filter(r => r.id !== userId)
    }));
  };

  const markAsRead = async (messageId: string) => {
    try {
      const message = messages.find(m => m.id === messageId);
      if (message) {
        const updatedReadBy = message.readBy || [];
        if (!updatedReadBy.find(r => r.userId === userProfile?.uid)) {
          updatedReadBy.push({
            userId: userProfile?.uid || '',
            readAt: new Date().toISOString()
          });
          
          await FirestoreService.update('messages', messageId, {
            readBy: updatedReadBy
          });
          
          await loadMessages();
        }
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const toggleStar = async (messageId: string) => {
    try {
      const message = messages.find(m => m.id === messageId);
      if (message) {
        await FirestoreService.update('messages', messageId, {
          isStarred: !message.isStarred
        });
        await loadMessages();
      }
    } catch (error) {
      console.error('Error toggling star:', error);
    }
  };

  const archiveMessage = async (messageId: string) => {
    try {
      await FirestoreService.update('messages', messageId, {
        isArchived: true
      });
      await loadMessages();
    } catch (error) {
      console.error('Error archiving message:', error);
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      try {
        await FirestoreService.delete('messages', messageId);
        await loadMessages();
      } catch (error) {
        console.error('Error deleting message:', error);
      }
    }
  };

  const replyToMessage = (message: Message) => {
    setComposeForm({
      recipients: [{ id: message.fromId, displayName: message.fromName, email: message.fromEmail, role: '' }],
      subject: message.subject.startsWith('Re:') ? message.subject : `Re: ${message.subject}`,
      content: `\n\n--- Reply to message from ${message.fromName} ---\n${message.content}`,
      type: 'direct',
      priority: 'normal',
      scheduledFor: '',
      replyTo: message.id
    });
    setIsComposing(true);
  };

  const getFilteredMessages = () => {
    let filtered = messages;

    switch (activeTab) {
      case 'inbox':
        filtered = messages.filter(m => 
          m.toIds.includes(userProfile?.uid || '') && 
          !m.isArchived
        );
        break;
      case 'sent':
        filtered = messages.filter(m => m.fromId === userProfile?.uid);
        break;
      case 'starred':
        filtered = messages.filter(m => m.isStarred);
        break;
      case 'archived':
        filtered = messages.filter(m => m.isArchived);
        break;
      case 'announcements':
        filtered = messages.filter(m => m.type === 'announcement');
        break;
      default:
        filtered = messages;
    }

    if (searchTerm) {
      filtered = filtered.filter(m =>
        (m.subject?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (m.content?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (m.fromName?.toLowerCase() || '').includes(searchTerm.toLowerCase())
      );
    }

    return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  const getMessageStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'text-green-600';
      case 'delivered': return 'text-blue-600';
      case 'read': return 'text-gray-600';
      case 'failed': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-xs bg-red-100 text-red-800';
      case 'high': return 'text-xs bg-orange-100 text-orange-800';
      case 'low': return 'text-xs bg-gray-100 text-gray-800';
      default: return 'text-xs bg-blue-100 text-blue-800';
    }
  };

  const getFilteredUsers = () => {
    return users.filter(u => 
      u.id !== userProfile?.uid &&
      ((u.displayName?.toLowerCase() || '').includes(recipientSearch.toLowerCase()) ||
       (u.email?.toLowerCase() || '').includes(recipientSearch.toLowerCase()))
    );
  };

  const isMessageRead = (message: Message) => {
    return message.readBy?.some(r => r.userId === userProfile?.uid) || false;
  };

  const getUnreadCount = () => {
    return messages.filter(m => 
      m.toIds.includes(userProfile?.uid || '') && 
      !isMessageRead(m) && 
      !m.isArchived
    ).length;
  };

  const getTabStats = () => {
    const inbox = messages.filter(m => m.toIds.includes(userProfile?.uid || '') && !m.isArchived).length;
    const sent = messages.filter(m => m.fromId === userProfile?.uid).length;
    const starred = messages.filter(m => m.isStarred).length;
    const archived = messages.filter(m => m.isArchived).length;
    const unread = getUnreadCount();
    const announcements = messages.filter(m => m.type === 'announcement').length;
    
    return { inbox, sent, starred, archived, unread, announcements };
  };

  const filteredMessages = getFilteredMessages();
  const filteredUsers = getFilteredUsers();
  const stats = getTabStats();

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Communication</h1>
            <p className="text-lg text-primary-100">
              Connect with users, send messages, and manage communications effectively.
            </p>
          </div>
          <div className="bg-white bg-opacity-20 p-4 rounded-xl">
            <MessageSquare className="h-8 w-8 text-white" />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl border border-white border-opacity-20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-100">Inbox</p>
                <p className="text-2xl font-bold text-white">{stats.inbox}</p>
                <p className="text-sm font-medium text-primary-200">
                  {stats.unread} unread
                </p>
              </div>
              <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                <Mail className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl border border-white border-opacity-20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-100">Sent</p>
                <p className="text-2xl font-bold text-white">{stats.sent}</p>
                <p className="text-sm font-medium text-primary-200">
                  Messages sent
                </p>
              </div>
              <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                <Send className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl border border-white border-opacity-20">
                <div className="flex items-center justify-between">
                  <div>
                <p className="text-sm font-medium text-primary-100">Starred</p>
                <p className="text-2xl font-bold text-white">{stats.starred}</p>
                    <p className="text-sm font-medium text-primary-200">
                  Important messages
                    </p>
                  </div>
                  <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                <Star className="h-6 w-6 text-white" />
              </div>
                  </div>
                </div>

          <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl border border-white border-opacity-20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-100">Announcements</p>
                <p className="text-2xl font-bold text-white">{stats.announcements}</p>
                <p className="text-sm font-medium text-primary-200">
                  System updates
                </p>
              </div>
              <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                <Bell className="h-6 w-6 text-white" />
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
          {/* Action Bar */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
                    <input
                      type="text"
                  placeholder="Search messages..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-64"
                    />
                  </div>
                </div>
                <button 
              onClick={() => setIsComposing(true)}
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200 flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
              <span>New Message</span>
                </button>
              </div>

              {/* Messages List */}
          {activeTab !== 'settings' && (
            <div className="space-y-4">
              {filteredMessages.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="h-16 w-16 text-secondary-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-secondary-800 mb-2">No messages found</h3>
                  <p className="text-secondary-600">
                    {searchTerm ? 'No messages match your search criteria.' : 'Start by sending your first message.'}
                  </p>
                </div>
              ) : (
                filteredMessages.map((message) => {
                  const isRead = isMessageRead(message);
                  return (
                    <div
                      key={message.id}
                      className={`border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                        !isRead ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                      onClick={() => {
                        setSelectedMessage(message);
                        if (!isRead) {
                          markAsRead(message.id);
                        }
                      }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                            <UserCircle className="h-6 w-6 text-primary-600" />
                          </div>
                          <div>
                            <p className={`font-medium ${!isRead ? 'text-primary-800' : 'text-secondary-800'}`}>
                              {activeTab === 'sent' ? message.toNames.join(', ') : message.fromName}
                            </p>
                            <p className="text-sm text-secondary-500">{message.fromEmail}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleStar(message.id);
                            }}
                            className="p-1 text-secondary-400 hover:text-yellow-600 transition-colors"
                          >
                            <Star className={`h-4 w-4 ${message.isStarred ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              archiveMessage(message.id);
                            }}
                            className="p-1 text-secondary-400 hover:text-primary-600 transition-colors"
                          >
                            <Archive className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteMessage(message.id);
                            }}
                            className="p-1 text-secondary-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className={`text-lg ${!isRead ? 'font-semibold' : 'font-medium'} text-secondary-800`}>
                            {message.subject}
                          </h3>
                          <div className="flex items-center space-x-2 text-sm text-secondary-500">
                            {message.type === 'announcement' && (
                              <Bell className="h-4 w-4" />
                            )}
                            <span className={`px-2 py-0.5 rounded-full ${getPriorityColor(message.priority)}`}>
                              {message.priority}
                            </span>
                            <span>{new Date(message.timestamp).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <p className="text-secondary-600 text-sm line-clamp-2">
                          {message.content}
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-xs text-secondary-500">
                          <span className="capitalize">{message.type}</span>
                          {message.toIds.length > 1 && (
                            <>
                              <span>•</span>
                              <span>{message.toIds.length} recipients</span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`text-xs ${getMessageStatusColor(message.status)}`}>
                            {message.status}
                          </span>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              replyToMessage(message);
                            }}
                            className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                          >
                            Reply
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold text-secondary-800 mb-4">Notification Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-secondary-800">Email Notifications</p>
                        <p className="text-sm text-secondary-600">Receive notifications via email</p>
                      </div>
                      <button className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm">
                        Enabled
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-secondary-800">Push Notifications</p>
                        <p className="text-sm text-secondary-600">Receive browser notifications</p>
                      </div>
                      <button className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm">
                        Disabled
                      </button>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-secondary-800">Direct Messages</p>
                        <p className="text-sm text-secondary-600">Personal messages from users</p>
                      </div>
                      <button className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm">
                        Enabled
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-secondary-800">Announcements</p>
                        <p className="text-sm text-secondary-600">System announcements and updates</p>
                      </div>
                      <button className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm">
                        Enabled
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-secondary-800 mb-4">Online Users</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {users.filter(u => u.isOnline && u.id !== userProfile?.uid).map((user) => (
                    <div key={user.id} className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                      <div className="relative">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <UserCircle className="h-6 w-6 text-primary-600" />
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-secondary-800 truncate">{user.displayName}</p>
                        <p className="text-sm text-secondary-600 truncate">{user.role}</p>
                      </div>
                      <button 
                        onClick={() => {
                          addRecipient(user);
                          setIsComposing(true);
                        }}
                        className="p-2 text-primary-600 hover:bg-primary-100 rounded-lg transition-colors"
                      >
                        <MessageSquare className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Compose Modal */}
      {isComposing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-secondary-800">New Message</h3>
              <button
                onClick={() => {
                  setIsComposing(false);
                  resetCompose();
                }}
                className="text-secondary-400 hover:text-secondary-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">Recipients</label>
                <div className="border border-gray-300 rounded-lg p-3">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {composeForm.recipients.map((recipient) => (
                      <span key={recipient.id} className="bg-primary-100 text-primary-800 px-2 py-1 rounded-full text-sm flex items-center space-x-1">
                        <span>{recipient.displayName}</span>
                        <button
                          type="button"
                          onClick={() => removeRecipient(recipient.id)}
                          className="text-primary-600 hover:text-primary-800"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={recipientSearch}
                      onChange={(e) => {
                        setRecipientSearch(e.target.value);
                        setShowRecipientDropdown(true);
                      }}
                      onFocus={() => setShowRecipientDropdown(true)}
                      className="w-full px-3 py-2 border-none focus:ring-0 focus:outline-none"
                    />
                    {showRecipientDropdown && recipientSearch && (
                      <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg mt-1 max-h-48 overflow-y-auto z-10">
                        {filteredUsers.slice(0, 10).map((user) => (
                          <button
                            key={user.id}
                            type="button"
                            onClick={() => addRecipient(user)}
                            className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-gray-100 text-left"
                          >
                            <UserCircle className="h-5 w-5 text-primary-600" />
                            <div>
                              <p className="font-medium text-secondary-800">{user.displayName}</p>
                              <p className="text-sm text-secondary-600">{user.email}</p>
                            </div>
                          </button>
                        ))}
            </div>
          )}
        </div>
      </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">Type</label>
                  <select
                    value={composeForm.type}
                    onChange={(e) => setComposeForm(prev => ({ ...prev, type: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="direct">Direct Message</option>
                    <option value="announcement">Announcement</option>
                    <option value="notification">Notification</option>
                    <option value="broadcast">Broadcast</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">Priority</label>
                  <select
                    value={composeForm.priority}
                    onChange={(e) => setComposeForm(prev => ({ ...prev, priority: e.target.value as any }))}
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
                <label className="block text-sm font-medium text-secondary-700 mb-2">Subject</label>
                <input
                  type="text"
                  value={composeForm.subject}
                  onChange={(e) => setComposeForm(prev => ({ ...prev, subject: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter subject..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">Message</label>
                <textarea
                  value={composeForm.content}
                  onChange={(e) => setComposeForm(prev => ({ ...prev, content: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  rows={6}
                  placeholder="Enter your message..."
                  required
                />
              </div>

              <div className="flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsComposing(false);
                    resetCompose();
                  }}
                  className="px-4 py-2 text-secondary-600 hover:text-secondary-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSending}
                  className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  {isSending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Send Message</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Message Detail Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-secondary-800">Message Details</h3>
              <button
                onClick={() => setSelectedMessage(null)}
                className="text-secondary-400 hover:text-secondary-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="border-b border-gray-200 pb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <UserCircle className="h-6 w-6 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-medium text-secondary-800">{selectedMessage.fromName}</p>
                      <p className="text-sm text-secondary-600">{selectedMessage.fromEmail}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full ${getPriorityColor(selectedMessage.priority)}`}>
                      {selectedMessage.priority}
                    </span>
                    <span className="text-sm text-secondary-600">
                      {new Date(selectedMessage.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
                <h2 className="text-xl font-semibold text-secondary-800 mb-2">{selectedMessage.subject}</h2>
                <div className="flex items-center space-x-4 text-sm text-secondary-600">
                  <span>To: {selectedMessage.toNames.join(', ')}</span>
                  <span>Type: {selectedMessage.type}</span>
                  <span>Status: {selectedMessage.status}</span>
                </div>
              </div>

              <div className="prose max-w-none">
                <div className="whitespace-pre-wrap text-secondary-700">
                  {selectedMessage.content}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => replyToMessage(selectedMessage)}
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2"
                >
                  <Reply className="h-4 w-4" />
                  <span>Reply</span>
                </button>
                <button
                  onClick={() => toggleStar(selectedMessage.id)}
                  className="bg-gray-100 text-secondary-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
                >
                  <Star className={`h-4 w-4 ${selectedMessage.isStarred ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                  <span>{selectedMessage.isStarred ? 'Unstar' : 'Star'}</span>
                </button>
                <button
                  onClick={() => archiveMessage(selectedMessage.id)}
                  className="bg-gray-100 text-secondary-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
                >
                  <Archive className="h-4 w-4" />
                  <span>Archive</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Communication;