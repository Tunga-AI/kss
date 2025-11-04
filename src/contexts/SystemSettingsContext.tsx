import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { SystemSettings } from '../types/systemSettings';
import { systemSettingsService } from '../services/systemSettingsService';
import { useAuth } from '../hooks/useAuth';

interface SystemSettingsContextType {
  settings: SystemSettings | null;
  loading: boolean;
  error: string | null;
  updateSettings: (updates: Partial<SystemSettings>) => Promise<void>;
  uploadLogo: (file: File) => Promise<string>;
  uploadFavicon: (file: File) => Promise<string>;
  resetToDefaults: () => Promise<void>;
}

const SystemSettingsContext = createContext<SystemSettingsContextType | undefined>(undefined);

export const SystemSettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user: currentUser, userProfile } = useAuth();

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        let systemSettings = await systemSettingsService.getSettings();
        
        if (!systemSettings) {
          systemSettings = await systemSettingsService.initializeDefaultSettings();
        }
        
        setSettings(systemSettings);
        
        if (systemSettings) {
          systemSettingsService.applyColorsToCSS(systemSettings.colors);
          systemSettingsService.updateMetaTags(systemSettings);
        }
      } catch (err) {
        console.error('Error loading system settings:', err);
        setError('Failed to load system settings');
      } finally {
        setLoading(false);
      }
    };

    loadSettings();

    const unsubscribe = systemSettingsService.subscribeToSettings((newSettings) => {
      if (newSettings) {
        setSettings(newSettings);
        systemSettingsService.applyColorsToCSS(newSettings.colors);
        systemSettingsService.updateMetaTags(newSettings);
      }
    });

    return () => unsubscribe();
  }, []);

  const updateSettings = async (updates: Partial<SystemSettings>) => {
    if (!currentUser) {
      throw new Error('User must be authenticated to update settings');
    }

    // Check if user has permission to update system settings
    if (userProfile && !['admin', 'staff', 'super-admin'].includes(userProfile.role)) {
      throw new Error('Insufficient permissions to update system settings');
    }

    try {
      await systemSettingsService.updateSettings(updates, currentUser.uid);
    } catch (err) {
      console.error('Error updating settings:', err);
      throw err;
    }
  };

  const uploadLogo = async (file: File): Promise<string> => {
    try {
      const url = await systemSettingsService.uploadLogo(file);
      await updateSettings({ logoUrl: url });
      return url;
    } catch (err) {
      console.error('Error uploading logo:', err);
      throw err;
    }
  };

  const uploadFavicon = async (file: File): Promise<string> => {
    try {
      const url = await systemSettingsService.uploadFavicon(file);
      await updateSettings({ faviconUrl: url });
      return url;
    } catch (err) {
      console.error('Error uploading favicon:', err);
      throw err;
    }
  };

  const resetToDefaults = async () => {
    if (!currentUser) {
      throw new Error('User must be authenticated to reset settings');
    }

    // Check if user has permission to reset system settings
    if (userProfile && !['admin', 'staff', 'super-admin'].includes(userProfile.role)) {
      throw new Error('Insufficient permissions to reset system settings');
    }

    try {
      await systemSettingsService.initializeDefaultSettings();
    } catch (err) {
      console.error('Error resetting to defaults:', err);
      throw err;
    }
  };

  return (
    <SystemSettingsContext.Provider
      value={{
        settings,
        loading,
        error,
        updateSettings,
        uploadLogo,
        uploadFavicon,
        resetToDefaults,
      }}
    >
      {children}
    </SystemSettingsContext.Provider>
  );
};

export const useSystemSettings = () => {
  const context = useContext(SystemSettingsContext);
  if (context === undefined) {
    throw new Error('useSystemSettings must be used within a SystemSettingsProvider');
  }
  return context;
};