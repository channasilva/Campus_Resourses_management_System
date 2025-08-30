import React from 'react';
import { Users, BookOpen, Clock, TrendingUp } from 'lucide-react';
import { Booking, Resource } from '../types';

interface AnalyticsProps {
  bookings: Booking[];
  resources: Resource[];
  totalUsers: number;
}

interface AnalyticCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
}

const AnalyticCard: React.FC<AnalyticCardProps> = ({ title, value, icon, description }) => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{title}</h3>
      <div className="text-blue-500">{icon}</div>
    </div>
    <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{value}</div>
    {description && (
      <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
    )}
  </div>
);

const DashboardAnalytics: React.FC<AnalyticsProps> = ({ bookings, resources, totalUsers }) => {
  console.log('Analytics Props:', { 
    bookingsCount: bookings?.length || 0, 
    resourcesCount: resources?.length || 0, 
    totalUsers 
  });

  const getMostBookedResource = () => {
    if (!Array.isArray(bookings) || !Array.isArray(resources) || bookings.length === 0 || resources.length === 0) {
      return { name: 'No bookings yet', count: 0 };
    }

    const bookingCounts = bookings.reduce((acc: Record<string, number>, booking) => {
      if (booking.resourceId) {
        acc[booking.resourceId] = (acc[booking.resourceId] || 0) + 1;
      }
      return acc;
    }, {});

    const mostBookedId = Object.entries(bookingCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0];

    const resourceName = resources.find(r => r.id === mostBookedId)?.name || 'N/A';
    const bookingCount = bookingCounts[mostBookedId] || 0;
    
    return { name: resourceName, count: bookingCount };
  };

  const getPeakBookingTime = () => {
    if (!bookings?.length) {
      return 'No bookings yet';
    }

    const hourCounts: Record<number, number> = {};
    
    bookings.forEach(booking => {
      const bookingHour = new Date(booking.startTime).getHours();
      hourCounts[bookingHour] = (hourCounts[bookingHour] || 0) + 1;
    });

    const peakHour = Object.entries(hourCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0];

    return `${peakHour}:00 - ${Number(peakHour) + 1}:00`;
  };

  const getBookingTrend = () => {
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);
    
    const recentBookings = bookings.filter(
      booking => new Date(booking.startTime) >= last30Days
    ).length;

    return `${recentBookings} in last 30 days`;
  };

  const mostBooked = getMostBookedResource();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <AnalyticCard
        title="Total Users"
        value={totalUsers}
        icon={<Users size={24} />}
        description="Registered users in the system"
      />
      <AnalyticCard
        title="Most Booked Resource"
        value={mostBooked.name}
        icon={<BookOpen size={24} />}
        description={`${mostBooked.count} bookings`}
      />
      <AnalyticCard
        title="Peak Booking Time"
        value={getPeakBookingTime()}
        icon={<Clock size={24} />}
        description="Most active booking hour"
      />
      <AnalyticCard
        title="Booking Trend"
        value={getBookingTrend()}
        icon={<TrendingUp size={24} />}
        description="Recent booking activity"
      />
    </div>
  );
};

export default DashboardAnalytics;
