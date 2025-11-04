import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  MapPin, 
  Monitor,
  BookOpen,
  User,
  Download,
  Edit,
  Plus,
  Filter,
  Save,
  Trash2,
  X,
  Check,
  Video,
  RotateCcw,
  GraduationCap,
  Users,
  CheckCircle,
  Star,
  MessageCircle
} from 'lucide-react';
import { FirestoreService } from '../../../services/firestore';

interface ScheduleItem {
  id?: string; // Firestore document ID
  session: number; // Session number
  week: number;
  date?: string;
  time?: string;
  moduleFocus?: string;
  sessionTitle?: string;
  activity?: string;
  trainingDeck?: string;
  trainer?: string;
  quadrantMapping?: string;
  deliveryMode?: 'physical' | 'virtual' | 'self-paced' | 'break';
  survey?: string; // Survey link or form
  surveyFeedback?: string; // Survey feedback results
  trainerObservationNotes?: string; // Trainer's observation notes
  attendance?: string; // Attendance tracking
  submissionOfAssignments?: string; // Assignment submission status
  virtualSessionRecording?: string; // Recording link for virtual sessions
  location?: string;
  sessionType: 'workshop' | 'lecture' | 'project' | 'break' | 'assessment';
  intakeId: string; // Link to intake
  createdAt?: string;
  updatedAt?: string;
}

interface Intake {
  id: string;
  intakeId: string;
  name: string;
  startDate: string;
  closeDate: string;
  status: string;
}

