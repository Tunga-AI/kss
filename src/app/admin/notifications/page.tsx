'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Bell, Send, Users, AlertCircle, CheckCheck, Archive, Trash2, Eye, Info } from "lucide-react";
import { useFirestore, useCollection, useUser } from '@/firebase';
import { collection, query, orderBy, where, getDocs } from 'firebase/firestore';
import type { Notification, NotificationPriority } from '@/lib/notification-types';
import { createAnnouncement, markAsRead, archiveNotification, deleteNotification } from '@/lib/notifications';
import { cn } from "@/lib/utils";

export default function AdminNotificationsPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const [showForm, setShowForm] = useState(false);
  const [sending, setSending] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<NotificationPriority>('medium');
  const [targetAudience, setTargetAudience] = useState<'all' | 'learners' | 'instructors'>('all');
  const [actionUrl, setActionUrl] = useState('');

  const notificationsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'notifications'),
      orderBy('createdAt', 'desc')
    );
  }, [firestore]);

  const { data: allNotifications, loading } = useCollection<Notification>(notificationsQuery as any);

  const recentNotifications = useMemo(() => {
    return allNotifications?.slice(0, 50) || [];
  }, [allNotifications]);

  const stats = useMemo(() => {
    if (!allNotifications) return { total: 0, unread: 0, urgent: 0 };

    return {
      total: allNotifications.length,
      unread: allNotifications.filter(n => n.status === 'unread').length,
      urgent: allNotifications.filter(n => n.priority === 'urgent' || n.priority === 'high').length,
    };
  }, [allNotifications]);

  const handleSendAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !user) return;

    setSending(true);
    try {
      // Get target user IDs based on audience
      let targetUserIds: string[] = [];

      if (targetAudience === 'all') {
        const usersQuery = query(collection(firestore, 'users'));
        const usersSnapshot = await getDocs(usersQuery);
        targetUserIds = usersSnapshot.docs.map(doc => doc.id);
      } else if (targetAudience === 'learners') {
        const learnersQuery = query(
          collection(firestore, 'users'),
          where('role', '==', 'Learner')
        );
        const learnersSnapshot = await getDocs(learnersQuery);
        targetUserIds = learnersSnapshot.docs.map(doc => doc.id);
      } else if (targetAudience === 'instructors') {
        const instructorsQuery = query(
          collection(firestore, 'users'),
          where('role', '==', 'Facilitator')
        );
        const instructorsSnapshot = await getDocs(instructorsQuery);
        targetUserIds = instructorsSnapshot.docs.map(doc => doc.id);
      }

      await createAnnouncement(
        firestore,
        title,
        message,
        targetUserIds,
        priority,
        user.id,
        actionUrl || undefined
      );

      alert(`Announcement sent to ${targetUserIds.length} users!`);

      // Reset form
      setTitle('');
      setMessage('');
      setPriority('medium');
      setTargetAudience('all');
      setActionUrl('');
      setShowForm(false);
    } catch (error) {
      console.error('Error sending announcement:', error);
      alert('Error sending announcement. Please try again.');
    } finally {
      setSending(false);
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
      <div className="w-full max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="bg-primary text-white p-6 mb-6 border-b border-primary/10 rounded-tl-3xl rounded-br-3xl rounded-tr-none rounded-bl-none shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-accent/20 rounded-full blur-3xl opacity-20" />

          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Bell className="h-8 w-8 bg-accent/20 p-1.5 rounded-lg text-accent" />
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Notifications Management</h1>
              </div>
              <p className="text-white/80 text-lg font-medium">
                Send announcements and manage platform notifications
              </p>
            </div>
            <Button
              className="bg-secondary hover:bg-secondary/90 text-white border-none h-12 px-6 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none font-bold shadow-lg transition-all"
              onClick={() => setShowForm(!showForm)}
            >
              <Send className="h-4 w-4 mr-2" />
              {showForm ? 'Cancel' : 'Send Announcement'}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="p-6 rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-primary/60 uppercase tracking-wider">Total Sent</p>
                <p className="text-3xl font-bold text-primary mt-2">{stats.total}</p>
              </div>
              <div className="p-3 rounded-tl-lg rounded-br-lg bg-blue-500/10 text-blue-500">
                <Bell className="h-5 w-5" />
              </div>
            </div>
          </Card>
          <Card className="p-6 rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-primary/60 uppercase tracking-wider">Global Unread</p>
                <p className="text-3xl font-bold text-accent mt-2">{stats.unread}</p>
              </div>
              <div className="p-3 rounded-tl-lg rounded-br-lg bg-accent/10 text-accent">
                <Users className="h-5 w-5" />
              </div>
            </div>
          </Card>
          <Card className="p-6 rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-primary/60 uppercase tracking-wider">High Priority</p>
                <p className="text-3xl font-bold text-orange-500 mt-2">{stats.urgent}</p>
              </div>
              <div className="p-3 rounded-tl-lg rounded-br-lg bg-orange-500/10 text-orange-500">
                <AlertCircle className="h-5 w-5" />
              </div>
            </div>
          </Card>
        </div>

        {/* Announcement Form */}
        {showForm && (
          <Card className="p-6 mb-6 rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none">
            <h2 className="text-xl font-bold text-primary mb-4">Send Announcement</h2>
            <form onSubmit={handleSendAnnouncement} className="space-y-4">
              <div>
                <Label htmlFor="title" className="text-sm font-bold text-primary/60 uppercase">Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="mt-2 rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none"
                  placeholder="Announcement title..."
                />
              </div>

              <div>
                <Label htmlFor="message" className="text-sm font-bold text-primary/60 uppercase">Message *</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  className="mt-2 rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none"
                  rows={4}
                  placeholder="Your announcement message..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="priority" className="text-sm font-bold text-primary/60 uppercase">Priority</Label>
                  <select
                    id="priority"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as NotificationPriority)}
                    className="w-full mt-2 px-4 py-2 border border-primary/10 rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none focus:outline-none focus:ring-2 focus:ring-primary/10"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="audience" className="text-sm font-bold text-primary/60 uppercase">Target Audience</Label>
                  <select
                    id="audience"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value as any)}
                    className="w-full mt-2 px-4 py-2 border border-primary/10 rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none focus:outline-none focus:ring-2 focus:ring-primary/10"
                  >
                    <option value="all">All Users</option>
                    <option value="learners">Learners Only</option>
                    <option value="instructors">Instructors Only</option>
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="actionUrl" className="text-sm font-bold text-primary/60 uppercase">Action URL (Optional)</Label>
                <Input
                  id="actionUrl"
                  value={actionUrl}
                  onChange={(e) => setActionUrl(e.target.value)}
                  className="mt-2 rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none"
                  placeholder="/dashboard/..."
                />
              </div>

              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                  className="rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={sending}
                  className="bg-secondary hover:bg-secondary/90 rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {sending ? 'Sending...' : 'Send Announcement'}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Recent Notifications List */}
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-primary mb-4 px-1">Recent Notifications</h2>
          {recentNotifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              onMarkAsRead={handleMarkAsRead}
              onArchive={handleArchive}
              onDelete={handleDelete}
            />
          ))}

          {recentNotifications.length === 0 && (
            <Card className="p-12 text-center rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none">
              <Bell className="h-16 w-16 text-primary/20 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-primary/40 mb-2">No Notifications</h3>
              <p className="text-primary/60">No recent notifications found.</p>
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
        notification.status === 'unread' ? 'border-l-4 border-l-accent bg-accent/5' : 'bg-white'
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
              {/* Admin view extras: Type */}
              <Badge className="text-[10px] bg-primary/10 text-primary border-none uppercase tracking-wider">
                {notification.type?.replace('_', ' ') || 'Notification'}
              </Badge>
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
              {notification.createdAt?.toDate().toLocaleDateString()} at{' '}
              {notification.createdAt?.toDate().toLocaleTimeString()}
            </p>

            <div className="flex gap-2 transition-opacity">
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
