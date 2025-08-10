import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Users } from 'lucide-react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { firebaseService } from '../services/firebase-service';
import { Booking } from '../types';
import { toLocalDateString, formatLocalTime } from '../utils/date-utils';
import 'react-calendar/dist/Calendar.css';

interface BookingCalendarProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
}

interface DayBookings {
  [date: string]: Booking[];
}

const BookingCalendar: React.FC<BookingCalendarProps> = ({
  isOpen,
  onClose,
  currentUser
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [dayBookings, setDayBookings] = useState<DayBookings>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadAllBookings();
    }
  }, [isOpen]);

  const loadAllBookings = async () => {
    setLoading(true);
    try {
      // Always load all bookings for everyone to see
      const bookings = await firebaseService.getAllBookings();
      
      setAllBookings(bookings);
      
      // Group bookings by date using local timezone to avoid date shifts
      const groupedBookings: DayBookings = {};
      bookings.forEach(booking => {
        const dateKey = toLocalDateString(booking.startTime);
        
        if (!groupedBookings[dateKey]) {
          groupedBookings[dateKey] = [];
        }
        groupedBookings[dateKey].push(booking);
      });
      
      setDayBookings(groupedBookings);
    } catch (error) {
      console.error('Error loading bookings for calendar:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  const getTileContent = ({ date }: { date: Date }) => {
    const dateKey = date.toISOString().split('T')[0];
    const bookingsForDay = dayBookings[dateKey] || [];
    
    if (bookingsForDay.length === 0) {
      return null;
    }

    return (
      <div className="text-xs">
        <div className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center mx-auto mb-1">
          {bookingsForDay.length}
        </div>
      </div>
    );
  };

  const getTileClassName = ({ date }: { date: Date }) => {
    const dateKey = date.toISOString().split('T')[0];
    const bookingsForDay = dayBookings[dateKey] || [];
    
    if (bookingsForDay.length === 0) {
      return '';
    }

    // Different colors based on booking status
    const hasApproved = bookingsForDay.some(b => b.status === 'approved');
    const hasPending = bookingsForDay.some(b => b.status === 'pending');
    const hasRejected = bookingsForDay.some(b => b.status === 'rejected');

    if (hasApproved) return 'react-calendar__tile--has-approved';
    if (hasPending) return 'react-calendar__tile--has-pending';
    if (hasRejected) return 'react-calendar__tile--has-rejected';
    
    return 'react-calendar__tile--has-bookings';
  };

  const formatTime = (dateString: string) => {
    return formatLocalTime(dateString);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300';
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300';
      case 'rejected':
        return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300';
    }
  };

  const getSelectedDateBookings = () => {
    if (!selectedDate) return [];
    
    const dateKey = selectedDate.toISOString().split('T')[0];
    return dayBookings[dateKey] || [];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Booking Calendar
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
              <span className="ml-2 text-gray-600 dark:text-gray-400">Loading bookings...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Calendar */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Calendar View</h3>
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <Calendar
                    onChange={handleDateClick}
                    value={selectedDate}
                    tileContent={getTileContent}
                    tileClassName={getTileClassName}
                    className="w-full"
                  />
                </div>
                
                {/* Legend */}
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-green-100 dark:bg-green-900 rounded"></div>
                    <span className="text-gray-900 dark:text-gray-100">Approved Bookings</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-yellow-100 dark:bg-yellow-900 rounded"></div>
                    <span className="text-gray-900 dark:text-gray-100">Pending Bookings</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-red-100 dark:bg-red-900 rounded"></div>
                    <span className="text-gray-900 dark:text-gray-100">Rejected Bookings</span>
                  </div>
                </div>
              </div>

              {/* Selected Date Bookings */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  {selectedDate ? (
                    `Bookings for ${selectedDate.toLocaleDateString()}`
                  ) : (
                    'Select a date to view bookings'
                  )}
                </h3>

                {selectedDate && (
                  <div className="space-y-3">
                    {getSelectedDateBookings().length > 0 ? (
                      getSelectedDateBookings()
                        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                        .map((booking) => (
                          <div key={booking.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold text-gray-900 dark:text-gray-100">{booking.resourceName}</h4>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(booking.status)}`}>
                                {booking.status}
                              </span>
                            </div>

                            <div className="space-y-2 text-sm">
                              <div className="flex items-center space-x-2">
                                <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                <span className="text-gray-900 dark:text-gray-100">
                                  {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                                </span>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <Users className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                <span className="text-gray-900 dark:text-gray-100">{booking.attendees} people</span>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <MapPin className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                <span className="text-gray-900 dark:text-gray-100">{booking.purpose}</span>
                              </div>

                              {/* Show user information for all users */}
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                Booked by: {booking.userName} ({booking.userRole})
                              </div>
                            </div>
                          </div>
                        ))
                    ) : (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        No bookings for this date
                      </div>
                    )}
                  </div>
                )}

                {!selectedDate && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    Click on a date in the calendar to view bookings
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingCalendar; 