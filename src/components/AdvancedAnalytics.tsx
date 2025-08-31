import React, { useState, useRef } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Calendar, Download, RefreshCw, FileText, Image, Package } from 'lucide-react';
import { Booking, Resource } from '../types';
import { exportToPDF, exportToPNG, exportBoth, prepareElementForExport, cleanupAfterExport } from '../utils/exportUtils';

interface AdvancedAnalyticsProps {
  bookings: Booking[];
  resources: Resource[];
  totalUsers: number;
  users?: any[]; // Optional users data for registration trends
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const AdvancedAnalytics: React.FC<AdvancedAnalyticsProps> = ({
  bookings,
  resources,
  totalUsers,
  users = []
}) => {
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    end: new Date().toISOString().split('T')[0] // today
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const analyticsRef = useRef<HTMLDivElement>(null);

  // Filter bookings by date range
  const filteredBookings = bookings.filter(booking => {
    const bookingDate = new Date(booking.startTime).toISOString().split('T')[0];
    return bookingDate >= dateRange.start && bookingDate <= dateRange.end;
  });

  // Handle refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    // Simulate refresh delay
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  // Export handlers
  const handleExportPDF = async () => {
    if (!analyticsRef.current || isExporting) return;
    
    setIsExporting(true);
    try {
      prepareElementForExport(analyticsRef.current);
      await exportToPDF(analyticsRef.current, {
        filename: `analysis_report_${new Date().toISOString().split('T')[0]}.pdf`,
        quality: 0.95,
        scale: 2
      });
    } catch (error) {
      console.error('PDF export failed:', error);
    } finally {
      if (analyticsRef.current) {
        cleanupAfterExport(analyticsRef.current);
      }
      setIsExporting(false);
    }
  };

  const handleExportPNG = async () => {
    if (!analyticsRef.current || isExporting) return;
    
    setIsExporting(true);
    try {
      prepareElementForExport(analyticsRef.current);
      await exportToPNG(analyticsRef.current, {
        filename: `analysis_report_${new Date().toISOString().split('T')[0]}.png`,
        quality: 0.95,
        scale: 2
      });
    } catch (error) {
      console.error('PNG export failed:', error);
    } finally {
      if (analyticsRef.current) {
        cleanupAfterExport(analyticsRef.current);
      }
      setIsExporting(false);
    }
  };

  const handleExportBoth = async () => {
    if (!analyticsRef.current || isExporting) return;
    
    setIsExporting(true);
    try {
      prepareElementForExport(analyticsRef.current);
      await exportBoth(analyticsRef.current, {
        filename: `analysis_report_${new Date().toISOString().split('T')[0]}`,
        quality: 0.95,
        scale: 2
      });
    } catch (error) {
      console.error('Batch export failed:', error);
    } finally {
      if (analyticsRef.current) {
        cleanupAfterExport(analyticsRef.current);
      }
      setIsExporting(false);
    }
  };

  // Process booking trends over time (last 30 days)
  const getBookingTrends = () => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return date.toISOString().split('T')[0];
    });

    const trends = last30Days.map(date => {
      const count = filteredBookings.filter(booking =>
        booking.startTime.startsWith(date)
      ).length;

      return {
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        bookings: count
      };
    });

    return trends;
  };

  // Process resource utilization
  const getResourceUtilization = () => {
    const utilization = resources.map(resource => {
      const resourceBookings = filteredBookings.filter(booking => booking.resourceId === resource.id);
      return {
        name: resource.name.length > 15 ? resource.name.substring(0, 15) + '...' : resource.name,
        bookings: resourceBookings.length,
        status: resource.status
      };
    }).sort((a, b) => b.bookings - a.bookings).slice(0, 10); // Top 10

    return utilization;
  };

  // Process peak booking hours
  const getPeakHours = () => {
    const hourCounts: Record<number, number> = {};

    filteredBookings.forEach(booking => {
      const hour = new Date(booking.startTime).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    return Array.from({ length: 24 }, (_, hour) => ({
      hour: `${hour}:00`,
      bookings: hourCounts[hour] || 0
    }));
  };

  // Process booking status distribution
  const getBookingStatusDistribution = () => {
    const statusCounts: Record<string, number> = {};

    filteredBookings.forEach(booking => {
      statusCounts[booking.status] = (statusCounts[booking.status] || 0) + 1;
    });

    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count
    }));
  };

  // Process user activity (bookings per user)
  const getUserActivity = () => {
    const userBookings: Record<string, number> = {};

    filteredBookings.forEach(booking => {
      if (booking.userName) {
        userBookings[booking.userName] = (userBookings[booking.userName] || 0) + 1;
      }
    });

    return Object.entries(userBookings)
      .map(([user, count]) => ({ user: user.length > 12 ? user.substring(0, 12) + '...' : user, bookings: count }))
      .sort((a, b) => b.bookings - a.bookings)
      .slice(0, 10); // Top 10 active users
  };

  // Process booking duration analysis
  const getBookingDurationAnalysis = () => {
    const durationRanges = {
      '0-1h': 0,
      '1-2h': 0,
      '2-4h': 0,
      '4-8h': 0,
      '8h+': 0
    };

    filteredBookings.forEach(booking => {
      const startTime = new Date(booking.startTime);
      const endTime = new Date(booking.endTime);
      const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);

      if (durationHours <= 1) durationRanges['0-1h']++;
      else if (durationHours <= 2) durationRanges['1-2h']++;
      else if (durationHours <= 4) durationRanges['2-4h']++;
      else if (durationHours <= 8) durationRanges['4-8h']++;
      else durationRanges['8h+']++;
    });

    return Object.entries(durationRanges).map(([range, count]) => ({
      duration: range,
      bookings: count
    }));
  };

  // Process resource category breakdown
  const getResourceCategoryBreakdown = () => {
    const categoryCounts: Record<string, number> = {};

    resources.forEach(resource => {
      const category = resource.category || 'Uncategorized';
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });

    return Object.entries(categoryCounts)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);
  };

  // Process user registration trends
  const getUserRegistrationTrends = () => {
    if (!users || users.length === 0) {
      // Generate mock data if no users provided
      const last30Days = Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (29 - i));
        return date.toISOString().split('T')[0];
      });

      return last30Days.map(date => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        registrations: Math.floor(Math.random() * 5) // Mock data
      }));
    }

    const registrationCounts: Record<string, number> = {};

    users.forEach(user => {
      if (user.createdAt) {
        const date = new Date(user.createdAt).toISOString().split('T')[0];
        registrationCounts[date] = (registrationCounts[date] || 0) + 1;
      }
    });

    return Object.entries(registrationCounts)
      .map(([date, count]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        registrations: count
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30); // Last 30 days
  };

  const bookingTrends = getBookingTrends();
  const resourceUtilization = getResourceUtilization();
  const peakHours = getPeakHours();
  const statusDistribution = getBookingStatusDistribution();
  const userActivity = getUserActivity();
  const bookingDurationAnalysis = getBookingDurationAnalysis();
  const resourceCategoryBreakdown = getResourceCategoryBreakdown();
  const userRegistrationTrends = getUserRegistrationTrends();

  return (
    <div className="space-y-8">
      {/* Header with Export Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Advanced Analytics</h2>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Last updated: {new Date().toLocaleString()}
          </div>
        </div>
        
        {/* Export Controls */}
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={handleExportPDF}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg transition-colors text-sm font-medium"
            title="Export as PDF"
          >
            <FileText className="w-4 h-4" />
            {isExporting ? 'Exporting...' : 'Export PDF'}
          </button>
          
          <button
            onClick={handleExportPNG}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg transition-colors text-sm font-medium"
            title="Export as PNG"
          >
            <Image className="w-4 h-4" />
            {isExporting ? 'Exporting...' : 'Export PNG'}
          </button>
          
          <button
            onClick={handleExportBoth}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-lg transition-colors text-sm font-medium"
            title="Export both PDF and PNG"
          >
            <Package className="w-4 h-4" />
            {isExporting ? 'Exporting...' : 'Export Both'}
          </button>
        </div>
      </div>

      {/* Analytics Content Container */}
      <div ref={analyticsRef} className="space-y-8 bg-white dark:bg-gray-900 p-6 rounded-lg">

      {/* Controls */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Date Range:</span>
            </div>
            <div className="flex gap-2">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
              />
              <span className="text-gray-500 dark:text-gray-400 self-center">to</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
              />
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="text-sm">Refresh</span>
          </button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Filtered Bookings</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{filteredBookings.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Resources</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {resources.filter(r => r.status === 'available').length}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg Bookings/Day</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {(() => {
              const days = Math.max(1, Math.ceil((new Date(dateRange.end).getTime() - new Date(dateRange.start).getTime()) / (1000 * 60 * 60 * 24)));
              return (filteredBookings.length / days).toFixed(1);
            })()}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Utilization Rate</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {resources.length > 0 ? ((filteredBookings.length / resources.length) * 100).toFixed(1) : 0}%
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
        {/* Booking Trends Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              Booking Trends (Last 30 Days)
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={bookingTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="bookings"
                stroke="#8884d8"
                strokeWidth={2}
                dot={{ fill: '#8884d8' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Resource Utilization Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              Top 10 Resource Utilization
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={resourceUtilization}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="bookings" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Peak Hours Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Peak Booking Hours
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={peakHours}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="bookings" fill="#ffc658" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Booking Duration Analysis */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Booking Duration Analysis
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={bookingDurationAnalysis}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="duration" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="bookings" fill="#ff7300" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Resource Category Breakdown */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Resource Category Breakdown
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={resourceCategoryBreakdown}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {resourceCategoryBreakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Additional Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* User Registration Trends */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              User Registration Trends
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={userRegistrationTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="registrations"
                stroke="#82ca9d"
                strokeWidth={2}
                dot={{ fill: '#82ca9d' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Performance Metrics Placeholder */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            System Performance
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Page Load Time</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">1.2s</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">API Response Time</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">245ms</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Uptime</span>
              <span className="text-sm font-medium text-green-600 dark:text-green-400">99.9%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Active Sessions</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">{Math.floor(Math.random() * 50) + 10}</span>
            </div>
          </div>
        </div>
      </div>

      {/* User Activity Chart - Full Width */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
          Top 10 Active Users
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={userActivity} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="user" type="category" width={100} />
            <Tooltip />
            <Legend />
            <Bar dataKey="bookings" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Predictive Analytics */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
          Predictive Analytics (Next 7 Days)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Expected Bookings</h4>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={(() => {
                const last7Days = bookingTrends.slice(-7);
                const avgBookings = last7Days.reduce((sum, day) => sum + day.bookings, 0) / last7Days.length;
                const next7Days = Array.from({ length: 7 }, (_, i) => ({
                  date: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                  predicted: Math.round(avgBookings * (0.8 + Math.random() * 0.4)) // Simple prediction with some variance
                }));
                return next7Days;
              })()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="predicted"
                  stroke="#ff7300"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: '#ff7300' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">Trend Analysis</h4>
              <p className="text-sm text-blue-600 dark:text-blue-400">
                Based on the last 30 days, booking activity shows a {(() => {
                  const recent = bookingTrends.slice(-10);
                  const earlier = bookingTrends.slice(-20, -10);
                  const recentAvg = recent.reduce((sum, day) => sum + day.bookings, 0) / recent.length;
                  const earlierAvg = earlier.reduce((sum, day) => sum + day.bookings, 0) / earlier.length;
                  const change = ((recentAvg - earlierAvg) / earlierAvg) * 100;
                  return change > 5 ? 'positive upward trend' : change < -5 ? 'downward trend' : 'stable pattern';
                })()}.
              </p>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <h4 className="text-sm font-medium text-green-800 dark:text-green-300 mb-2">Recommendations</h4>
              <ul className="text-sm text-green-600 dark:text-green-400 space-y-1">
                <li>• Consider adding more resources during peak hours</li>
                <li>• Schedule maintenance during low-activity periods</li>
                <li>• Monitor {resourceUtilization[0]?.name || 'top resource'} usage closely</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
          Summary Statistics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {Math.max(...peakHours.map(h => h.bookings))}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Peak Hour Bookings</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">
              {resourceUtilization[0]?.bookings || 0}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Most Booked Resource</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
              {userActivity[0]?.bookings || 0}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Most Active User</p>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default AdvancedAnalytics;