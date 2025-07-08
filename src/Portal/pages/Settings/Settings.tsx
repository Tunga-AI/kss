import React, { useState } from 'react';
import { Settings as SettingsIcon, Building, Users, Bell, Shield, Database, Palette } from 'lucide-react';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general', label: 'General', icon: Building },
    { id: 'users', label: 'Users & Permissions', icon: Users },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'data', label: 'Data & Backup', icon: Database },
    { id: 'appearance', label: 'Appearance', icon: Palette },
  ];

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="bg-primary-600 text-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Settings</h1>
            <p className="text-lg text-primary-100">
              Configure system settings and manage institutional preferences.
            </p>
          </div>
          <div className="bg-white bg-opacity-20 p-4 rounded-xl">
            <SettingsIcon className="h-8 w-8 text-white" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors duration-200 ${
                      activeTab === tab.id
                        ? 'bg-primary-600 text-white'
                        : 'text-secondary-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            {activeTab === 'general' && (
              <div>
                <h2 className="text-2xl font-bold text-secondary-800 mb-6">General Settings</h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Institution Name
                    </label>
                    <input
                      type="text"
                      defaultValue="Msomi Learning Institution"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        Time Zone
                      </label>
                      <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                        <option>UTC-5 (Eastern Time)</option>
                        <option>UTC-8 (Pacific Time)</option>
                        <option>UTC+0 (Greenwich Mean Time)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        Academic Year
                      </label>
                      <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                        <option>2024-2025</option>
                        <option>2025-2026</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Institution Address
                    </label>
                    <textarea
                      rows={3}
                      defaultValue="123 Education Street, Learning City, LC 12345"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                    />
                  </div>

                  <button className="bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors duration-200">
                    Save Changes
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div>
                <h2 className="text-2xl font-bold text-secondary-800 mb-6">Users & Permissions</h2>
                <div className="text-center py-12">
                  <Users className="h-16 w-16 text-secondary-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-secondary-800 mb-2">User Management</h3>
                  <p className="text-secondary-600">Configure user roles and permissions here.</p>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div>
                <h2 className="text-2xl font-bold text-secondary-800 mb-6">Notification Settings</h2>
                <div className="space-y-6">
                  {[
                    { title: 'Email Notifications', description: 'Send notifications via email' },
                    { title: 'SMS Notifications', description: 'Send notifications via SMS' },
                    { title: 'Push Notifications', description: 'Send push notifications to mobile devices' },
                    { title: 'System Alerts', description: 'Enable system maintenance alerts' },
                    { title: 'Academic Reminders', description: 'Send academic deadline reminders' },
                  ].map((setting, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h3 className="font-semibold text-secondary-800">{setting.title}</h3>
                        <p className="text-sm text-secondary-600">{setting.description}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div>
                <h2 className="text-2xl font-bold text-secondary-800 mb-6">Security Settings</h2>
                <div className="space-y-6">
                  <div className="p-6 bg-gray-50 rounded-lg">
                    <h3 className="text-lg font-semibold text-secondary-800 mb-2">Password Policy</h3>
                    <p className="text-secondary-600 mb-4">Configure password requirements for all users</p>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <input type="checkbox" defaultChecked className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                        <span className="text-secondary-700">Minimum 8 characters</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <input type="checkbox" defaultChecked className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                        <span className="text-secondary-700">Require uppercase letters</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <input type="checkbox" defaultChecked className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                        <span className="text-secondary-700">Require numbers</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <input type="checkbox" className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                        <span className="text-secondary-700">Require special characters</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-gray-50 rounded-lg">
                    <h3 className="text-lg font-semibold text-secondary-800 mb-2">Session Management</h3>
                    <p className="text-secondary-600 mb-4">Configure user session settings</p>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-2">
                          Session Timeout (minutes)
                        </label>
                        <input
                          type="number"
                          defaultValue="30"
                          className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                      <div className="flex items-center space-x-3">
                        <input type="checkbox" defaultChecked className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                        <span className="text-secondary-700">Enable automatic logout</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'data' && (
              <div>
                <h2 className="text-2xl font-bold text-secondary-800 mb-6">Data & Backup</h2>
                <div className="text-center py-12">
                  <Database className="h-16 w-16 text-secondary-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-secondary-800 mb-2">Data Management</h3>
                  <p className="text-secondary-600">Configure data backup and export settings here.</p>
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div>
                <h2 className="text-2xl font-bold text-secondary-800 mb-6">Appearance Settings</h2>
                <div className="text-center py-12">
                  <Palette className="h-16 w-16 text-secondary-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-secondary-800 mb-2">Theme & Branding</h3>
                  <p className="text-secondary-600">Customize the appearance and branding here.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;