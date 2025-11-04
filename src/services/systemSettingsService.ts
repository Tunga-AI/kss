import { doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { SystemSettings, SystemSettingsUpdate } from '../types/systemSettings';

const SETTINGS_COLLECTION = 'systemSettings';
const SETTINGS_DOC_ID = 'default';

export const systemSettingsService = {
  async getSettings(): Promise<SystemSettings | null> {
    try {
      const settingsDoc = await getDoc(doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID));
      if (settingsDoc.exists()) {
        return { id: settingsDoc.id, ...settingsDoc.data() } as SystemSettings;
      }
      return null;
    } catch (error) {
      console.error('Error fetching system settings:', error);
      throw error;
    }
  },

  async initializeDefaultSettings(): Promise<SystemSettings> {
    const defaultSettings: Omit<SystemSettings, 'id'> = {
      organizationName: 'Kenya School of Sales',
      organizationShortName: 'KSS',
      logoUrl: '/logo.png',
      faviconUrl: '/favicon.png',
      colors: {
        primary: {
          50: '#F0F8FB',
          100: '#E1F1F7',
          200: '#C3E3EF',
          300: '#9CCEE3',
          400: '#6FB3D3',
          500: '#4590AD',
          600: '#3A7B94',
          700: '#2F647A',
          800: '#254D60',
          900: '#1A3646',
        },
        secondary: {
          50: '#FDF2F2',
          100: '#FCE5E4',
          200: '#F9CBCA',
          300: '#F4A5A3',
          400: '#EC7471',
          500: '#BD2D2B',
          600: '#A02624',
          700: '#831F1D',
          800: '#661816',
          900: '#4A110F',
        },
        accent: {
          50: '#FDF8F0',
          100: '#FBF1E1',
          200: '#F7E3C3',
          300: '#F1CF9C',
          400: '#E9B56F',
          500: '#E39E41',
          600: '#C18637',
          700: '#9E6E2D',
          800: '#7B5623',
          900: '#583E19',
        },
        neutral: {
          50: '#F8F8FB',
          100: '#F1F0F7',
          200: '#E3E1EF',
          300: '#CFC9DF',
          400: '#B0A6C7',
          500: '#7D6FA0',
          600: '#5A4B7A',
          700: '#423860',
          800: '#2C2547',
          900: '#1E184E',
        },
      },
      metaTags: {
        title: 'Kenya School of Sales (KSS) - Premier Sales Training Institute in Kenya | Nairobi',
        description: 'KSS is Kenya\'s leading sales training institute in Nairobi. Professional sales courses, certification programs, and career development for sales professionals in Kenya, East Africa.',
        keywords: 'Kenya School of Sales, KSS, sales training Kenya, sales courses Nairobi, sales institute Kenya',
        ogImage: 'https://kss.or.ke/home.jpg',
      },
      fonts: {
        primary: 'Plus Jakarta Sans',
        secondary: 'Plus Jakarta Sans',
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      updatedBy: 'system',
    };

    await setDoc(doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID), defaultSettings);
    return { id: SETTINGS_DOC_ID, ...defaultSettings };
  },

  async updateSettings(updates: SystemSettingsUpdate, userId: string): Promise<void> {
    try {
      await updateDoc(doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID), {
        ...updates,
        updatedAt: new Date(),
        updatedBy: userId,
      });
    } catch (error) {
      console.error('Error updating system settings:', error);
      throw error;
    }
  },

  async uploadLogo(file: File): Promise<string> {
    try {
      const storageRef = ref(storage, `system/logo_${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      return await getDownloadURL(snapshot.ref);
    } catch (error) {
      console.error('Error uploading logo:', error);
      throw error;
    }
  },

  async uploadFavicon(file: File): Promise<string> {
    try {
      const storageRef = ref(storage, `system/favicon_${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      return await getDownloadURL(snapshot.ref);
    } catch (error) {
      console.error('Error uploading favicon:', error);
      throw error;
    }
  },

  subscribeToSettings(callback: (settings: SystemSettings | null) => void): () => void {
    const unsubscribe = onSnapshot(
      doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID),
      (doc) => {
        if (doc.exists()) {
          callback({ id: doc.id, ...doc.data() } as SystemSettings);
        } else {
          callback(null);
        }
      },
      (error) => {
        console.error('Error in settings subscription:', error);
        callback(null);
      }
    );

    return unsubscribe;
  },

  applyColorsToCSS(colors: SystemSettings['colors']): void {
    const root = document.documentElement;
    
    Object.entries(colors).forEach(([colorName, shades]) => {
      Object.entries(shades).forEach(([shade, value]) => {
        root.style.setProperty(`--color-${colorName}-${shade}`, value);
      });
    });
  },

  updateMetaTags(settings: SystemSettings): void {
    document.title = settings.metaTags.title;
    
    const updateOrCreateMeta = (name: string, content: string) => {
      let meta = document.querySelector(`meta[name="${name}"]`) || 
                 document.querySelector(`meta[property="${name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        if (name.startsWith('og:') || name.startsWith('twitter:')) {
          meta.setAttribute('property', name);
        } else {
          meta.setAttribute('name', name);
        }
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    updateOrCreateMeta('title', settings.metaTags.title);
    updateOrCreateMeta('description', settings.metaTags.description);
    updateOrCreateMeta('keywords', settings.metaTags.keywords);
    updateOrCreateMeta('og:title', settings.metaTags.title);
    updateOrCreateMeta('og:description', settings.metaTags.description);
    updateOrCreateMeta('og:image', settings.metaTags.ogImage);
    updateOrCreateMeta('twitter:title', settings.metaTags.title);
    updateOrCreateMeta('twitter:description', settings.metaTags.description);
    updateOrCreateMeta('twitter:image', settings.metaTags.ogImage);
    
    const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    if (favicon) {
      favicon.href = settings.faviconUrl;
    }
    
    const appleTouchIcon = document.querySelector('link[rel="apple-touch-icon"]') as HTMLLinkElement;
    if (appleTouchIcon) {
      appleTouchIcon.href = settings.faviconUrl;
    }
  },
};