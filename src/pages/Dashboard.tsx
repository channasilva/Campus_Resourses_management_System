import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  Users, 
  MapPin, 
  Plus, 
  Edit, 
  Trash2, 
  BookOpen, 
  Bell, 
  Settings, 
  LogOut, 
  Search,
  Filter,
  Send,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Hash,
  Mail,
  Shield,
  CalendarDays,
  User,
  GraduationCap,
  Menu,
  X
} from 'lucide-react';
import Button from '../components/Button';
import { firebaseService } from '../services/firebase-service';
import { Resource, Booking, Notification } from '../types';
import { User as UserType } from '../types/auth';
import { formatLocalDateTime, formatLocalTime } from '../utils/date-utils';
import toast, { Toaster } from 'react-hot-toast';
import { useTheme } from '../contexts/ThemeContext';

import AddResourceModal from '../components/AddResourceModal';
import EditResourceModal from '../components/EditResourceModal';
import BookingModal from '../components/BookingModal';
import BookingDetails from '../components/BookingDetails';
import BookingCalendar from '../components/BookingCalendar';
import CreateNotificationModal from '../components/CreateNotificationModal';
import ProfileSettingsModal from '../components/ProfileSettingsModal';
import ThemeToggle from '../components/ThemeToggle';
import UserCountCard from '../components/UserCountCard';
import MaintenanceToggle from '../components/MaintenanceToggle';
import DashboardAnalytics from '../components/DashboardAnalytics';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [userCount, setUserCount] = useState(0);
  const [isAddResourceModalOpen, setIsAddResourceModalOpen] = useState(false);
  const [isEditResourceModalOpen, setIsEditResourceModalOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isBookingDetailsOpen, setIsBookingDetailsOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isCreateNotificationOpen, setIsCreateNotificationOpen] = useState(false);
  const [isProfileSettingsOpen, setIsProfileSettingsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        const userData = localStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
          console.log('Current user role:', user.role);
          console.log('👤 Current user data:', user);
          console.log('🔍 User role:', user.role, 'Role type:', typeof user.role);
          console.log('🆔 User ID:', user.id, 'ID type:', typeof user.id);
          
          if (!user.id) {
            console.error('❌ User ID not found in user data');
            toast.error('User data is incomplete. Please log in again.');
            navigate('/login');
            return;
          }
          
          setCurrentUser(user);
          await loadDashboardData(user.id, user.role);
        } else {
          console.log('❌ No user data found in localStorage');
          navigate('/login');
          return;
        }
      } catch (error) {
        console.error('❌ Error initializing dashboard:', error);
        toast.error('Failed to initialize dashboard.');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };
    initializeDashboard();
  }, [navigate]);

  const loadDashboardData = async (userId: string, userRole: string) => {
    try {
      console.log('🔄 Loading dashboard data for user:', userId, 'role:', userRole);
      
             // Load resources and notifications
       let notificationsData: Notification[] = [];
       if (userRole.toLowerCase() === 'admin') {
         notificationsData = await firebaseService.getAllNotifications();
         // Fetch total user count for admin
         const users = await firebaseService.getAllUsers();
         setUserCount(users.length);
       } else {
         notificationsData = await firebaseService.getNotificationsByUser(userId);
       }
       
       const [resourcesData] = await Promise.all([
         firebaseService.getResources()
       ]);

      // Load bookings based on user role
      let bookingsData: Booking[] = [];
      if (userRole.toLowerCase() === 'admin') {
        console.log('👑 Loading all bookings for admin');
        bookingsData = await firebaseService.getAllBookings();
      } else {
        console.log('👤 Loading user bookings for:', userRole);
        bookingsData = await firebaseService.getBookingsByUser(userId);
      }

      console.log('📊 Dashboard data loaded:', {
        resources: resourcesData.length,
        bookings: bookingsData.length,
        notifications: notificationsData.length,
        userRole: userRole
      });

      setResources(resourcesData);
      setBookings(bookingsData);
      setNotifications(notificationsData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data.');
    }
  };

  const handleLogout = async () => {
    try {
      await firebaseService.logout();
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Logout failed.');
    }
  };

  const handleResourceAdded = async () => {
    // Refresh resources list
    try {
      const updatedResources = await firebaseService.getResources();
      setResources(updatedResources);
    } catch (error) {
      console.error('Error refreshing resources:', error);
    }
  };

  const handleResourceUpdated = async () => {
    // Refresh resources list
    try {
      const updatedResources = await firebaseService.getResources();
      setResources(updatedResources);
    } catch (error) {
      console.error('Error refreshing resources:', error);
    }
  };

  const handleEditResource = (resource: Resource) => {
    setSelectedResource(resource);
    setIsEditResourceModalOpen(true);
  };

  const handleDeleteResource = async (resourceId: string) => {
    if (window.confirm('Are you sure you want to delete this resource?')) {
      try {
        await firebaseService.deleteResource(resourceId);
        toast.success('Resource deleted successfully!');
        // Refresh resources list
        const updatedResources = await firebaseService.getResources();
        setResources(updatedResources);
      } catch (error) {
        console.error('Error deleting resource:', error);
        toast.error('Failed to delete resource. Please try again.');
      }
    }
  };

  const handleBookResource = (resource: Resource) => {
    setSelectedResource(resource);
    setIsBookingModalOpen(true);
  };

  const handleBookingCreated = async () => {
    // Refresh bookings list
    if (currentUser) {
      try {
        console.log('🔄 Refreshing bookings for user:', currentUser.id);
        
        // Load bookings based on user role
        let updatedBookings: Booking[] = [];
        if (currentUser.role?.toLowerCase() === 'admin') {
          console.log('👑 Refreshing all bookings for admin');
          updatedBookings = await firebaseService.getAllBookings();
        } else {
          console.log('👤 Refreshing user bookings for:', currentUser.role);
          updatedBookings = await firebaseService.getBookingsByUser(currentUser.id);
        }
        
        console.log('📋 Updated bookings:', updatedBookings);
        setBookings(updatedBookings);
      } catch (error) {
        console.error('Error refreshing bookings:', error);
      }
    }
  };

  const handleViewBookingDetails = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsBookingDetailsOpen(true);
  };

  const handleBookingUpdated = async () => {
    // Refresh bookings list
    if (currentUser) {
      try {
        if (currentUser.role?.toLowerCase() === 'admin') {
          const updatedBookings = await firebaseService.getAllBookings();
          setBookings(updatedBookings);
        } else {
          const updatedBookings = await firebaseService.getBookingsByUser(currentUser.id);
          setBookings(updatedBookings);
        }
      } catch (error) {
        console.error('Error refreshing bookings:', error);
      }
    }
  };

  const handleApproveBooking = async (bookingId: string) => {
    try {
      await firebaseService.approveBooking(bookingId);
      toast.success('Booking approved successfully!');
      handleBookingUpdated();
    } catch (error) {
      console.error('Error approving booking:', error);
      toast.error('Failed to approve booking.');
    }
  };

  const handleRejectBooking = async (bookingId: string) => {
    try {
      await firebaseService.rejectBooking(bookingId);
      toast.success('Booking rejected successfully!');
      handleBookingUpdated();
    } catch (error) {
      console.error('Error rejecting booking:', error);
      toast.error('Failed to reject booking.');
    }
  };

  const handleOpenCalendar = () => {
    setIsCalendarOpen(true);
  };

  const handleOpenCreateNotification = () => {
    setIsCreateNotificationOpen(true);
  };

  const handleNotificationCreated = async () => {
    // Refresh notifications list
    if (currentUser) {
      try {
        const updatedNotifications = await firebaseService.getNotificationsByUser(currentUser.id);
        setNotifications(updatedNotifications);
      } catch (error) {
        console.error('Error refreshing notifications:', error);
      }
    }
  };

  const handleOpenProfileSettings = () => {
    setIsProfileSettingsOpen(true);
  };

  const handleProfileUpdated = async () => {
    if (currentUser) {
      try {
        // Refresh user data from localStorage (it was updated in the modal)
        const userData = localStorage.getItem('user');
        if (userData) {
          const updatedUser = JSON.parse(userData);
          setCurrentUser(updatedUser);
        }
      } catch (error) {
        console.error('Error refreshing user data:', error);
      }
    }
  };

  const handleRefreshBookings = async () => {
    if (currentUser) {
      try {
        console.log('🔄 Manual refresh of bookings for user:', currentUser.id);
        await loadDashboardData(currentUser.id, currentUser.role);
        toast.success('Bookings refreshed!');
      } catch (error) {
        console.error('Error refreshing bookings:', error);
        toast.error('Failed to refresh bookings.');
      }
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await firebaseService.markNotificationAsRead(notificationId);
      toast.success('Notification marked as read!');
      handleNotificationCreated();
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark notification as read.');
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    if (window.confirm('Are you sure you want to delete this notification?')) {
      try {
        await firebaseService.deleteNotification(notificationId);
        toast.success('Notification deleted successfully!');
        handleNotificationCreated();
      } catch (error) {
        console.error('Error deleting notification:', error);
        toast.error('Failed to delete notification.');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-all duration-300">
      <Toaster position="top-center" />
      
      {/* Mobile-First Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 transition-all duration-300 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Mobile Header */}
          <div className="flex items-center justify-between h-16 lg:hidden">
            <div className="flex items-center space-x-3">
              <GraduationCap className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                Campus Resources
              </h1>
            </div>
            
            <div className="flex items-center space-x-3">
              <ThemeToggle />
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Desktop Header */}
          <div className="hidden lg:flex justify-between items-center h-16">
            <div className="flex items-center">
              <GraduationCap className="h-10 w-10 text-blue-600 dark:text-blue-400 mr-4" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Campus Resources Management
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              {currentUser.role?.toLowerCase() === 'admin' && (
                <UserCountCard />
              )}
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-sm">
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{currentUser.username}</p>
                  <p className="text-gray-500 dark:text-gray-400 capitalize">{currentUser.role}</p>
                </div>
              </div>
              <Button
                onClick={handleOpenProfileSettings}
                variant="outline"
                size="sm"
              >
                <User className="w-4 h-4 mr-2" />
                Profile
              </Button>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="lg:hidden border-t border-gray-200 dark:border-gray-700 py-4 space-y-4">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{currentUser.username}</p>
                  <p className="text-gray-500 dark:text-gray-400 text-xs capitalize">{currentUser.role}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={handleOpenProfileSettings}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </Button>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Welcome Section - Mobile Optimized */}
        <div className="mb-6 sm:mb-8 lg:mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2 sm:mb-3 lg:mb-4 leading-tight">
            Welcome back, {currentUser.username}!
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 dark:text-gray-400 leading-relaxed">
            Manage your campus resources and bookings from your dashboard.
          </p>
        </div>

        {/* Mobile-First Navigation Tabs */}
        <div className="mb-6 sm:mb-8 lg:mb-12">
          <div className="flex overflow-x-auto scrollbar-hide pb-2 -mb-2">
            {[
              'overview',
              currentUser?.role?.toLowerCase() === 'admin' ? 'analytics' : null,
              'resources',
              'bookings',
              'notifications'
            ].filter(Boolean).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`mobile-tab px-4 sm:px-6 ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 transition-all duration-300">
          {activeTab === 'analytics' && currentUser?.role?.toLowerCase() === 'admin' && (
            <div className="p-6 space-y-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Analytics Dashboard</h2>
              </div>
              <DashboardAnalytics 
                bookings={bookings || []}
                resources={resources || []}
                totalUsers={userCount}
              />
              {/* Debug information */}
              <div className="text-sm text-gray-500 mt-4">
                Role: {currentUser?.role}, Users: {userCount}, Resources: {resources?.length || 0}, Bookings: {bookings?.length || 0}
              </div>
            </div>
          )}
          {activeTab === 'overview' && (
            <div className="p-4 sm:p-6 lg:p-8">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 sm:mb-6">Overview</h3>
              
              {/* Mobile-Optimized Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-6 sm:mb-8 lg:mb-10">
                <div className="stat-card p-4 sm:p-6">
                  <div className="flex items-center">
                    <div className="p-3 sm:p-4 bg-blue-100 dark:bg-blue-800 rounded-xl sm:rounded-2xl flex-shrink-0">
                      <Hash className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="ml-3 sm:ml-4 lg:ml-6 min-w-0 flex-1">
                      <p className="text-sm sm:text-base font-semibold text-blue-600 dark:text-blue-400">Total Resources</p>
                      <p className="text-2xl sm:text-3xl font-bold text-blue-900 dark:text-blue-100">{resources.length}</p>
                    </div>
                  </div>
                </div>

                <div className="stat-card-green p-4 sm:p-6">
                  <div className="flex items-center">
                    <div className="p-3 sm:p-4 bg-green-100 dark:bg-green-800 rounded-xl sm:rounded-2xl flex-shrink-0">
                      <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="ml-3 sm:ml-4 lg:ml-6 min-w-0 flex-1">
                      <p className="text-sm sm:text-base font-semibold text-green-600 dark:text-green-400">Your Bookings</p>
                      <p className="text-2xl sm:text-3xl font-bold text-green-900 dark:text-green-100">{bookings.length}</p>
                    </div>
                  </div>
                </div>

                <div className="stat-card-yellow sm:col-span-2 lg:col-span-1 p-4 sm:p-6">
                  <div className="flex items-center">
                    <div className="p-3 sm:p-4 bg-yellow-100 dark:bg-yellow-800 rounded-xl sm:rounded-2xl flex-shrink-0">
                      <Mail className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div className="ml-3 sm:ml-4 lg:ml-6 min-w-0 flex-1">
                      <p className="text-sm sm:text-base font-semibold text-yellow-600 dark:text-yellow-400">Notifications</p>
                      <p className="text-2xl sm:text-3xl font-bold text-yellow-900 dark:text-yellow-100">{notifications.length}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile Quick Actions */}
              <div className="mb-6 sm:mb-8">
                <h4 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Quick Actions</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  <button
                    onClick={() => setActiveTab('resources')}
                    className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors text-center"
                  >
                    <Plus className="w-6 h-6 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Book Resource</p>
                  </button>
                  <button
                    onClick={() => setActiveTab('bookings')}
                    className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors text-center"
                  >
                    <Calendar className="w-6 h-6 text-green-600 dark:text-green-400 mx-auto mb-2" />
                    <p className="text-sm font-medium text-green-900 dark:text-green-100">View Bookings</p>
                  </button>
                  <button
                    onClick={() => setActiveTab('notifications')}
                    className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-900/40 transition-colors text-center"
                  >
                    <Bell className="w-6 h-6 text-yellow-600 dark:text-yellow-400 mx-auto mb-2" />
                    <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">Notifications</p>
                  </button>
                  <button
                    onClick={handleOpenCalendar}
                    className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors text-center"
                  >
                    <CalendarDays className="w-6 h-6 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
                    <p className="text-sm font-medium text-purple-900 dark:text-purple-100">Calendar</p>
                  </button>
                </div>
              </div>

              {/* Recent Activity - Mobile Optimized */}
              <div className="space-y-4 sm:space-y-6">
                <h4 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">Recent Activity</h4>
                
                {bookings.length > 0 ? (
                  <div className="space-y-3 sm:space-y-4">
                    {bookings.slice(0, 3).map((booking) => (
                      <div key={booking.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-6 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-300">
                        <div className="flex items-start sm:items-center space-x-3 sm:space-x-4 mb-3 sm:mb-0">
                          <div className="p-2 sm:p-3 bg-blue-100 dark:bg-blue-800 rounded-lg sm:rounded-xl flex-shrink-0">
                            <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-gray-900 dark:text-gray-100 text-base sm:text-lg mb-1">{booking.resourceName}</p>
                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                              {formatLocalDateTime(booking.startTime)} at{' '}
                              {formatLocalTime(booking.startTime)}
                            </p>
                          </div>
                        </div>
                        <span className={`px-3 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold rounded-full self-start sm:self-auto ${
                          booking.status === 'approved' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300' :
                          booking.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300' :
                          'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300'
                        }`}>
                          {booking.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-6 sm:py-8 text-sm sm:text-base">No recent bookings found.</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'resources' && (
            <div className="p-4 sm:p-6 lg:p-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 space-y-4 sm:space-y-0">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Available Resources</h3>
                {currentUser.role?.toLowerCase() === 'admin' && (
                  <Button 
                    className="flex items-center justify-center space-x-2 w-full sm:w-auto"
                    onClick={() => setIsAddResourceModalOpen(true)}
                  >
                    <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
                    <span className="text-sm sm:text-base">Add Resource</span>
                  </Button>
                )}
              </div>

              {/* Mobile-Optimized Search and Filter */}
              <div className="mb-6 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search resources..."
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all duration-200 text-base"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <button className="px-3 py-2 text-sm font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 rounded-lg border border-blue-200 dark:border-blue-700">
                    All
                  </button>
                  <button className="px-3 py-2 text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg border border-gray-200 dark:border-gray-600">
                    Available
                  </button>
                  <button className="px-3 py-2 text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg border border-gray-200 dark:border-gray-600">
                    Booked
                  </button>
                  <button className="px-3 py-2 text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg border border-gray-200 dark:border-gray-600">
                    Maintenance
                  </button>
                </div>
              </div>

              {resources.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {resources.map((resource) => (
                    <div 
                      key={resource.id} 
                      className={`card p-4 sm:p-6 transition-all duration-300 ${
                        resource.isUnderMaintenance ? 'opacity-60 grayscale' : ''
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 sm:mb-4 space-y-2 sm:space-y-0">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-base sm:text-lg">{resource.name}</h4>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            resource.status === 'available' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                            resource.status === 'booked' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' :
                            'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                          }`}>
                            {resource.status}
                          </span>
                          {resource.isUnderMaintenance && (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300">
                              Maintenance
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 sm:mb-4 leading-relaxed">{resource.description}</p>
                      
                      {resource.isUnderMaintenance && resource.maintenanceNote && (
                        <div className="mb-3 sm:mb-4 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                          <p className="text-xs sm:text-sm text-orange-800 dark:text-orange-300 leading-relaxed">
                            <strong>Maintenance Note:</strong> {resource.maintenanceNote}
                          </p>
                        </div>
                      )}
                      
                      <div className="space-y-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-3 sm:mb-4">
                        <div className="flex items-center">
                          <Shield className="w-4 h-4 mr-2 flex-shrink-0" />
                          <span className="truncate">{resource.category}</span>
                        </div>
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-2 flex-shrink-0" />
                          <span>{resource.capacity || 'N/A'} capacity</span>
                        </div>
                        <div className="flex items-center">
                          <Hash className="w-4 h-4 mr-2 flex-shrink-0" />
                          <span className="truncate">{resource.location}</span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {/* Maintenance Toggle (Admin Only) */}
                        {currentUser.role?.toLowerCase() === 'admin' && (
                          <MaintenanceToggle
                            resourceId={resource.id}
                            resourceName={resource.name}
                            isUnderMaintenance={resource.isUnderMaintenance || false}
                            onToggle={(isUnderMaintenance) => {
                              // Update local state
                              setResources(prev => 
                                prev.map(r => 
                                  r.id === resource.id 
                                    ? { ...r, isUnderMaintenance, status: isUnderMaintenance ? 'maintenance' : 'available' }
                                    : r
                                )
                              );
                            }}
                          />
                        )}

                        {/* Mobile-Optimized Action Buttons */}
                        <div className="flex flex-col space-y-3">
                          <Button 
                            className="w-full mobile-button" 
                            size="sm"
                            onClick={() => handleBookResource(resource)}
                            disabled={resource.isUnderMaintenance}
                          >
                            {resource.isUnderMaintenance ? 'Unavailable' : 'Book Now'}
                          </Button>
                          {currentUser.role?.toLowerCase() === 'admin' && (
                            <div className="grid grid-cols-2 gap-3">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleEditResource(resource)}
                                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 mobile-button"
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleDeleteResource(resource.id)}
                                className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 mobile-button"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">No resources available.</p>
              )}
            </div>
          )}

          {activeTab === 'bookings' && (
            <div className="p-4 sm:p-6 lg:p-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
                <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-100">
                  {currentUser?.role?.toLowerCase() === 'admin' ? 'All Bookings' : 'Your Bookings'}
                </h3>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleOpenCalendar}
                    className="flex items-center justify-center space-x-2 w-full sm:w-auto"
                  >
                    <CalendarDays className="w-4 h-4" />
                    <span className="text-sm sm:text-base">Calendar View</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleRefreshBookings}
                    className="flex items-center justify-center space-x-2 w-full sm:w-auto"
                  >
                    <Clock className="w-4 h-4" />
                    <span className="text-sm sm:text-base">Refresh</span>
                  </Button>
                </div>
              </div>

              {bookings.length > 0 ? (
                <div className="space-y-4">
                  {bookings.map((booking) => (
                    <div key={booking.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 space-y-3 sm:space-y-0">
                        <div className="min-w-0 flex-1">
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-base sm:text-lg mb-1">{booking.resourceName}</h4>
                          {currentUser?.role?.toLowerCase() === 'admin' && (
                            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                              Booked by: {booking.userName} ({booking.userRole})
                            </p>
                          )}
                        </div>
                        <span className={`px-3 py-1 text-xs font-medium rounded-full self-start sm:self-auto ${
                          booking.status === 'approved' ? 'bg-green-100 text-green-800' :
                          booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          booking.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {booking.status}
                        </span>
                      </div>

                      {/* Mobile-Optimized Booking Info Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm mb-4">
                        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                          <p className="text-gray-500 dark:text-gray-400 mb-1 font-medium">Start Time</p>
                          <p className="font-semibold text-gray-900 dark:text-gray-100">{formatLocalDateTime(booking.startTime)}</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                          <p className="text-gray-500 dark:text-gray-400 mb-1 font-medium">End Time</p>
                          <p className="font-semibold text-gray-900 dark:text-gray-100">{formatLocalDateTime(booking.endTime)}</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                          <p className="text-gray-500 dark:text-gray-400 mb-1 font-medium">Purpose</p>
                          <p className="font-semibold text-gray-900 dark:text-gray-100">{booking.purpose}</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                          <p className="text-gray-500 dark:text-gray-400 mb-1 font-medium">Attendees</p>
                          <p className="font-semibold text-gray-900 dark:text-gray-100">{booking.attendees} people</p>
                        </div>
                      </div>

                      {/* Mobile-Optimized Action Buttons */}
                      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewBookingDetails(booking)}
                          className="flex items-center justify-center space-x-2 w-full sm:w-auto"
                        >
                          <Eye className="w-4 h-4" />
                          <span className="text-sm sm:text-base">View Details</span>
                        </Button>
                        
                        {/* Admin approval buttons */}
                        {currentUser?.role?.toLowerCase() === 'admin' && booking.status === 'pending' && (
                          <div className="grid grid-cols-2 gap-3 w-full sm:w-auto">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleApproveBooking(booking.id)}
                              className="text-green-600 hover:text-green-700 w-full mobile-button"
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Approve
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleRejectBooking(booking.id)}
                              className="text-red-600 hover:text-red-700 w-full mobile-button"
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Reject
                            </Button>
                          </div>
                        )}
                        
                        {/* User status message */}
                        {currentUser?.role?.toLowerCase() !== 'admin' && booking.status === 'approved' && (
                          <div className="text-center sm:text-left">
                            <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                              ✅ Your booking has been approved!
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  {currentUser?.role?.toLowerCase() === 'admin' ? 'No bookings found.' : 'No bookings found.'}
                </p>
              )}
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="p-4 sm:p-6 lg:p-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
                <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-100">
                  {currentUser?.role?.toLowerCase() === 'admin' ? 'All Notifications' : 'Your Notifications'}
                </h3>
                {currentUser?.role?.toLowerCase() === 'admin' && (
                  <Button 
                    onClick={handleOpenCreateNotification}
                    className="flex items-center justify-center space-x-2 w-full sm:w-auto"
                  >
                    <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="text-sm sm:text-base">Create Notification</span>
                  </Button>
                )}
              </div>

              {notifications.length > 0 ? (
                <div className="space-y-4">
                  {notifications.map((notification) => (
                    <div key={notification.id} className={`border-l-4 p-4 sm:p-6 ${
                      notification.isRead ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800' : 'border-blue-500 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                    }`}>
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between space-y-3 sm:space-y-0">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 mb-2">
                            <h4 className="font-medium text-gray-900 dark:text-gray-100 text-base sm:text-lg">{notification.title}</h4>
                            {notification.isSystemNotification && (
                              <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 rounded-full self-start sm:self-auto">
                                System
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">{notification.message}</p>
                          
                          {/* Display image if exists */}
                          {notification.imageUrl && (
                            <div className="mt-3">
                              <img
                                src={notification.imageUrl}
                                alt="Notification"
                                className="max-w-full max-h-48 object-cover rounded-lg"
                              />
                            </div>
                          )}
                          
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-3 sm:mt-2 space-y-2 sm:space-y-0">
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {formatLocalDateTime(notification.createdAt)}
                            </p>
                            {notification.createdBy && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                By: {notification.createdBy}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        {/* Mobile-Optimized Action Buttons */}
                        <div className="flex flex-col space-y-2 self-start sm:self-auto w-full sm:w-auto">
                          {!notification.isRead && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="text-blue-600 hover:text-blue-700 w-full sm:w-auto"
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              <span className="text-sm sm:text-base">Mark Read</span>
                            </Button>
                          )}
                          
                          {currentUser?.role?.toLowerCase() === 'admin' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteNotification(notification.id)}
                              className="text-red-600 hover:text-red-700 w-full sm:w-auto"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              <span className="text-sm sm:text-base">Delete</span>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8 text-sm sm:text-base">
                  {currentUser?.role?.toLowerCase() === 'admin' ? 'No notifications found.' : 'No notifications found.'}
                </p>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Mobile Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-30 lg:hidden">
        <div className="relative">
          <button
            onClick={() => {
              if (activeTab === 'resources') {
                setIsAddResourceModalOpen(true);
              } else if (activeTab === 'notifications') {
                setIsCreateNotificationOpen(true);
              } else if (activeTab === 'bookings') {
                handleOpenCalendar();
              }
            }}
            className="w-14 h-14 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center"
            style={{ minHeight: '56px', minWidth: '56px' }}
          >
            {activeTab === 'resources' ? (
              <Plus className="w-6 h-6" />
            ) : activeTab === 'notifications' ? (
              <Send className="w-6 h-6" />
            ) : (
              <Calendar className="w-6 h-6" />
            )}
          </button>
          
          {/* Tooltip */}
          <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            {activeTab === 'resources' ? 'Add Resource' : 
             activeTab === 'notifications' ? 'Create Notification' : 
             'View Calendar'}
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddResourceModal
        isOpen={isAddResourceModalOpen}
        onClose={() => setIsAddResourceModalOpen(false)}
        onResourceAdded={handleResourceAdded}
      />

      <EditResourceModal
        isOpen={isEditResourceModalOpen}
        onClose={() => {
          setIsEditResourceModalOpen(false);
          setSelectedResource(null);
        }}
        onResourceUpdated={handleResourceUpdated}
        resource={selectedResource}
      />

      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => {
          setIsBookingModalOpen(false);
          setSelectedResource(null);
        }}
        resource={selectedResource}
        currentUser={currentUser}
        onBookingCreated={handleBookingCreated}
      />

      <BookingDetails
        isOpen={isBookingDetailsOpen}
        onClose={() => {
          setIsBookingDetailsOpen(false);
          setSelectedBooking(null);
        }}
        booking={selectedBooking}
        currentUser={currentUser}
        onBookingUpdated={handleBookingUpdated}
      />

      <BookingCalendar
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        currentUser={currentUser}
      />

      <CreateNotificationModal
        isOpen={isCreateNotificationOpen}
        onClose={() => setIsCreateNotificationOpen(false)}
        currentUser={currentUser}
        onNotificationCreated={handleNotificationCreated}
      />

      <ProfileSettingsModal
        isOpen={isProfileSettingsOpen}
        onClose={() => setIsProfileSettingsOpen(false)}
        currentUser={currentUser}
        onProfileUpdated={handleProfileUpdated}
      />
    </div>
  );
};

export default Dashboard; 