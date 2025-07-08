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
  Video
} from 'lucide-react';
import { FirestoreService } from '../../../services/firestore';

interface ScheduleItem {
  id?: string; // Firestore document ID
  session: number; // Changed from day to session
  week: number;
  date?: string;
  format: 'physical' | 'virtual' | 'self-paced' | 'break';
  topic: string;
  time?: string;
  trainer?: string;
  location?: string;
  sessionType: 'workshop' | 'lecture' | 'project' | 'break' | 'assessment';
  cohortId: string; // Link to cohort
  createdAt?: string;
  updatedAt?: string;
}

interface Cohort {
  id: string;
  cohortId: string;
  name: string;
  startDate: string;
  closeDate: string;
  status: string;
}

const Schedule: React.FC = () => {
  const navigate = useNavigate();
  const { cohortId } = useParams<{ cohortId: string }>();
  const [cohort, setCohort] = useState<Cohort | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [weekFilter, setWeekFilter] = useState<number | 'all'>('all');
  const [scheduleData, setScheduleData] = useState<ScheduleItem[]>([]);
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    if (cohortId) {
      loadCohortData();
      loadScheduleData();
    }
  }, [cohortId]);

  const loadCohortData = async () => {
    if (!cohortId) return;
    
    setLoading(true);
    try {
      const result = await FirestoreService.getById('cohorts', cohortId);
      if (result.success && result.data) {
        setCohort(result.data as Cohort);
      }
    } catch (error) {
      console.error('Error loading cohort:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadScheduleData = async () => {
    if (!cohortId) return;
    
    try {
      // Load schedule items for this cohort from the scheduleItems collection
      const result = await FirestoreService.getWithQuery('scheduleItems', [
        { field: 'cohortId', operator: '==', value: cohortId }
      ]);
      
      if (result.success && result.data && result.data.length > 0) {
        // Sort by session number
        const sortedItems = (result.data as ScheduleItem[]).sort((a, b) => a.session - b.session);
        setScheduleData(sortedItems);
      } else {
        // If no schedule exists, create default template
        const defaultTemplate = getDefaultScheduleTemplate();
        setScheduleData(defaultTemplate);
        // Auto-save the default template
        await saveDefaultTemplate(defaultTemplate);
      }
    } catch (error) {
      console.error('Error loading schedule:', error);
      // Fallback to default template
      const defaultTemplate = getDefaultScheduleTemplate();
      setScheduleData(defaultTemplate);
    }
  };

  // Default 12-week schedule template based on your provided structure
  const getDefaultScheduleTemplate = (): ScheduleItem[] => {
    if (!cohortId) return [];
    
    return [
      // Week One
      { session: 1, week: 1, format: 'break', topic: 'Week One', sessionType: 'break', cohortId },
      { session: 2, week: 1, format: 'physical', topic: 'Onboarding & Orientation', time: '9:00 AM - 5:00 PM', trainer: 'Program Director', sessionType: 'workshop', cohortId },
      { session: 3, week: 1, format: 'break', topic: '', sessionType: 'break', cohortId },
      { session: 4, week: 1, format: 'physical', topic: 'Introduction to sales', time: '9:00 AM - 5:00 PM', trainer: 'Sales Lead', sessionType: 'workshop', cohortId },
      { session: 5, week: 1, format: 'break', topic: '', sessionType: 'break', cohortId },

      // Week Two
      { session: 6, week: 2, format: 'break', topic: 'Week Two', sessionType: 'break', cohortId },
      { session: 7, week: 2, format: 'virtual', topic: 'Preparing to sell', time: '2:00 PM - 4:00 PM', trainer: 'Senior Trainer', sessionType: 'workshop', cohortId },
      { session: 8, week: 2, format: 'break', topic: '', sessionType: 'break', cohortId },
      { session: 9, week: 2, format: 'physical', topic: 'Prospecting: Research', time: '9:00 AM - 5:00 PM', trainer: 'Research Specialist', sessionType: 'workshop', cohortId },
      { session: 10, week: 2, format: 'break', topic: '', sessionType: 'break', cohortId },

      // Week Three
      { session: 11, week: 3, format: 'break', topic: 'Week Three', sessionType: 'break', cohortId },
      { session: 12, week: 3, format: 'virtual', topic: 'Customer Psychology', time: '2:00 PM - 4:00 PM', trainer: 'Psychology Expert', sessionType: 'workshop', cohortId },
      { session: 13, week: 3, format: 'break', topic: '', sessionType: 'break', cohortId },
      { session: 14, week: 3, format: 'physical', topic: 'Prospecting: Contacting', time: '9:00 AM - 5:00 PM', trainer: 'Communications Lead', sessionType: 'workshop', cohortId },
      { session: 15, week: 3, format: 'break', topic: '', sessionType: 'break', cohortId },

      // Week Four
      { session: 16, week: 4, format: 'break', topic: 'Week Four', sessionType: 'break', cohortId },
      { session: 17, week: 4, format: 'virtual', topic: 'Digital Tools for sales efficiency', time: '2:00 PM - 4:00 PM', trainer: 'Tech Specialist', sessionType: 'workshop', cohortId },
      { session: 18, week: 4, format: 'break', topic: '', sessionType: 'break', cohortId },
      { session: 19, week: 4, format: 'physical', topic: 'The Art of follow up', time: '9:00 AM - 5:00 PM', trainer: 'Relationship Manager', sessionType: 'workshop', cohortId },
      { session: 20, week: 4, format: 'break', topic: '', sessionType: 'break', cohortId },

      // Week Five
      { session: 21, week: 5, format: 'break', topic: 'Week Five', sessionType: 'break', cohortId },
      { session: 22, week: 5, format: 'virtual', topic: 'Use of Data in Sales', time: '2:00 PM - 4:00 PM', trainer: 'Data Analyst', sessionType: 'workshop', cohortId },
      { session: 23, week: 5, format: 'break', topic: '', sessionType: 'break', cohortId },
      { session: 24, week: 5, format: 'physical', topic: 'Sales Pitch Day', time: '9:00 AM - 5:00 PM', trainer: 'Pitch Coach', sessionType: 'assessment', cohortId },
      { session: 25, week: 5, format: 'break', topic: '', sessionType: 'break', cohortId },

      // Week Six
      { session: 26, week: 6, format: 'break', topic: 'Week Six', sessionType: 'break', cohortId },
      { session: 27, week: 6, format: 'virtual', topic: 'Sales Ethics', time: '2:00 PM - 4:00 PM', trainer: 'Ethics Consultant', sessionType: 'workshop', cohortId },
      { session: 28, week: 6, format: 'break', topic: '', sessionType: 'break', cohortId },
      { session: 29, week: 6, format: 'physical', topic: 'Social selling', time: '9:00 AM - 5:00 PM', trainer: 'Social Media Expert', sessionType: 'workshop', cohortId },
      { session: 30, week: 6, format: 'break', topic: '', sessionType: 'break', cohortId },

      // Week Seven
      { session: 31, week: 7, format: 'break', topic: 'Week Seven', sessionType: 'break', cohortId },
      { session: 32, week: 7, format: 'virtual', topic: 'Mastering Productivity', time: '2:00 PM - 4:00 PM', trainer: 'Productivity Coach', sessionType: 'workshop', cohortId },
      { session: 33, week: 7, format: 'break', topic: '', sessionType: 'break', cohortId },
      { session: 34, week: 7, format: 'physical', topic: 'Building your personal Brand', time: '9:00 AM - 5:00 PM', trainer: 'Brand Strategist', sessionType: 'workshop', cohortId },
      { session: 35, week: 7, format: 'break', topic: '', sessionType: 'break', cohortId },

      // Week Eight
      { session: 36, week: 8, format: 'break', topic: 'Week Eight', sessionType: 'break', cohortId },
      { session: 37, week: 8, format: 'virtual', topic: 'Project 2 Brief', time: '2:00 PM - 4:00 PM', trainer: 'Project Manager', sessionType: 'project', cohortId },
      { session: 38, week: 8, format: 'break', topic: '', sessionType: 'break', cohortId },
      { session: 39, week: 8, format: 'physical', topic: 'The Art of Negotiation', time: '9:00 AM - 5:00 PM', trainer: 'Negotiation Expert', sessionType: 'workshop', cohortId },
      { session: 40, week: 8, format: 'break', topic: '', sessionType: 'break', cohortId },

      // Week Nine
      { session: 41, week: 9, format: 'break', topic: 'Week Nine', sessionType: 'break', cohortId },
      { session: 42, week: 9, format: 'virtual', topic: 'The Power of Networking', time: '2:00 PM - 4:00 PM', trainer: 'Network Specialist', sessionType: 'workshop', cohortId },
      { session: 43, week: 9, format: 'break', topic: '', sessionType: 'break', cohortId },
      { session: 44, week: 9, format: 'physical', topic: 'The Art of closing a Sale', time: '9:00 AM - 5:00 PM', trainer: 'Closing Expert', sessionType: 'workshop', cohortId },
      { session: 45, week: 9, format: 'break', topic: '', sessionType: 'break', cohortId },

      // Week Ten
      { session: 46, week: 10, format: 'break', topic: 'Week Ten', sessionType: 'break', cohortId },
      { session: 47, week: 10, format: 'virtual', topic: 'CV Creation', time: '2:00 PM - 4:00 PM', trainer: 'Career Counselor', sessionType: 'workshop', cohortId },
      { session: 48, week: 10, format: 'break', topic: '', sessionType: 'break', cohortId },
      { session: 49, week: 10, format: 'physical', topic: 'Tracking Metrics & Improving Conversion Rates', time: '9:00 AM - 5:00 PM', trainer: 'Analytics Expert', sessionType: 'workshop', cohortId },
      { session: 50, week: 10, format: 'break', topic: '', sessionType: 'break', cohortId },

      // Week Eleven
      { session: 51, week: 11, format: 'break', topic: 'Week Eleven', sessionType: 'break', cohortId },
      { session: 52, week: 11, format: 'virtual', topic: 'Interview Skills', time: '2:00 PM - 4:00 PM', trainer: 'HR Specialist', sessionType: 'workshop', cohortId },
      { session: 53, week: 11, format: 'break', topic: '', sessionType: 'break', cohortId },
      { session: 54, week: 11, format: 'physical', topic: 'Maximizing Efficiency & Closing Deals Faster', time: '9:00 AM - 5:00 PM', trainer: 'Efficiency Expert', sessionType: 'workshop', cohortId },
      { session: 55, week: 11, format: 'break', topic: '', sessionType: 'break', cohortId },

      // Week Twelve
      { session: 56, week: 12, format: 'break', topic: 'Week Twelve', sessionType: 'break', cohortId },
      { session: 57, week: 12, format: 'virtual', topic: 'LinkedIn Optimization', time: '2:00 PM - 4:00 PM', trainer: 'LinkedIn Expert', sessionType: 'workshop', cohortId },
      { session: 58, week: 12, format: 'break', topic: '', sessionType: 'break', cohortId },
      { session: 59, week: 12, format: 'physical', topic: 'Project 2 Submission', time: '9:00 AM - 5:00 PM', trainer: 'Assessment Team', sessionType: 'project', cohortId },
      { session: 60, week: 12, format: 'break', topic: '', sessionType: 'break', cohortId },
    ];
  };

  const saveDefaultTemplate = async (templateItems: ScheduleItem[]) => {
    if (!cohortId) return;
    
    try {
      const timestamp = new Date().toISOString();
      const itemsToSave = templateItems.map(item => ({
        ...item,
        createdAt: timestamp,
        updatedAt: timestamp
      }));

      // Save each schedule item individually
      const promises = itemsToSave.map(item => 
        FirestoreService.create('scheduleItems', item)
      );
      
      await Promise.all(promises);
    } catch (error) {
      console.error('Error saving default template:', error);
    }
  };

  const saveScheduleData = async () => {
    if (!cohortId) return;
    
    setSaving(true);
    try {
      const timestamp = new Date().toISOString();
      let success = true;

      // Save or update each schedule item
      for (const item of scheduleData) {
        const itemData = {
          ...item,
          updatedAt: timestamp,
          cohortId
        };

        if (item.id) {
          // Update existing item
          const result = await FirestoreService.update('scheduleItems', item.id, itemData);
          if (!result.success) success = false;
        } else {
          // Create new item
          const result = await FirestoreService.create('scheduleItems', {
            ...itemData,
            createdAt: timestamp
          });
          if (result.success && (result as any).id) {
            // Update local data with the new ID
            item.id = (result as any).id;
          } else {
            success = false;
          }
        }
      }

      if (success) {
        alert('✅ Schedule saved successfully!');
      } else {
        alert('⚠️ Some items may not have been saved. Please try again.');
      }
    } catch (error) {
      console.error('Error saving schedule:', error);
      alert('❌ Error saving schedule. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const addScheduleItem = async (item: Omit<ScheduleItem, 'session' | 'cohortId'>) => {
    const newSession = Math.max(...scheduleData.map(s => s.session)) + 1;
    const newItem = { 
      ...item, 
      session: newSession, 
      cohortId: cohortId!,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    try {
      const result = await FirestoreService.create('scheduleItems', newItem);
      if (result.success && (result as any).id) {
        newItem.id = (result as any).id;
        setScheduleData([...scheduleData, newItem]);
      }
    } catch (error) {
      console.error('Error adding schedule item:', error);
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

    try {
      if (item.id) {
        const result = await FirestoreService.update('scheduleItems', item.id, updatedItem);
        if (result.success) {
          const newScheduleData = [...scheduleData];
          newScheduleData[itemIndex] = updatedItem;
          setScheduleData(newScheduleData);
        }
      }
    } catch (error) {
      console.error('Error updating schedule item:', error);
      alert('❌ Error updating schedule item. Please try again.');
    }
  };

  const deleteScheduleItem = async (session: number) => {
    if (!confirm('Are you sure you want to delete this schedule item?')) return;
    
    const item = scheduleData.find(item => item.session === session);
    if (!item || !item.id) return;

    try {
      const result = await FirestoreService.delete('scheduleItems', item.id);
      if (result.success) {
        setScheduleData(scheduleData.filter(item => item.session !== session));
      }
    } catch (error) {
      console.error('Error deleting schedule item:', error);
      alert('❌ Error deleting schedule item. Please try again.');
    }
  };

  const handleEditItem = (item: ScheduleItem) => {
    setEditingItem(item);
    setShowEditModal(true);
  };

  const getDateForSession = (sessionNumber: number): string => {
    if (!cohort?.startDate) return '';
    const startDate = new Date(cohort.startDate);
    const targetDate = new Date(startDate);
    targetDate.setDate(startDate.getDate() + (sessionNumber - 1));
    return targetDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'physical': return <MapPin className="h-4 w-4" />;
      case 'virtual': return <Monitor className="h-4 w-4" />;
      case 'self-paced': return <BookOpen className="h-4 w-4" />;
      default: return null;
    }
  };

  const getFormatColor = (format: string) => {
    switch (format) {
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
              onClick={() => navigate('/portal/learning')}
              className="p-2 text-primary-100 hover:text-white transition-colors duration-200 bg-white bg-opacity-20 rounded-lg"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-4xl font-bold mb-2">Cohort Schedule</h1>
              <p className="text-lg text-primary-100">
                {cohort ? `${cohort.name} - 12 Week Program Schedule` : 'Program schedule and timeline'}
              </p>
            </div>
          </div>
          <div className="bg-white bg-opacity-20 p-4 rounded-xl">
            <Calendar className="h-8 w-8 text-white" />
          </div>
        </div>

        {/* Program Info */}
        {cohort && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl border border-white border-opacity-20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-primary-100">Start Date</p>
                  <p className="text-xl font-bold text-white">{new Date(cohort.startDate).toLocaleDateString()}</p>
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
                  <p className="text-xl font-bold text-white">{scheduleData.filter(item => item.format !== 'break' && item.topic).length}</p>
                </div>
                <BookOpen className="h-6 w-6 text-white opacity-80" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
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
              onClick={() => setShowAddModal(true)}
              className="flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Add Session</span>
            </button>
          </div>
        </div>
      </div>

      {/* Schedule Table */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-secondary-800">
            {weekFilter === 'all' ? 'Complete Schedule' : `Week ${weekFilter} Schedule`}
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Session</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Format</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Topic / Session</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trainer</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSchedule.map((item, index) => (
                <tr 
                  key={index} 
                  className={`
                    ${item.format === 'break' && item.topic.startsWith('Week') ? 'bg-primary-50' : ''}
                    ${item.format === 'break' && !item.topic ? 'bg-gray-25' : ''}
                    hover:bg-gray-50 transition-colors
                  `}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className={`text-sm font-medium ${
                        item.format === 'break' && item.topic.startsWith('Week') 
                          ? 'text-primary-600' 
                          : 'text-gray-900'
                      }`}>
                        SESSION {item.session}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-500">
                      {item.format !== 'break' || item.topic.startsWith('Week') ? getDateForSession(item.session) : ''}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {item.format !== 'break' && (
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getFormatColor(item.format)}`}>
                          {getFormatIcon(item.format)}
                          <span className="ml-1 capitalize">{item.format === 'physical' ? 'Physical workshop' : 'Live virtual workshop'}</span>
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm font-medium ${
                        item.topic.startsWith('Week') 
                          ? 'text-primary-600 text-lg' 
                          : 'text-gray-900'
                      }`}>
                        {item.topic}
                      </span>
                      {item.sessionType !== 'break' && item.topic && (
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getSessionTypeColor(item.sessionType)}`}>
                          {item.sessionType.charAt(0).toUpperCase() + item.sessionType.slice(1)}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-500">
                      {item.time && (
                        <>
                          <Clock className="h-4 w-4 mr-1" />
                          {item.time}
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {item.trainer && (
                      <div className="flex items-center text-sm text-gray-900">
                        <User className="h-4 w-4 mr-2 text-gray-400" />
                        {item.trainer}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {item.format !== 'break' || item.topic.startsWith('Week') ? (
                      <div className="flex items-center space-x-2">
                        {/* Class Session Button - only for actual sessions, not week headers */}
                        {!item.topic.startsWith('Week') && item.topic && (
                          <button
                            onClick={() => navigate(`/portal/learning/cohort/${cohortId}/session/${item.session}`)}
                            className="text-green-600 hover:text-green-800 p-1 rounded transition-colors"
                            title="Start class session"
                          >
                            <Video className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleEditItem(item)}
                          className="text-blue-600 hover:text-blue-800 p-1 rounded transition-colors"
                          title="Edit session"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        {!item.topic.startsWith('Week') && (
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
      </div>

      {/* Legend */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-secondary-800 mb-4">Legend</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
  onSave: (item: Omit<ScheduleItem, 'session' | 'cohortId'>) => void;
  maxSession: number;
}> = ({ onClose, onSave, maxSession }) => {
  const [formData, setFormData] = useState({
    week: Math.ceil(maxSession / 7),
    format: 'physical' as const,
    topic: '',
    time: '',
    trainer: '',
    sessionType: 'workshop' as const
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.topic.trim()) {
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Format</label>
            <select
              value={formData.format}
              onChange={(e) => setFormData({...formData, format: e.target.value as any})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="physical">Physical Workshop</option>
              <option value="virtual">Virtual Workshop</option>
              <option value="self-paced">Self-Paced</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Topic/Session</label>
            <input
              type="text"
              value={formData.topic}
              onChange={(e) => setFormData({...formData, topic: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="Enter session topic"
              required
            />
          </div>

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
    format: item.format,
    topic: item.topic,
    time: item.time || '',
    trainer: item.trainer || '',
    sessionType: item.sessionType
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Format</label>
            <select
              value={formData.format}
              onChange={(e) => setFormData({...formData, format: e.target.value as any})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="physical">Physical Workshop</option>
              <option value="virtual">Virtual Workshop</option>
              <option value="self-paced">Self-Paced</option>
              <option value="break">Break</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Topic/Session</label>
            <input
              type="text"
              value={formData.topic}
              onChange={(e) => setFormData({...formData, topic: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="Enter session topic"
            />
          </div>

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
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Schedule;
