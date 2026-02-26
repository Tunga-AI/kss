'use client';

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  Firestore,
  updateDoc,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import type {
  Notification,
  NotificationType,
  NotificationPriority,
  NotificationStats,
} from './notification-types';

// CRUD Operations
export async function createNotification(
  db: Firestore,
  notification: Omit<Notification, 'id'>
) {
  return addDoc(collection(db, 'notifications'), notification);
}

export async function createBulkNotifications(
  db: Firestore,
  notifications: Omit<Notification, 'id'>[]
) {
  const batch = writeBatch(db);
  const notificationsRef = collection(db, 'notifications');

  notifications.forEach((notification) => {
    const docRef = doc(notificationsRef);
    batch.set(docRef, notification);
  });

  return batch.commit();
}

export async function markAsRead(db: Firestore, notificationId: string) {
  const notificationRef = doc(db, 'notifications', notificationId);
  return updateDoc(notificationRef, {
    status: 'read',
    readAt: Timestamp.now(),
  });
}

export async function markAllAsRead(db: Firestore, userId: string) {
  const q = query(
    collection(db, 'notifications'),
    where('recipientId', '==', userId),
    where('status', '==', 'unread')
  );

  const snapshot = await getDocs(q);
  const batch = writeBatch(db);

  snapshot.docs.forEach((document) => {
    batch.update(document.ref, {
      status: 'read',
      readAt: Timestamp.now(),
    });
  });

  return batch.commit();
}

export async function archiveNotification(db: Firestore, notificationId: string) {
  const notificationRef = doc(db, 'notifications', notificationId);
  return updateDoc(notificationRef, {
    status: 'archived',
    archivedAt: Timestamp.now(),
  });
}

export async function deleteNotification(db: Firestore, notificationId: string) {
  const notificationRef = doc(db, 'notifications', notificationId);
  return deleteDoc(notificationRef);
}

// Notification Statistics
export async function getNotificationStats(
  db: Firestore,
  userId: string
): Promise<NotificationStats> {
  const q = query(
    collection(db, 'notifications'),
    where('recipientId', '==', userId),
    where('status', '!=', 'archived')
  );

  const snapshot = await getDocs(q);
  const notifications = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Notification[];

  const stats: NotificationStats = {
    total: notifications.length,
    unread: notifications.filter((n) => n.status === 'unread').length,
    byType: {},
    byPriority: {},
  };

  notifications.forEach((notification) => {
    // Count by type
    stats.byType[notification.type] = (stats.byType[notification.type] || 0) + 1;

    // Count by priority
    stats.byPriority[notification.priority] =
      (stats.byPriority[notification.priority] || 0) + 1;
  });

  return stats;
}

// Helper function to create feedback notifications
export async function notifyFeedbackCycle(
  db: Firestore,
  feedbackCycleId: string,
  feedbackTitle: string,
  feedbackDescription: string,
  targetUserIds: string[],
  createdBy: string
) {
  const notifications: Omit<Notification, 'id'>[] = targetUserIds.map((userId) => ({
    type: 'feedback_new' as NotificationType,
    priority: 'medium' as NotificationPriority,
    status: 'unread',
    title: 'New Feedback Request',
    message: `You have been invited to provide feedback: ${feedbackTitle}`,
    recipientId: userId,
    relatedEntityId: feedbackCycleId,
    relatedEntityType: 'feedback',
    actions: [
      {
        label: 'Provide Feedback',
        url: `/dashboard/feedback/${feedbackCycleId}`,
        type: 'primary',
      },
    ],
    actionUrl: `/dashboard/feedback/${feedbackCycleId}`,
    createdBy,
    createdAt: Timestamp.now(),
    sendEmail: true,
    emailSent: false,
  }));

  return createBulkNotifications(db, notifications);
}

// Helper function to send feedback reminders
export async function sendFeedbackReminder(
  db: Firestore,
  feedbackCycleId: string,
  feedbackTitle: string,
  targetUserIds: string[],
  daysUntilDeadline: number
) {
  const notifications: Omit<Notification, 'id'>[] = targetUserIds.map((userId) => ({
    type: 'feedback_reminder' as NotificationType,
    priority: daysUntilDeadline <= 2 ? ('high' as NotificationPriority) : ('medium' as NotificationPriority),
    status: 'unread',
    title: 'Feedback Reminder',
    message: `Reminder: Please complete feedback "${feedbackTitle}". ${daysUntilDeadline} day(s) remaining.`,
    recipientId: userId,
    relatedEntityId: feedbackCycleId,
    relatedEntityType: 'feedback',
    actions: [
      {
        label: 'Complete Now',
        url: `/dashboard/feedback/${feedbackCycleId}`,
        type: 'primary',
      },
    ],
    actionUrl: `/dashboard/feedback/${feedbackCycleId}`,
    createdAt: Timestamp.now(),
    sendEmail: true,
    emailSent: false,
  }));

  return createBulkNotifications(db, notifications);
}

// Helper function to notify class scheduling
export async function notifyClassScheduled(
  db: Firestore,
  classId: string,
  className: string,
  classDate: Date,
  targetUserIds: string[],
  createdBy: string
) {
  const notifications: Omit<Notification, 'id'>[] = targetUserIds.map((userId) => ({
    type: 'class_scheduled' as NotificationType,
    priority: 'medium' as NotificationPriority,
    status: 'unread',
    title: 'New Class Scheduled',
    message: `A new class "${className}" has been scheduled for ${classDate.toLocaleDateString()}.`,
    recipientId: userId,
    relatedEntityId: classId,
    relatedEntityType: 'class',
    actions: [
      {
        label: 'View Details',
        url: `/dashboard/classroom/${classId}`,
        type: 'primary',
      },
    ],
    actionUrl: `/dashboard/classroom/${classId}`,
    createdBy,
    createdAt: Timestamp.now(),
    sendEmail: true,
    emailSent: false,
  }));

  return createBulkNotifications(db, notifications);
}

// Helper function to notify admission updates
export async function notifyAdmissionUpdate(
  db: Firestore,
  admissionId: string,
  status: string,
  userId: string,
  createdBy: string
) {
  const notification: Omit<Notification, 'id'> = {
    type: 'admission_update',
    priority: 'high',
    status: 'unread',
    title: 'Admission Status Update',
    message: `Your admission status has been updated to: ${status}`,
    recipientId: userId,
    relatedEntityId: admissionId,
    relatedEntityType: 'admission',
    actions: [
      {
        label: 'View Application',
        url: `/dashboard/admissions`,
        type: 'primary',
      },
    ],
    actionUrl: `/dashboard/admissions`,
    createdBy,
    createdAt: Timestamp.now(),
    sendEmail: true,
    emailSent: false,
  };

  return createNotification(db, notification);
}

// Helper function to notify certificate issuance
export async function notifyCertificateIssued(
  db: Firestore,
  certificateId: string,
  programName: string,
  userId: string,
  createdBy: string
) {
  const notification: Omit<Notification, 'id'> = {
    type: 'certificate_issued',
    priority: 'high',
    status: 'unread',
    title: 'Certificate Issued',
    message: `Congratulations! Your certificate for "${programName}" is now available.`,
    recipientId: userId,
    relatedEntityId: certificateId,
    relatedEntityType: 'certificate',
    actions: [
      {
        label: 'View Certificate',
        url: `/dashboard/certificates`,
        type: 'primary',
      },
    ],
    actionUrl: `/dashboard/certificates`,
    createdBy,
    createdAt: Timestamp.now(),
    sendEmail: true,
    emailSent: false,
  };

  return createNotification(db, notification);
}

// Helper function to send payment reminders
export async function notifyPaymentDue(
  db: Firestore,
  transactionId: string,
  amount: number,
  dueDate: Date,
  userId: string
) {
  const notification: Omit<Notification, 'id'> = {
    type: 'payment_due',
    priority: 'high',
    status: 'unread',
    title: 'Payment Due',
    message: `You have a payment of ${amount} due on ${dueDate.toLocaleDateString()}.`,
    recipientId: userId,
    relatedEntityId: transactionId,
    relatedEntityType: 'transaction',
    actions: [
      {
        label: 'Make Payment',
        url: `/dashboard/finance`,
        type: 'primary',
      },
    ],
    actionUrl: `/dashboard/finance`,
    createdAt: Timestamp.now(),
    sendEmail: true,
    emailSent: false,
  };

  return createNotification(db, notification);
}

// Helper function to create general announcements
export async function createAnnouncement(
  db: Firestore,
  title: string,
  message: string,
  targetUserIds: string[],
  priority: NotificationPriority,
  createdBy: string,
  actionUrl?: string
) {
  const notifications: Omit<Notification, 'id'>[] = targetUserIds.map((userId) => ({
    type: 'announcement' as NotificationType,
    priority,
    status: 'unread',
    title,
    message,
    recipientId: userId,
    actionUrl,
    createdBy,
    createdAt: Timestamp.now(),
    sendEmail: true,
    emailSent: false,
  }));

  return createBulkNotifications(db, notifications);
}

// Get users who haven't responded to feedback
export async function getUsersWhoHaventRespondedToFeedback(
  db: Firestore,
  feedbackCycleId: string,
  allTargetUserIds: string[]
): Promise<string[]> {
  const responsesQuery = query(
    collection(db, 'feedbackResponses'),
    where('feedbackCycleId', '==', feedbackCycleId)
  );

  const snapshot = await getDocs(responsesQuery);
  const respondedUserIds = new Set(
    snapshot.docs.map((doc) => doc.data().respondentId)
  );

  return allTargetUserIds.filter((userId) => !respondedUserIds.has(userId));
}