const Schedule: React.FC = () => {
  const navigate = useNavigate();
  const { intakeId } = useParams<{ intakeId: string }>();
  const [intake, setIntake] = useState<Intake | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [weekFilter, setWeekFilter] = useState<number | 'all'>('all');
  const [scheduleData, setScheduleData] = useState<ScheduleItem[]>([]);
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    if (intakeId) {
      loadIntakeData();
      loadScheduleData();
    }
  }, [intakeId]);

  // Add navigation listener to reload data when returning from create page
  useEffect(() => {
    const handleFocus = () => {
      console.log('Schedule page gained focus - reloading data');
      if (intakeId) {
        loadScheduleData();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [intakeId]);

  const loadIntakeData = async () => {
    if (!intakeId) return;
    
    setLoading(true);
    try {
      const result = await FirestoreService.getById('intakes', intakeId);
      if (result.success && result.data) {
        setIntake(result.data as Intake);
      }
    } catch (error) {
      console.error('Error loading intake:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadScheduleData = async () => {
    if (!intakeId) return;
    
    try {
      console.log('Loading schedule for intake:', intakeId);
      
      // Load schedule from the schedules collection using intake ID as document ID
      const result = await FirestoreService.getById('schedules', intakeId);
      
      console.log('Schedule load result:', result);
      
      if (result.success && result.data) {
        console.log('Schedule data found:', result.data);
        
        if (result.data.sessions && result.data.sessions.length > 0) {
          // Sort by session number
          const sortedItems = (result.data.sessions as ScheduleItem[]).sort((a, b) => a.session - b.session);
          console.log('Setting schedule data with', sortedItems.length, 'sessions');
          setScheduleData(sortedItems);
        } else {
          console.log('No sessions found in schedule data');
          setScheduleData([]);
        }
      } else {
        console.log('No schedule found or failed to load');
        // If no schedule exists, show empty state
        setScheduleData([]);
      }
    } catch (error) {
      console.error('Error loading schedule:', error);
      // Show empty state on error
      setScheduleData([]);
    }
  };


  const createBlankSchedule = () => {
    if (!intakeId) return;
    
    // Navigate to the dedicated schedule creation page
    navigate(`/portal/learning/intake/${intakeId}/schedule/create`);
  };

  const saveScheduleData = async () => {
    if (!intakeId) return;
    
    setSaving(true);
    try {
      const timestamp = new Date().toISOString();
      
      // Save the entire schedule as a document in the schedules collection
      const scheduleDocument = {
        intakeId,
        sessions: scheduleData,
        createdAt: timestamp,
        updatedAt: timestamp
      };
      
      const result = await FirestoreService.update('schedules', intakeId, scheduleDocument);
      
      if (result.success) {
        alert('✅ Schedule saved successfully!');
      } else {
        alert('⚠️ Schedule could not be saved. Please try again.');
      }
    } catch (error) {
      console.error('Error saving schedule:', error);
      alert('❌ Error saving schedule. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const addScheduleItem = async (item: Omit<ScheduleItem, 'session' | 'intakeId'>) => {
    const newSession = scheduleData.length > 0 ? Math.max(...scheduleData.map(s => s.session)) + 1 : 1;
    const newItem = { 
      ...item, 
      session: newSession, 
      intakeId: intakeId!,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Update local state first
    const updatedSchedule = [...scheduleData, newItem];
    setScheduleData(updatedSchedule);
    
    // Save the entire schedule to Firestore
    try {
      const timestamp = new Date().toISOString();
      const scheduleDocument = {
        intakeId: intakeId!,
        sessions: updatedSchedule,
        createdAt: timestamp,
        updatedAt: timestamp
      };
      
      const result = await FirestoreService.update('schedules', intakeId!, scheduleDocument);
      if (!result.success) {
        // Revert on failure
        setScheduleData(scheduleData);
        alert('❌ Error adding schedule item. Please try again.');
      }
    } catch (error) {
      console.error('Error adding schedule item:', error);
      // Revert on failure
      setScheduleData(scheduleData);
      alert('❌ Error adding schedule item. Please try again.');
    }
  };

  const updateScheduleItem = async (session: number, updates: Partial<ScheduleItem>) => {
    const itemIndex = scheduleData.findIndex(item => item.session === session);
    if (itemIndex === -1) return;

    const item = scheduleData[itemIndex];
    const updatedItem = { 
      ...item, 
      ...updates, 
      updatedAt: new Date().toISOString()
    };

    // Update local state
    const newScheduleData = [...scheduleData];
    newScheduleData[itemIndex] = updatedItem;
    setScheduleData(newScheduleData);

    // Save the entire schedule to Firestore
    try {
      const timestamp = new Date().toISOString();
      const scheduleDocument = {
        intakeId: intakeId!,
        sessions: newScheduleData,
        createdAt: timestamp,
        updatedAt: timestamp
      };
      
      const result = await FirestoreService.update('schedules', intakeId!, scheduleDocument);
      if (!result.success) {
        // Revert on failure
        setScheduleData(scheduleData);
        alert('❌ Error updating schedule item. Please try again.');
      }
    } catch (error) {
      console.error('Error updating schedule item:', error);
      // Revert on failure
      setScheduleData(scheduleData);
      alert('❌ Error updating schedule item. Please try again.');
    }
  };

  const deleteScheduleItem = async (session: number) => {
    if (!confirm('Are you sure you want to delete this schedule item?')) return;
    
    // Update local state
    const updatedSchedule = scheduleData.filter(item => item.session !== session);
    setScheduleData(updatedSchedule);

    // Save the entire schedule to Firestore
    try {
      const timestamp = new Date().toISOString();
      const scheduleDocument = {
        intakeId: intakeId!,
        sessions: updatedSchedule,
        createdAt: timestamp,
        updatedAt: timestamp
      };
      
      const result = await FirestoreService.update('schedules', intakeId!, scheduleDocument);
      if (!result.success) {
        // Revert on failure
        setScheduleData(scheduleData);
        alert('❌ Error deleting schedule item. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting schedule item:', error);
      // Revert on failure
      setScheduleData(scheduleData);
      alert('❌ Error deleting schedule item. Please try again.');
    }
  };

  const handleEditItem = (item: ScheduleItem) => {
    setEditingItem(item);
    setShowEditModal(true);
  };

  const getDateForSession = (sessionNumber: number): string => {
    if (!intake?.startDate) return '';
    const startDate = new Date(intake.startDate);
    const targetDate = new Date(startDate);
    targetDate.setDate(startDate.getDate() + (sessionNumber - 1));
    return targetDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getFormatIcon = (deliveryMode: string) => {
    switch (deliveryMode) {
      case 'physical': return <MapPin className="h-4 w-4" />;
      case 'virtual': return <Monitor className="h-4 w-4" />;
      case 'self-paced': return <BookOpen className="h-4 w-4" />;
      default: return null;
    }
  };

  const getFormatColor = (deliveryMode: string) => {
    switch (deliveryMode) {
      case 'physical': return 'bg-blue-100 text-blue-800';
      case 'virtual': return 'bg-green-100 text-green-800';
      case 'self-paced': return 'bg-purple-100 text-purple-800';
      case 'break': return 'bg-gray-50 text-gray-500';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSessionTypeColor = (sessionType: string) => {
    switch (sessionType) {
      case 'workshop': return 'bg-primary-100 text-primary-800';
      case 'project': return 'bg-orange-100 text-orange-800';
      case 'assessment': return 'bg-red-100 text-red-800';
      case 'lecture': return 'bg-secondary-100 text-secondary-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredSchedule = weekFilter === 'all' 
    ? scheduleData 
    : scheduleData.filter(item => item.week === weekFilter);

  const weeks = Array.from(new Set(scheduleData.map(item => item.week))).sort((a, b) => a - b);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="bg-primary-600 text-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/portal/learning/cohorts')}
              className="p-2 text-primary-100 hover:text-white transition-colors duration-200 bg-white bg-opacity-20 rounded-lg"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-4xl font-bold mb-2">Cohort Schedule</h1>
              <p className="text-lg text-primary-100">
                {intake ? `${intake.name} - 12 Week Program Schedule` : 'Program schedule and timeline'}
              </p>
            </div>
          </div>
          <div className="bg-white bg-opacity-20 p-4 rounded-xl">
            <Calendar className="h-8 w-8 text-white" />
          </div>
        </div>

        {/* Program Info */}
        {intake && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl border border-white border-opacity-20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-primary-100">Start Date</p>
                  <p className="text-xl font-bold text-white">{new Date(intake.startDate).toLocaleDateString()}</p>
                </div>
                <Calendar className="h-6 w-6 text-white opacity-80" />
              </div>
            </div>
            <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl border border-white border-opacity-20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-primary-100">Duration</p>
                  <p className="text-xl font-bold text-white">12 Weeks</p>
                </div>
                <Clock className="h-6 w-6 text-white opacity-80" />
              </div>
            </div>
            <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl border border-white border-opacity-20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-primary-100">Total Sessions</p>
                  <p className="text-xl font-bold text-white">{scheduleData.filter(item => item.deliveryMode !== 'break' && item.sessionTitle).length}</p>
                </div>
                <BookOpen className="h-6 w-6 text-white opacity-80" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controls - Only show when schedule exists */}
      {scheduleData.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={weekFilter}
              onChange={(e) => setWeekFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Weeks</option>
              {weeks.map(week => (
                <option key={week} value={week}>Week {week}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-3">
            <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
            <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
              <Download className="h-4 w-4" />
              <span>Print</span>
            </button>
            <button 
              onClick={saveScheduleData}
              disabled={saving}
              className="flex items-center space-x-2 px-4 py-2 border border-green-300 rounded-lg text-green-700 hover:bg-green-50 transition-colors disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? 'Saving...' : 'Save Schedule'}</span>
            </button>
            <button 
              onClick={loadScheduleData}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Refresh</span>
            </button>
            <button 
              onClick={() => setShowAddModal(true)}
              className="flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Add Session</span>
            </button>
          </div>
        </div>
        </div>
      )}

      {/* Schedule Table */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-secondary-800">
            {weekFilter === 'all' ? 'Complete Schedule' : `Week ${weekFilter} Schedule`}
          </h2>
        </div>

        {scheduleData.length === 0 ? (
          // Empty State - No schedule exists
          <div className="p-12 text-center">
            <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Schedule Created Yet</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              This intake doesn't have a schedule yet. Start creating your custom schedule by adding sessions.
            </p>
            
            <div className="flex justify-center">
              <button
                onClick={createBlankSchedule}
                className="flex items-center justify-center space-x-2 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Plus className="h-5 w-5" />
                <span>Create Schedule</span>
              </button>
            </div>
            
            <div className="mt-6 text-sm text-gray-500">
              <p>Create a fully customized schedule tailored to your intake's specific needs</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Session</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Week</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Session Title</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery Mode</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trainer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSchedule.map((item, index) => (
                <tr 
                  key={index} 
                  className={`
                    ${item.deliveryMode === 'break' && item.sessionTitle?.startsWith('Week') ? 'bg-primary-50' : ''}
                    ${item.deliveryMode === 'break' && !item.sessionTitle ? 'bg-gray-25' : ''}
                    hover:bg-gray-50 transition-colors
                  `}
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className={`text-sm font-medium ${
                        item.deliveryMode === 'break' && item.sessionTitle?.startsWith('Week') 
                          ? 'text-primary-600' 
                          : 'text-gray-900'
                      }`}>
                        {item.session}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-sm text-gray-500">
                      {item.week}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-sm text-gray-500">
                      {item.deliveryMode !== 'break' || item.sessionTitle?.startsWith('Week') ? getDateForSession(item.session) : ''}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm font-medium ${
                        item.sessionTitle?.startsWith('Week') 
                          ? 'text-primary-600' 
                          : 'text-gray-900'
                      }`}>
                        {item.sessionTitle || '-'}
                      </span>
                      {item.sessionType !== 'break' && item.sessionTitle && (
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getSessionTypeColor(item.sessionType)}`}>
                          {item.sessionType.charAt(0).toUpperCase() + item.sessionType.slice(1)}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {item.trainer && (
                      <div className="flex items-center text-sm text-gray-900">
                        <User className="h-3 w-3 mr-1 text-gray-400" />
                        {item.trainer}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {item.deliveryMode !== 'break' && (
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getFormatColor(item.deliveryMode || 'physical')}`}>
                          {getFormatIcon(item.deliveryMode || 'physical')}
                          <span className="ml-1 capitalize">{item.deliveryMode === 'physical' ? 'Physical' : 'Virtual'}</span>
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {item.deliveryMode !== 'break' || item.sessionTitle?.startsWith('Week') ? (
                      <div className="flex items-center space-x-2">
                        {/* Class Session Button - only for actual sessions, not week headers */}
                        {!item.sessionTitle?.startsWith('Week') && item.sessionTitle && (
                          <button
                            onClick={() => navigate(`/portal/learning/intake/${intakeId}/session/${item.session}`)}
                            className="text-green-600 hover:text-green-800 p-1 rounded transition-colors"
                            title="Start class session"
                          >
                            <GraduationCap className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleEditItem(item)}
                          className="text-blue-600 hover:text-blue-800 p-1 rounded transition-colors"
                          title="Edit session"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        {!item.sessionTitle?.startsWith('Week') && (
                          <button
                            onClick={() => deleteScheduleItem(item.session)}
                            className="text-red-600 hover:text-red-800 p-1 rounded transition-colors"
                            title="Delete session"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ) : null}
                  </td>
                </tr>
              ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Legend - Only show when schedule exists */}
      {scheduleData.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-secondary-800 mb-4">Legend</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              <MapPin className="h-3 w-3 mr-1" />
              Physical
            </span>
            <span className="text-sm text-gray-600">In-person workshops</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <Monitor className="h-3 w-3 mr-1" />
              Virtual
            </span>
            <span className="text-sm text-gray-600">Online sessions</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
              Project
            </span>
            <span className="text-sm text-gray-600">Project work</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
              Assessment
            </span>
            <span className="text-sm text-gray-600">Evaluation days</span>
          </div>
        </div>
        </div>
      )}

      {/* Add Session Modal */}
      {showAddModal && (
        <AddSessionModal
          onClose={() => setShowAddModal(false)}
          onSave={(item) => {
            addScheduleItem(item);
            setShowAddModal(false);
          }}
          maxSession={scheduleData.length > 0 ? Math.max(...scheduleData.map(s => s.session)) : 0}
        />
      )}

      {/* Edit Session Modal */}
      {showEditModal && editingItem && (
        <EditSessionModal
          item={editingItem}
          onClose={() => {
            setShowEditModal(false);
            setEditingItem(null);
          }}
          onSave={(updates) => {
            updateScheduleItem(editingItem.session, updates);
            setShowEditModal(false);
            setEditingItem(null);
          }}
        />
      )}
    </div>
  );
};

// Add Session Modal Component
const AddSessionModal: React.FC<{
  onClose: () => void;
  onSave: (item: Omit<ScheduleItem, 'session' | 'intakeId'>) => void;
  maxSession: number;
}> = ({ onClose, onSave, maxSession }) => {
  const [formData, setFormData] = useState({
    week: Math.ceil(maxSession / 7),
    date: '',
    time: '',
    moduleFocus: '',
    sessionTitle: '',
    activity: '',
    trainingDeck: '',
    trainer: '',
    quadrantMapping: '',
    deliveryMode: 'physical' as const,
    sessionType: 'workshop' as const,
    survey: '',
    surveyFeedback: '',
    trainerObservationNotes: '',
    attendance: '',
    submissionOfAssignments: '',
    virtualSessionRecording: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.sessionTitle.trim()) {
      onSave(formData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Add New Session</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Week</label>
              <input
                type="number"
                value={formData.week}
                onChange={(e) => setFormData({...formData, week: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                min="1"
                max="20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
              <input
                type="text"
                value={formData.time}
                onChange={(e) => setFormData({...formData, time: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="e.g., 9:00 AM - 5:00 PM"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Mode</label>
              <select
                value={formData.deliveryMode}
                onChange={(e) => setFormData({...formData, deliveryMode: e.target.value as any})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="physical">Physical Workshop</option>
                <option value="virtual">Virtual Workshop</option>
                <option value="self-paced">Self-Paced</option>
                <option value="break">Break</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Module Focus</label>
            <input
              type="text"
              value={formData.moduleFocus}
              onChange={(e) => setFormData({...formData, moduleFocus: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="Enter module focus"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Session Title</label>
            <input
              type="text"
              value={formData.sessionTitle}
              onChange={(e) => setFormData({...formData, sessionTitle: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="Enter session title"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Activity</label>
            <textarea
              value={formData.activity}
              onChange={(e) => setFormData({...formData, activity: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="Enter activity description"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Training Deck</label>
            <input
              type="text"
              value={formData.trainingDeck}
              onChange={(e) => setFormData({...formData, trainingDeck: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="Enter training deck details"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trainer</label>
              <input
                type="text"
                value={formData.trainer}
                onChange={(e) => setFormData({...formData, trainer: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="Enter trainer name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quadrant Mapping</label>
              <input
                type="text"
                value={formData.quadrantMapping}
                onChange={(e) => setFormData({...formData, quadrantMapping: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="Enter quadrant mapping"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Session Type</label>
            <select
              value={formData.sessionType}
              onChange={(e) => setFormData({...formData, sessionType: e.target.value as any})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="workshop">Workshop</option>
              <option value="lecture">Lecture</option>
              <option value="project">Project</option>
              <option value="assessment">Assessment</option>
              <option value="break">Break</option>
            </select>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Add Session
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Edit Session Modal Component
const EditSessionModal: React.FC<{
  item: ScheduleItem;
  onClose: () => void;
  onSave: (updates: Partial<ScheduleItem>) => void;
}> = ({ item, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    week: item.week,
    date: item.date || '',
    time: item.time || '',
    moduleFocus: item.moduleFocus || '',
    sessionTitle: item.sessionTitle || '',
    activity: item.activity || '',
    trainingDeck: item.trainingDeck || '',
    trainer: item.trainer || '',
    quadrantMapping: item.quadrantMapping || '',
    deliveryMode: item.deliveryMode || 'physical',
    sessionType: item.sessionType,
    survey: item.survey || '',
    surveyFeedback: item.surveyFeedback || '',
    trainerObservationNotes: item.trainerObservationNotes || '',
    attendance: item.attendance || '',
    submissionOfAssignments: item.submissionOfAssignments || '',
    virtualSessionRecording: item.virtualSessionRecording || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Edit Session - Session {item.session}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Week</label>
              <input
                type="number"
                value={formData.week}
                onChange={(e) => setFormData({...formData, week: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                min="1"
                max="20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
              <input
                type="text"
                value={formData.time}
                onChange={(e) => setFormData({...formData, time: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="e.g., 9:00 AM - 5:00 PM"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Mode</label>
              <select
                value={formData.deliveryMode}
                onChange={(e) => setFormData({...formData, deliveryMode: e.target.value as any})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="physical">Physical Workshop</option>
                <option value="virtual">Virtual Workshop</option>
                <option value="self-paced">Self-Paced</option>
                <option value="break">Break</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Module Focus</label>
            <input
              type="text"
              value={formData.moduleFocus}
              onChange={(e) => setFormData({...formData, moduleFocus: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="Enter module focus"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Session Title</label>
            <input
              type="text"
              value={formData.sessionTitle}
              onChange={(e) => setFormData({...formData, sessionTitle: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="Enter session title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Activity</label>
            <textarea
              value={formData.activity}
              onChange={(e) => setFormData({...formData, activity: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="Enter activity description"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Training Deck</label>
            <input
              type="text"
              value={formData.trainingDeck}
              onChange={(e) => setFormData({...formData, trainingDeck: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="Enter training deck details"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trainer</label>
              <input
                type="text"
                value={formData.trainer}
                onChange={(e) => setFormData({...formData, trainer: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="Enter trainer name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quadrant Mapping</label>
              <input
                type="text"
                value={formData.quadrantMapping}
                onChange={(e) => setFormData({...formData, quadrantMapping: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="Enter quadrant mapping"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Session Type</label>
            <select
              value={formData.sessionType}
              onChange={(e) => setFormData({...formData, sessionType: e.target.value as any})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="workshop">Workshop</option>
              <option value="lecture">Lecture</option>
              <option value="project">Project</option>
              <option value="assessment">Assessment</option>
              <option value="break">Break</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Survey</label>
              <input
                type="text"
                value={formData.survey}
                onChange={(e) => setFormData({...formData, survey: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="Survey link or form"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Survey Feedback</label>
              <input
                type="text"
                value={formData.surveyFeedback}
                onChange={(e) => setFormData({...formData, surveyFeedback: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="Survey feedback status"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Trainer Observation Notes</label>
            <textarea
              value={formData.trainerObservationNotes}
              onChange={(e) => setFormData({...formData, trainerObservationNotes: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="Trainer's observation notes"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Attendance</label>
              <input
                type="text"
                value={formData.attendance}
                onChange={(e) => setFormData({...formData, attendance: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="Attendance status"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assignment Submissions</label>
              <input
                type="text"
                value={formData.submissionOfAssignments}
                onChange={(e) => setFormData({...formData, submissionOfAssignments: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="Assignment submission status"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Session Recording</label>
              <input
                type="url"
                value={formData.virtualSessionRecording}
                onChange={(e) => setFormData({...formData, virtualSessionRecording: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="Virtual session recording link"
              />
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Schedule;
