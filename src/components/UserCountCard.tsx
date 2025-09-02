import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, Activity } from 'lucide-react';
import firebaseService from '../services/firebase-service';

interface UserCountCardProps {
  className?: string;
}

const UserCountCard: React.FC<UserCountCardProps> = ({ className = '' }) => {
  const [userCount, setUserCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const fetchUserCount = async () => {
      try {
        setIsLoading(true);
        const users = await firebaseService.getAllUsers();
        setUserCount(users.length);
      } catch (error) {
        console.error('Error fetching user count:', error);
        setUserCount(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserCount();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchUserCount, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`card p-6 animate-fade-in ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Active Users
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Real-time count
            </p>
          </div>
        </div>
        
        {/* Online indicator */}
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>
      
      <div className="flex items-end justify-between">
        <div>
          {isLoading ? (
            <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          ) : (
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {userCount}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                users
              </span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-1 text-green-500">
          <TrendingUp className="w-4 h-4" />
          <span className="text-sm font-medium">+12%</span>
        </div>
      </div>
      
      {/* Activity indicator */}
      <div className="mt-4 flex items-center space-x-2">
        <Activity className="w-4 h-4 text-blue-500" />
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Last updated: {new Date().toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
};

export default UserCountCard; 