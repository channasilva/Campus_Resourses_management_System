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
  X,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import Button from '../components/Button';
import { firebaseService } from '../services/firebase-service';
import { dashboardService } from '../services/dashboard-service';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { Resource, Booking, Notification } from '../types';
import { User as UserType } from '../types/auth';
import { formatLocalDateTime, formatLocalTime } from '../utils/date-utils';
import toast, { Toaster } from 'react-hot-toast';
import { useTheme } from '../contexts/ThemeContext';
import { profileImageManager } from '../utils/profileImageManager';
import ProfileImageUpload from '../components/ProfileImageUpload';
import { checkAndInitializeData } from '../utils/initializeSampleData';

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
import AdvancedAnalytics from '../components/AdvancedAnalytics';
import DashboardTest from '../components/DashboardTest';
import ErrorBoundary from '../components/ErrorBoundary';

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
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'booked' | 'maintenance'>('all');



  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        console.log('🔄 Initializing dashboard...');
        console.log('🕒 Dashboard version: 2025-01-09-v5');
        
        // Add comprehensive error boundary for third-party script errors
        window.addEventListener('error', (event) => {
          if (event.filename && (event.filename.includes('ma_payload.js') || 
              event.filename.includes('facebook') || 
              event.filename.includes('fb') ||
              event.error?.message?.includes('getAttribute'))) {
            console.warn('⚠️ Third-party script error detected, preventing dashboard crash:', {
              filename: event.filename,
              error: event.error?.message,
              stack: event.error?.stack
            });
            event.preventDefault();
            event.stopPropagation();
            return false;
          }
        });

        // Also handle unhandled promise rejections from third-party scripts
        window.addEventListener('unhandledrejection', (event) => {
          if (event.reason?.message?.includes('getAttribute') || 
              event.reason?.message?.includes('Cannot read properties of null')) {
            console.warn('⚠️ Third-party script promise rejection detected, preventing dashboard crash:', event.reason);
            event.preventDefault();
            return false;
          }
        });
        
        // Try to get user from localStorage first (fallback)
        const userData = localStorage.getItem('user');
        let currentUser = null;
        
        if (userData) {
          try {
            currentUser = JSON.parse(userData);
            console.log('👤 User data from localStorage:', currentUser);
          } catch (error) {
            console.error('❌ Error parsing localStorage user data:', error);
          }
        }
        
        // Try to get current user from Firebase Auth
        try {
          const firebaseUser = await firebaseService.getCurrentUser();
          if (firebaseUser) {
            console.log('✅ Firebase user found:', firebaseUser);
            currentUser = firebaseUser;
            // Update localStorage with fresh data
            localStorage.setItem('user', JSON.stringify(firebaseUser));
          } else {
            console.log('⚠️ No Firebase user found, using localStorage data');
          }
        } catch (error) {
          console.error('⚠️ Error getting Firebase user:', error);
          console.log('🔄 Falling back to localStorage data');
        }
        
        // If we still don't have user data, redirect to login
        if (!currentUser || !currentUser.id) {
          console.error('❌ No valid user data found');
          toast.error('Please log in again.');
          navigate('/login');
          return;
        }

        console.log('✅ Using user data:', currentUser);
        console.log('🔍 User role:', currentUser.role, 'Role type:', typeof currentUser.role);
        console.log('🆔 User ID:', currentUser.id, 'ID type:', typeof currentUser.id);

        setCurrentUser(currentUser);
        
        // Check and initialize sample data if needed
        const dataInitialized = await checkAndInitializeData();
        if (dataInitialized) {
          console.log('✅ Sample data initialized successfully');
        }
        
        await loadDashboardData(currentUser);

        // Load profile image from the manager system
        try {
          const savedImage = await profileImageManager.getProfileImage(currentUser.id);
          console.log('Profile image loaded:', savedImage ? 'found' : 'not found');
          setProfileImage(savedImage);
          
        } catch (error) {
          console.error('Error loading profile image:', error);
          setProfileImage(null);
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

  const loadDashboardData = async (user: UserType) => {
    try {
      console.log('🔄 Loading dashboard data for user:', user.id, 'role:', user.role);
      
      const dashboardData = await dashboardService.loadDashboardData(user);
      
      setResources(dashboardData.resources);
      setBookings(dashboardData.bookings);
      setNotifications(dashboardData.notifications);
      setUserCount(dashboardData.userCount);
      
      // Show success message based on what we loaded
      if (dashboardData.error) {
        toast.error(dashboardData.error);
      } else if (dashboardData.resources.length > 0) {
        toast.success(`Dashboard loaded successfully! Found ${dashboardData.resources.length} resources.`);
      } else if (dashboardData.bookings.length > 0 || dashboardData.notifications.length > 0) {
        toast.success('Dashboard loaded successfully!');
      } else {
        toast.info('Dashboard loaded. No data found - this is normal for a new system.');
      }
      
    } catch (error: any) {
      console.error('❌ Critical error loading dashboard data:', error);
      toast.error(`Critical error: ${error.message || 'Failed to load dashboard data.'}`);
      
      // Set empty arrays as fallback
      setResources([]);
      setBookings([]);
      setNotifications([]);
      setUserCount(0);
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
      const updatedResources = await dashboardService.refreshResources();
      setResources(updatedResources);
    } catch (error) {
      console.error('Error refreshing resources:', error);
    }
  };

  const handleResourceUpdated = async () => {
    // Refresh resources list
    try {
      const updatedResources = await dashboardService.refreshResources();
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
        const updatedResources = await dashboardService.refreshResources();
        setResources(updatedResources);
      } catch (error) {
        console.error('Error deleting resource:', error);
        toast.error('Failed to delete resource. Please try again.');
      }
    }
  };

  const handleBookResource = (resource: Resource) => {
    console.log('🎯 Booking resource:', resource.name, 'ID:', resource.id);
    // Clear any previous resource state first
    setSelectedResource(null);
    // Set the new resource after a brief delay to ensure state is cleared
    setTimeout(() => {
      setSelectedResource(resource);
      setIsBookingModalOpen(true);
    }, 10);
  };

  const handleBookingCreated = async () => {
    // Refresh bookings list and resources for real-time updates
    if (currentUser) {
      try {
        console.log('🔄 Refreshing bookings and resources for user:', currentUser.id);
        
        // Load bookings based on user role
        const updatedBookings = await dashboardService.refreshBookings(currentUser);
        
        // Also refresh resources to update availability status
        const updatedResources = await dashboardService.refreshResources();
        
        console.log('📋 Updated bookings:', updatedBookings);
        console.log('🏢 Updated resources:', updatedResources.length);
        
        setBookings(updatedBookings);
        setResources(updatedResources);
        
        // No duplicate success message - BookingModal already shows one
      } catch (error) {
        console.error('Error refreshing bookings and resources:', error);
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
        const updatedBookings = await dashboardService.refreshBookings(currentUser);
          setBookings(updatedBookings);
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
        const updatedNotifications = await dashboardService.refreshNotifications(currentUser);
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
        await loadDashboardData(currentUser);
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

  const handleProfileImageUploaded = async (imageUrl: string) => {
    console.log('Profile image uploaded successfully:', imageUrl);
    setProfileImage(imageUrl);
    
    // Update current user state
    if (currentUser) {
      const updatedUser = {
        ...currentUser,
        profilePicture: imageUrl
      };
      setCurrentUser(updatedUser);
      
      // Update localStorage
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
    }
  };

  const handleProfileImageRemoved = () => {
    console.log('Profile image removed');
    setProfileImage(null);
    
    // Update current user state
    if (currentUser) {
      const updatedUser = {
        ...currentUser,
        profilePicture: null
      };
      setCurrentUser(updatedUser);
      
      // Update localStorage
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
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
    <ErrorBoundary>
    <div className="min-h-screen bg-gradient-to-br from-secondary-50 via-white to-primary-50/30 dark:from-secondary-950 dark:via-secondary-900 dark:to-primary-950/30 transition-all duration-500">
      <Toaster
        position="top-center"
        toastOptions={{
          className: 'bg-white/90 dark:bg-secondary-800/90 backdrop-blur-xl border border-secondary-200/50 dark:border-secondary-700/50',
          duration: 4000,
        }}
      />
      
      {/* Enhanced Modern Header */}
      <header className="glass-effect border-b border-secondary-200/50 dark:border-secondary-700/50 sticky top-0 z-50 backdrop-blur-xl">
        <div className="container-responsive">
          {/* Mobile Header */}
          <div className="flex items-center justify-between h-16 lg:hidden">
            <div className="flex items-center space-x-3 animate-fade-in-left">
              <div className="relative">
                <GraduationCap className="h-8 w-8 text-primary-600 dark:text-primary-400 animate-float" />
                <div className="absolute inset-0 bg-primary-600/20 dark:bg-primary-400/20 rounded-full blur-lg animate-pulse-soft" />
              </div>
              <div>
                <h1 className="text-lg font-bold gradient-text">
                  Campus Resources
                </h1>
                <div className="h-0.5 w-full bg-gradient-to-r from-primary-600 to-transparent rounded-full" />
              </div>
            </div>
            
            <div className="flex items-center space-x-3 animate-fade-in-right">
              <ThemeToggle />
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="btn btn-ghost btn-sm p-2 rounded-xl hover-scale"
                aria-label="Toggle mobile menu"
              >
                {isMobileMenuOpen ?
                  <X className="h-5 w-5 animate-scale-in" /> :
                  <Menu className="h-5 w-5 animate-scale-in" />
                }
              </button>
            </div>
          </div>

          {/* Desktop Header */}
          <div className="hidden lg:flex justify-between items-center h-20 animate-fade-in-down">
            <div className="flex items-center space-x-4">
              <div className="relative group">
                <GraduationCap className="h-12 w-12 text-primary-600 dark:text-primary-400 animate-float group-hover:scale-110 transition-transform duration-300" />
                <div className="absolute inset-0 bg-primary-600/20 dark:bg-primary-400/20 rounded-full blur-xl animate-pulse-soft opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <div className="space-y-1">
                <h1 className="text-3xl font-bold gradient-text">
                  Campus Resources Management
                </h1>
                <div className="h-1 w-full bg-gradient-to-r from-primary-600 via-primary-400 to-transparent rounded-full" />
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <ThemeToggle />
              
              {currentUser.role?.toLowerCase() === 'admin' && (
                <div className="animate-fade-in-up">
                  <UserCountCard />
                </div>
              )}
              
              {/* User Profile Section with Image Upload */}
              <div className="flex items-center space-x-4 p-3 rounded-2xl bg-white/50 dark:bg-secondary-800/50 backdrop-blur-sm border border-secondary-200/50 dark:border-secondary-700/50 hover:bg-white/70 dark:hover:bg-secondary-800/70 transition-all duration-300 animate-fade-in-up">
                <ProfileImageUpload
                  size="md"
                  showUploadButton={false}
                  showRemoveButton={false}
                  onImageUploaded={handleProfileImageUploaded}
                  onImageRemoved={handleProfileImageRemoved}
                  className="relative"
                />
                <div className="text-sm">
                  <p className="font-semibold text-secondary-900 dark:text-secondary-100">{currentUser?.username}</p>
                  <p className="text-secondary-500 dark:text-secondary-400 capitalize flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    {currentUser?.role}
                  </p>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center space-x-3 animate-fade-in-up">
                <Button
                  onClick={handleOpenProfileSettings}
                  variant="ghost"
                  size="sm"
                  className="hover-lift"
                  leftIcon={<User className="w-4 h-4" />}
                >
                  Profile
                </Button>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  size="sm"
                  className="hover-lift border-error-300 text-error-600 hover:bg-error-500 hover:text-white hover:border-error-500"
                  leftIcon={<LogOut className="w-4 h-4" />}
                >
                  Logout
                </Button>
              </div>
            </div>
          </div>

          {/* Enhanced Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="lg:hidden border-t border-secondary-200/50 dark:border-secondary-700/50 py-6 space-y-6 animate-fade-in-down">
              {/* User Profile Card with Image Upload */}
              <div className="card-interactive p-4 animate-scale-in">
                <div className="flex items-center space-x-4">
                  <ProfileImageUpload
                    size="md"
                    showUploadButton={false}
                    showRemoveButton={true}
                    onImageUploaded={handleProfileImageUploaded}
                    onImageRemoved={handleProfileImageRemoved}
                    className="relative"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-secondary-900 dark:text-secondary-100 text-base">{currentUser?.username}</p>
                    <p className="text-secondary-500 dark:text-secondary-400 text-sm capitalize flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      {currentUser?.role}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-4 animate-fade-in-up">
                <Button
                  onClick={handleOpenProfileSettings}
                  variant="ghost"
                  size="md"
                  fullWidth
                  leftIcon={<User className="w-4 h-4" />}
                  className="hover-lift"
                >
                  Profile
                </Button>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  size="md"
                  fullWidth
                  leftIcon={<LogOut className="w-4 h-4" />}
                  className="hover-lift border-error-300 text-error-600 hover:bg-error-500 hover:text-white hover:border-error-500"
                >
                  Logout
                </Button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Enhanced Main Content */}
      <main className="container-responsive py-8 lg:py-12 space-y-8 lg:space-y-12">
        {/* Hero Welcome Section */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 via-transparent to-accent-purple-500/10 rounded-3xl" />
          <div className="relative card-glass p-8 lg:p-12 animate-fade-in-up">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse" />
                  <span className="text-sm font-medium text-success-600 dark:text-success-400">
                    System Online
                  </span>
                </div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold gradient-text leading-tight">
                  Welcome back, {currentUser.username}!
                </h2>
                <p className="text-lg lg:text-xl text-secondary-600 dark:text-secondary-400 leading-relaxed max-w-2xl">
                  Manage your campus resources and bookings with our enhanced dashboard experience.
                </p>
              </div>
              
              {/* Quick Stats Preview */}
              <div className="flex lg:flex-col gap-4 lg:gap-2 text-right">
                <div className="text-center lg:text-right">
                  <div className="text-2xl lg:text-3xl font-bold text-primary-600 dark:text-primary-400">
                    {resources.length}
                  </div>
                  <div className="text-sm text-secondary-500 dark:text-secondary-400">Resources</div>
                </div>
                <div className="text-center lg:text-right">
                  <div className="text-2xl lg:text-3xl font-bold text-primary-600 dark:text-primary-400">
                    {bookings.length}
                  </div>
                  <div className="text-sm text-secondary-500 dark:text-secondary-400">Bookings</div>
                </div>
                <div className="text-center lg:text-right">
                  <div className="text-2xl lg:text-3xl font-bold text-primary-600 dark:text-primary-400">
                    {notifications.length}
                  </div>
                  <div className="text-sm text-secondary-500 dark:text-secondary-400">Notifications</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Enhanced Navigation Tabs */}
        <section className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="card-glass p-2 rounded-2xl">
            <div className="flex overflow-x-auto scrollbar-hide gap-2">
              {[
                { key: 'overview', label: 'Overview', icon: <Hash className="w-4 h-4" /> },
                ...(currentUser?.role?.toLowerCase() === 'admin' ? [
                  { key: 'analytics', label: 'Analytics', icon: <TrendingUp className="w-4 h-4" /> },
                  { key: 'analysis', label: 'Analysis', icon: <BarChart3 className="w-4 h-4" /> }
                ] : []),
                { key: 'resources', label: 'Resources', icon: <BookOpen className="w-4 h-4" /> },
                { key: 'bookings', label: 'Bookings', icon: <Calendar className="w-4 h-4" /> },
                { key: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> }
              ].map((tab, index) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`nav-tab flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 whitespace-nowrap min-h-touch hover-scale ${
                    activeTab === tab.key
                      ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg'
                      : 'text-secondary-600 dark:text-secondary-400 hover:bg-secondary-100 dark:hover:bg-secondary-800 hover:text-secondary-900 dark:hover:text-secondary-100'
                  }`}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  {activeTab === tab.key && (
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white rounded-full animate-bounce-in" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Enhanced Tab Content */}
        <section className="card-glass rounded-3xl overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          {activeTab === 'analytics' && currentUser?.role?.toLowerCase() === 'admin' && (
            <div className="padding-responsive spacing-responsive">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                <div>
                  <h2 className="text-3xl font-bold gradient-text mb-2">Analytics Dashboard</h2>
                  <p className="text-secondary-600 dark:text-secondary-400">Comprehensive insights and metrics</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-secondary-500 dark:text-secondary-400">
                  <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse" />
                  <span>Live Data</span>
                </div>
              </div>
              <DashboardAnalytics
                bookings={bookings || []}
                resources={resources || []}
                totalUsers={userCount}
              />
            </div>
          )}
          
          {activeTab === 'analysis' && currentUser?.role?.toLowerCase() === 'admin' && (
            <div className="padding-responsive spacing-responsive">
              <AdvancedAnalytics
                bookings={bookings || []}
                resources={resources || []}
                totalUsers={userCount}
              />
            </div>
          )}
          
          {activeTab === 'overview' && (
            <div className="padding-responsive">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-3xl font-bold gradient-text mb-2">Dashboard Overview</h3>
                  <p className="text-secondary-600 dark:text-secondary-400">Your personalized campus resource hub</p>
                </div>
                <div className="hidden sm:flex items-center gap-2 text-sm text-secondary-500 dark:text-secondary-400">
                  <Clock className="w-4 h-4" />
                  <span>Updated {new Date().toLocaleTimeString()}</span>
                </div>
              </div>
              
              {/* Enhanced Stats Cards with Animations */}
              <div className="grid-responsive mb-12">
                <div className="stat-card hover-lift animate-fade-in-up group" style={{ animationDelay: '0.1s' }}>
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-wide">Total Resources</p>
                      <p className="text-4xl font-bold text-primary-900 dark:text-primary-100 group-hover:scale-110 transition-transform duration-300">{resources.length}</p>
                      <p className="text-xs text-secondary-500 dark:text-secondary-400">Available for booking</p>
                    </div>
                    <div className="relative">
                      <div className="p-4 bg-primary-100 dark:bg-primary-800 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                        <Hash className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                      </div>
                      <div className="absolute inset-0 bg-primary-600/20 dark:bg-primary-400/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                  </div>
                </div>

                <div className="stat-card hover-lift animate-fade-in-up group" style={{ animationDelay: '0.2s' }}>
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-wide">Your Bookings</p>
                      <p className="text-4xl font-bold text-primary-900 dark:text-primary-100 group-hover:scale-110 transition-transform duration-300">{bookings.length}</p>
                      <p className="text-xs text-secondary-500 dark:text-secondary-400">Active reservations</p>
                    </div>
                    <div className="relative">
                      <div className="p-4 bg-primary-100 dark:bg-primary-800 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                        <Calendar className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                      </div>
                      <div className="absolute inset-0 bg-primary-600/20 dark:bg-primary-400/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                  </div>
                </div>

                <div className="stat-card hover-lift animate-fade-in-up group" style={{ animationDelay: '0.3s' }}>
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-wide">Notifications</p>
                      <p className="text-4xl font-bold text-primary-900 dark:text-primary-100 group-hover:scale-110 transition-transform duration-300">{notifications.length}</p>
                      <p className="text-xs text-secondary-500 dark:text-secondary-400">Unread messages</p>
                    </div>
                    <div className="relative">
                      <div className="p-4 bg-primary-100 dark:bg-primary-800 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                        <Mail className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                      </div>
                      <div className="absolute inset-0 bg-primary-600/20 dark:bg-primary-400/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Quick Actions */}
              <div className="mb-12">
                <h4 className="text-2xl font-bold gradient-text mb-6">Quick Actions</h4>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    {
                      key: 'resources',
                      label: 'Book Resource',
                      icon: <Plus className="w-6 h-6" />,
                      color: 'primary',
                      description: 'Reserve a resource'
                    },
                    {
                      key: 'bookings',
                      label: 'View Bookings',
                      icon: <Calendar className="w-6 h-6" />,
                      color: 'primary',
                      description: 'Manage reservations'
                    },
                    {
                      key: 'notifications',
                      label: 'Notifications',
                      icon: <Bell className="w-6 h-6" />,
                      color: 'primary',
                      description: 'Check messages'
                    },
                    {
                      action: handleOpenCalendar,
                      label: 'Calendar',
                      icon: <CalendarDays className="w-6 h-6" />,
                      color: 'primary',
                      description: 'View schedule'
                    }
                  ].map((action, index) => (
                    <button
                      key={action.key || 'calendar'}
                      onClick={action.action || (() => setActiveTab(action.key))}
                      className={`card-interactive p-6 text-center hover-lift animate-fade-in-up group ${
                        action.color === 'primary' ? 'hover:shadow-primary-500/25' :
                        action.color === 'success' ? 'hover:shadow-success-500/25' :
                        action.color === 'warning' ? 'hover:shadow-warning-500/25' :
                        'hover:shadow-info-500/25'
                      }`}
                      style={{ animationDelay: `${0.1 + index * 0.1}s` }}
                    >
                      <div className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-300 ${
                        action.color === 'primary' ? 'bg-primary-100 dark:bg-primary-800 text-primary-600 dark:text-primary-400' :
                        action.color === 'success' ? 'bg-success-100 dark:bg-success-800 text-success-600 dark:text-success-400' :
                        action.color === 'warning' ? 'bg-warning-100 dark:bg-warning-800 text-warning-600 dark:text-warning-400' :
                        'bg-info-100 dark:bg-info-800 text-info-600 dark:text-info-400'
                      }`}>
                        {action.icon}
                      </div>
                      <h5 className="font-semibold text-secondary-900 dark:text-secondary-100 mb-1">{action.label}</h5>
                      <p className="text-xs text-secondary-500 dark:text-secondary-400">{action.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Dashboard Test Component (Development Only) */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mb-8">
                  <DashboardTest user={currentUser} />
                </div>
              )}

              {/* Enhanced Recent Activity */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-2xl font-bold gradient-text">Recent Activity</h4>
                  <Button
                    onClick={() => setActiveTab('bookings')}
                    variant="ghost"
                    size="sm"
                    className="hover-scale"
                  >
                    View All
                  </Button>
                </div>
                
                {bookings.length > 0 ? (
                  <div className="space-y-4">
                    {bookings.slice(0, 3).map((booking, index) => (
                      <div
                        key={booking.id}
                        className="card-interactive p-6 hover-lift animate-fade-in-up group"
                        style={{ animationDelay: `${0.1 + index * 0.1}s` }}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-center space-x-4">
                            <div className="p-3 bg-primary-100 dark:bg-primary-800 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                              <BookOpen className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h5 className="font-semibold text-secondary-900 dark:text-secondary-100 text-lg mb-1">{booking.resourceName}</h5>
                              <p className="text-sm text-secondary-600 dark:text-secondary-400 flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                {formatLocalDateTime(booking.startTime)} at {formatLocalTime(booking.startTime)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`badge ${
                              booking.status === 'approved' ? 'badge-success' :
                              booking.status === 'pending' ? 'badge-warning' :
                              'badge-error'
                            }`}>
                              {booking.status}
                            </span>
                            <Button
                              onClick={() => handleViewBookingDetails(booking)}
                              variant="ghost"
                              size="sm"
                              className="hover-scale"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="card text-center py-12 animate-fade-in-up">
                    <div className="w-16 h-16 bg-secondary-100 dark:bg-secondary-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Calendar className="w-8 h-8 text-secondary-400" />
                    </div>
                    <h5 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-2">No Recent Activity</h5>
                    <p className="text-secondary-500 dark:text-secondary-400 mb-6">Start by booking your first resource</p>
                    <Button
                      onClick={() => setActiveTab('resources')}
                      variant="primary"
                      className="hover-scale"
                    >
                      Browse Resources
                    </Button>
                  </div>
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
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all duration-200 text-base"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setStatusFilter('all')}
                    className={`px-3 py-2 text-sm font-medium rounded-lg border transition-all duration-200 ${
                      statusFilter === 'all'
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-700'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setStatusFilter('available')}
                    className={`px-3 py-2 text-sm font-medium rounded-lg border transition-all duration-200 ${
                      statusFilter === 'available'
                        ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    Available
                  </button>
                  <button
                    onClick={() => setStatusFilter('booked')}
                    className={`px-3 py-2 text-sm font-medium rounded-lg border transition-all duration-200 ${
                      statusFilter === 'booked'
                        ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300 border-red-200 dark:border-red-700'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    Booked
                  </button>
                  <button
                    onClick={() => setStatusFilter('maintenance')}
                    className={`px-3 py-2 text-sm font-medium rounded-lg border transition-all duration-200 ${
                      statusFilter === 'maintenance'
                        ? 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-700'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    Maintenance
                  </button>
                </div>
              </div>

              {resources.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {resources
                    .filter((resource) => {
                      // Search filter
                      const matchesSearch = searchTerm === '' ||
                        resource.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        resource.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        resource.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (resource.description && resource.description.toLowerCase().includes(searchTerm.toLowerCase()));
                      
                      // Status filter
                      const matchesStatus = statusFilter === 'all' ||
                        (statusFilter === 'available' && resource.status === 'available' && !resource.isUnderMaintenance) ||
                        (statusFilter === 'booked' && resource.status === 'booked') ||
                        (statusFilter === 'maintenance' && (resource.status === 'maintenance' || resource.isUnderMaintenance));
                      
                      return matchesSearch && matchesStatus;
                    })
                    .map((resource) => (
                    <div
                      key={resource.id}
                      className={`card p-4 sm:p-6 transition-all duration-500 hover:shadow-lg hover:scale-[1.02] ${
                        resource.isUnderMaintenance ? 'opacity-60 grayscale' : 'hover:shadow-primary-500/10'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 sm:mb-4 space-y-2 sm:space-y-0">
                        <div className="flex items-center gap-3">
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-base sm:text-lg">{resource.name}</h4>
                          {/* Real-time availability indicator */}
                          <div className={`w-3 h-3 rounded-full animate-pulse ${
                            resource.isUnderMaintenance ? 'bg-orange-500' :
                            resource.status === 'available' ? 'bg-green-500' :
                            'bg-red-500'
                          }`} title={
                            resource.isUnderMaintenance ? 'Under Maintenance' :
                            resource.status === 'available' ? 'Available Now' :
                            'Currently Booked'
                          } />
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-3 py-1 text-xs font-medium rounded-full transition-all duration-300 ${
                            resource.status === 'available' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 shadow-green-500/20' :
                            resource.status === 'booked' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 shadow-red-500/20' :
                            'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 shadow-yellow-500/20'
                          } shadow-sm`}>
                            {resource.status === 'available' ? '✅ Available' :
                             resource.status === 'booked' ? '🔒 Booked' :
                             '⚠️ ' + resource.status}
                          </span>
                          {resource.isUnderMaintenance && (
                            <span className="px-3 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300 shadow-sm shadow-orange-500/20 animate-pulse">
                              🔧 Maintenance
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

                        {/* Enhanced Action Buttons with Smooth Transitions */}
                        <div className="flex flex-col space-y-3">
                          <Button
                            className={`w-full mobile-button transition-all duration-300 transform hover:scale-105 ${
                              resource.isUnderMaintenance
                                ? 'bg-gray-400 cursor-not-allowed opacity-60'
                                : resource.status === 'available'
                                  ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-green-500/25'
                                  : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-blue-500/25'
                            }`}
                            size="sm"
                            onClick={() => {
                              if (resource.isUnderMaintenance) {
                                toast.error('This resource is currently under maintenance and cannot be booked.', {
                                  duration: 4000
                                });
                                return;
                              }
                              handleBookResource(resource);
                            }}
                            disabled={resource.isUnderMaintenance}
                          >
                            {resource.isUnderMaintenance ? (
                              <>
                                <AlertCircle className="w-4 h-4 mr-2" />
                                Unavailable
                              </>
                            ) : (
                              <>
                                <Calendar className="w-4 h-4 mr-2" />
                                {resource.status === 'available' ? 'Book Now' : 'Check Availability'}
                              </>
                            )}
                          </Button>
                          {currentUser.role?.toLowerCase() === 'admin' && (
                            <div className="grid grid-cols-2 gap-3">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditResource(resource)}
                                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 mobile-button transition-all duration-300 hover:scale-105 hover:shadow-md hover:shadow-blue-500/20"
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  if (window.confirm(`Are you sure you want to delete "${resource.name}"? This action cannot be undone.`)) {
                                    handleDeleteResource(resource.id);
                                  }
                                }}
                                className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 mobile-button transition-all duration-300 hover:scale-105 hover:shadow-md hover:shadow-red-500/20"
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
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-secondary-100 dark:bg-secondary-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-secondary-400" />
                  </div>
                  <h5 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-2">
                    {searchTerm || statusFilter !== 'all' ? 'No matching resources found' : 'No resources available'}
                  </h5>
                  <p className="text-secondary-500 dark:text-secondary-400 mb-6">
                    {searchTerm || statusFilter !== 'all'
                      ? 'Try adjusting your search or filter criteria'
                      : 'Resources will appear here once they are added'
                    }
                  </p>
                  {(searchTerm || statusFilter !== 'all') && (
                    <Button
                      onClick={() => {
                        setSearchTerm('');
                        setStatusFilter('all');
                      }}
                      variant="outline"
                      className="hover-scale"
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
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
        </section>
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
    </ErrorBoundary>
  );
};

export default Dashboard; 