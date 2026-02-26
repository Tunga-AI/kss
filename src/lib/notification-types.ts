import type { Timestamp } from 'firebase/firestore';

export type NotificationType =
  | 'feedback_new'           // New feedback cycle available
  | 'feedback_reminder'      // Reminder to complete feedback
  | 'feedback_closed'        // Feedback cycle closed
  | 'admission_update'       // Admission status update
  | 'class_scheduled'        // New class scheduled
  | 'class_cancelled'        // Class cancelled
  | 'class_reminder'         // Class starting soon
  | 'certificate_issued'     // Certificate available
  | 'payment_due'            // Payment reminder
  | 'payment_confirmed'      // Payment confirmed
  | 'program_update'         // Program information updated
  | 'cohort_update'          // Cohort information updated
  | 'announcement'           // General announcement
  | 'system'                 // System notification
  | 'message';               // Direct message

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export type NotificationStatus = 'unread' | 'read' | 'archived';

export interface NotificationAction {
  label: string;
  url: string;
  type: 'primary' | 'secondary';
}

export interface Notification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  status: NotificationStatus;

  // Content
  title: string;
  message: string;
  icon?: string;

  // Recipients
  recipientId: string;          // User ID
  recipientRole?: string;        // User role for filtering

  // Context
  relatedEntityId?: string;      // ID of related entity (feedback, class, etc.)
  relatedEntityType?: string;    // Type of related entity

  // Actions
  actions?: NotificationAction[];
  actionUrl?: string;            // Quick action URL

  // Metadata
  createdBy?: string;            // User ID of creator
  createdAt: Timestamp;
  readAt?: Timestamp;
  archivedAt?: Timestamp;
  expiresAt?: Timestamp;         // Optional expiration

  // Delivery
  sendEmail?: boolean;           // Whether to send email notification
  emailSent?: boolean;
  sendPush?: boolean;            // Whether to send push notification
  pushSent?: boolean;
}

export interface NotificationTemplate {
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  actions?: NotificationAction[];
}

export interface NotificationPreferences {
  userId: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  notificationTypes: {
    [key in NotificationType]?: boolean;
  };
}

export interface NotificationStats {
  total: number;
  unread: number;
  byType: { [key in NotificationType]?: number };
  byPriority: { [key in NotificationPriority]?: number };
}
