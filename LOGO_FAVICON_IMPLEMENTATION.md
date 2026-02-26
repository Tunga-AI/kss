# Dynamic Logo and Favicon Implementation

## Overview
Implemented dynamic logo and favicon management across the KSS application. Admins can now upload and manage logos and favicons from the Admin Settings page, which will be automatically reflected across the entire application.

## Changes Made

### 1. **Type Definitions** (`src/lib/settings-types.ts`)
- Added `faviconUrl?: string` field to `BrandingSettings` type
- This allows storing the favicon URL in Firestore

### 2. **Admin Settings Page** (`src/app/admin/settings/page.tsx`)
- Added Favicon uploader using the existing `ImageUploader` component
- Favicon can be uploaded in ICO, PNG, or SVG format
- Recommended size: 32x32px or 16x16px
- Files are stored in Firebase Storage at `settings/favicon`

### 3. **Admin Layout** (`src/app/admin/layout.tsx`)
- Added imports: `useDoc`, `useFirestore`, `doc`, `BrandingSettings`, `Image`
- Fetches branding settings from Firestore
- Updated sidebar header to display dynamic logo from Firebase Storage
- **Fallback**: Shows "KSS" text when no logo is uploaded
- Logo adapts to sidebar collapsed state with smooth transitions

### 4. **Staff Layout** (`src/app/staff/layout.tsx`)
- Added imports: `useDoc`, `useFirestore`, `doc`, `BrandingSettings`, `Image`, `SidebarHeader`
- Fetches branding settings from Firestore
- Added `SidebarHeader` component to staff sidebar
- Updated sidebar header to display dynamic logo from Firebase Storage
- **Fallback**: Shows "KSS" text when no logo is uploaded
- Logo adapts to sidebar collapsed state with smooth transitions

### 5. **Header Component** (`src/components/shared/header.tsx`)
- ✅ Already implemented - uses dynamic logo from branding settings
- Shows "KSS" fallback when no logo is uploaded

### 6. **Footer Component** (`src/components/shared/footer.tsx`)
- ✅ Already implemented - uses dynamic logo from branding settings
- Shows "KSS" fallback when no logo is uploaded

### 7. **Favicon Manager** (`src/components/shared/favicon-manager.tsx`)
- **NEW FILE**: Client component that dynamically updates the browser favicon
- Watches for changes to `faviconUrl` in branding settings
- Automatically updates the favicon without page reload
- Creates favicon link element if it doesn't exist

### 8. **Root Layout** (`src/app/layout.tsx`)
- Added `FaviconManager` component to enable dynamic favicon updates
- Component is placed inside `FirebaseClientProvider` for Firebase access

## How It Works

### Logo Management Flow:
1. Admin navigates to `/a/settings` → **Branding & UI** tab
2. Uploads logo image via "Platform Logo" uploader
3. Image is uploaded to Firebase Storage at `settings/logo`
4. Download URL is saved to Firestore at `settings/branding`
5. All components using the logo automatically update:
   - Admin sidebar
   - Staff sidebar
   - Public header (all pages)
   - Public footer (all pages)

### Favicon Management Flow:
1. Admin navigates to `/a/settings` → **Branding & UI** tab
2. Uploads favicon image via "Favicon" uploader
3. Image is uploaded to Firebase Storage at `settings/favicon`
4. Download URL is saved to Firestore at `settings/branding`
5. `FaviconManager` component detects the change
6. Browser favicon updates dynamically across all tabs

## Features

### Logo Features:
- ✅ Single upload point (Admin Settings)
- ✅ Automatically syncs across all application areas
- ✅ Responsive to sidebar collapse/expand state
- ✅ Smooth transitions and animations
- ✅ Fallback to "KSS" text when no logo
- ✅ Works with any image format (PNG, SVG, JPEG, etc.)
- ✅ Brightness/invert filters for dark sidebar backgrounds

### Favicon Features:
- ✅ Single upload point (Admin Settings)
- ✅ Dynamic update without page reload
- ✅ Supports ICO, PNG, and SVG formats
- ✅ Recommended size guidance (32x32px or 16x16px)
- ✅ Stored in Firebase Storage for reliability

## Testing

To test the implementation:

1. **Upload Logo:**
   - Go to `/a/settings`
   - Click "Branding & UI"
   - Upload an image in "Platform Logo"
   - Navigate to different pages to verify logo appears

2. **Upload Favicon:**
   - Go to `/a/settings`
   - Click "Branding & UI"
   - Upload an image in "Favicon"
   - Check browser tab to see new favicon

3. **Test Fallback:**
   - Clear the logo URL from Firestore
   - Verify "KSS" text appears in sidebars and header/footer

## File Locations

- **Settings Page**: `/Users/mutunga/Tunga/kss2/kss/src/app/admin/settings/page.tsx`
- **Admin Layout**: `/Users/mutunga/Tunga/kss2/kss/src/app/admin/layout.tsx`
- **Staff Layout**: `/Users/mutunga/Tunga/kss2/kss/src/app/staff/layout.tsx`
- **Header**: `/Users/mutunga/Tunga/kss2/kss/src/components/shared/header.tsx`
- **Footer**: `/Users/mutunga/Tunga/kss2/kss/src/components/shared/footer.tsx`
- **Favicon Manager**: `/Users/mutunga/Tunga/kss2/kss/src/components/shared/favicon-manager.tsx`
- **Root Layout**: `/Users/mutunga/Tunga/kss2/kss/src/app/layout.tsx`
- **Type Definitions**: `/Users/mutunga/Tunga/kss2/kss/src/lib/settings-types.ts`

## Storage Structure

```
Firebase Storage:
└── settings/
    ├── logo           (Platform logo)
    ├── favicon        (Browser favicon)
    ├── hero_home      (Home page hero)
    ├── hero_programs  (Programs page hero)
    └── ... (other hero images)

Firestore:
└── settings/
    └── branding/
        ├── logoUrl: "https://storage.googleapis.com/..."
        ├── faviconUrl: "https://storage.googleapis.com/..."
        ├── homeHeroUrl: "https://storage.googleapis.com/..."
        └── ... (other settings)
```
