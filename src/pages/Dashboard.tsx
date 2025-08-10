import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Users, LogOut, User as UserIcon, Mail, Shield, Calendar, Hash, BookOpen, Plus, Clock, CalendarDays, Send, User } from 'lucide-react';
import Button from '../components/Button';
import { firebaseService } from '../services/firebase-service';
import { Resource, Booking, Notification } from '../types';
import { User as UserType } from '../types/auth';
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

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isAddResourceModalOpen, setIsAddResourceModalOpen] = useState(false);
  const [isEditResourceModalOpen, setIsEditResourceModalOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isBookingDetailsOpen, setIsBookingDetailsOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isCreateNotificationOpen, setIsCreateNotificationOpen] = useState(false);
  const [isProfileSettingsOpen, setIsProfileSettingsOpen] = useState(false);

  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        const userData = localStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-all duration-300">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <GraduationCap className="h-8 w-8 text-blue-600 dark:text-blue-400 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Campus Resources Management
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Theme Toggle */}
              <ThemeToggle />
              
              {/* User Count Card (Admin Only) */}
              {currentUser.role?.toLowerCase() === 'admin' && (
                <UserCountCard className="hidden lg:block" />
              )}
              
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <UserIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-sm">
                  <p className="font-medium text-gray-900 dark:text-gray-100">{currentUser.username}</p>
                  <p className="text-gray-500 dark:text-gray-400 capitalize">{currentUser.role}</p>
                </div>
              </div>
              
              <Button
                onClick={handleOpenProfileSettings}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
              >
                <User className="w-4 h-4" />
                <span>Profile</span>
              </Button>
              
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Welcome back, {currentUser.username}!
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your campus resources and bookings from your dashboard.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {['overview', 'resources', 'bookings', 'notifications'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-2 px-1 border-b-2 font-medium text-sm capitalize transition-colors duration-200 ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 transition-all duration-300">
          {activeTab === 'overview' && (
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Overview</h3>
              
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
                      <Hash className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Resources</p>
                      <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{resources.length}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6 border border-green-200 dark:border-green-800">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 dark:bg-green-800 rounded-lg">
                      <Calendar className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-green-600 dark:text-green-400">Your Bookings</p>
                      <p className="text-2xl font-bold text-green-900 dark:text-green-100">{bookings.length}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-6 border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-center">
                    <div className="p-2 bg-yellow-100 dark:bg-yellow-800 rounded-lg">
                      <Mail className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Notifications</p>
                      <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">{notifications.length}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="space-y-4">
                <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100">Recent Activity</h4>
                
                {bookings.length > 0 ? (
                  <div className="space-y-3">
                    {bookings.slice(0, 3).map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">{booking.resourceName}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {new Date(booking.startTime).toLocaleDateString()} at{' '}
                              {new Date(booking.startTime).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
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
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">No recent bookings found.</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'resources' && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Available Resources</h3>
                {currentUser.role?.toLowerCase() === 'admin' && (
                  <Button 
                    className="flex items-center space-x-2"
                    onClick={() => setIsAddResourceModalOpen(true)}
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Resource</span>
                  </Button>
                )}
              </div>

              {resources.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {resources.map((resource) => (
                    <div 
                      key={resource.id} 
                      className={`card p-6 transition-all duration-300 ${
                        resource.isUnderMaintenance ? 'opacity-60 grayscale' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100">{resource.name}</h4>
                        <div className="flex items-center space-x-2">
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
                      
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{resource.description}</p>
                      
                      {resource.isUnderMaintenance && resource.maintenanceNote && (
                        <div className="mb-4 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                          <p className="text-sm text-orange-800 dark:text-orange-300">
                            <strong>Maintenance Note:</strong> {resource.maintenanceNote}
                          </p>
                        </div>
                      )}
                      
                      <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center">
                          <Shield className="w-4 h-4 mr-2" />
                          <span>{resource.category}</span>
                        </div>
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-2" />
                          <span>{resource.capacity || 'N/A'} capacity</span>
                        </div>
                        <div className="flex items-center">
                          <Hash className="w-4 h-4 mr-2" />
                          <span>{resource.location}</span>
                        </div>
                      </div>

                      <div className="mt-4 space-y-3">
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

                        {/* Action Buttons */}
                        <div className="flex space-x-2">
                          <Button 
                            className="flex-1" 
                            size="sm"
                            onClick={() => handleBookResource(resource)}
                            disabled={resource.isUnderMaintenance}
                          >
                            {resource.isUnderMaintenance ? 'Unavailable' : 'Book Now'}
                          </Button>
                          {currentUser.role?.toLowerCase() === 'admin' && (
                            <>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleEditResource(resource)}
                                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                              >
                                Edit
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleDeleteResource(resource.id)}
                                className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                              >
                                Delete
                              </Button>
                            </>
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
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {currentUser?.role?.toLowerCase() === 'admin' ? 'All Bookings' : 'Your Bookings'}
                </h3>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleOpenCalendar}
                    className="flex items-center space-x-2"
                  >
                    <CalendarDays className="w-4 h-4" />
                    <span>Calendar View</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleRefreshBookings}
                    className="flex items-center space-x-2"
                  >
                    <Clock className="w-4 h-4" />
                    <span>Refresh</span>
                  </Button>
                </div>
              </div>

              {bookings.length > 0 ? (
                <div className="space-y-4">
                  {bookings.map((booking) => (
                    <div key={booking.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100">{booking.resourceName}</h4>
                          {currentUser?.role?.toLowerCase() === 'admin' && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              Booked by: {booking.username} ({booking.userEmail})
                            </p>
                          )}
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          booking.status === 'approved' ? 'bg-green-100 text-green-800' :
                          booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          booking.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {booking.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">Start Time</p>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{new Date(booking.startTime).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">End Time</p>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{new Date(booking.endTime).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">Purpose</p>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{booking.purpose}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">Attendees</p>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{booking.attendees} people</p>
                        </div>
                      </div>

                      <div className="mt-4 flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewBookingDetails(booking)}
                        >
                          View Details
                        </Button>
                        
                        {/* Admin approval buttons */}
                        {currentUser?.role?.toLowerCase() === 'admin' && booking.status === 'pending' && (
                          <>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleApproveBooking(booking.id)}
                              className="text-green-600 hover:text-green-700"
                            >
                              Approve
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleRejectBooking(booking.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              Reject
                            </Button>
                          </>
                        )}
                        
                        {/* User status message */}
                        {currentUser?.role?.toLowerCase() !== 'admin' && booking.status === 'approved' && (
                          <span className="text-green-600 text-sm font-medium">
                            ✅ Booking Approved
                          </span>
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
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {currentUser?.role?.toLowerCase() === 'admin' ? 'All Notifications' : 'Your Notifications'}
                </h3>
                {currentUser?.role?.toLowerCase() === 'admin' && (
                  <Button 
                    onClick={handleOpenCreateNotification}
                    className="flex items-center space-x-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>Create Notification</span>
                  </Button>
                )}
              </div>

              {notifications.length > 0 ? (
                <div className="space-y-4">
                  {notifications.map((notification) => (
                    <div key={notification.id} className={`border-l-4 p-4 ${
                      notification.isRead ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800' : 'border-blue-500 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                    }`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-medium text-gray-900 dark:text-gray-100">{notification.title}</h4>
                            {notification.isSystemNotification && (
                              <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 rounded-full">
                                System
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{notification.message}</p>
                          
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
                          
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(notification.createdAt).toLocaleString()}
                            </p>
                            {notification.createdBy && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                By: {notification.createdBy}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                          {currentUser?.role?.toLowerCase() === 'admin' && notification.isSystemNotification && (
                            <button
                              onClick={async () => {
                                if (window.confirm('Are you sure you want to delete this notification?')) {
                                  try {
                                    await firebaseService.deleteNotification(notification.id);
                                    toast.success('Notification deleted successfully!');
                                    handleNotificationCreated();
                                  } catch (error) {
                                    console.error('Error deleting notification:', error);
                                    toast.error('Failed to delete notification.');
                                  }
                                }
                              }}
                              className="text-red-500 hover:text-red-700 text-sm"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">No notifications found.</p>
              )}
            </div>
          )}
                 </div>
       </main>

       {/* Add Resource Modal */}
       <AddResourceModal
         isOpen={isAddResourceModalOpen}
         onClose={() => setIsAddResourceModalOpen(false)}
         onResourceAdded={handleResourceAdded}
       />

       {/* Edit Resource Modal */}
       <EditResourceModal
         isOpen={isEditResourceModalOpen}
         onClose={() => {
           setIsEditResourceModalOpen(false);
           setSelectedResource(null);
         }}
         onResourceUpdated={handleResourceUpdated}
         resource={selectedResource}
       />

       {/* Booking Modal */}
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

               {/* Booking Details Modal */}
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

        {/* Booking Calendar Modal */}
        <BookingCalendar
          isOpen={isCalendarOpen}
          onClose={() => setIsCalendarOpen(false)}
          currentUser={currentUser}
        />

        {/* Create Notification Modal */}
        <CreateNotificationModal
          isOpen={isCreateNotificationOpen}
          onClose={() => setIsCreateNotificationOpen(false)}
          currentUser={currentUser}
          onNotificationCreated={handleNotificationCreated}
        />

        {/* Profile Settings Modal */}
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