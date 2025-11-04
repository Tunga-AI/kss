import { useSystemSettings } from '../contexts/SystemSettingsContext';

export const useSystemTheme = () => {
  const { settings, loading, error } = useSystemSettings();

  return {
    // Basic information
    organizationName: settings?.organizationName || 'Kenya School of Sales',
    organizationShortName: settings?.organizationShortName || 'KSS',
    logoUrl: settings?.logoUrl || '/logo.png',
    faviconUrl: settings?.faviconUrl || '/favicon.png',
    
    // Colors
    colors: settings?.colors || {
      primary: { 500: '#4590AD' },
      secondary: { 500: '#BD2D2B' },
      accent: { 500: '#E39E41' },
      neutral: { 500: '#7D6FA0' },
    },
    
    // Meta information
    metaTags: settings?.metaTags || {
      title: 'Kenya School of Sales (KSS) - Premier Sales Training Institute in Kenya | Nairobi',
      description: 'KSS is Kenya\'s leading sales training institute in Nairobi.',
      keywords: 'Kenya School of Sales, KSS, sales training Kenya',
      ogImage: 'https://kss.or.ke/home.jpg',
    },
    
    // Loading states
    loading,
    error,
    
    // Computed values
    primaryColor: settings?.colors?.primary?.[500] || '#4590AD',
    secondaryColor: settings?.colors?.secondary?.[500] || '#BD2D2B',
    accentColor: settings?.colors?.accent?.[500] || '#E39E41',
    neutralColor: settings?.colors?.neutral?.[500] || '#7D6FA0',
  };
};