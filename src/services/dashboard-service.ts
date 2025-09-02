import firebaseService from './firebase-service';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { Resource, Booking, Notification, User } from '../types';

export interface DashboardData {
  resources: Resource[];
  bookings: Booking[];
  notifications: Notification[];
  userCount: number;
  loading: boolean;
  error: string | null;
}

export class DashboardService {
  private static instance: DashboardService;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 30000; // 30 seconds

  static getInstance(): DashboardService {
    if (!DashboardService.instance) {
      DashboardService.instance = new DashboardService();
    }
    return DashboardService.instance;
  }

  private isCacheValid(key: string): boolean {
    const cached = this.cache.get(key);
    if (!cached) return false;
    return Date.now() - cached.timestamp < this.CACHE_DURATION;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  private getCache(key: string): any {
    const cached = this.cache.get(key);
    return cached ? cached.data : null;
  }

  private clearCache(): void {
    this.cache.clear();
  }

  async loadDashboardData(user: User): Promise<DashboardData> {
    const cacheKey = `dashboard_${user.id}_${user.role}`;
    
    // Return cached data if valid
    if (this.isCacheValid(cacheKey)) {
      console.log('📦 Returning cached dashboard data');
      return this.getCache(cacheKey);
    }

    console.log('🔄 Loading fresh dashboard data for user:', user.id, 'role:', user.role);
    
    const dashboardData: DashboardData = {
      resources: [],
      bookings: [],
      notifications: [],
      userCount: 0,
      loading: true,
      error: null
    };

    try {
      // Load all data in parallel for better performance with individual error handling
      const [resources, bookings, notifications, userCount] = await Promise.allSettled([
        this.loadResources().catch(err => {
          console.warn('⚠️ Resources failed to load:', err);
          return [];
        }),
        this.loadBookings(user).catch(err => {
          console.warn('⚠️ Bookings failed to load:', err);
          return [];
        }),
        this.loadNotifications(user).catch(err => {
          console.warn('⚠️ Notifications failed to load:', err);
          return [];
        }),
        this.loadUserCount(user).catch(err => {
          console.warn('⚠️ User count failed to load:', err);
          return 0;
        })
      ]);

      // Process results - all should be fulfilled due to catch handlers above
      dashboardData.resources = resources.status === 'fulfilled' ? resources.value : [];
      dashboardData.bookings = bookings.status === 'fulfilled' ? bookings.value : [];
      dashboardData.notifications = notifications.status === 'fulfilled' ? notifications.value : [];
      dashboardData.userCount = userCount.status === 'fulfilled' ? userCount.value : 0;

      // Check for any critical errors
      const errors = [resources, bookings, notifications, userCount]
        .filter(result => result.status === 'rejected')
        .map(result => (result as PromiseRejectedResult).reason);

      if (errors.length > 0) {
        console.warn('⚠️ Some dashboard data failed to load:', errors);
        // Only set error if all data failed to load
        if (dashboardData.resources.length === 0 && dashboardData.bookings.length === 0 && 
            dashboardData.notifications.length === 0 && dashboardData.userCount === 0) {
          dashboardData.error = `Failed to load dashboard data: ${errors.length} errors`;
        }
      }

      dashboardData.loading = false;
      
      // Cache the result
      this.setCache(cacheKey, { ...dashboardData });
      
      console.log('✅ Dashboard data loaded successfully:', {
        resources: dashboardData.resources.length,
        bookings: dashboardData.bookings.length,
        notifications: dashboardData.notifications.length,
        userCount: dashboardData.userCount,
        hasErrors: errors.length > 0
      });

      return dashboardData;
    } catch (error: any) {
      console.error('❌ Critical error loading dashboard data:', error);
      dashboardData.loading = false;
      dashboardData.error = error.message || 'Failed to load dashboard data';
      return dashboardData;
    }
  }

  private async loadResources(): Promise<Resource[]> {
    try {
      console.log('📚 Loading resources...');
      
      // Try service method first
      try {
        const resources = await firebaseService.getResources();
        console.log('✅ Resources loaded via service:', resources.length);
        return resources;
      } catch (serviceError) {
        console.warn('⚠️ Service method failed, trying direct Firebase:', serviceError);
        
        // Fallback to direct Firebase
        const db = getFirestore();
        const resourcesRef = collection(db, 'resources');
        const snapshot = await getDocs(resourcesRef);
        
        if (snapshot.empty) {
          console.log('📊 No resources found in Firestore');
          return [];
        }
        
        const resources = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Resource[];
        
        console.log('✅ Resources loaded via direct Firebase:', resources.length);
        return resources;
      }
    } catch (error: any) {
      console.error('❌ Error loading resources:', error);
      return [];
    }
  }

  private async loadBookings(user: User): Promise<Booking[]> {
    try {
      console.log('📅 Loading bookings for user:', user.id, 'role:', user.role);
      
      let bookings: Booking[] = [];
      
      if (user.role?.toLowerCase() === 'admin') {
        console.log('👑 Loading all bookings for admin');
        bookings = await firebaseService.getAllBookings();
      } else {
        console.log('👤 Loading user bookings');
        bookings = await firebaseService.getBookingsByUser(user.id);
      }
      
      console.log('✅ Bookings loaded:', bookings.length);
      return bookings;
    } catch (error: any) {
      console.error('❌ Error loading bookings:', error);
      return [];
    }
  }

  private async loadNotifications(user: User): Promise<Notification[]> {
    try {
      console.log('🔔 Loading notifications for user:', user.id, 'role:', user.role);
      
      let notifications: Notification[] = [];
      
      if (user.role?.toLowerCase() === 'admin') {
        console.log('👑 Loading all notifications for admin');
        notifications = await firebaseService.getAllNotifications();
      } else {
        console.log('👤 Loading user notifications');
        notifications = await firebaseService.getNotificationsByUser(user.id);
      }
      
      console.log('✅ Notifications loaded:', notifications.length);
      return notifications;
    } catch (error: any) {
      console.error('❌ Error loading notifications:', error);
      return [];
    }
  }

  private async loadUserCount(user: User): Promise<number> {
    try {
      if (user.role?.toLowerCase() === 'admin') {
        console.log('👥 Loading user count for admin');
        const users = await firebaseService.getAllUsers();
        console.log('✅ User count loaded:', users.length);
        return users.length;
      }
      return 0;
    } catch (error: any) {
      console.error('❌ Error loading user count:', error);
      return 0;
    }
  }

  async refreshData(user: User): Promise<DashboardData> {
    console.log('🔄 Refreshing dashboard data...');
    this.clearCache();
    return this.loadDashboardData(user);
  }

  async refreshResources(): Promise<Resource[]> {
    console.log('🔄 Refreshing resources...');
    this.cache.delete('resources');
    return this.loadResources();
  }

  async refreshBookings(user: User): Promise<Booking[]> {
    console.log('🔄 Refreshing bookings...');
    this.cache.delete(`bookings_${user.id}`);
    return this.loadBookings(user);
  }

  async refreshNotifications(user: User): Promise<Notification[]> {
    console.log('🔄 Refreshing notifications...');
    this.cache.delete(`notifications_${user.id}`);
    return this.loadNotifications(user);
  }
}

// Export singleton instance
export const dashboardService = DashboardService.getInstance();
export default dashboardService;
