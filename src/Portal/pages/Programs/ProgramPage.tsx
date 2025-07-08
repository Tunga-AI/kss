import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, BookOpen, Plus, Trash2, Edit } from 'lucide-react';
import { ProgramService } from '../../../services/firestore';

interface ProgramData {
  id?: string;
  programName: string;
  programCode: string;
  programDuration: string;
  shortDescription: string;
  objectives: string[];
  whoIsItFor: string;
  level: number;
  capabilities: string[];
  capabilityBreakdown: { capability: string; description: string }[];
  competencyAlignment: string[];
  modules: { name: string; description: string; duration: string }[];
  keySessions: { session: string; topics: string[]; duration: string }[];
  schedule: {
    startDate: string;
    endDate: string;
    sessions: { day: string; time: string; topic: string }[];
  };
  status: 'draft' | 'active' | 'archived';
}

const ProgramPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(!id); // New program = editing mode

  const [programData, setProgramData] = useState<ProgramData>({
    programName: '',
    programCode: '',
    programDuration: '',
    shortDescription: '',
    objectives: [''],
    whoIsItFor: '',
    level: 1,
    capabilities: [''],
    capabilityBreakdown: [{ capability: '', description: '' }],
    competencyAlignment: [''],
    modules: [{ name: '', description: '', duration: '' }],
    keySessions: [{ session: '', topics: [''], duration: '' }],
    schedule: {
      startDate: '',
      endDate: '',
      sessions: [{ day: '', time: '', topic: '' }]
    },
    status: 'draft'
  });

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'outlines', label: 'Outlines' },
    { id: 'schedule', label: 'Schedule' },
  ];

  useEffect(() => {
    if (id) {
      loadProgram();
    }
  }, [id]);

  const loadProgram = async () => {
    setLoading(true);
    try {
      const result = await ProgramService.getById('programs', id!);
      if (result.success) {
        setProgramData(result.data as ProgramData);
      }
    } catch (error) {
      console.error('Error loading program:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let result;
      if (id) {
        result = await ProgramService.update('programs', id, programData);
      } else {
        result = await ProgramService.create('programs', programData);
      }

      if (result.success) {
        if (!id && result.id) {
          navigate(`/portal/programs/${result.id}`);
        }
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error saving program:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setProgramData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleArrayChange = (field: string, index: number, value: string) => {
    setProgramData(prev => ({
      ...prev,
      [field]: prev[field as keyof ProgramData].map((item: any, i: number) => 
        i === index ? value : item
      )
    }));
  };

  const addArrayItem = (field: string, defaultValue: any = '') => {
    setProgramData(prev => ({
      ...prev,
      [field]: [...prev[field as keyof ProgramData], defaultValue]
    }));
  };

  const removeArrayItem = (field: string, index: number) => {
    setProgramData(prev => ({
      ...prev,
      [field]: prev[field as keyof ProgramData].filter((_: any, i: number) => i !== index)
    }));
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
      {/* Hero Section */}
      <div className="bg-primary-600 text-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/portal/programs')}
              className="bg-white bg-opacity-20 p-2 rounded-lg hover:bg-opacity-30 transition-colors duration-200"
            >
              <ArrowLeft className="h-6 w-6 text-white" />
            </button>
            <div>
              <h1 className="text-4xl font-bold mb-2">
                {id ? (isEditing ? 'Edit Program' : programData.programName || 'Program Details') : 'New Program'}
              </h1>
              <p className="text-lg text-primary-100">
                {id ? 'Manage program details, outlines, and schedule' : 'Create a new academic program'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {id && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-white bg-opacity-20 text-white px-4 py-2 rounded-lg font-medium hover:bg-opacity-30 transition-colors duration-200 flex items-center space-x-2"
              >
                <Edit className="h-4 w-4" />
                <span>Edit</span>
              </button>
            )}
            {isEditing && (
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-white text-primary-600 px-6 py-2 rounded-lg font-medium hover:bg-gray-100 disabled:opacity-50 transition-colors duration-200 flex items-center space-x-2"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span>{saving ? 'Saving...' : 'Save Program'}</span>
              </button>
            )}
            <div className="bg-white bg-opacity-20 p-4 rounded-xl">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
          </div>
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
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-secondary-800 mb-6">Program Overview</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Program Name *
                  </label>
                  <input
                    type="text"
                    value={programData.programName}
                    onChange={(e) => handleInputChange('programName', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                    placeholder="Enter program name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Program Code *
                  </label>
                  <input
                    type="text"
                    value={programData.programCode}
                    onChange={(e) => handleInputChange('programCode', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                    placeholder="e.g., CS101"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Program Duration *
                  </label>
                  <input
                    type="text"
                    value={programData.programDuration}
                    onChange={(e) => handleInputChange('programDuration', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                    placeholder="e.g., 4 years, 6 months"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Level *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={programData.level}
                    onChange={(e) => handleInputChange('level', parseInt(e.target.value))}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Short Description *
                </label>
                <textarea
                  rows={4}
                  value={programData.shortDescription}
                  onChange={(e) => handleInputChange('shortDescription', e.target.value)}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 resize-none"
                  placeholder="Brief description of the program"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Who Is It For
                </label>
                <textarea
                  rows={3}
                  value={programData.whoIsItFor}
                  onChange={(e) => handleInputChange('whoIsItFor', e.target.value)}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 resize-none"
                  placeholder="Target audience for this program"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-secondary-700">
                    Program Objectives
                  </label>
                  {isEditing && (
                    <button
                      onClick={() => addArrayItem('objectives', '')}
                      className="text-primary-600 hover:text-primary-700 flex items-center space-x-1"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Objective</span>
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                  {programData.objectives.map((objective, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <input
                        type="text"
                        value={objective}
                        onChange={(e) => handleArrayChange('objectives', index, e.target.value)}
                        disabled={!isEditing}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                        placeholder={`Objective ${index + 1}`}
                      />
                      {isEditing && programData.objectives.length > 1 && (
                        <button
                          onClick={() => removeArrayItem('objectives', index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'outlines' && (
            <div className="space-y-8">
              <h2 className="text-2xl font-bold text-secondary-800 mb-6">Program Outlines</h2>
              
              {/* Capabilities */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-secondary-700">
                    Capabilities
                  </label>
                  {isEditing && (
                    <button
                      onClick={() => addArrayItem('capabilities', '')}
                      className="text-primary-600 hover:text-primary-700 flex items-center space-x-1"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Capability</span>
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                  {programData.capabilities.map((capability, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <input
                        type="text"
                        value={capability}
                        onChange={(e) => handleArrayChange('capabilities', index, e.target.value)}
                        disabled={!isEditing}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                        placeholder={`Capability ${index + 1}`}
                      />
                      {isEditing && programData.capabilities.length > 1 && (
                        <button
                          onClick={() => removeArrayItem('capabilities', index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Capability Breakdown */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-secondary-700">
                    Capability Breakdown
                  </label>
                  {isEditing && (
                    <button
                      onClick={() => addArrayItem('capabilityBreakdown', { capability: '', description: '' })}
                      className="text-primary-600 hover:text-primary-700 flex items-center space-x-1"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Breakdown</span>
                    </button>
                  )}
                </div>
                <div className="space-y-4">
                  {programData.capabilityBreakdown.map((item, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-medium text-secondary-800">Breakdown {index + 1}</h4>
                        {isEditing && programData.capabilityBreakdown.length > 1 && (
                          <button
                            onClick={() => removeArrayItem('capabilityBreakdown', index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={item.capability}
                          onChange={(e) => {
                            const newBreakdown = [...programData.capabilityBreakdown];
                            newBreakdown[index] = { ...newBreakdown[index], capability: e.target.value };
                            handleInputChange('capabilityBreakdown', newBreakdown);
                          }}
                          disabled={!isEditing}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                          placeholder="Capability name"
                        />
                        <textarea
                          rows={3}
                          value={item.description}
                          onChange={(e) => {
                            const newBreakdown = [...programData.capabilityBreakdown];
                            newBreakdown[index] = { ...newBreakdown[index], description: e.target.value };
                            handleInputChange('capabilityBreakdown', newBreakdown);
                          }}
                          disabled={!isEditing}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 resize-none"
                          placeholder="Capability description"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Competency Alignment */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-secondary-700">
                    Competency Alignment
                  </label>
                  {isEditing && (
                    <button
                      onClick={() => addArrayItem('competencyAlignment', '')}
                      className="text-primary-600 hover:text-primary-700 flex items-center space-x-1"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Competency</span>
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                  {programData.competencyAlignment.map((competency, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <input
                        type="text"
                        value={competency}
                        onChange={(e) => handleArrayChange('competencyAlignment', index, e.target.value)}
                        disabled={!isEditing}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                        placeholder={`Competency ${index + 1}`}
                      />
                      {isEditing && programData.competencyAlignment.length > 1 && (
                        <button
                          onClick={() => removeArrayItem('competencyAlignment', index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Modules */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-secondary-700">
                    Modules
                  </label>
                  {isEditing && (
                    <button
                      onClick={() => addArrayItem('modules', { name: '', description: '', duration: '' })}
                      className="text-primary-600 hover:text-primary-700 flex items-center space-x-1"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Module</span>
                    </button>
                  )}
                </div>
                <div className="space-y-4">
                  {programData.modules.map((module, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-medium text-secondary-800">Module {index + 1}</h4>
                        {isEditing && programData.modules.length > 1 && (
                          <button
                            onClick={() => removeArrayItem('modules', index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                          type="text"
                          value={module.name}
                          onChange={(e) => {
                            const newModules = [...programData.modules];
                            newModules[index] = { ...newModules[index], name: e.target.value };
                            handleInputChange('modules', newModules);
                          }}
                          disabled={!isEditing}
                          className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                          placeholder="Module name"
                        />
                        <input
                          type="text"
                          value={module.duration}
                          onChange={(e) => {
                            const newModules = [...programData.modules];
                            newModules[index] = { ...newModules[index], duration: e.target.value };
                            handleInputChange('modules', newModules);
                          }}
                          disabled={!isEditing}
                          className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                          placeholder="Duration"
                        />
                      </div>
                      <textarea
                        rows={3}
                        value={module.description}
                        onChange={(e) => {
                          const newModules = [...programData.modules];
                          newModules[index] = { ...newModules[index], description: e.target.value };
                          handleInputChange('modules', newModules);
                        }}
                        disabled={!isEditing}
                        className="w-full mt-3 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 resize-none"
                        placeholder="Module description"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Key Sessions */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-secondary-700">
                    Key Sessions
                  </label>
                  {isEditing && (
                    <button
                      onClick={() => addArrayItem('keySessions', { session: '', topics: [''], duration: '' })}
                      className="text-primary-600 hover:text-primary-700 flex items-center space-x-1"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Session</span>
                    </button>
                  )}
                </div>
                <div className="space-y-4">
                  {programData.keySessions.map((session, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-medium text-secondary-800">Session {index + 1}</h4>
                        {isEditing && programData.keySessions.length > 1 && (
                          <button
                            onClick={() => removeArrayItem('keySessions', index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <input
                          type="text"
                          value={session.session}
                          onChange={(e) => {
                            const newSessions = [...programData.keySessions];
                            newSessions[index] = { ...newSessions[index], session: e.target.value };
                            handleInputChange('keySessions', newSessions);
                          }}
                          disabled={!isEditing}
                          className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                          placeholder="Session name"
                        />
                        <input
                          type="text"
                          value={session.duration}
                          onChange={(e) => {
                            const newSessions = [...programData.keySessions];
                            newSessions[index] = { ...newSessions[index], duration: e.target.value };
                            handleInputChange('keySessions', newSessions);
                          }}
                          disabled={!isEditing}
                          className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                          placeholder="Duration"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-2">Topics</label>
                        <div className="space-y-2">
                          {session.topics.map((topic, topicIndex) => (
                            <div key={topicIndex} className="flex items-center space-x-2">
                              <input
                                type="text"
                                value={topic}
                                onChange={(e) => {
                                  const newSessions = [...programData.keySessions];
                                  newSessions[index].topics[topicIndex] = e.target.value;
                                  handleInputChange('keySessions', newSessions);
                                }}
                                disabled={!isEditing}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                                placeholder={`Topic ${topicIndex + 1}`}
                              />
                              {isEditing && (
                                <>
                                  {session.topics.length > 1 && (
                                    <button
                                      onClick={() => {
                                        const newSessions = [...programData.keySessions];
                                        newSessions[index].topics = newSessions[index].topics.filter((_, i) => i !== topicIndex);
                                        handleInputChange('keySessions', newSessions);
                                      }}
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  )}
                                  {topicIndex === session.topics.length - 1 && (
                                    <button
                                      onClick={() => {
                                        const newSessions = [...programData.keySessions];
                                        newSessions[index].topics.push('');
                                        handleInputChange('keySessions', newSessions);
                                      }}
                                      className="text-primary-600 hover:text-primary-700"
                                    >
                                      <Plus className="h-4 w-4" />
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'schedule' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-secondary-800 mb-6">Program Schedule</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={programData.schedule.startDate}
                    onChange={(e) => handleInputChange('schedule', { ...programData.schedule, startDate: e.target.value })}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={programData.schedule.endDate}
                    onChange={(e) => handleInputChange('schedule', { ...programData.schedule, endDate: e.target.value })}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-secondary-700">
                    Schedule Sessions
                  </label>
                  {isEditing && (
                    <button
                      onClick={() => {
                        const newSchedule = { ...programData.schedule };
                        newSchedule.sessions.push({ day: '', time: '', topic: '' });
                        handleInputChange('schedule', newSchedule);
                      }}
                      className="text-primary-600 hover:text-primary-700 flex items-center space-x-1"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Session</span>
                    </button>
                  )}
                </div>
                <div className="space-y-4">
                  {programData.schedule.sessions.map((session, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-medium text-secondary-800">Session {index + 1}</h4>
                        {isEditing && programData.schedule.sessions.length > 1 && (
                          <button
                            onClick={() => {
                              const newSchedule = { ...programData.schedule };
                              newSchedule.sessions = newSchedule.sessions.filter((_, i) => i !== index);
                              handleInputChange('schedule', newSchedule);
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input
                          type="text"
                          value={session.day}
                          onChange={(e) => {
                            const newSchedule = { ...programData.schedule };
                            newSchedule.sessions[index] = { ...newSchedule.sessions[index], day: e.target.value };
                            handleInputChange('schedule', newSchedule);
                          }}
                          disabled={!isEditing}
                          className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                          placeholder="Day (e.g., Monday)"
                        />
                        <input
                          type="time"
                          value={session.time}
                          onChange={(e) => {
                            const newSchedule = { ...programData.schedule };
                            newSchedule.sessions[index] = { ...newSchedule.sessions[index], time: e.target.value };
                            handleInputChange('schedule', newSchedule);
                          }}
                          disabled={!isEditing}
                          className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                        />
                        <input
                          type="text"
                          value={session.topic}
                          onChange={(e) => {
                            const newSchedule = { ...programData.schedule };
                            newSchedule.sessions[index] = { ...newSchedule.sessions[index], topic: e.target.value };
                            handleInputChange('schedule', newSchedule);
                          }}
                          disabled={!isEditing}
                          className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                          placeholder="Topic/Subject"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProgramPage;