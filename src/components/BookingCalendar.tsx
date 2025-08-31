import React, { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon, Clock, Users, MapPin } from 'lucide-react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { firebaseService } from '../services/firebase-service';
import { Booking } from '../types';
import { toLocalDateString, formatLocalTime } from '../utils/date-utils';

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
  const [viewMode, setViewMode] = useState<'calendar' | 'details'>('calendar');

  useEffect(() => {
    if (isOpen) {
      loadAllBookings();
    }
  }, [isOpen]);

  const loadAllBookings = async () => {
    setLoading(true);
    try {
      console.log('🔄 Loading all bookings for calendar...');
      console.log('👤 Current user role:', currentUser?.role);
      
      // Always load all bookings for everyone to see
      const bookings = await firebaseService.getAllBookings();
      
      console.log('📋 Total bookings loaded:', bookings.length);
      console.log('📋 Sample booking:', bookings[0]);
      
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
      
      console.log('📅 Grouped bookings by date:', Object.keys(groupedBookings));
      console.log('📅 Sample date bookings:', Object.values(groupedBookings)[0]);
      
      setDayBookings(groupedBookings);
    } catch (error) {
      console.error('❌ Error loading bookings for calendar:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateClick = (date: Date | Date[]) => {
    // Handle both single date and date array cases
    const selectedDate = Array.isArray(date) ? date[0] : date;

    if (selectedDate) {
      // Create a date key that matches how bookings are grouped
      const dateKey = toLocalDateString(selectedDate.toISOString());

      console.log('📅 Date clicked:', selectedDate);
      console.log('📅 Date key:', dateKey);
      console.log('📅 Available dates with bookings:', Object.keys(dayBookings));
      console.log('📅 Bookings for selected date:', dayBookings[dateKey] || []);

      setSelectedDate(selectedDate);
      setViewMode('details');
    }
  };

  const handleBackToCalendar = () => {
    setViewMode('calendar');
    setSelectedDate(null);
  };

  const getTileContent = ({ date }: { date: Date }) => {
    const dateKey = toLocalDateString(date.toISOString());
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
    const dateKey = toLocalDateString(date.toISOString());
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

    const dateKey = toLocalDateString(selectedDate.toISOString());
    const bookings = dayBookings[dateKey] || [];

    console.log('🔍 Getting bookings for date:', dateKey);
    console.log('🔍 Available dates:', Object.keys(dayBookings));
    console.log('🔍 Found bookings:', bookings.length);
    console.log('🔍 Bookings:', bookings);

    return bookings;
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
          ) : viewMode === 'calendar' ? (
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

              {/* Instructions */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">How to Use</h3>
                <div className="space-y-4 text-gray-600 dark:text-gray-400">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">1</span>
                    </div>
                    <p>Click on any date in the calendar that shows a number (indicating bookings)</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">2</span>
                    </div>
                    <p>View all booking details for that specific date</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">3</span>
                    </div>
                    <p>Use the back button to return to calendar view</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Selected Date Bookings Details View */
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Bookings for {selectedDate?.toLocaleDateString()}
                </h3>
                <button
                  onClick={handleBackToCalendar}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors duration-200"
                >
                  <CalendarIcon className="w-4 h-4" />
                  <span>Back to Calendar</span>
                </button>
              </div>

              <div className="space-y-4">
                {getSelectedDateBookings().length > 0 ? (
                  getSelectedDateBookings()
                    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                    .map((booking) => (
                      <div key={booking.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-gray-800">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{booking.resourceName}</h4>
                          <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(booking.status)}`}>
                            {booking.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="space-y-3">
                            <div className="flex items-center space-x-3">
                              <Clock className="w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Time</p>
                              </div>
                            </div>

                            <div className="flex items-center space-x-3">
                              <Users className="w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{booking.attendees} people</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Attendees</p>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-center space-x-3">
                              <MapPin className="w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{booking.purpose}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Purpose</p>
                              </div>
                            </div>

                            <div className="flex items-center space-x-3">
                              <CalendarIcon className="w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{booking.userName}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Booked by ({booking.userRole})</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Additional booking information */}
                        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            <span className="font-medium">Booking ID:</span> {booking.id}
                          </div>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="text-center py-12">
                    <CalendarIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Bookings Found</h4>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">There are no bookings for this date.</p>
                    <button
                      onClick={handleBackToCalendar}
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
                    >
                      Back to Calendar
                    </button>
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