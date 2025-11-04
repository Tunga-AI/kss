import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Building, 
  Users, 
  Bell, 
  Shield, 
  Database, 
  Palette,
  Save,
  Edit,
  X,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Upload,
  Download,
  RefreshCw,
  Globe,
  Mail,
  Phone,
  MapPin,
  Clock,
  Calendar,
  Banknote,
  Key,
  ExternalLink,
  Copy,
  TestTube,
  Type,
  Search,
  Filter,
  Plus,
  FileText,
  Trash2,
  CreditCard,
  MessageCircle
} from 'lucide-react';
import { FirestoreService } from '../../../services/firestore';
import { useAuthContext } from '../../../contexts/AuthContext';
import { EmailService } from '../../../services/emailService';
import { applyTheme, applyThemeColors, applyThemeFonts, applyCustomCSS, updateFavicon, updatePageTitle } from '../../../utils/themeUtils';
import SystemSettingsTab from './SystemSettingsTab';

interface SystemSettings {
  // General Settings
  institutionName: string;
  institutionEmail: string;
  institutionPhone: string;
  institutionAddress: string;
  timezone: string;
  dateFormat: string;
  currency: string;
  
  // Appearance Settings
  logoUrl: string;
  faviconUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  primaryFont: string;
  secondaryFont: string;
  accentFont: string;
  customCSS: string;
  enableDarkMode: boolean;
  
  // Email Settings
  emailProvider: string;
  emailFromName: string;
  emailFromAddress: string;
  emailReplyTo: string;
  
  // GSuite Settings
  gsuite: {
    enabled: boolean;
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    refreshToken: string;
    fromEmail: string;
    fromName: string;
    replyToEmail: string;
    verificationSecret: string;
  };
  

  // WhatsApp Settings
  whatsapp: {
    enabled: boolean;
    environment: 'sandbox' | 'live';
    accessToken: string;
    phoneNumberId: string;
    businessAccountId: string;
    webhookVerifyToken: string;
    apiVersion: string;
    webhookUrl: string;
    testPhoneNumber: string;
  };
  
  // Notification Settings
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  
  // Security Settings
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
  };
  sessionTimeout: number;
  maxLoginAttempts: number;
  
  // Integration Settings
  googleAnalyticsId: string;
  facebookPixelId: string;
  googleTagManagerId: string;
}

interface LetterTemplate {
  id: string;
  title: string;
  type: 'acceptance' | 'rejection' | 'payment_reminder' | 'interview_invitation' | 'document_request' | 'custom';
  subject: string;
  content: string;
  variables: string[];
  status: 'active' | 'draft';
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  usageCount: number;
}

interface LetterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (template: Partial<LetterTemplate>) => void;
  template: LetterTemplate | null;
  isEditing: boolean;
}

