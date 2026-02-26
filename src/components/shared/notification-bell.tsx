'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { useFirestore, useCollection, useUser } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { Notification } from '@/lib/notification-types';
import { cn } from '@/lib/utils';

interface NotificationBellProps {
  href: string;
  className?: string;
}

export function NotificationBell({ href, className }: NotificationBellProps) {
  const firestore = useFirestore();
  const { user } = useUser();

  const notificationsQuery = useMemo(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'notifications'),
      where('recipientId', '==', user.id),
      where('status', '==', 'unread')
    );
  }, [firestore, user]);

  const { data: unreadNotifications } = useCollection<Notification>(notificationsQuery as any);

  const unreadCount = unreadNotifications?.length || 0;

  return (
    <Link
      href={href}
      className={cn(
        'relative inline-flex items-center justify-center p-2 rounded-tl-lg rounded-br-lg hover:bg-white/10 transition-colors',
        className
      )}
    >
      <Bell className="h-5 w-5" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-accent text-white text-xs font-bold flex items-center justify-center animate-pulse">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </Link>
  );
}
