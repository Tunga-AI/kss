import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, Building2, Mail, Phone, MessageSquare, Calendar, 
  Plus, Edit, Save, X, Clock, Target, FileText, Trash2, User
} from 'lucide-react';
import { FirestoreService } from '../../../services/firestore';
import { useAuthContext } from '../../../contexts/AuthContext';
import WhatsAppButton from '../../../components/WhatsAppButton';

interface B2bLead {
  id: string;
  leadNumber: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  position: string;
  companySize: string;
  industry: string;
  trainingNeeds: string;
  budget: string;
  timeline: string;
  source: string;
  status: string;
  priority: string;
  notes: string;
  submittedDate: string;
  lastContactDate?: string;
  assignedTo?: string;
  assignedToName?: string;
}

const B2bCustomerPage: React.FC = () => {
  const navigate = useNavigate();
  const { leadId } = useParams<{ leadId: string }>();
  const { userProfile } = useAuthContext();
  const [lead, setLead] = useState<B2bLead | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<B2bLead>>({});

  useEffect(() => {
    if (leadId) {
      loadLead();
    } else {
      setLoading(false);
      setIsEditing(true);
      setEditData({
        companyName: '',
        contactPerson: '',
        email: '',
        phone: '',
        position: '',
        companySize: '',
        industry: '',
        trainingNeeds: '',
        budget: '',
        timeline: '',
        source: 'business_page',
        status: 'new',
        priority: 'medium',
        notes: ''
      });
    }
  }, [leadId]);

  const loadLead = async () => {
    try {
      const result = await FirestoreService.getById('b2bleads', leadId!);
      if (result.success && result.data) {
        const leadData = result.data as B2bLead;
        setLead(leadData);
        setEditData(leadData);
      }
    } catch (error) {
      console.error('Error loading B2B lead:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveLead = async () => {
    try {
      if (leadId) {
        const result = await FirestoreService.update('b2bleads', leadId, editData);
        if (result.success) {
          setLead({ ...lead!, ...editData });
          setIsEditing(false);
        }
      } else {
        const generateB2bLeadNumber = async () => {
          try {
            const result = await FirestoreService.getAll('b2bleads');
            let maxId = 0;
            
            if (result.success && result.data) {
              const leads = result.data as B2bLead[];
              leads.forEach(lead => {
                if (lead.leadNumber && lead.leadNumber.startsWith('B2B')) {
                  const numStr = lead.leadNumber.substring(3);
                  const num = parseInt(numStr);
                  if (!isNaN(num) && num > maxId) {
                    maxId = num;
                  }
                }
              });
            }
            
            const nextId = maxId + 1;
            return `B2B${nextId.toString().padStart(4, '0')}`;
          } catch (error) {
            console.error('Error generating B2B lead number:', error);
            return 'B2B0001';
          }
        };

        const leadData: Partial<B2bLead> = {
          ...editData,
          leadNumber: await generateB2bLeadNumber(),
          submittedDate: new Date().toISOString(),
          assignedTo: userProfile?.uid,
          assignedToName: userProfile?.displayName || 'Unknown User'
        };

        const result = await FirestoreService.create('b2bleads', leadData);
        if (result.success) {
          navigate(`/portal/customers/b2b/${result.id}`);
        }
      }
    } catch (error) {
      console.error('Error saving B2B lead:', error);
    }
  };

  const deleteLead = async () => {
    if (window.confirm('Are you sure you want to delete this B2B lead? This action cannot be undone.')) {
      try {
        const result = await FirestoreService.delete('b2bleads', leadId!);
        if (result.success) {
          navigate('/portal/customers');
        }
      } catch (error) {
        console.error('Error deleting B2B lead:', error);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'contacted': return 'bg-yellow-100 text-yellow-800';
      case 'qualified': return 'bg-green-100 text-green-800';
      case 'proposal': return 'bg-purple-100 text-purple-800';
      case 'negotiation': return 'bg-orange-100 text-orange-800';
      case 'won': return 'bg-green-100 text-green-800';
      case 'lost': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/portal/customers')}
              className="p-2 text-secondary-400 hover:text-secondary-600 transition-colors duration-200"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-secondary-800">
                {lead ? `${lead.companyName}` : 'New B2B Lead'}
              </h1>
              <p className="text-secondary-600">
                {lead ? `Lead #${lead.leadNumber}` : 'Create a new B2B lead'}
              </p>
            </div>
          </div>
          
          {lead && (
            <div className="flex items-center space-x-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(lead.status)}`}>
                {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(lead.priority)}`}>
                {lead.priority.charAt(0).toUpperCase() + lead.priority.slice(1)} Priority
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      {lead && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-secondary-800 mb-4">Quick Actions</h3>
          <div className="flex flex-wrap gap-3">
            <a
              href={`tel:${lead.phone}`}
              className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg font-medium hover:bg-blue-200 transition-colors duration-200 flex items-center space-x-2"
            >
              <Phone className="h-4 w-4" />
              <span>Call</span>
            </a>
            <a
              href={`mailto:${lead.email}`}
              className="bg-purple-100 text-purple-800 px-4 py-2 rounded-lg font-medium hover:bg-purple-200 transition-colors duration-200 flex items-center space-x-2"
            >
              <Mail className="h-4 w-4" />
              <span>Email</span>
            </a>
            <WhatsAppButton
              customerId={lead.id}
              customerPhone={lead.phone}
              customerName={`${lead.contactPerson} - ${lead.companyName}`}
              variant="minimal"
              size="md"
            />
            <button
              onClick={deleteLead}
              className="bg-red-100 text-red-800 px-4 py-2 rounded-lg font-medium hover:bg-red-200 transition-colors duration-200 flex items-center space-x-2"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-secondary-800">B2B Lead Information</h3>
          <button
            onClick={() => {
              if (isEditing) {
                saveLead();
              } else {
                setIsEditing(true);
              }
            }}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200 flex items-center space-x-2"
          >
            {isEditing ? <Save className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
            <span>{isEditing ? 'Save Changes' : 'Edit Details'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Company Information */}
          <div className="bg-gray-50 rounded-xl p-6">
            <h4 className="text-md font-semibold text-secondary-800 mb-4 flex items-center">
              <Building2 className="h-5 w-5 mr-2" />
              Company Information
            </h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Company Name <span className="text-red-500">*</span>
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.companyName || ''}
                    onChange={(e) => setEditData(prev => ({ ...prev, companyName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter company name"
                    required
                  />
                ) : (
                  <p className="text-secondary-800">{lead?.companyName}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Industry</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.industry || ''}
                    onChange={(e) => setEditData(prev => ({ ...prev, industry: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="e.g., Technology, Healthcare, Manufacturing"
                  />
                ) : (
                  <p className="text-secondary-800">{lead?.industry || 'Not specified'}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Company Size</label>
                {isEditing ? (
                  <select
                    value={editData.companySize || ''}
                    onChange={(e) => setEditData(prev => ({ ...prev, companySize: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Select company size</option>
                    <option value="1-10">1-10 employees</option>
                    <option value="11-50">11-50 employees</option>
                    <option value="51-200">51-200 employees</option>
                    <option value="201-500">201-500 employees</option>
                    <option value="501-1000">501-1000 employees</option>
                    <option value="1000+">1000+ employees</option>
                  </select>
                ) : (
                  <p className="text-secondary-800">{lead?.companySize || 'Not specified'}</p>
                )}
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-gray-50 rounded-xl p-6">
            <h4 className="text-md font-semibold text-secondary-800 mb-4 flex items-center">
              <User className="h-5 w-5 mr-2" />
              Contact Information
            </h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Contact Person <span className="text-red-500">*</span>
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.contactPerson || ''}
                    onChange={(e) => setEditData(prev => ({ ...prev, contactPerson: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter contact person name"
                    required
                  />
                ) : (
                  <p className="text-secondary-800">{lead?.contactPerson}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Position</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.position || ''}
                    onChange={(e) => setEditData(prev => ({ ...prev, position: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="e.g., HR Manager, Sales Director"
                  />
                ) : (
                  <p className="text-secondary-800">{lead?.position || 'Not specified'}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={editData.email || ''}
                    onChange={(e) => setEditData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter email address"
                    required
                  />
                ) : (
                  <p className="text-secondary-800">{lead?.email}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Phone <span className="text-red-500">*</span>
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={editData.phone || ''}
                    onChange={(e) => setEditData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter phone number"
                    required
                  />
                ) : (
                  <p className="text-secondary-800">{lead?.phone}</p>
                )}
              </div>
            </div>
          </div>

          {/* Training Requirements */}
          <div className="bg-gray-50 rounded-xl p-6">
            <h4 className="text-md font-semibold text-secondary-800 mb-4 flex items-center">
              <Target className="h-5 w-5 mr-2" />
              Training Requirements
            </h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Training Needs</label>
                {isEditing ? (
                  <textarea
                    value={editData.trainingNeeds || ''}
                    onChange={(e) => setEditData(prev => ({ ...prev, trainingNeeds: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Describe the training needs..."
                  />
                ) : (
                  <p className="text-secondary-800">{lead?.trainingNeeds || 'Not specified'}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Budget Range</label>
                {isEditing ? (
                  <select
                    value={editData.budget || ''}
                    onChange={(e) => setEditData(prev => ({ ...prev, budget: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Select budget range</option>
                    <option value="Under 100K">Under KES 100,000</option>
                    <option value="100K-500K">KES 100,000 - 500,000</option>
                    <option value="500K-1M">KES 500,000 - 1,000,000</option>
                    <option value="1M-5M">KES 1,000,000 - 5,000,000</option>
                    <option value="5M+">Over KES 5,000,000</option>
                  </select>
                ) : (
                  <p className="text-secondary-800">{lead?.budget || 'Not specified'}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Timeline</label>
                {isEditing ? (
                  <select
                    value={editData.timeline || ''}
                    onChange={(e) => setEditData(prev => ({ ...prev, timeline: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Select timeline</option>
                    <option value="Immediate">Immediate (within 1 month)</option>
                    <option value="1-3 months">1-3 months</option>
                    <option value="3-6 months">3-6 months</option>
                    <option value="6+ months">6+ months</option>
                    <option value="Planning">Still planning</option>
                  </select>
                ) : (
                  <p className="text-secondary-800">{lead?.timeline || 'Not specified'}</p>
                )}
              </div>
            </div>
          </div>

          {/* Status Information */}
          <div className="bg-gray-50 rounded-xl p-6">
            <h4 className="text-md font-semibold text-secondary-800 mb-4">Status & Timeline</h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Status</label>
                {isEditing ? (
                  <select
                    value={editData.status || ''}
                    onChange={(e) => setEditData(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="qualified">Qualified</option>
                    <option value="proposal">Proposal Sent</option>
                    <option value="negotiation">Negotiation</option>
                    <option value="won">Won</option>
                    <option value="lost">Lost</option>
                  </select>
                ) : (
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${lead?.status ? getStatusColor(lead.status) : 'bg-gray-100 text-gray-800'}`}>
                    {lead?.status ? lead.status.charAt(0).toUpperCase() + lead.status.slice(1) : 'Not set'}
                  </span>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Priority</label>
                {isEditing ? (
                  <select
                    value={editData.priority || ''}
                    onChange={(e) => setEditData(prev => ({ ...prev, priority: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                ) : (
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${lead?.priority ? getPriorityColor(lead.priority) : 'bg-gray-100 text-gray-800'}`}>
                    {lead?.priority ? lead.priority.charAt(0).toUpperCase() + lead.priority.slice(1) : 'Not set'}
                  </span>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Submitted Date</label>
                <p className="text-secondary-800">{lead?.submittedDate ? new Date(lead.submittedDate).toLocaleDateString() : 'Not available'}</p>
              </div>
              
              {lead?.lastContactDate && (
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Last Contact</label>
                  <p className="text-secondary-800">{new Date(lead.lastContactDate).toLocaleDateString()}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default B2bCustomerPage; 