const LetterModal: React.FC<LetterModalProps> = ({ isOpen, onClose, onSave, template, isEditing }) => {
  const [formData, setFormData] = useState<Partial<LetterTemplate>>({
    title: '',
    type: 'custom',
    subject: '',
    content: '',
    variables: [],
    status: 'draft'
  });

  useEffect(() => {
    if (template && isEditing) {
      setFormData(template);
    } else if (!isEditing) {
      setFormData({
        title: '',
        type: 'custom',
        subject: '',
        content: '',
        variables: [],
        status: 'draft'
      });
    }
  }, [template, isEditing]);

  const predefinedTemplates = {
    acceptance: {
      title: 'Acceptance Letter',
      subject: 'Admission to KSS {{program_level}}',
      content: `[KSS Letterhead]

Date: {{current_date}}

To: {{applicant_name}}
Subject: Admission to KSS {{program_level}}

Dear {{applicant_name}},

Congratulations!

We are pleased to inform you that your application to the KSS {{program_name}} has been successful. Your experience in {{applicant_role}} and demonstrated competency in {{key_skill}} align strongly with this program's objectives.

Next Steps:
• Confirm your participation by {{confirmation_date}} via {{contact_method}}.
• Review the program schedule and pre-course materials attached.
• Payment of the program fee (KES {{program_fee}}) is due by {{payment_due_date}}.

We look forward to supporting your journey toward becoming a certified {{program_level}} professional.

Best regards,

{{sender_name}}
Admissions Committee Chair
Kenya School of Sales`,
      variables: ['applicant_name', 'program_level', 'program_name', 'applicant_role', 'key_skill', 'confirmation_date', 'contact_method', 'program_fee', 'payment_due_date', 'sender_name', 'current_date']
    },
    rejection: {
      title: 'Rejection Letter with Alternative Recommendation',
      subject: 'Application Outcome for KSS {{program_level}}',
      content: `[KSS Letterhead]

Date: {{current_date}}

To: {{applicant_name}}
Subject: Application Outcome for KSS {{program_level}}

Dear {{applicant_name}},

Thank you for applying to the KSS {{program_name}}. After careful review, we regret to inform you that your application has not been successful at this time.

Key Feedback:
• Your current experience ({{applicant_experience}} years) falls short of the {{program_level}} requirement ({{required_experience}} years).
• The assessment highlighted strengths in {{applicant_strengths}}, but gaps in {{improvement_areas}}.

Alternative Pathway:
We encourage you to apply for the {{alternative_program}}, which better matches your profile. This program will equip you with {{alternative_skills}} to prepare for future advancement.

To proceed, please confirm your interest by {{response_date}}.

Thank you for your understanding.

Best regards,

{{sender_name}}
Admissions Committee Chair
Kenya School of Sales`,
      variables: ['applicant_name', 'program_level', 'program_name', 'applicant_experience', 'required_experience', 'applicant_strengths', 'improvement_areas', 'alternative_program', 'alternative_skills', 'response_date', 'sender_name', 'current_date']
    }
  };

  const handleTypeChange = (type: string) => {
    setFormData(prev => ({ ...prev, type: type as any }));
    
    if (type in predefinedTemplates) {
      const template = predefinedTemplates[type as keyof typeof predefinedTemplates];
      setFormData(prev => ({
        ...prev,
        title: template.title,
        subject: template.subject,
        content: template.content,
        variables: template.variables
      }));
    }
  };

  const extractVariables = (text: string): string[] => {
    const matches = text.match(/\{\{([^}]+)\}\}/g);
    if (!matches) return [];
    return [...new Set(matches.map(match => match.slice(2, -2)))];
  };

  const handleContentChange = (content: string) => {
    const variables = extractVariables(content + ' ' + formData.subject);
    setFormData(prev => ({ ...prev, content, variables }));
  };

  const handleSubjectChange = (subject: string) => {
    const variables = extractVariables(formData.content + ' ' + subject);
    setFormData(prev => ({ ...prev, subject, variables }));
  };

  const handleSave = () => {
    if (!formData.title || !formData.content) {
      alert('Please fill in all required fields');
      return;
    }

    onSave({
      ...formData,
      variables: extractVariables(formData.content + ' ' + formData.subject)
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-bold text-secondary-800">
            {isEditing ? 'Edit Letter Template' : 'Create New Letter Template'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-secondary-400 hover:text-secondary-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form Section */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Template Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => handleTypeChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="acceptance">Acceptance Letter</option>
                  <option value="rejection">Rejection Letter</option>
                  <option value="payment_reminder">Payment Reminder</option>
                  <option value="interview_invitation">Interview Invitation</option>
                  <option value="document_request">Document Request</option>
                  <option value="custom">Custom Template</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Template Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter template title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Email Subject *
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => handleSubjectChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter email subject"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                </select>
              </div>

              {/* Variables Section */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Available Variables
                </label>
                <div className="bg-gray-50 rounded-lg p-3 max-h-32 overflow-y-auto">
                  {formData.variables && formData.variables.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {formData.variables.map((variable, index) => (
                        <span
                          key={index}
                          className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                        >
                          {`{{${variable}}}`}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No variables detected. Use {`{{variable_name}}`} syntax.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Content Section */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Letter Content *
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => handleContentChange(e.target.value)}
                rows={20}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono text-sm"
                placeholder="Enter letter content. Use double curly braces for dynamic content."
              />
              <p className="text-xs text-gray-500 mt-1">
                Use double curly braces for variables: {`{{applicant_name}}, {{program_name}}, etc.`}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-secondary-700 hover:bg-gray-50 transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200"
          >
            {isEditing ? 'Update Template' : 'Create Template'}
          </button>
        </div>
      </div>
    </div>
  );
};

const Settings: React.FC = () => {
  const { userProfile, user } = useAuthContext();
  const [activeTab, setActiveTab] = useState('general');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [lastSaveTime, setLastSaveTime] = useState<number>(0);
  const [showPasswords, setShowPasswords] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [testingWhatsApp, setTestingWhatsApp] = useState(false);

  // Letter templates state
  const [letterTemplates, setLetterTemplates] = useState<LetterTemplate[]>([]);
  const [letterModal, setLetterModal] = useState({
    isOpen: false,
    template: null as LetterTemplate | null,
    isEditing: false
  });
  const [letterSearchTerm, setLetterSearchTerm] = useState('');
  const [letterTypeFilter, setLetterTypeFilter] = useState('all');
  
  const [settings, setSettings] = useState<SystemSettings>({
    // General Settings
    institutionName: 'Kenya School of Sales (KSS)',
    institutionEmail: 'info@kenyaschoolofsales.co.ke',
    institutionPhone: '+254 700 123 456',
    institutionAddress: '123 Commercial Street',
    timezone: 'Africa/Nairobi',
    dateFormat: 'YYYY-MM-DD',
    currency: 'KES',
    
    // Appearance Settings
    logoUrl: '',
    faviconUrl: '',
    primaryColor: '#4590AD',
    secondaryColor: '#BD2D2B',
    accentColor: '#E39E41',
    primaryFont: 'Arial',
    secondaryFont: 'Helvetica',
    accentFont: 'Helvetica Neue',
    customCSS: '',
    enableDarkMode: false,
    
    // Email Settings
    emailProvider: 'Gmail',
    emailFromName: 'Kenya School of Sales',
    emailFromAddress: 'noreply@yourdomain.com',
    emailReplyTo: 'support@yourdomain.com',
    
    // GSuite Settings
    gsuite: {
      enabled: false,
      clientId: '',
      clientSecret: '',
      redirectUri: '',
      refreshToken: '',
      fromEmail: '',
      fromName: 'Kenya School of Sales',
      replyToEmail: 'support@yourdomain.com',
      verificationSecret: 'your-verification-secret',
    },
    

    // WhatsApp Settings
    whatsapp: {
      enabled: false,
      environment: 'sandbox',
      accessToken: '',
      phoneNumberId: '',
      businessAccountId: '',
      webhookVerifyToken: '',
      apiVersion: 'v18.0',
      webhookUrl: '',
      testPhoneNumber: '',
    },
    
    // Notification Settings
    emailNotifications: true,
    smsNotifications: true,
    pushNotifications: true,
    
    // Security Settings
    passwordPolicy: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: false,
    },
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    
    // Integration Settings
    googleAnalyticsId: '',
    facebookPixelId: '',
    googleTagManagerId: '',
  });

  const [originalSettings, setOriginalSettings] = useState<SystemSettings | null>(null);

  const tabs = [
    { id: 'general', label: 'General', icon: Building },
    { id: 'financial', label: 'Financial', icon: Banknote },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'gsuite', label: 'GSuite Email', icon: Mail },
    { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
    { id: 'letters', label: 'Letters', icon: Type },
  ];

  // Check if user has permission to edit settings
  const canEdit = userProfile?.role === 'admin';

  useEffect(() => {
    console.log('🚀 Settings component mounted - loading settings and templates');
    loadSettings();
    loadLetterTemplates();
  }, []);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const loadSettings = async () => {
    console.log('📥 loadSettings called');
    setLoading(true);
    try {
      const result = await FirestoreService.getById('settings', 'system');
      console.log('📊 Firestore result:', result);
      if (result.success && result.data) {
        // Clean up old properties that no longer exist in the interface
        const cleanedData = { ...result.data };
        
        // Remove old system settings properties
        delete cleanedData.maintenanceMode;
        delete cleanedData.backupFrequency;
        delete cleanedData.autoBackup;
        delete cleanedData.dataRetentionPeriod;
        delete cleanedData.maxFileUploadSize;
        delete cleanedData.allowedFileTypes;
        delete cleanedData.defaultLanguage;
        
        // Remove old GSuite properties
        if (cleanedData.gsuite) {
          delete cleanedData.gsuite.testEmail;
        }
        
        const loadedSettings = { ...settings, ...cleanedData };
        console.log('📋 Loaded settings from Firestore:', loadedSettings);
        console.log('🏢 Institution email loaded:', loadedSettings.institutionEmail);
        setSettings(loadedSettings);
        setOriginalSettings(loadedSettings);
        
        // Initialize theme with loaded settings
        if (loadedSettings.primaryColor && loadedSettings.secondaryColor && loadedSettings.accentColor) {
          applyThemeColors({
            primaryColor: loadedSettings.primaryColor,
            secondaryColor: loadedSettings.secondaryColor,
            accentColor: loadedSettings.accentColor
          });
        }
        
        if (loadedSettings.customCSS) {
          applyCustomCSS(loadedSettings.customCSS);
        }
        
        if (loadedSettings.faviconUrl) {
          updateFavicon(loadedSettings.faviconUrl);
        }
        
        if (loadedSettings.logoUrl) {
          updatePageTitle(loadedSettings.logoUrl, loadedSettings.institutionName || 'Kenya School of Sales');
        }
        
        // If we cleaned up old properties, save the cleaned version back to Firestore
        if (JSON.stringify(cleanedData) !== JSON.stringify(result.data)) {
          console.log('🧹 Cleaned up old properties, saving updated settings');
          await saveSettings(loadedSettings, false);
        }
      } else {
        // If no settings exist, create default ones
        console.log('🆕 No settings document found, creating default settings');
        await saveSettings(settings, false);
        setOriginalSettings(settings);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      setMessage({ type: 'error', text: 'Failed to load settings' });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (settingsToSave: SystemSettings = settings, showMessage: boolean = true) => {
    console.log('💾 saveSettings called with:', settingsToSave);
    console.log('📋 Current institutionEmail in settingsToSave:', settingsToSave.institutionEmail);
    
    // Rate limiting: prevent saves within 500ms of each other to avoid connection conflicts
    const now = Date.now();
    if (now - lastSaveTime < 500) {
      console.log('⏸️ Rate limiting: skipping save to prevent connection conflicts');
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    setLastSaveTime(now);
    
    setSaving(true);
    try {
      // Prepare settings data for saving
      const settingsWithId = { ...settingsToSave, id: 'system' };
      console.log('📤 Attempting to save settings with ID:', settingsWithId);
      console.log('🏢 Institution email being saved:', settingsWithId.institutionEmail);
      
      let result;
      
      // Check if document exists first to avoid update failures
      const existingDoc = await FirestoreService.getById('settings', 'system');
      console.log('📄 Existing document check:', existingDoc);
      
      if (existingDoc.success && existingDoc.data) {
        // Document exists, use update
        console.log('📝 Document exists, updating...');
        result = await FirestoreService.update('settings', 'system', settingsWithId);
        console.log('✅ Update result:', result);
      } else {
        // Document doesn't exist, use create
        console.log('📝 Document does not exist, creating...');
        result = await FirestoreService.create('settings', settingsWithId);
        console.log('✅ Create result:', result);
      }
      
      // Check if operation was successful
      if (!result.success) {
        throw new Error(result.error || 'Failed to save settings');
      }
      
      console.log('✅ Settings saved successfully!');
      
      // Update last save time for rate limiting
      setLastSaveTime(Date.now());
      
      // Small delay to prevent rapid-fire operations that cause connection conflicts
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // If GSuite settings are enabled, also save to Firebase Functions config
      if (settingsToSave.gsuite.enabled) {
        await saveGSuiteConfigToFirebase();
      }
      
      
      // If WhatsApp settings are enabled, also save to Firebase Functions config
      if (settingsToSave.whatsapp.enabled) {
        await saveWhatsAppConfigToFirebase(settingsToSave.whatsapp);
      }
      
      setOriginalSettings(settingsToSave);
      setIsEditing(false);
      
      if (showMessage) {
        setMessage({ type: 'success', text: 'Settings saved successfully!' });
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: 'Failed to save settings. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const saveGSuiteConfigToFirebase = async () => {
    if (!validateGSuiteConfig()) return;
    
    try {
      // This would typically save to Firebase Functions environment variables
      console.log('GSuite configuration:', settings.gsuite);
      setMessage({ type: 'success', text: 'GSuite configuration logged. Please update Firebase Functions environment variables manually.' });
    } catch (error) {
      console.error('Error saving GSuite config:', error);
      setMessage({ type: 'error', text: 'Failed to save GSuite configuration.' });
    }
  };


  const saveWhatsAppConfigToFirebase = async (whatsappConfig: SystemSettings['whatsapp']) => {
    try {
      // This would typically be done through Firebase Functions
      // For now, we'll just log the configuration
      console.log('WhatsApp configuration to save:', whatsappConfig);
      
      // In a real implementation, you would call a Firebase Function to update the config
      // Example:
      // await httpsCallable(functions, 'updateWhatsAppConfig')(whatsappConfig);
      
      setMessage({ 
        type: 'success', 
        text: 'WhatsApp configuration saved. Please also update Firebase Functions configuration manually.' 
      });
    } catch (error) {
      console.error('Error saving WhatsApp config:', error);
      setMessage({ 
        type: 'error', 
        text: 'WhatsApp configuration saved to settings, but failed to update Firebase Functions. Please update manually.' 
      });
    }
  };

  const handleNestedInputChange = (parent: string, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [parent]: {
        ...(prev as any)[parent],
        [field]: value
      }
    }));
  };

  const handleInputChange = (field: string, value: any) => {
    console.log(`🔧 handleInputChange called: ${field} = ${value}`); // Debug log
    
    // Handle nested fields (e.g., 'gsuite.enabled')
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      console.log(`📁 Processing nested field: ${parent}.${child} = ${value}`);
      handleNestedInputChange(parent, child, value);
    } else {
      setSettings(prev => {
        const oldValue = prev[field as keyof SystemSettings];
        const newSettings = {
          ...prev,
          [field]: value
        };
        console.log(`✅ Updated ${field}:`, { 
          oldValue, 
          newValue: value,
          hasChanged: oldValue !== value
        }); // Enhanced debug log
        return newSettings;
      });

      // Apply theme changes in real-time
      if (field === 'primaryColor' || field === 'secondaryColor' || field === 'accentColor') {
        applyThemeColors({
          primaryColor: field === 'primaryColor' ? value : settings.primaryColor,
          secondaryColor: field === 'secondaryColor' ? value : settings.secondaryColor,
          accentColor: field === 'accentColor' ? value : settings.accentColor
        });
      }

      // Apply custom CSS in real-time
      if (field === 'customCSS') {
        applyCustomCSS(value);
      }

      // Update favicon in real-time
      if (field === 'faviconUrl') {
        updateFavicon(value);
      }

      // Update logo in real-time
      if (field === 'logoUrl') {
        updatePageTitle(value, settings.institutionName || 'Kenya School of Sales');
      }
    }
  };

  const handleArrayInputChange = (field: string, value: string[]) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCancel = () => {
    if (originalSettings) {
      setSettings(originalSettings);
    }
    setIsEditing(false);
    setMessage(null);
  };

  const validateGSuiteConfig = () => {
    const requiredFields = ['clientId', 'clientSecret', 'refreshToken', 'fromEmail'];
    const missingFields = requiredFields.filter(field => !settings.gsuite[field as keyof typeof settings.gsuite]);
    
    if (missingFields.length > 0) {
      setMessage({ type: 'error', text: `Missing required fields: ${missingFields.join(', ')}` });
      return false;
    }
    return true;
  };

  const testGmailConfiguration = async () => {
    if (!validateGSuiteConfig()) return;
    
    setTestingEmail(true);
    try {
      await EmailService.sendVerificationEmail(
        'test@example.com',
        'Test Email'
      );
      setMessage({ type: 'success', text: 'Test email sent successfully! Check your inbox.' });
    } catch (error) {
      console.error('Gmail test error:', error);
      setMessage({ type: 'error', text: 'Failed to send test email. Please check your configuration.' });
    } finally {
      setTestingEmail(false);
    }
  };


  const validateWhatsAppConfig = (whatsappConfig: SystemSettings['whatsapp']): string[] => {
    const errors: string[] = [];
    
    if (!whatsappConfig.accessToken) {
      errors.push('Access Token is required');
    }
    
    if (!whatsappConfig.phoneNumberId) {
      errors.push('Phone Number ID is required');
    }
    
    if (!whatsappConfig.businessAccountId) {
      errors.push('Business Account ID is required');
    }
    
    if (!whatsappConfig.webhookVerifyToken) {
      errors.push('Webhook Verify Token is required');
    }
    
    if (!whatsappConfig.apiVersion) {
      errors.push('API Version is required');
    }
    
    return errors;
  };

  const testWhatsAppConfiguration = async () => {
    if (!settings.whatsapp.testPhoneNumber) {
      setMessage({ type: 'error', text: 'Please enter a test phone number' });
      return;
    }

    // Validate WhatsApp configuration
    const errors = validateWhatsAppConfig(settings.whatsapp);
    if (errors.length > 0) {
      setMessage({ 
        type: 'error', 
        text: `WhatsApp configuration errors: ${errors.join(', ')}` 
      });
      return;
    }

    setTestingWhatsApp(true);
    try {
      // Test the WhatsApp configuration by making a test API call
      // This would typically involve calling WhatsApp's Business API
      const testData = {
        environment: settings.whatsapp.environment,
        accessToken: settings.whatsapp.accessToken,
        phoneNumberId: settings.whatsapp.phoneNumberId,
        businessAccountId: settings.whatsapp.businessAccountId,
        phoneNumber: settings.whatsapp.testPhoneNumber,
        message: 'WhatsApp Business API Configuration Test'
      };
      
      console.log('Testing WhatsApp configuration:', testData);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setMessage({ 
        type: 'success', 
        text: `WhatsApp test initiated successfully for ${settings.whatsapp.testPhoneNumber}. Check your WhatsApp for the test message.` 
      });
    } catch (error) {
      console.error('WhatsApp test failed:', error);
      setMessage({ 
        type: 'error', 
        text: `WhatsApp test failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    } finally {
      setTestingWhatsApp(false);
    }
  };

  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `kss-settings-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const resetToDefaults = () => {
    if (confirm('Are you sure you want to reset all settings to default values? This action cannot be undone.')) {
      const defaultSettings: SystemSettings = {
        ...settings,
        // Reset to defaults - you can customize this
        timezone: 'Africa/Nairobi',
        sessionTimeout: 30,
        maxLoginAttempts: 5,
        passwordPolicy: {
          minLength: 8,
          requireUppercase: true,
          requireLowercase: true,
          requireNumbers: true,
          requireSpecialChars: false,
        }
      };
      setSettings(defaultSettings);
      setMessage({ type: 'success', text: 'Settings reset to default values' });
    }
  };

  const hasUnsavedChanges = () => {
    if (!originalSettings) return false;
    const hasChanges = JSON.stringify(settings) !== JSON.stringify(originalSettings);
    console.log('Has unsaved changes:', hasChanges); // Debug log
    return hasChanges;
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const file = files[0];
      
      // Validate file size (2MB limit)
      if (file.size > 2 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'Logo file size must be less than 2MB' });
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setMessage({ type: 'error', text: 'Please select a valid image file' });
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        handleInputChange('logoUrl', reader.result as string);
        setMessage({ type: 'success', text: 'Logo uploaded successfully!' });
      };
      reader.onerror = () => {
        setMessage({ type: 'error', text: 'Failed to read logo file' });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFaviconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const file = files[0];
      
      // Validate file size (1MB limit)
      if (file.size > 1 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'Favicon file size must be less than 1MB' });
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setMessage({ type: 'error', text: 'Please select a valid image file' });
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        handleInputChange('faviconUrl', reader.result as string);
        setMessage({ type: 'success', text: 'Favicon uploaded successfully!' });
      };
      reader.onerror = () => {
        setMessage({ type: 'error', text: 'Failed to read favicon file' });
      };
      reader.readAsDataURL(file);
    }
  };

  // Letter Template Functions
  const loadLetterTemplates = async () => {
    try {
      const result = await FirestoreService.getAll('letterTemplates');
      if (result.success && result.data) {
        setLetterTemplates(result.data as LetterTemplate[]);
      }
    } catch (error) {
      console.error('Error loading letter templates:', error);
    }
  };

  const saveLetterTemplate = async (templateData: Partial<LetterTemplate>) => {
    try {
      const isEditingTemplate = letterModal.isEditing && letterModal.template?.id;
      
      if (isEditingTemplate) {
        const result = await FirestoreService.update('letterTemplates', letterModal.template!.id, {
          ...templateData,
          updatedAt: new Date().toISOString()
        });
        
        if (result.success) {
          setLetterTemplates(prev => 
            prev.map(template => 
              template.id === letterModal.template!.id 
                ? { ...template, ...templateData, updatedAt: new Date().toISOString() }
                : template
            )
          );
          setMessage({ type: 'success', text: 'Template updated successfully!' });
        }
      } else {
        const newTemplate: Omit<LetterTemplate, 'id'> = {
          ...templateData as LetterTemplate,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: user?.uid || '',
          usageCount: 0
        };
        
        const result = await FirestoreService.create('letterTemplates', newTemplate);
        
        if (result.success && result.id) {
          setLetterTemplates(prev => [...prev, { ...newTemplate, id: result.id }]);
          setMessage({ type: 'success', text: 'Template created successfully!' });
        }
      }
      
      setLetterModal({ isOpen: false, template: null, isEditing: false });
    } catch (error) {
      console.error('Error saving letter template:', error);
      setMessage({ type: 'error', text: 'Error saving template. Please try again.' });
    }
  };

  const deleteLetterTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    
    try {
      const result = await FirestoreService.delete('letterTemplates', templateId);
      
      if (result.success) {
        setLetterTemplates(prev => prev.filter(template => template.id !== templateId));
        setMessage({ type: 'success', text: 'Template deleted successfully!' });
      }
    } catch (error) {
      console.error('Error deleting letter template:', error);
      setMessage({ type: 'error', text: 'Error deleting template. Please try again.' });
    }
  };

  const duplicateLetterTemplate = async (template: LetterTemplate) => {
    try {
      const newTemplate: Omit<LetterTemplate, 'id'> = {
        ...template,
        title: `${template.title} (Copy)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: user?.uid || '',
        usageCount: 0
      };
      
      const result = await FirestoreService.create('letterTemplates', newTemplate);
      
      if (result.success && result.id) {
        setLetterTemplates(prev => [...prev, { ...newTemplate, id: result.id }]);
        setMessage({ type: 'success', text: 'Template duplicated successfully!' });
      }
    } catch (error) {
      console.error('Error duplicating letter template:', error);
      setMessage({ type: 'error', text: 'Error duplicating template. Please try again.' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Message Display */}
      {message && (
        <div className={`p-4 rounded-lg flex items-center space-x-2 ${
          message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Hero Section */}
      <div className="bg-primary-600 text-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">System Settings</h1>
            <p className="text-lg text-primary-100">
              Configure system preferences, security, and institutional settings.
            </p>
            {hasUnsavedChanges() && (
              <div className="mt-3 bg-yellow-500 bg-opacity-20 border border-yellow-300 rounded-lg px-3 py-2">
                <p className="text-sm text-yellow-100 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  You have unsaved changes
                </p>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-4">
            {/* Action Buttons */}
            {canEdit && (
              <div className="flex items-center space-x-3">
                {!isEditing ? (
                  <>
                    <button
                      onClick={() => {
                        console.log('✏️ Edit button clicked - enabling edit mode');
                        setIsEditing(true);
                      }}
                      className="bg-white bg-opacity-20 text-white px-4 py-2 rounded-lg font-medium hover:bg-opacity-30 transition-colors duration-200 flex items-center space-x-2"
                    >
                      <Edit className="h-4 w-4" />
                      <span>Edit Settings</span>
                    </button>
                    <button
                      onClick={exportSettings}
                      className="bg-white bg-opacity-20 text-white px-4 py-2 rounded-lg font-medium hover:bg-opacity-30 transition-colors duration-200 flex items-center space-x-2"
                    >
                      <Download className="h-4 w-4" />
                      <span>Export</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleCancel}
                      className="bg-white bg-opacity-20 text-white px-4 py-2 rounded-lg font-medium hover:bg-opacity-30 transition-colors duration-200 flex items-center space-x-2"
                    >
                      <X className="h-4 w-4" />
                      <span>Cancel</span>
                    </button>
                    <button
                      onClick={() => {
                        console.log('🖱️ Save button clicked!');
                        console.log('🔧 Current settings state:', settings);
                        console.log('🏢 Institution email in current state:', settings.institutionEmail);
                        console.log('📊 Has unsaved changes:', hasUnsavedChanges());
                        console.log('🆚 Original vs Current:', { 
                          original: originalSettings?.institutionEmail,
                          current: settings.institutionEmail
                        });
                        saveSettings();
                      }}
                      disabled={saving}
                      className="bg-white text-primary-600 px-6 py-2 rounded-lg font-medium hover:bg-gray-100 disabled:opacity-50 transition-colors duration-200 flex items-center space-x-2"
                    >
                      {saving ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                    </button>
                  </>
                )}
              </div>
            )}
          <div className="bg-white bg-opacity-20 p-4 rounded-xl">
            <SettingsIcon className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-6">
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
            
            {/* Quick Actions */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Quick Actions</h4>
              <div className="space-y-2">
                <button
                  onClick={resetToDefaults}
                  disabled={!isEditing}
                  className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Reset to Defaults
                </button>
                <button
                  onClick={testGmailConfiguration}
                  disabled={testingEmail}
                  className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg disabled:opacity-50 flex items-center space-x-2"
                >
                  {testingEmail ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Mail className="h-4 w-4" />
                  )}
                  <span>{testingEmail ? 'Testing...' : 'Test GSuite Email'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            {activeTab === 'general' && (
              <div>
                <h2 className="text-2xl font-bold text-secondary-800 mb-6">General Settings</h2>
                
                <div className="space-y-6">
                  {/* Institution Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-secondary-800 mb-4">Institution Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-2">
                          Institution Name *
                        </label>
                        <input
                          type="text"
                          value={settings.institutionName}
                          onChange={(e) => handleInputChange('institutionName', e.target.value)}
                          disabled={!isEditing}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                          placeholder="Enter institution name"
                        />
                      </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                          Institution Email *
                    </label>
                    <input
                      type="email"
                          value={settings.institutionEmail}
                          onChange={(e) => {
                            console.log('📧 Institution email input changed:', e.target.value);
                            console.log('🔒 Is editing mode enabled?', isEditing);
                            handleInputChange('institutionEmail', e.target.value);
                          }}
                          disabled={!isEditing}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                          placeholder="Enter institution email"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Location Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        Institution Address *
                      </label>
                      <textarea
                        rows={3}
                        value={settings.institutionAddress}
                        onChange={(e) => handleInputChange('institutionAddress', e.target.value)}
                        disabled={!isEditing}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 resize-none"
                        placeholder="Enter institution address"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        value={settings.institutionPhone}
                        onChange={(e) => handleInputChange('institutionPhone', e.target.value)}
                        disabled={!isEditing}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                        placeholder="+254 700 123 456"
                      />
                    </div>
                  </div>

                  {/* System Configuration */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        Timezone *
                      </label>
                      <select
                        value={settings.timezone}
                        onChange={(e) => handleInputChange('timezone', e.target.value)}
                        disabled={!isEditing}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                      >
                        <option value="Africa/Nairobi">Africa/Nairobi (EAT)</option>
                        <option value="UTC">UTC</option>
                        <option value="America/New_York">America/New_York (EST)</option>
                        <option value="Europe/London">Europe/London (GMT)</option>
                        <option value="Africa/Lagos">Africa/Lagos (WAT)</option>
                        <option value="Africa/Cairo">Africa/Cairo (EET)</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        Date Format *
                      </label>
                      <select
                        value={settings.dateFormat}
                        onChange={(e) => handleInputChange('dateFormat', e.target.value)}
                        disabled={!isEditing}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                      >
                        <option value="YYYY-MM-DD">YYYY-MM-DD (2024-12-31)</option>
                        <option value="MM/DD/YYYY">MM/DD/YYYY (12/31/2024)</option>
                        <option value="DD/MM/YYYY">DD/MM/YYYY (31/12/2024)</option>
                        <option value="DD-MM-YYYY">DD-MM-YYYY (31-12-2024)</option>
                      </select>
                    </div>
                  </div>

                  {/* Default Currency */}
                  <div>
                    <h3 className="text-lg font-semibold text-secondary-800 mb-4">System Defaults</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-2">
                          Default Currency *
                        </label>
                        <select
                          value={settings.currency}
                          onChange={(e) => handleInputChange('currency', e.target.value)}
                          disabled={!isEditing}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                        >
                          <option value="KES">KES - Kenyan Shilling</option>
                          <option value="USD">USD - US Dollar</option>
                          <option value="EUR">EUR - Euro</option>
                          <option value="GBP">GBP - British Pound</option>
                          <option value="UGX">UGX - Ugandan Shilling</option>
                          <option value="TZS">TZS - Tanzanian Shilling</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">This will be the default currency for programs and events</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'financial' && (
              <div>
                <h2 className="text-2xl font-bold text-secondary-800 mb-6">Financial Settings</h2>
                
                <div className="space-y-6">
                  {/* Currency & Tax Settings */}
                  <div>
                    <h3 className="text-lg font-semibold text-secondary-800 mb-4">Currency & Tax Settings</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-2">
                          Default Currency *
                        </label>
                        <select
                          value={settings.currency}
                          onChange={(e) => handleInputChange('currency', e.target.value)}
                          disabled={!isEditing}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                        >
                          <option value="KES">KES - Kenyan Shilling</option>
                          <option value="USD">USD - US Dollar</option>
                          <option value="EUR">EUR - Euro</option>
                          <option value="GBP">GBP - British Pound</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-2">
                          Date Format *
                        </label>
                        <select
                          value={settings.dateFormat}
                          onChange={(e) => handleInputChange('dateFormat', e.target.value)}
                          disabled={!isEditing}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                        >
                          <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                          <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                          <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                          <option value="DD-MM-YYYY">DD-MM-YYYY</option>
                        </select>
                      </div>
                    </div>
                  </div>




                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div>
                <h2 className="text-2xl font-bold text-secondary-800 mb-6">Notification Settings</h2>
                <div className="space-y-6">
                  {[
                    { 
                      key: 'emailNotifications', 
                      title: 'Email Notifications', 
                      description: 'Send notifications via email to users' 
                    },
                    { 
                      key: 'smsNotifications', 
                      title: 'SMS Notifications', 
                      description: 'Send notifications via SMS to users' 
                    },
                    { 
                      key: 'pushNotifications', 
                      title: 'Push Notifications', 
                      description: 'Send push notifications to mobile devices' 
                    },
                    { 
                      key: 'systemAlerts', 
                      title: 'System Alerts', 
                      description: 'Enable system maintenance and error alerts' 
                    },
                    { 
                      key: 'academicReminders', 
                      title: 'Academic Reminders', 
                      description: 'Send academic deadline and event reminders' 
                    },
                    { 
                      key: 'paymentReminders', 
                      title: 'Payment Reminders', 
                      description: 'Send payment due date and overdue reminders' 
                    },
                    { 
                      key: 'marketingEmails', 
                      title: 'Marketing Emails', 
                      description: 'Send promotional and marketing communications' 
                    },
                  ].map((setting) => (
                    <div key={setting.key} className="flex items-center justify-between p-6 bg-gray-50 rounded-lg">
                      <div>
                        <h3 className="font-semibold text-secondary-800">{setting.title}</h3>
                        <p className="text-sm text-secondary-600">{setting.description}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={settings[setting.key as keyof SystemSettings] as boolean}
                          onChange={(e) => handleInputChange(setting.key, e.target.checked)}
                          disabled={!isEditing}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600 peer-disabled:opacity-50"></div>
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
                  {/* Password Policy */}
                  <div className="p-6 bg-gray-50 rounded-lg">
                    <h3 className="text-lg font-semibold text-secondary-800 mb-4">Password Policy</h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-secondary-700 mb-2">
                            Minimum Length
                          </label>
                          <input
                            type="number"
                            min="6"
                            max="32"
                            value={settings.passwordPolicy.minLength}
                            onChange={(e) => handleNestedInputChange('passwordPolicy', 'minLength', parseInt(e.target.value) || 8)}
                            disabled={!isEditing}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                          />
                        </div>

                      </div>
                      
                      <div className="space-y-3">
                        {[
                          { key: 'requireUppercase', label: 'Require uppercase letters' },
                          { key: 'requireNumbers', label: 'Require numbers' },
                          { key: 'requireSpecialChars', label: 'Require special characters' }
                        ].map((rule) => (
                          <div key={rule.key} className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={settings.passwordPolicy[rule.key as keyof typeof settings.passwordPolicy] as boolean}
                              onChange={(e) => handleNestedInputChange('passwordPolicy', rule.key, e.target.checked)}
                              disabled={!isEditing}
                              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded disabled:opacity-50"
                            />
                            <span className="text-secondary-700">{rule.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Session Management */}
                  <div className="p-6 bg-gray-50 rounded-lg">
                    <h3 className="text-lg font-semibold text-secondary-800 mb-4">Session Management</h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-secondary-700 mb-2">
                            Session Timeout (minutes)
                          </label>
                          <input
                            type="number"
                            min="5"
                            max="480"
                            value={settings.sessionTimeout}
                            onChange={(e) => handleInputChange('sessionTimeout', parseInt(e.target.value) || 30)}
                            disabled={!isEditing}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-secondary-700 mb-2">
                            Failed Login Attempts
                          </label>
                          <input
                            type="number"
                            min="3"
                            max="10"
                            value={settings.maxLoginAttempts}
                            onChange={(e) => handleInputChange('maxLoginAttempts', parseInt(e.target.value) || 5)}
                            disabled={!isEditing}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                          />
                        </div>
                      </div>
                      

                    </div>
                  </div>
                </div>
              </div>
            )}



            {activeTab === 'appearance' && (
              <SystemSettingsTab />
            )}

            {activeTab === 'gsuite' && (
              <div>
                <h2 className="text-2xl font-bold text-secondary-800 mb-6">GSuite Email Settings</h2>
                
                <div className="space-y-6">
                  {/* GSuite Configuration Status */}
                  <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-blue-800 mb-2">GSuite Email Configuration</h3>
                        <p className="text-blue-600">
                          Configure GSuite (Gmail API) integration for sending emails from your system.
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${settings.gsuite.enabled ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                        <span className="text-sm font-medium text-blue-800">
                          {settings.gsuite.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* GSuite Configuration */}
                  <div className="p-6 bg-gray-50 rounded-lg">
                    <h3 className="text-lg font-semibold text-secondary-800 mb-4">GSuite API Configuration</h3>
                    
                    <div className="space-y-6">
                      {/* Enable/Disable GSuite */}
                      <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
                        <div>
                          <h4 className="font-medium text-secondary-800">Enable GSuite Email Service</h4>
                          <p className="text-sm text-secondary-600">Use GSuite (Gmail API) for sending system emails</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={settings.gsuite.enabled}
                            onChange={(e) => handleNestedInputChange('gsuite', 'enabled', e.target.checked)}
                            disabled={!isEditing}
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600 peer-disabled:opacity-50"></div>
                        </label>
                      </div>

                      {/* OAuth2 Credentials */}
                      <div className="space-y-4">
                        <h4 className="font-medium text-secondary-800">OAuth2 Credentials</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-2">
                              Client ID *
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                value={settings.gsuite.clientId}
                                onChange={(e) => handleNestedInputChange('gsuite', 'clientId', e.target.value)}
                                disabled={!isEditing}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 font-mono text-sm"
                                placeholder="123456789-abcdef.apps.googleusercontent.com"
                              />
                              {isEditing && (
                                <button
                                  onClick={() => navigator.clipboard.writeText(settings.gsuite.clientId)}
                                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                  <Copy className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-2">
                              Client Secret *
                            </label>
                            <div className="relative">
                              <input
                                type={showPasswords ? "text" : "password"}
                                value={settings.gsuite.clientSecret}
                                onChange={(e) => handleNestedInputChange('gsuite', 'clientSecret', e.target.value)}
                                disabled={!isEditing}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 font-mono text-sm"
                                placeholder="GOCSPX-abcdefghijklmnop"
                              />
                              {isEditing && (
                                <button
                                  onClick={() => setShowPasswords(!showPasswords)}
                                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                  {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-2">
                              Redirect URI *
                            </label>
                            <input
                              type="url"
                              value={settings.gsuite.redirectUri}
                              onChange={(e) => handleNestedInputChange('gsuite', 'redirectUri', e.target.value)}
                              disabled={!isEditing}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 font-mono text-sm"
                              placeholder="https://your-project.firebaseapp.com/__/auth/handler"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-2">
                              Refresh Token *
                            </label>
                            <div className="relative">
                              <input
                                type={showPasswords ? "text" : "password"}
                                value={settings.gsuite.refreshToken}
                                onChange={(e) => handleNestedInputChange('gsuite', 'refreshToken', e.target.value)}
                                disabled={!isEditing}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 font-mono text-sm"
                                placeholder="1//04abcdefghijklmnop"
                              />
                              {isEditing && (
                                <button
                                  onClick={() => setShowPasswords(!showPasswords)}
                                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                  {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Email Configuration */}
                      <div className="space-y-4">
                        <h4 className="font-medium text-secondary-800">Email Configuration</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-2">
                              From Email Address *
                            </label>
                            <input
                              type="email"
                              value={settings.gsuite.fromEmail}
                              onChange={(e) => handleNestedInputChange('gsuite', 'fromEmail', e.target.value)}
                              disabled={!isEditing}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                              placeholder="noreply@yourdomain.com"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-2">
                              From Name *
                            </label>
                            <input
                              type="text"
                              value={settings.gsuite.fromName}
                              onChange={(e) => handleNestedInputChange('gsuite', 'fromName', e.target.value)}
                              disabled={!isEditing}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                              placeholder="Kenya School of Sales"
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-2">
                              Reply-To Email
                            </label>
                            <input
                              type="email"
                              value={settings.gsuite.replyToEmail}
                              onChange={(e) => handleNestedInputChange('gsuite', 'replyToEmail', e.target.value)}
                              disabled={!isEditing}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                              placeholder="support@yourdomain.com"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-2">
                              Verification Secret
                            </label>
                            <input
                              type="text"
                              value={settings.gsuite.verificationSecret}
                              onChange={(e) => handleNestedInputChange('gsuite', 'verificationSecret', e.target.value)}
                              disabled={!isEditing}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                              placeholder="your-verification-secret"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Test Configuration */}
                      <div className="space-y-4">
                        <h4 className="font-medium text-secondary-800">Test Configuration</h4>

                      </div>
                    </div>
                  </div>

                  {/* Setup Instructions */}
                  <div className="p-6 bg-blue-50 rounded-lg border border-blue-200">
                    <h3 className="text-lg font-semibold text-blue-800 mb-4">Setup Instructions</h3>
                    <div className="space-y-3 text-sm text-blue-700">
                      <div className="flex items-start space-x-2">
                        <span className="bg-blue-200 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">1</span>
                        <div>
                          <p className="font-medium">Enable Gmail API in Google Cloud Console</p>
                          <a 
                            href="https://console.cloud.google.com/apis/library/gmail.googleapis.com" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline flex items-center space-x-1"
                          >
                            <span>Open Google Cloud Console</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </div>
                      <div className="flex items-start space-x-2">
                        <span className="bg-blue-200 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">2</span>
                        <div>
                          <p className="font-medium">Create OAuth2 credentials</p>
                          <a 
                            href="https://console.cloud.google.com/apis/credentials" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline flex items-center space-x-1"
                          >
                            <span>Create OAuth2 Client ID</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </div>
                      <div className="flex items-start space-x-2">
                        <span className="bg-blue-200 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">3</span>
                        <div>
                          <p className="font-medium">Generate refresh token</p>
                          <a 
                            href="/docs/GMAIL_SETUP.md" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline flex items-center space-x-1"
                          >
                            <span>View detailed setup guide</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </div>
                      <div className="flex items-start space-x-2">
                        <span className="bg-blue-200 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">4</span>
                        <div>
                          <p className="font-medium">Configure Firebase Functions</p>
                          <p className="text-blue-600">Set the credentials in Firebase Functions configuration</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Troubleshooting */}
                  <div className="p-6 bg-yellow-50 rounded-lg border border-yellow-200">
                    <h3 className="text-lg font-semibold text-yellow-800 mb-4">Troubleshooting</h3>
                    <div className="space-y-2 text-sm text-yellow-700">
                      <div className="flex items-start space-x-2">
                        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium">Invalid Credentials</p>
                          <p>Verify your client ID, client secret, and refresh token are correct</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-2">
                        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium">Access Denied</p>
                          <p>Ensure your email is added as a test user in OAuth consent screen</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-2">
                        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium">Quota Exceeded</p>
                          <p>Gmail API has daily quotas. Monitor usage in Google Cloud Console</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}


            {activeTab === 'whatsapp' && (
              <div>
                <h2 className="text-2xl font-bold text-secondary-800 mb-6">WhatsApp Business API Settings</h2>
                
                <div className="space-y-6">
                  {/* WhatsApp Configuration Status */}
                  <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-green-800 mb-2">WhatsApp Business API Configuration</h3>
                        <p className="text-green-600">
                          Configure WhatsApp Business API integration for sending messages and managing conversations.
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${settings.whatsapp.enabled ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                        <span className="text-sm font-medium text-green-800">
                          {settings.whatsapp.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* WhatsApp Configuration */}
                  <div className="p-6 bg-gray-50 rounded-lg">
                    <h3 className="text-lg font-semibold text-secondary-800 mb-4">WhatsApp Business API Configuration</h3>
                    
                    <div className="space-y-6">
                      {/* Enable/Disable WhatsApp */}
                      <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
                        <div>
                          <h4 className="font-medium text-secondary-800">Enable WhatsApp Business API</h4>
                          <p className="text-sm text-secondary-600">Use WhatsApp Business API for sending messages and managing conversations</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={settings.whatsapp.enabled}
                            onChange={(e) => handleNestedInputChange('whatsapp', 'enabled', e.target.checked)}
                            disabled={!isEditing}
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600 peer-disabled:opacity-50"></div>
                        </label>
                      </div>

                      {/* Environment Selection */}
                      <div className="space-y-4">
                        <h4 className="font-medium text-secondary-800">Environment</h4>
                        <div className="flex space-x-4">
                          <label className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name="whatsapp-environment"
                              value="sandbox"
                              checked={settings.whatsapp.environment === 'sandbox'}
                              onChange={(e) => handleNestedInputChange('whatsapp', 'environment', e.target.value)}
                              disabled={!isEditing}
                              className="text-primary-600 focus:ring-primary-500"
                            />
                            <span className="text-sm text-secondary-700">Sandbox (Testing)</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name="whatsapp-environment"
                              value="live"
                              checked={settings.whatsapp.environment === 'live'}
                              onChange={(e) => handleNestedInputChange('whatsapp', 'environment', e.target.value)}
                              disabled={!isEditing}
                              className="text-primary-600 focus:ring-primary-500"
                            />
                            <span className="text-sm text-secondary-700">Live (Production)</span>
                          </label>
                        </div>
                      </div>

                      {/* API Credentials */}
                      <div className="space-y-4">
                        <h4 className="font-medium text-secondary-800">API Credentials</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-2">
                              Access Token *
                            </label>
                            <div className="relative">
                              <input
                                type={showPasswords ? "text" : "password"}
                                value={settings.whatsapp.accessToken}
                                onChange={(e) => handleNestedInputChange('whatsapp', 'accessToken', e.target.value)}
                                disabled={!isEditing}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 font-mono text-sm"
                                placeholder="EAA..."
                              />
                              {isEditing && (
                                <button
                                  onClick={() => setShowPasswords(!showPasswords)}
                                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                  {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                              )}
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-2">
                              Phone Number ID *
                            </label>
                            <input
                              type="text"
                              value={settings.whatsapp.phoneNumberId}
                              onChange={(e) => handleNestedInputChange('whatsapp', 'phoneNumberId', e.target.value)}
                              disabled={!isEditing}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 font-mono text-sm"
                              placeholder="123456789012345"
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-2">
                              Business Account ID *
                            </label>
                            <input
                              type="text"
                              value={settings.whatsapp.businessAccountId}
                              onChange={(e) => handleNestedInputChange('whatsapp', 'businessAccountId', e.target.value)}
                              disabled={!isEditing}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 font-mono text-sm"
                              placeholder="123456789012345"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-2">
                              Webhook Verify Token *
                            </label>
                            <input
                              type="text"
                              value={settings.whatsapp.webhookVerifyToken}
                              onChange={(e) => handleNestedInputChange('whatsapp', 'webhookVerifyToken', e.target.value)}
                              disabled={!isEditing}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 font-mono text-sm"
                              placeholder="your-webhook-verify-token"
                            />
                          </div>
                        </div>
                      </div>

                      {/* API Configuration */}
                      <div className="space-y-4">
                        <h4 className="font-medium text-secondary-800">API Configuration</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-2">
                              API Version
                            </label>
                            <input
                              type="text"
                              value={settings.whatsapp.apiVersion}
                              onChange={(e) => handleNestedInputChange('whatsapp', 'apiVersion', e.target.value)}
                              disabled={!isEditing}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 font-mono text-sm"
                              placeholder="v18.0"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-2">
                              Test Phone Number
                            </label>
                            <input
                              type="text"
                              value={settings.whatsapp.testPhoneNumber}
                              onChange={(e) => handleNestedInputChange('whatsapp', 'testPhoneNumber', e.target.value)}
                              disabled={!isEditing}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 font-mono text-sm"
                              placeholder="+254700123456"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Webhook Configuration */}
                      <div className="space-y-4">
                        <h4 className="font-medium text-secondary-800">Webhook Configuration</h4>
                        <div>
                          <label className="block text-sm font-medium text-secondary-700 mb-2">
                            Webhook URL
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={settings.whatsapp.webhookUrl}
                              onChange={(e) => handleNestedInputChange('whatsapp', 'webhookUrl', e.target.value)}
                              disabled={!isEditing}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 font-mono text-sm"
                              placeholder="https://your-domain.com/api/whatsapp-webhook"
                            />
                            {isEditing && (
                              <button
                                onClick={() => navigator.clipboard.writeText(settings.whatsapp.webhookUrl)}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                              >
                                <Copy className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                          <p className="text-sm text-secondary-600 mt-1">
                            This URL will receive WhatsApp webhook notifications. Configure this in your WhatsApp Business API dashboard.
                          </p>
                        </div>
                      </div>

                      {/* Test Configuration */}
                      {settings.whatsapp.enabled && (
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <h4 className="font-medium text-blue-800 mb-3">Test Configuration</h4>
                          <div className="flex items-center space-x-4">
                            <button
                              onClick={testWhatsAppConfiguration}
                              disabled={!isEditing || testingWhatsApp}
                              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                            >
                              {testingWhatsApp ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <TestTube className="h-4 w-4" />
                              )}
                              <span>{testingWhatsApp ? 'Testing...' : 'Test WhatsApp Connection'}</span>
                            </button>
                            <span className="text-sm text-blue-600">
                              Test your WhatsApp Business API configuration
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'letters' && (
              <div>
                <h2 className="text-2xl font-bold text-secondary-800 mb-6">Letter Templates</h2>
                
                <div>
                  {/* Actions Bar */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
                        <input
                          type="text"
                          placeholder="Search templates..."
                          value={letterSearchTerm}
                          onChange={(e) => setLetterSearchTerm(e.target.value)}
                          className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-64"
                        />
                      </div>
                      <select
                        value={letterTypeFilter}
                        onChange={(e) => setLetterTypeFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="all">All Types</option>
                        <option value="acceptance">Acceptance</option>
                        <option value="rejection">Rejection</option>
                        <option value="payment_reminder">Payment Reminder</option>
                        <option value="interview_invitation">Interview</option>
                        <option value="document_request">Documents</option>
                        <option value="custom">Custom</option>
                      </select>
                    </div>
                    {canEdit && (
                      <button 
                        onClick={() => setLetterModal({ isOpen: true, template: null, isEditing: false })}
                        className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200 flex items-center space-x-2"
                      >
                        <Plus className="h-4 w-4" />
                        <span>New Template</span>
                      </button>
                    )}
                  </div>

                  {/* Letter Templates Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {letterTemplates
                      .filter(template => {
                        const matchesSearch = template.title.toLowerCase().includes(letterSearchTerm.toLowerCase()) ||
                                            template.subject.toLowerCase().includes(letterSearchTerm.toLowerCase());
                        const matchesType = letterTypeFilter === 'all' || template.type === letterTypeFilter;
                        return matchesSearch && matchesType;
                      })
                      .map((template) => (
                        <div key={template.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow duration-200">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-secondary-800 mb-1">{template.title}</h3>
                              <p className="text-sm text-secondary-600 mb-3 line-clamp-2">{template.subject}</p>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              template.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {template.status}
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between text-sm text-secondary-500 mb-4">
                            <span className="capitalize bg-gray-100 px-2 py-1 rounded text-xs">
                              {template.type.replace('_', ' ')}
                            </span>
                            <span className="flex items-center space-x-1">
                              <FileText className="h-3 w-3" />
                              <span>{template.usageCount} uses</span>
                            </span>
                          </div>

                          <div className="mb-4">
                            <div className="flex flex-wrap gap-1">
                              {template.variables.slice(0, 3).map((variable, index) => (
                                <span
                                  key={index}
                                  className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                                >
                                  {`{{${variable}}}`}
                                </span>
                              ))}
                              {template.variables.length > 3 && (
                                <span className="text-xs text-secondary-500">
                                  +{template.variables.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={() => setLetterModal({ isOpen: true, template, isEditing: true })}
                              className="flex-1 bg-primary-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors duration-200"
                              disabled={!canEdit}
                            >
                              {canEdit ? 'Edit Template' : 'View Template'}
                            </button>
                            {canEdit && (
                              <>
                                <button 
                                  onClick={() => duplicateLetterTemplate(template)}
                                  className="p-2 text-secondary-400 hover:text-secondary-600 transition-colors duration-200"
                                  title="Duplicate template"
                                >
                                  <Copy className="h-4 w-4" />
                                </button>
                                <button 
                                  onClick={() => deleteLetterTemplate(template.id)}
                                  className="p-2 text-red-400 hover:text-red-600 transition-colors duration-200"
                                  title="Delete template"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>

                  {/* Empty State */}
                  {letterTemplates.length === 0 && (
                    <div className="text-center py-12">
                      <FileText className="h-12 w-12 text-secondary-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-secondary-800 mb-2">No Letter Templates</h3>
                      <p className="text-secondary-600 mb-4">Create your first letter template to get started.</p>
                      {canEdit && (
                        <button 
                          onClick={() => setLetterModal({ isOpen: true, template: null, isEditing: false })}
                          className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200"
                        >
                          Create Template
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Letter Template Modal */}
      <LetterModal
        isOpen={letterModal.isOpen}
        onClose={() => setLetterModal({ isOpen: false, template: null, isEditing: false })}
        onSave={saveLetterTemplate}
        template={letterModal.template}
        isEditing={letterModal.isEditing}
      />
    </div>
  );
};

export default Settings;