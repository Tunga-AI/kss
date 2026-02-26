'use client';

import { useEffect } from 'react';
import { useDoc, useUsersFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { BrandingSettings } from '@/lib/settings-types';

export function FaviconManager() {
    const firestore = useUsersFirestore();
    const settingsRef = firestore ? doc(firestore, 'settings', 'branding') : null;
    const { data: settings } = useDoc<BrandingSettings>(settingsRef as any);

    useEffect(() => {
        if (settings?.faviconUrl) {
            // Update favicon dynamically
            let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
            if (!link) {
                link = document.createElement('link');
                link.rel = 'icon';
                document.head.appendChild(link);
            }
            link.href = settings.faviconUrl;
        }
    }, [settings?.faviconUrl]);

    return null;
}
