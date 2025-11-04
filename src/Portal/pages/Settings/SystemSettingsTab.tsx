import React, { useState, useRef } from 'react';
import { 
  Save,
  Upload,
  RefreshCw,
  Palette,
  Type,
  Globe,
  ImageIcon,
  CheckCircle,
  AlertCircle,
  X,
  Eye,
  EyeOff
} from 'lucide-react';
import { useSystemSettings } from '../../../contexts/SystemSettingsContext';
import { SystemColors } from '../../../types/systemSettings';

const SystemSettingsTab: React.FC = () => {
  const { 
    settings, 
    loading, 
    error, 
    updateSettings, 
    uploadLogo, 
    uploadFavicon, 
    resetToDefaults 
  } = useSystemSettings();

  const [formData, setFormData] = useState({
    organizationName: settings?.organizationName || '',
    organizationShortName: settings?.organizationShortName || '',
    logoUrl: settings?.logoUrl || '',
    faviconUrl: settings?.faviconUrl || '',
    metaTags: {
      title: settings?.metaTags?.title || '',
      description: settings?.metaTags?.description || '',
      keywords: settings?.metaTags?.keywords || '',
      ogImage: settings?.metaTags?.ogImage || '',
    },
    colors: settings?.colors || {
      primary: { 500: '#4590AD' },
      secondary: { 500: '#BD2D2B' },
      accent: { 500: '#E39E41' },
      neutral: { 500: '#7D6FA0' },
    },
  });

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string>('basic');

  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (settings) {
      setFormData({
        organizationName: settings.organizationName,
        organizationShortName: settings.organizationShortName,
        logoUrl: settings.logoUrl,
        faviconUrl: settings.faviconUrl,
        metaTags: settings.metaTags,
        colors: settings.colors,
      });
    }
  }, [settings]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNestedChange = (parent: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent as keyof typeof prev],
        [field]: value
      }
    }));
  };

  const handleColorChange = (colorType: keyof SystemColors, shade: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      colors: {
        ...prev.colors,
        [colorType]: {
          ...prev.colors[colorType],
          [shade]: value
        }
      }
    }));
  };

  const generateColorShades = (baseColor: string) => {
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null;
    };

    const rgb = hexToRgb(baseColor);
    if (!rgb) return {};

    const shades: { [key: string]: string } = {};
    
    // Generate lighter shades (50-400)
    for (let i = 1; i <= 4; i++) {
      const factor = 1 - (i * 0.15);
      const r = Math.round(rgb.r + (255 - rgb.r) * (1 - factor));
      const g = Math.round(rgb.g + (255 - rgb.g) * (1 - factor));
      const b = Math.round(rgb.b + (255 - rgb.b) * (1 - factor));
      shades[`${i * 50}`] = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
    
    // Base color (500)
    shades['500'] = baseColor;
    
    // Generate darker shades (600-900)
    for (let i = 1; i <= 4; i++) {
      const factor = 1 - (i * 0.15);
      const r = Math.round(rgb.r * factor);
      const g = Math.round(rgb.g * factor);
      const b = Math.round(rgb.b * factor);
      shades[`${(i + 5) * 100}`] = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
    
    return shades;
  };

  const handleBaseColorChange = (colorType: keyof SystemColors, baseColor: string) => {
    const shades = generateColorShades(baseColor);
    setFormData(prev => ({
      ...prev,
      colors: {
        ...prev.colors,
        [colorType]: shades
      }
    }));
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadingLogo(true);
      const url = await uploadLogo(file);
      setFormData(prev => ({ ...prev, logoUrl: url }));
    } catch (err) {
      console.error('Error uploading logo:', err);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleFaviconUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadingFavicon(true);
      const url = await uploadFavicon(file);
      setFormData(prev => ({ ...prev, faviconUrl: url }));
    } catch (err) {
      console.error('Error uploading favicon:', err);
    } finally {
      setUploadingFavicon(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaveStatus('saving');
      setErrorMessage('');
      await updateSettings(formData);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err: any) {
      console.error('Error saving settings:', err);
      setErrorMessage(err.message || 'Failed to save settings');
      setSaveStatus('error');
      setTimeout(() => {
        setSaveStatus('idle');
        setErrorMessage('');
      }, 5000);
    }
  };

  const handleReset = async () => {
    if (window.confirm('Are you sure you want to reset all settings to defaults? This action cannot be undone.')) {
      try {
        setSaveStatus('saving');
        await resetToDefaults();
        setSaveStatus('success');
        setTimeout(() => setSaveStatus('idle'), 3000);
      } catch (err) {
        console.error('Error resetting settings:', err);
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">System Settings</h2>
          <p className="text-gray-600 mt-1">Customize your organization's branding and theme</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            {previewMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            <span>{previewMode ? 'Exit Preview' : 'Preview'}</span>
          </button>
          <button
            onClick={handleReset}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Reset to Defaults</span>
          </button>
          <button
            onClick={handleSave}
            disabled={saveStatus === 'saving'}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {saveStatus === 'saving' ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : saveStatus === 'success' ? (
              <CheckCircle className="h-4 w-4" />
            ) : saveStatus === 'error' ? (
              <AlertCircle className="h-4 w-4" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>
              {saveStatus === 'saving' ? 'Saving...' : 
               saveStatus === 'success' ? 'Saved!' : 
               saveStatus === 'error' ? 'Error' : 'Save Changes'}
            </span>
          </button>
        </div>
        
        {/* Error Message Display */}
        {errorMessage && saveStatus === 'error' && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2 text-red-700">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">{errorMessage}</span>
            </div>
          </div>
        )}
      </div>

      {/* Basic Information */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div 
          className="p-6 border-b border-gray-200 cursor-pointer flex justify-between items-center"
          onClick={() => setExpandedSection(expandedSection === 'basic' ? '' : 'basic')}
        >
          <div className="flex items-center space-x-3">
            <Globe className="h-5 w-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
          </div>
        </div>
        {expandedSection === 'basic' && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Organization Name
                </label>
                <input
                  type="text"
                  value={formData.organizationName}
                  onChange={(e) => handleInputChange('organizationName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="e.g., Kenya School of Sales"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Short Name
                </label>
                <input
                  type="text"
                  value={formData.organizationShortName}
                  onChange={(e) => handleInputChange('organizationShortName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="e.g., KSS"
                />
              </div>
            </div>

            {/* Logo Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Logo
              </label>
              <div className="flex items-center space-x-4">
                {formData.logoUrl && (
                  <div className="relative">
                    <img 
                      src={formData.logoUrl} 
                      alt="Logo" 
                      className="h-16 w-16 object-contain border border-gray-200 rounded-lg"
                    />
                    <button
                      onClick={() => handleInputChange('logoUrl', '')}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
                <div>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => logoInputRef.current?.click()}
                    disabled={uploadingLogo}
                    className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    {uploadingLogo ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    <span>{formData.logoUrl ? 'Change Logo' : 'Upload Logo'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Favicon Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Favicon
              </label>
              <div className="flex items-center space-x-4">
                {formData.faviconUrl && (
                  <div className="relative">
                    <img 
                      src={formData.faviconUrl} 
                      alt="Favicon" 
                      className="h-8 w-8 object-contain border border-gray-200 rounded"
                    />
                    <button
                      onClick={() => handleInputChange('faviconUrl', '')}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                    >
                      <X className="h-2 w-2" />
                    </button>
                  </div>
                )}
                <div>
                  <input
                    ref={faviconInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFaviconUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => faviconInputRef.current?.click()}
                    disabled={uploadingFavicon}
                    className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    {uploadingFavicon ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                    ) : (
                      <ImageIcon className="h-4 w-4" />
                    )}
                    <span>{formData.faviconUrl ? 'Change Favicon' : 'Upload Favicon'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Color Scheme */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div 
          className="p-6 border-b border-gray-200 cursor-pointer flex justify-between items-center"
          onClick={() => setExpandedSection(expandedSection === 'colors' ? '' : 'colors')}
        >
          <div className="flex items-center space-x-3">
            <Palette className="h-5 w-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-gray-900">Color Scheme</h3>
          </div>
        </div>
        {expandedSection === 'colors' && (
          <div className="p-6 space-y-6">
            {/* Color Pickers */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {(['primary', 'secondary', 'accent', 'neutral'] as const).map((colorType) => (
                <div key={colorType} className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700 capitalize">
                    {colorType} Color
                  </label>
                  <div className="space-y-2">
                    <input
                      type="color"
                      value={formData.colors[colorType]?.['500'] || '#000000'}
                      onChange={(e) => handleBaseColorChange(colorType, e.target.value)}
                      className="w-full h-10 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.colors[colorType]?.['500'] || '#000000'}
                      onChange={(e) => handleBaseColorChange(colorType, e.target.value)}
                      className="w-full px-3 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-primary-500"
                      placeholder="#000000"
                    />
                  </div>
                  {/* Color Preview */}
                  <div className="flex space-x-1">
                    {['100', '300', '500', '700', '900'].map((shade) => (
                      <div
                        key={shade}
                        className="w-4 h-4 rounded border border-gray-200"
                        style={{ backgroundColor: formData.colors[colorType]?.[shade] || '#000000' }}
                        title={`${colorType}-${shade}`}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* SEO & Meta Tags */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div 
          className="p-6 border-b border-gray-200 cursor-pointer flex justify-between items-center"
          onClick={() => setExpandedSection(expandedSection === 'seo' ? '' : 'seo')}
        >
          <div className="flex items-center space-x-3">
            <Type className="h-5 w-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-gray-900">SEO & Meta Tags</h3>
          </div>
        </div>
        {expandedSection === 'seo' && (
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Page Title
              </label>
              <input
                type="text"
                value={formData.metaTags.title}
                onChange={(e) => handleNestedChange('metaTags', 'title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Your page title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Meta Description
              </label>
              <textarea
                value={formData.metaTags.description}
                onChange={(e) => handleNestedChange('metaTags', 'description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Describe your organization..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Keywords
              </label>
              <input
                type="text"
                value={formData.metaTags.keywords}
                onChange={(e) => handleNestedChange('metaTags', 'keywords', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="keyword1, keyword2, keyword3"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Social Media Image URL
              </label>
              <input
                type="url"
                value={formData.metaTags.ogImage}
                onChange={(e) => handleNestedChange('metaTags', 'ogImage', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemSettingsTab;