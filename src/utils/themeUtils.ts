// Theme utilities for dynamic color management

export interface ThemeColors {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}

export interface ThemeFonts {
  primaryFont: string;
  secondaryFont: string;
  accentFont: string;
}

export interface ThemeSettings {
  colors: ThemeColors;
  fonts?: ThemeFonts;
  customCSS?: string;
  logoUrl?: string;
  faviconUrl?: string;
  enableDarkMode?: boolean;
}

/**
 * Convert hex color to RGB
 */
const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

/**
 * Generate color variations (lighter and darker shades)
 */
const generateColorVariations = (baseColor: string) => {
  const rgb = hexToRgb(baseColor);
  if (!rgb) return null;

  const variations: { [key: string]: string } = {};
  
  // Generate lighter shades (50-400)
  for (let i = 1; i <= 4; i++) {
    const factor = 1 - (i * 0.15);
    const r = Math.round(rgb.r + (255 - rgb.r) * (1 - factor));
    const g = Math.round(rgb.g + (255 - rgb.g) * (1 - factor));
    const b = Math.round(rgb.b + (255 - rgb.b) * (1 - factor));
    variations[`${i}00`] = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }
  
  // Base color (500)
  variations['500'] = baseColor;
  
  // Generate darker shades (600-900)
  for (let i = 1; i <= 4; i++) {
    const factor = 1 - (i * 0.15);
    const r = Math.round(rgb.r * factor);
    const g = Math.round(rgb.g * factor);
    const b = Math.round(rgb.b * factor);
    variations[`${(i + 5)}00`] = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }
  
  return variations;
};

/**
 * Apply dynamic colors to the application
 * This function creates CSS custom properties and applies them to the document
 */
export const applyThemeColors = (colors: ThemeColors) => {
  const root = document.documentElement;
  
  // Generate color variations for each color
  const primaryVariations = generateColorVariations(colors.primaryColor);
  const secondaryVariations = generateColorVariations(colors.secondaryColor);
  const accentVariations = generateColorVariations(colors.accentColor);

  // Apply primary color variations
  if (primaryVariations) {
    Object.entries(primaryVariations).forEach(([shade, color]) => {
      root.style.setProperty(`--color-primary-${shade}`, color);
    });
  }

  // Apply secondary color variations
  if (secondaryVariations) {
    Object.entries(secondaryVariations).forEach(([shade, color]) => {
      root.style.setProperty(`--color-secondary-${shade}`, color);
    });
  }

  // Apply accent color variations
  if (accentVariations) {
    Object.entries(accentVariations).forEach(([shade, color]) => {
      root.style.setProperty(`--color-accent-${shade}`, color);
    });
  }

  // Apply RGB values for opacity support
  const primaryRgb = hexToRgb(colors.primaryColor);
  const secondaryRgb = hexToRgb(colors.secondaryColor);
  const accentRgb = hexToRgb(colors.accentColor);

  if (primaryRgb) {
    root.style.setProperty('--color-primary-rgb', `${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}`);
  }
  if (secondaryRgb) {
    root.style.setProperty('--color-secondary-rgb', `${secondaryRgb.r}, ${secondaryRgb.g}, ${secondaryRgb.b}`);
  }
  if (accentRgb) {
    root.style.setProperty('--color-accent-rgb', `${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}`);
  }
};

/**
 * Apply dynamic fonts to the application
 */
export const applyThemeFonts = (fonts: ThemeFonts) => {
  const root = document.documentElement;
  
  if (fonts.primaryFont) {
    root.style.setProperty('--font-primary', fonts.primaryFont);
  }
  if (fonts.secondaryFont) {
    root.style.setProperty('--font-secondary', fonts.secondaryFont);
  }
  if (fonts.accentFont) {
    root.style.setProperty('--font-accent', fonts.accentFont);
  }
};

/**
 * Generate complete CSS custom properties for the theme
 */
export const generateThemeCSS = (theme: ThemeSettings): string => {
  const { colors, fonts } = theme;
  
  // Generate color variations
  const primaryVariations = generateColorVariations(colors.primaryColor);
  const secondaryVariations = generateColorVariations(colors.secondaryColor);
  const accentVariations = generateColorVariations(colors.accentColor);

  let css = ':root {\n';
  
  // Add color variables
  if (primaryVariations) {
    Object.entries(primaryVariations).forEach(([shade, color]) => {
      css += `  --color-primary-${shade}: ${color};\n`;
    });
  }
  
  if (secondaryVariations) {
    Object.entries(secondaryVariations).forEach(([shade, color]) => {
      css += `  --color-secondary-${shade}: ${color};\n`;
    });
  }
  
  if (accentVariations) {
    Object.entries(accentVariations).forEach(([shade, color]) => {
      css += `  --color-accent-${shade}: ${color};\n`;
    });
  }

  // Add font variables
  if (fonts) {
    if (fonts.primaryFont) css += `  --font-primary: ${fonts.primaryFont};\n`;
    if (fonts.secondaryFont) css += `  --font-secondary: ${fonts.secondaryFont};\n`;
    if (fonts.accentFont) css += `  --font-accent: ${fonts.accentFont};\n`;
  }

  css += '}\n\n';

  // Add utility classes for colors
  if (primaryVariations) {
    Object.entries(primaryVariations).forEach(([shade, color]) => {
      css += `.bg-primary-${shade} { background-color: ${color} !important; }\n`;
      css += `.text-primary-${shade} { color: ${color} !important; }\n`;
      css += `.border-primary-${shade} { border-color: ${color} !important; }\n`;
    });
  }

  if (secondaryVariations) {
    Object.entries(secondaryVariations).forEach(([shade, color]) => {
      css += `.bg-secondary-${shade} { background-color: ${color} !important; }\n`;
      css += `.text-secondary-${shade} { color: ${color} !important; }\n`;
      css += `.border-secondary-${shade} { border-color: ${color} !important; }\n`;
    });
  }

  if (accentVariations) {
    Object.entries(accentVariations).forEach(([shade, color]) => {
      css += `.bg-accent-${shade} { background-color: ${color} !important; }\n`;
      css += `.text-accent-${shade} { color: ${color} !important; }\n`;
      css += `.border-accent-${shade} { border-color: ${color} !important; }\n`;
    });
  }

  // Add font utility classes
  if (fonts) {
    if (fonts.primaryFont) {
      css += `.font-primary { font-family: ${fonts.primaryFont}, sans-serif !important; }\n`;
    }
    if (fonts.secondaryFont) {
      css += `.font-secondary { font-family: ${fonts.secondaryFont}, sans-serif !important; }\n`;
    }
    if (fonts.accentFont) {
      css += `.font-accent { font-family: ${fonts.accentFont}, sans-serif !important; }\n`;
    }
  }

  return css;
};

/**
 * Apply custom CSS to the document
 */
export const applyCustomCSS = (customCSS: string) => {
  // Remove existing custom CSS
  const existingStyle = document.getElementById('custom-theme-css');
  if (existingStyle) {
    existingStyle.remove();
  }

  // Add new custom CSS
  if (customCSS.trim()) {
    const style = document.createElement('style');
    style.id = 'custom-theme-css';
    style.textContent = customCSS;
    document.head.appendChild(style);
  }
};

/**
 * Apply complete theme to the application
 */
export const applyTheme = (theme: ThemeSettings) => {
  // Apply colors
  if (theme.colors) {
    applyThemeColors(theme.colors);
  }

  // Apply fonts
  if (theme.fonts) {
    applyThemeFonts(theme.fonts);
  }

  // Apply custom CSS
  if (theme.customCSS) {
    applyCustomCSS(theme.customCSS);
  }

  // Apply favicon
  if (theme.faviconUrl) {
    updateFavicon(theme.faviconUrl);
  }

  // Apply logo
  if (theme.logoUrl) {
    updatePageTitle(theme.logoUrl, 'Kenya School of Sales');
  }

  // Apply dark mode
  if (theme.enableDarkMode) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
};

/**
 * Update favicon
 */
export const updateFavicon = (faviconUrl: string) => {
  if (faviconUrl) {
    const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement || document.createElement('link');
    link.type = 'image/x-icon';
    link.rel = 'shortcut icon';
    link.href = faviconUrl;
    document.getElementsByTagName('head')[0].appendChild(link);
  }
};

/**
 * Update page title with logo
 */
export const updatePageTitle = (logoUrl: string, title: string) => {
  if (logoUrl) {
    // You can add logic here to update the page title or add logo to the header
    console.log('Logo updated:', logoUrl);
  }
};

/**
 * Initialize theme from settings
 */
export const initializeTheme = (settings: any) => {
  const theme: ThemeSettings = {
    colors: {
      primaryColor: settings.primaryColor || '#4590AD',
      secondaryColor: settings.secondaryColor || '#BD2D2B',
      accentColor: settings.accentColor || '#E39E41'
    },
    fonts: {
      primaryFont: settings.primaryFont || 'Plus Jakarta Sans',
      secondaryFont: settings.secondaryFont || 'Plus Jakarta Sans',
      accentFont: settings.accentFont || 'Plus Jakarta Sans'
    },
    customCSS: settings.customCSS,
    logoUrl: settings.logoUrl,
    faviconUrl: settings.faviconUrl,
    enableDarkMode: settings.enableDarkMode
  };

  applyTheme(theme);
}; 