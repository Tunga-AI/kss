'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Bell, CheckCheck, Archive, Trash2, Eye, AlertCircle, Info } from "lucide-react";
import { useFirestore, useCollection, useUser } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import type { Notification } from '@/lib/notification-types';
import { markAsRead, markAllAsRead, archiveNotification, deleteNotification } from '@/lib/notifications';
import { cn } from "@/lib/utils";

export default function NotificationsPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  const notificationsQuery = useMemo(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'notifications'),
      where('recipientId', '==', user.id),
      where('status', '!=', 'archived'),
      orderBy('status'),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, user]);

  const { data: allNotifications, loading } = useCollection<Notification>(notificationsQuery as any);

  const filteredNotifications = useMemo(() => {
    if (!allNotifications) return [];
    if (filter === 'all') return allNotifications;
    return allNotifications.filter(n => n.status === filter);
  }, [allNotifications, filter]);

  const unreadCount = useMemo(() => {
    return allNotifications?.filter(n => n.status === 'unread').length || 0;
  }, [allNotifications]);

  const handleMarkAllAsRead = async () => {
    if (firestore && user) {
      await markAllAsRead(firestore, user.id);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    if (firestore) {
      await markAsRead(firestore, notificationId);
    }
  };

  const handleArchive = async (notificationId: string) => {
    if (firestore) {
      await archiveNotification(firestore, notificationId);
    }
  };

  const handleDelete = async (notificationId: string) => {
    if (firestore && confirm('Are you sure you want to delete this notification?')) {
      await deleteNotification(firestore, notificationId);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-50/50 p-2 md:p-4 font-body">
      <div className="w-full max-w-5xl mx-auto">
        {/* Hero Section */}
        <div className="bg-primary text-white p-6 mb-6 border-b border-primary/10 rounded-tl-3xl rounded-br-3xl rounded-tr-none rounded-bl-none shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-accent/20 rounded-full blur-3xl opacity-20" />

          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Bell className="h-8 w-8 bg-accent/20 p-1.5 rounded-lg text-accent" />
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Notifications</h1>
              </div>
              <p className="text-white/80 text-lg font-medium">
                Stay updated with important messages and reminders
              </p>
            </div>
            {unreadCount > 0 && (
              <Button
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-primary rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none font-bold"
                onClick={handleMarkAllAsRead}
              >
                <CheckCheck className="h-4 w-4 mr-2" />
                Mark All as Read
              </Button>
            )}
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="p-4 rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none">
            <p className="text-xs font-bold text-primary/60 uppercase mb-1">Total</p>
            <p className="text-2xl font-bold text-primary">{allNotifications?.length || 0}</p>
          </Card>
          <Card className="p-4 rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none">
            <p className="text-xs font-bold text-primary/60 uppercase mb-1">Unread</p>
            <p className="text-2xl font-bold text-accent">{unreadCount}</p>
          </Card>
          <Card className="p-4 rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none">
            <p className="text-xs font-bold text-primary/60 uppercase mb-1">Read</p>
            <p className="text-2xl font-bold text-green-600">
              {(allNotifications?.length || 0) - unreadCount}
            </p>
          </Card>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
            className="rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none"
          >
            All ({allNotifications?.length || 0})
          </Button>
          <Button
            variant={filter === 'unread' ? 'default' : 'outline'}
            onClick={() => setFilter('unread')}
            className="rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none"
          >
            Unread ({unreadCount})
          </Button>
          <Button
            variant={filter === 'read' ? 'default' : 'outline'}
            onClick={() => setFilter('read')}
            className="rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none"
          >
            Read
          </Button>
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {filteredNotifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              onMarkAsRead={handleMarkAsRead}
              onArchive={handleArchive}
              onDelete={handleDelete}
            />
          ))}

          {filteredNotifications.length === 0 && (
            <Card className="p-12 text-center rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none">
              <Bell className="h-16 w-16 text-primary/20 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-primary/40 mb-2">No Notifications</h3>
              <p className="text-primary/60">
                {filter === 'unread'
                  ? "You're all caught up! No unread notifications."
                  : 'No notifications to display.'}
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function NotificationCard({
  notification,
  onMarkAsRead,
  onArchive,
  onDelete,
}: {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500/10 text-red-500 border-red-200';
      case 'high':
        return 'bg-orange-500/10 text-orange-500 border-orange-200';
      case 'medium':
        return 'bg-blue-500/10 text-blue-500 border-blue-200';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-200';
    }
  };

  const getIcon = () => {
    if (notification.priority === 'urgent' || notification.priority === 'high') {
      return <AlertCircle className="h-5 w-5" />;
    }
    return <Info className="h-5 w-5" />;
  };

  return (
    <Card
      className={cn(
        'p-4 rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none transition-all hover:shadow-lg group',
        notification.status === 'unread' ? 'border-l-4 border-l-accent bg-accent/5' : ''
      )}
    >
      <div className="flex gap-4">
        <div
          className={cn(
            'h-10 w-10 flex items-center justify-center rounded-tl-lg rounded-br-lg flex-shrink-0',
            getPriorityColor(notification.priority)
          )}
        >
          {getIcon()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div className="flex-1">
              <h3 className="font-bold text-primary leading-tight">{notification.title}</h3>
              <p className="text-sm text-primary/60 mt-1">{notification.message}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {notification.status === 'unread' && (
                <Badge className="bg-accent/10 text-accent border-none text-xs">New</Badge>
              )}
              <Badge className={cn('text-xs', getPriorityColor(notification.priority))}>
                {notification.priority}
              </Badge>
            </div>
          </div>

          <div className="flex items-center justify-between mt-3">
            <p className="text-xs text-primary/40">
              {notification.createdAt.toDate().toLocaleDateString()} at{' '}
              {notification.createdAt.toDate().toLocaleTimeString()}
            </p>

            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              {notification.actionUrl && (
                <Button
                  size="sm"
                  variant="ghost"
                  asChild
                  className="h-8 hover:bg-blue-500/10 rounded-tl-md rounded-br-md"
                  onClick={() => {
                    if (notification.status === 'unread') {
                      onMarkAsRead(notification.id);
                    }
                  }}
                >
                  <Link href={notification.actionUrl}>
                    <Eye className="h-4 w-4 text-blue-500" />
                  </Link>
                </Button>
              )}
              {notification.status === 'unread' && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onMarkAsRead(notification.id)}
                  className="h-8 hover:bg-green-500/10 rounded-tl-md rounded-br-md"
                >
                  <CheckCheck className="h-4 w-4 text-green-500" />
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onArchive(notification.id)}
                className="h-8 hover:bg-primary/10 rounded-tl-md rounded-br-md"
              >
                <Archive className="h-4 w-4 text-primary" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDelete(notification.id)}
                className="h-8 hover:bg-red-500/10 rounded-tl-md rounded-br-md"
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          </div>

          {notification.actions && notification.actions.length > 0 && (
            <div className="flex gap-2 mt-3">
              {notification.actions.map((action, index) => (
                <Button
                  key={index}
                  size="sm"
                  variant={action.type === 'primary' ? 'default' : 'outline'}
                  asChild
                  className="rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none"
                  onClick={() => {
                    if (notification.status === 'unread') {
                      onMarkAsRead(notification.id);
                    }
                  }}
                >
                  <Link href={action.url}>{action.label}</Link>
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
