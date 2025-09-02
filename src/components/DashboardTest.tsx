import React, { useState, useEffect } from 'react';
import { dashboardService } from '../services/dashboard-service';
import { User } from '../types';
import { Resource, Booking, Notification } from '../types';

interface DashboardTestProps {
  user: User;
}

const DashboardTest: React.FC<DashboardTestProps> = ({ user }) => {
  const [testResults, setTestResults] = useState<{
    resources: { count: number; error?: string };
    bookings: { count: number; error?: string };
    notifications: { count: number; error?: string };
    userCount: { count: number; error?: string };
  }>({
    resources: { count: 0 },
    bookings: { count: 0 },
    notifications: { count: 0 },
    userCount: { count: 0 }
  });
  const [loading, setLoading] = useState(false);
  const [lastTest, setLastTest] = useState<string>('');

  const runTest = async () => {
    setLoading(true);
    setLastTest(new Date().toLocaleTimeString());
    
    try {
      console.log('🧪 Running dashboard data test...');
      const dashboardData = await dashboardService.loadDashboardData(user);
      
      setTestResults({
        resources: { count: dashboardData.resources.length },
        bookings: { count: dashboardData.bookings.length },
        notifications: { count: dashboardData.notifications.length },
        userCount: { count: dashboardData.userCount }
      });
      
      console.log('✅ Dashboard test completed successfully:', dashboardData);
    } catch (error: any) {
      console.error('❌ Dashboard test failed:', error);
      setTestResults({
        resources: { count: 0, error: error.message },
        bookings: { count: 0, error: error.message },
        notifications: { count: 0, error: error.message },
        userCount: { count: 0, error: error.message }
      });
    } finally {
      setLoading(false);
    }
  };

  const testIndividualServices = async () => {
    setLoading(true);
    setLastTest(new Date().toLocaleTimeString());
    
    try {
      console.log('🧪 Testing individual services...');
      
      const [resources, bookings, notifications, userCount] = await Promise.allSettled([
        dashboardService.refreshResources(),
        dashboardService.refreshBookings(user),
        dashboardService.refreshNotifications(user),
        user.role?.toLowerCase() === 'admin' ? 
          dashboardService.loadUserCount(user) : 
          Promise.resolve(0)
      ]);

      setTestResults({
        resources: {
          count: resources.status === 'fulfilled' ? resources.value.length : 0,
          error: resources.status === 'rejected' ? resources.reason.message : undefined
        },
        bookings: {
          count: bookings.status === 'fulfilled' ? bookings.value.length : 0,
          error: bookings.status === 'rejected' ? bookings.reason.message : undefined
        },
        notifications: {
          count: notifications.status === 'fulfilled' ? notifications.value.length : 0,
          error: notifications.status === 'rejected' ? notifications.reason.message : undefined
        },
        userCount: {
          count: userCount.status === 'fulfilled' ? userCount.value : 0,
          error: userCount.status === 'rejected' ? userCount.reason.message : undefined
        }
      });
      
      console.log('✅ Individual services test completed');
    } catch (error: any) {
      console.error('❌ Individual services test failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
        Dashboard Data Test
      </h3>
      
      <div className="mb-4">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          User: {user.username} ({user.role})
        </p>
        {lastTest && (
          <p className="text-xs text-gray-500 dark:text-gray-500">
            Last test: {lastTest}
          </p>
        )}
      </div>

      <div className="flex gap-2 mb-6">
        <button
          onClick={runTest}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Testing...' : 'Test Dashboard Data'}
        </button>
        <button
          onClick={testIndividualServices}
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Testing...' : 'Test Individual Services'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Resources</h4>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {testResults.resources.count}
          </p>
          {testResults.resources.error && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
              Error: {testResults.resources.error}
            </p>
          )}
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Bookings</h4>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {testResults.bookings.count}
          </p>
          {testResults.bookings.error && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
              Error: {testResults.bookings.error}
            </p>
          )}
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Notifications</h4>
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {testResults.notifications.count}
          </p>
          {testResults.notifications.error && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
              Error: {testResults.notifications.error}
            </p>
          )}
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">User Count</h4>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {testResults.userCount.count}
          </p>
          {testResults.userCount.error && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
              Error: {testResults.userCount.error}
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          <strong>Test Instructions:</strong> Click "Test Dashboard Data" to test the complete dashboard loading, 
          or "Test Individual Services" to test each service separately. Check the browser console for detailed logs.
        </p>
      </div>
    </div>
  );
};

export default DashboardTest;
