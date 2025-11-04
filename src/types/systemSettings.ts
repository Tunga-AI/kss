export interface SystemColors {
  primary: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  };
  secondary: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  };
  accent: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  };
  neutral: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  };
}

export interface SystemSettings {
  id: string;
  organizationName: string;
  organizationShortName: string;
  logoUrl: string;
  faviconUrl: string;
  colors: SystemColors;
  metaTags: {
    title: string;
    description: string;
    keywords: string;
    ogImage: string;
  };
  fonts: {
    primary: string;
    secondary: string;
  };
  createdAt: Date;
  updatedAt: Date;
  updatedBy: string;
}

export interface SystemSettingsUpdate {
  organizationName?: string;
  organizationShortName?: string;
  logoUrl?: string;
  faviconUrl?: string;
  colors?: Partial<SystemColors>;
  metaTags?: Partial<SystemSettings['metaTags']>;
  fonts?: Partial<SystemSettings['fonts']>;
}