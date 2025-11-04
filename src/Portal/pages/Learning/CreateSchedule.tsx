import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Plus,
  Save,
  Trash2,
  Copy,
  BookOpen,
  User,
  MapPin,
  Monitor,
  Target,
  Activity,
  CheckCircle,
  AlertCircle,
  UserCheck
} from 'lucide-react';
import { FirestoreService } from '../../../services/firestore';
import { InstructorService } from '../../../services/instructorService';
import { Instructor, InstructorAssignment } from '../../../types/instructor';

interface ScheduleItem {
  id?: string;
  session: number;
  week: number;
  date?: string;
  time?: string;
  moduleFocus?: string;
  sessionTitle?: string;
  activity?: string;
  trainingDeck?: string;
  trainer?: string;
  instructorId?: string;
  instructorName?: string;
  quadrantMapping?: string;
  deliveryMode?: 'physical' | 'virtual' | 'self-paced' | 'break';
  survey?: string;
  surveyFeedback?: string;
  trainerObservationNotes?: string;
  attendance?: string;
  submissionOfAssignments?: string;
  virtualSessionRecording?: string;
  sessionType: 'workshop' | 'lecture' | 'project' | 'break' | 'assessment';
  intakeId: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Intake {
  id: string;
  intakeId: string;
  name: string;
  programId?: string;
  startDate: string;
  closeDate: string;
  status: string;
}

const CreateSchedule: React.FC = () => {
  const navigate = useNavigate();
  const { intakeId } = useParams<{ intakeId: string }>();
  
  const [intake, setIntake] = useState<Intake | null>(null);
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(1);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [availableInstructors, setAvailableInstructors] = useState<Instructor[]>([]);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  // Form state for adding new sessions
  const [newSession, setNewSession] = useState({
    week: 1,
    date: '',
    time: '9:00 AM - 5:00 PM',
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

  useEffect(() => {
    if (intakeId) {
      loadIntakeData();
      loadInstructors();
    }
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

  const loadInstructors = async () => {
    try {
      const activeInstructors = await InstructorService.getActiveInstructors();
      setInstructors(activeInstructors);
    } catch (error) {
      console.error('Error loading instructors:', error);
    }
  };

  const checkInstructorAvailability = async (date: string, time: string, subject: string) => {
    if (!date || !time) {
      setAvailableInstructors(instructors);
      return;
    }

    setCheckingAvailability(true);
    try {
      const [startTime, endTime] = time.split(' - ');
      const available: Instructor[] = [];

      for (const instructor of instructors) {
        if (instructor.id && instructor.subjects?.includes(subject)) {
          const availability = await InstructorService.checkInstructorAvailability(
            instructor.id,
            date,
            startTime,
            endTime
          );
          if (availability.isAvailable) {
            available.push(instructor);
          }
        }
      }

      setAvailableInstructors(available);
    } catch (error) {
      console.error('Error checking availability:', error);
      setAvailableInstructors(instructors);
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleDateTimeChange = (field: 'date' | 'time', value: string) => {
    setNewSession({ ...newSession, [field]: value });
    if (field === 'date' || field === 'time') {
      checkInstructorAvailability(
        field === 'date' ? value : newSession.date,
        field === 'time' ? value : newSession.time,
        newSession.moduleFocus
      );
    }
  };

  const handleInstructorSelect = (instructorId: string) => {
    const instructor = instructors.find(i => i.id === instructorId);
    if (instructor) {
      setNewSession({
        ...newSession,
        instructorId,
        instructorName: `${instructor.firstName} ${instructor.lastName}`,
        trainer: `${instructor.firstName} ${instructor.lastName}`
      });
    }
  };

  const addSession = () => {
    if (!newSession.sessionTitle.trim()) {
      alert('Please enter a session title');
      return;
    }

    const sessionNumber = scheduleItems.length + 1;
    const session: ScheduleItem = {
      ...newSession,
      session: sessionNumber,
      intakeId: intakeId!,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setScheduleItems([...scheduleItems, session]);
    
    // Reset form but keep some defaults
    setNewSession({
      ...newSession,
      sessionTitle: '',
      activity: '',
      week: currentWeek,
      moduleFocus: '',
      trainingDeck: '',
      quadrantMapping: '',
      survey: '',
      surveyFeedback: '',
      trainerObservationNotes: '',
      attendance: '',
      submissionOfAssignments: '',
      virtualSessionRecording: ''
    });
  };

  const removeSession = (sessionNumber: number) => {
    if (!confirm('Are you sure you want to remove this session?')) return;
    
    const filtered = scheduleItems.filter(item => item.session !== sessionNumber);
    // Reorder session numbers
    const reordered = filtered.map((item, index) => ({
      ...item,
      session: index + 1
    }));
    setScheduleItems(reordered);
  };

  const duplicateSession = (sessionNumber: number) => {
    const sessionToDuplicate = scheduleItems.find(item => item.session === sessionNumber);
    if (!sessionToDuplicate) return;

    const newSessionNumber = scheduleItems.length + 1;
    const duplicatedSession: ScheduleItem = {
      ...sessionToDuplicate,
      session: newSessionNumber,
      sessionTitle: `${sessionToDuplicate.sessionTitle} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setScheduleItems([...scheduleItems, duplicatedSession]);
  };

  const updateSession = (sessionNumber: number, updates: Partial<ScheduleItem>) => {
    setScheduleItems(items => items.map(item => 
      item.session === sessionNumber 
        ? { ...item, ...updates, updatedAt: new Date().toISOString() }
        : item
    ));
  };

  const generateWeekHeaders = () => {
    const weeks = Array.from(new Set(scheduleItems.map(item => item.week))).sort();
    const headers: ScheduleItem[] = [];
    
    weeks.forEach(week => {
      const weekSessions = scheduleItems.filter(item => item.week === week);
      if (weekSessions.length > 0) {
        const headerSession: ScheduleItem = {
          session: weekSessions[0].session - 0.5, // Place before first session of the week
          week: week,
          sessionTitle: `Week ${week}`,
          deliveryMode: 'break',
          sessionType: 'break',
          intakeId: intakeId!,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        headers.push(headerSession);
      }
    });
    
    return headers;
  };

  const saveSchedule = async () => {
    if (scheduleItems.length === 0) {
      alert('Please add at least one session to create a schedule');
      return;
    }

    setSaving(true);
    try {
      const timestamp = new Date().toISOString();
      
      // Create a properly structured schedule with sessions only
      // Sort sessions first by week, then by their order within the week
      const sortedSessions = [...scheduleItems].sort((a, b) => {
        if (a.week !== b.week) {
          return a.week - b.week;
        }
        return a.session - b.session;
      });

      // Renumber all sessions sequentially
      const numberedSessions = sortedSessions.map((item, index) => ({
        ...item,
        session: index + 1,
        createdAt: item.createdAt || timestamp,
        updatedAt: timestamp
      }));

      const scheduleDocument = {
        intakeId: intakeId!,
        sessions: numberedSessions,
        createdAt: timestamp,
        updatedAt: timestamp
      };
      
      console.log('Creating schedule document:', scheduleDocument);
      
      const result = await FirestoreService.createOrUpdate('schedules', intakeId!, scheduleDocument);
      
      if (result.success) {
        // Create instructor assignments for sessions with assigned instructors
        const assignmentPromises = numberedSessions
          .filter(session => session.instructorId)
          .map(async session => {
            const assignment: InstructorAssignment = {
              instructorId: session.instructorId!,
              instructorName: session.instructorName || session.trainer || '',
              sessionId: `${intakeId}-session-${session.session}`,
              intakeId: intakeId!,
              programId: intake?.programId || '',
              sessionDate: session.date || '',
              sessionTime: session.time || '',
              sessionTitle: session.sessionTitle || '',
              sessionType: session.sessionType === 'workshop' ? 'workshop' : 
                          session.sessionType === 'lecture' ? 'lecture' : 
                          session.sessionType === 'assessment' ? 'assessment' : 'practical',
              assignedDate: timestamp,
              assignedBy: 'System',
              status: 'confirmed'
            };
            
            return InstructorService.assignInstructorToSession(assignment);
          });
        
        // Wait for all assignments to be created
        await Promise.all(assignmentPromises);
        
        alert('✅ Schedule created successfully with instructor assignments!');
        navigate(`/portal/learning/intake/${intakeId}/schedule`);
      } else {
        console.error('Failed to create schedule:', result);
        alert('⚠️ Schedule could not be created. Please try again.');
      }
    } catch (error) {
      console.error('Error creating schedule:', error);
      alert('❌ Error creating schedule. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const addWeekBreak = () => {
    setCurrentWeek(prev => prev + 1);
    setNewSession({
      ...newSession,
      week: currentWeek + 1
    });
  };

  const getDateForSession = (sessionNumber: number): string => {
    if (!intake?.startDate) return '';
    const startDate = new Date(intake.startDate);
    const targetDate = new Date(startDate);
    targetDate.setDate(startDate.getDate() + (sessionNumber - 1));
    return targetDate.toISOString().split('T')[0];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-2xl shadow-lg p-6 md:p-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(`/portal/learning/intake/${intakeId}/schedule`)}
              className="p-2 text-primary-100 hover:text-white transition-colors duration-200 bg-white bg-opacity-20 rounded-lg"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl md:text-4xl font-bold mb-2">Create Schedule</h1>
              <p className="text-lg text-primary-100">
                {intake ? `${intake.name} - Build your custom program schedule` : 'Build your custom program schedule'}
              </p>
            </div>
          </div>
          <div className="bg-white bg-opacity-20 p-4 rounded-xl">
            <Calendar className="h-6 w-6 md:h-8 md:w-8 text-white" />
          </div>
        </div>

        {/* Quick Stats */}
        {intake && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <div className="bg-white bg-opacity-10 backdrop-blur-sm p-4 rounded-xl border border-white border-opacity-20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-primary-100">Start Date</p>
                  <p className="text-lg font-bold text-white">{new Date(intake.startDate).toLocaleDateString()}</p>
                </div>
                <Calendar className="h-5 w-5 text-white opacity-80" />
              </div>
            </div>
            <div className="bg-white bg-opacity-10 backdrop-blur-sm p-4 rounded-xl border border-white border-opacity-20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-primary-100">Current Week</p>
                  <p className="text-lg font-bold text-white">Week {currentWeek}</p>
                </div>
                <Target className="h-5 w-5 text-white opacity-80" />
              </div>
            </div>
            <div className="bg-white bg-opacity-10 backdrop-blur-sm p-4 rounded-xl border border-white border-opacity-20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-primary-100">Sessions Added</p>
                  <p className="text-lg font-bold text-white">{scheduleItems.length}</p>
                </div>
                <BookOpen className="h-5 w-5 text-white opacity-80" />
              </div>
            </div>
            <div className="bg-white bg-opacity-10 backdrop-blur-sm p-4 rounded-xl border border-white border-opacity-20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-primary-100">Status</p>
                  <p className="text-lg font-bold text-white">Draft</p>
                </div>
                <Activity className="h-5 w-5 text-white opacity-80" />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Session Builder Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <Plus className="h-5 w-5 mr-2 text-primary-600" />
              Add New Session
            </h2>

            <div className="space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Week</label>
                  <select
                    value={newSession.week}
                    onChange={(e) => setNewSession({...newSession, week: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    {[...Array(20)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>Week {i + 1}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={newSession.date || ''}
                    onChange={(e) => handleDateTimeChange('date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                <input
                  type="text"
                  value={newSession.time}
                  onChange={(e) => handleDateTimeChange('time', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="9:00 AM - 5:00 PM"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Session Title *</label>
                <input
                  type="text"
                  value={newSession.sessionTitle}
                  onChange={(e) => setNewSession({...newSession, sessionTitle: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter session title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Module Focus</label>
                <input
                  type="text"
                  value={newSession.moduleFocus}
                  onChange={(e) => setNewSession({...newSession, moduleFocus: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter module focus"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Activity Description</label>
                <textarea
                  value={newSession.activity}
                  onChange={(e) => setNewSession({...newSession, activity: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Describe the session activities"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Mode</label>
                  <select
                    value={newSession.deliveryMode}
                    onChange={(e) => setNewSession({...newSession, deliveryMode: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="physical">Physical Workshop</option>
                    <option value="virtual">Virtual Workshop</option>
                    <option value="self-paced">Self-Paced</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Session Type</label>
                  <select
                    value={newSession.sessionType}
                    onChange={(e) => setNewSession({...newSession, sessionType: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="workshop">Workshop</option>
                    <option value="lecture">Lecture</option>
                    <option value="project">Project</option>
                    <option value="assessment">Assessment</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <UserCheck className="inline h-4 w-4 mr-1" />
                  Instructor
                </label>
                <select
                  value={newSession.instructorId || ''}
                  onChange={(e) => handleInstructorSelect(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select Instructor</option>
                  {checkingAvailability ? (
                    <option disabled>Checking availability...</option>
                  ) : (
                    availableInstructors.length > 0 ? (
                      availableInstructors.map(instructor => (
                        <option key={instructor.id} value={instructor.id}>
                          {instructor.firstName} {instructor.lastName}
                          {instructor.specializations?.length > 0 && 
                            ` - ${instructor.specializations.join(', ')}`}
                        </option>
                      ))
                    ) : (
                      instructors.map(instructor => (
                        <option key={instructor.id} value={instructor.id}>
                          {instructor.firstName} {instructor.lastName}
                          {instructor.specializations?.length > 0 && 
                            ` - ${instructor.specializations.join(', ')}`}
                        </option>
                      ))
                    )
                  )}
                </select>
                {newSession.date && newSession.time && availableInstructors.length === 0 && !checkingAvailability && (
                  <p className="text-xs text-orange-600 mt-1">
                    No instructors available for this time slot
                  </p>
                )}
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  onClick={addSession}
                  className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Session</span>
                </button>
                <button
                  onClick={addWeekBreak}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                  title="Move to next week"
                >
                  Week +
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Schedule Preview */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-primary-600" />
                Schedule Preview ({scheduleItems.length} sessions)
              </h2>
              <div className="flex space-x-3">
                <button
                  onClick={saveSchedule}
                  disabled={saving || scheduleItems.length === 0}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Create Schedule</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {scheduleItems.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">No Sessions Added Yet</h3>
                <p className="text-gray-600">Use the form on the left to start building your schedule.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {scheduleItems.map((item, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="bg-primary-100 text-primary-800 px-2 py-1 rounded-full text-xs font-medium">
                            Session {item.session}
                          </span>
                          <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-medium">
                            Week {item.week}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            item.deliveryMode === 'virtual' ? 'bg-green-100 text-green-800' :
                            item.deliveryMode === 'physical' ? 'bg-blue-100 text-blue-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            {item.deliveryMode === 'virtual' ? <Monitor className="h-3 w-3 inline mr-1" /> : <MapPin className="h-3 w-3 inline mr-1" />}
                            {item.deliveryMode}
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">{item.sessionTitle}</h3>
                        {item.moduleFocus && (
                          <p className="text-sm text-gray-600 mb-2"><strong>Focus:</strong> {item.moduleFocus}</p>
                        )}
                        {item.activity && (
                          <p className="text-sm text-gray-600 mb-2">{item.activity}</p>
                        )}
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          {item.time && (
                            <span className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {item.time}
                            </span>
                          )}
                          {item.trainer && (
                            <span className="flex items-center">
                              <User className="h-3 w-3 mr-1" />
                              {item.trainer}
                            </span>
                          )}
                          <span className="capitalize bg-gray-100 px-2 py-0.5 rounded text-gray-700">
                            {item.sessionType}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => duplicateSession(item.session)}
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Duplicate session"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => removeSession(item.session)}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          title="Remove session"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateSchedule;