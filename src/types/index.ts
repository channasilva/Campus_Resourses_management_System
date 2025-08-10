// User Management Types
export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'lecturer' | 'student';
  department?: string;
  profilePicture?: string;
  contactInfo?: {
    phone?: string;
    office?: string;
  };
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
}

export interface UserProfile extends User {
  bookingHistory: Booking[];
  preferences?: {
    notifications: boolean;
    emailNotifications: boolean;
    defaultBookingDuration: number;
  };
}

// Resource Management Types
export interface Resource {
  id: string;
  name: string;
  type: 'room' | 'lab' | 'equipment' | 'vehicle';
  category: string;
  location: string;
  capacity?: number;
  description?: string;
  status: 'available' | 'booked' | 'maintenance' | 'unavailable';
  isUnderMaintenance: boolean;
  maintenanceNote?: string;
  features: string[];
  qrCode?: string;
  maintenanceHistory?: MaintenanceRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface MaintenanceRecord {
  id: string;
  resourceId: string;
  issue: string;
  reportedBy: string;
  reportedAt: string;
  status: 'pending' | 'in-progress' | 'resolved';
  resolvedBy?: string;
  resolvedAt?: string;
  notes?: string;
}

// Booking System Types
export interface Booking {
  id: string;
  resourceId: string;
  resourceName: string;
  userId: string;
  userName: string;
  userRole: string;
  startTime: string;
  endTime: string;
  purpose: string;
  attendees?: number;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  isRecurring: boolean;
  recurringPattern?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    interval: number;
    endDate?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface BookingRequest {
  resourceId: string;
  startTime: string;
  endTime: string;
  purpose: string;
  attendees?: number;
  isRecurring?: boolean;
  recurringPattern?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    interval: number;
    endDate?: string;
  };
}

// Notification Types
export interface Notification {
  id: string;
  userId?: string; // Optional for system-wide notifications
  type: 'booking_confirmation' | 'booking_cancellation' | 'approval_request' | 'maintenance_alert' | 'system_announcement' | 'admin_announcement';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
  imageUrl?: string; // Optional image URL
  createdBy?: string; // Admin who created the notification
  isSystemNotification?: boolean; // True for admin-created notifications
}

// Report Types
export interface BookingReport {
  totalBookings: number;
  approvedBookings: number;
  rejectedBookings: number;
  pendingBookings: number;
  cancelledBookings: number;
  averageBookingDuration: number;
  mostBookedResources: Array<{
    resourceId: string;
    resourceName: string;
    bookingCount: number;
  }>;
  peakBookingTimes: Array<{
    hour: number;
    bookingCount: number;
  }>;
}

export interface ResourceUtilizationReport {
  resourceId: string;
  resourceName: string;
  totalBookings: number;
  utilizationPercentage: number;
  averageBookingDuration: number;
  maintenanceCount: number;
  downtimeHours: number;
}

// Audit Log Types
export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  resource?: string;
  details: string;
  timestamp: string;
  ipAddress?: string;
}

// System Settings Types
export interface SystemSettings {
  maxBookingDuration: number; // in hours
  maxBookingsPerUser: number;
  approvalRequired: boolean;
  blackoutDates: string[];
  maintenanceMode: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
}

// Form Types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'admin' | 'lecturer' | 'student';
  department?: string;
}

export interface ProfileUpdateData {
  username?: string;
  department?: string;
  contactInfo?: {
    phone?: string;
    office?: string;
  };
  preferences?: {
    notifications: boolean;
    emailNotifications: boolean;
    defaultBookingDuration: number;
  };
}

// Calendar Types
export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resourceId: string;
  resourceName: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  color: string;
}

// Search and Filter Types
export interface BookingFilters {
  resourceType?: string;
  status?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  userRole?: string;
}

export interface ResourceFilters {
  type?: string;
  status?: string;
  location?: string;
  capacity?: number;
} 