import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageCircle, Phone, CheckCircle, Clock, AlertCircle, Image, FileText } from 'lucide-react';
import WhatsAppService, { WhatsAppMessage, WhatsAppTemplate } from '../../../services/whatsappService';
import { useAuthContext } from '../../../contexts/AuthContext';

interface WhatsAppChatProps {
  customerId?: string;
  customerPhone: string;
  customerName: string;
  isOpen: boolean;
  onClose: () => void;
}

const WhatsAppChat: React.FC<WhatsAppChatProps> = ({
  customerId,
  customerPhone,
  customerName,
  isOpen,
  onClose
}) => {
  const { userProfile } = useAuthContext();
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [templateParameters, setTemplateParameters] = useState<string[]>([]);
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [activeTab, setActiveTab] = useState<'template' | 'text'>('template');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadMessages();
      loadTemplates();
    }
  }, [isOpen, customerId, customerPhone]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    setLoading(true);
    try {
      let messageHistory: WhatsAppMessage[];
      
      if (customerId) {
        messageHistory = await WhatsAppService.getCustomerMessages(customerId);
      } else {
        messageHistory = await WhatsAppService.getPhoneMessages(customerPhone);
      }
      
      setMessages(messageHistory.reverse()); // Reverse to show chronological order
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const templateList = await WhatsAppService.getTemplates();
      const approvedTemplates = templateList.filter(t => t.status === 'APPROVED');
      setTemplates(approvedTemplates);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const handleSendTemplate = async () => {
    if (!selectedTemplate || sending) return;

    setSending(true);
    try {
      const template = templates.find(t => t.name === selectedTemplate);
      if (!template) {
        alert('Template not found');
        return;
      }

      const result = await WhatsAppService.sendTemplateMessage(
        customerPhone,
        selectedTemplate,
        template.language,
        templateParameters,
        customerId,
        {
          sentBy: userProfile?.uid,
          sentByName: userProfile?.displayName
        }
      );

      if (result.success) {
        setSelectedTemplate('');
        setTemplateParameters([]);
        loadMessages(); // Refresh messages
        alert('Template message sent successfully!');
      } else {
        alert(`Failed to send message: ${result.error}`);
      }
    } catch (error) {
      console.error('Error sending template:', error);
      alert('Failed to send template message');
    } finally {
      setSending(false);
    }
  };

  const handleSendText = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const result = await WhatsAppService.sendTextMessage(
        customerPhone,
        newMessage.trim(),
        customerId
      );

      if (result.success) {
        setNewMessage('');
        loadMessages(); // Refresh messages
      } else {
        alert(`Failed to send message: ${result.error}`);
      }
    } catch (error) {
      console.error('Error sending text message:', error);
      alert('Failed to send text message');
    } finally {
      setSending(false);
    }
  };

  const getSelectedTemplate = () => {
    return templates.find(t => t.name === selectedTemplate);
  };

  const getTemplateBodyComponent = () => {
    const template = getSelectedTemplate();
    return template?.components.find(c => c.type === 'BODY');
  };

  const getMessageStatusIcon = (message: WhatsAppMessage) => {
    if (message.direction === 'inbound') return null;
    
    switch (message.status) {
      case 'sent':
        return <Clock className="h-3 w-3 text-gray-400" />;
      case 'delivered':
        return <CheckCircle className="h-3 w-3 text-gray-400" />;
      case 'read':
        return <CheckCircle className="h-3 w-3 text-blue-500" />;
      case 'failed':
        return <AlertCircle className="h-3 w-3 text-red-500" />;
      default:
        return <Clock className="h-3 w-3 text-gray-400" />;
    }
  };

  const formatMessageTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getMessageContent = (message: WhatsAppMessage) => {
    if (message.messageType === 'template' && message.templateName) {
      return `📋 Template: ${message.templateName}`;
    }
    return message.content || 'Message content unavailable';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-green-500 p-2 rounded-lg">
              <MessageCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">WhatsApp Chat</h2>
              <p className="text-sm text-gray-600 flex items-center space-x-1">
                <Phone className="h-3 w-3" />
                <span>{customerName} - {customerPhone}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100"
          >
            ✕
          </button>
        </div>

        {/* Message History */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No messages yet. Start a conversation with a template message.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.direction === 'outbound'
                        ? 'bg-green-500 text-white'
                        : 'bg-white text-gray-900 border border-gray-200'
                    }`}
                  >
                    <div className="flex items-start space-x-2">
                      {message.messageType === 'image' && <Image className="h-4 w-4 mt-1" />}
                      {message.messageType === 'document' && <FileText className="h-4 w-4 mt-1" />}
                      <div className="flex-1">
                        <p className="text-sm">{getMessageContent(message)}</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className={`text-xs ${
                            message.direction === 'outbound' ? 'text-green-100' : 'text-gray-500'
                          }`}>
                            {formatMessageTime(message.sentAt)}
                          </span>
                          {getMessageStatusIcon(message)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Message Input */}
        <div className="p-6 border-t border-gray-200 bg-white">
          {/* Tab Selector */}
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 mb-4">
            <button
              onClick={() => setActiveTab('template')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'template'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              📋 Template Message
            </button>
            <button
              onClick={() => setActiveTab('text')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'text'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              💬 Free Text
            </button>
          </div>

          {activeTab === 'template' ? (
            <div className="space-y-4">
              {/* Template Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Template
                </label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => {
                    setSelectedTemplate(e.target.value);
                    setTemplateParameters([]);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Choose a template...</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.name}>
                      {template.name} ({template.category})
                    </option>
                  ))}
                </select>
              </div>

              {/* Template Preview */}
              {selectedTemplate && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Preview:</h4>
                  <div className="bg-white p-3 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-900">
                      {getTemplateBodyComponent()?.text || 'Template content will appear here'}
                    </p>
                  </div>
                </div>
              )}

              {/* Template Parameters */}
              {selectedTemplate && getTemplateBodyComponent()?.example?.body_text?.[0] && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Template Parameters
                  </label>
                  {getTemplateBodyComponent()?.example?.body_text?.[0].map((param, index) => (
                    <input
                      key={index}
                      type="text"
                      placeholder={`Parameter ${index + 1}: ${param}`}
                      value={templateParameters[index] || ''}
                      onChange={(e) => {
                        const newParams = [...templateParameters];
                        newParams[index] = e.target.value;
                        setTemplateParameters(newParams);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 mb-2"
                    />
                  ))}
                </div>
              )}

              <button
                onClick={handleSendTemplate}
                disabled={!selectedTemplate || sending}
                className="w-full bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {sending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Send Template</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-800">
                  ℹ️ Free text messages can only be sent within 24 hours of the customer's last message.
                </p>
              </div>
              
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendText()}
                  placeholder="Type your message..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
                <button
                  onClick={handleSendText}
                  disabled={!newMessage.trim() || sending}
                  className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {sending ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WhatsAppChat; 