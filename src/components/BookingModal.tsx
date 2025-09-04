import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Users } from 'lucide-react';
import Button from './Button';
import Input from './Input';
import firebaseService from '../services/firebase-service';
import { Booking, Resource } from '../types';
import { createLocalDateTime, toLocalISOString, formatLocalDateTime } from '../utils/date-utils';
import toast from 'react-hot-toast';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  resource: Resource | null;
  currentUser: any;
  onBookingCreated: () => void;
}

const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  resource,
  currentUser,
  onBookingCreated
}) => {
  const [formData, setFormData] = useState({
    startDate: '',
    startTime: '',
    endTime: '',
    purpose: '',
    attendees: '1',
    notes: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [conflicts, setConflicts] = useState<Booking[]>([]);
  const [checkingConflicts, setCheckingConflicts] = useState(false);

  // Clear conflicts when modal opens or resource changes
  useEffect(() => {
    if (isOpen) {
      setConflicts([]);
      setCheckingConflicts(false);
      // Reset form when resource changes
      setFormData({
        startDate: '',
        startTime: '',
        endTime: '',
        purpose: '',
        attendees: '1',
        notes: ''
      });
      setErrors({});
    }
  }, [isOpen, resource?.id]);

  const handleInputChange = (field: string, value: string) => {
    console.log(`Input change: ${field} = "${value}"`);
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }

    // Check for conflicts when date or time changes (with debounce)
    if (['startDate', 'startTime', 'endTime'].includes(field)) {
      // Clear existing conflicts immediately when user changes input
      setConflicts([]);
      // Debounce the conflict check to avoid too many API calls
      setTimeout(() => {
        checkForConflicts();
      }, 500);
    }
  };

  const checkForConflicts = async () => {
    if (!resource || !formData.startDate || !formData.startTime || !formData.endTime) {
      setConflicts([]);
      return;
    }

    try {
      setCheckingConflicts(true);
      const startDateTime = createLocalDateTime(formData.startDate, formData.startTime);
      const endDateTime = createLocalDateTime(formData.startDate, formData.endTime);
      
      const foundConflicts = await firebaseService.checkBookingConflicts(
        resource.id,
        toLocalISOString(startDateTime),
        toLocalISOString(endDateTime)
      );
      
      setConflicts(foundConflicts);
    } catch (error) {
      console.error('Error checking conflicts:', error);
      setConflicts([]);
    } finally {
      setCheckingConflicts(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!formData.startTime) {
      newErrors.startTime = 'Start time is required';
    }

    if (!formData.endTime) {
      newErrors.endTime = 'End time is required';
    }

    if (!formData.purpose) {
      newErrors.purpose = 'Purpose is required';
    }

    // Validate time logic
    if (formData.startTime && formData.endTime) {
      const startTime = new Date(`2000-01-01T${formData.startTime}`);
      const endTime = new Date(`2000-01-01T${formData.endTime}`);
      
      if (endTime <= startTime) {
        newErrors.endTime = 'End time must be after start time';
      }
    }

    // Validate date is not in the past
    if (formData.startDate) {
      const selectedDate = new Date(formData.startDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        newErrors.startDate = 'Cannot book in the past';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !resource) return;

    // Don't allow submission if there are conflicts
    if (conflicts.length > 0) {
      toast.error('Please resolve the time conflict before booking.', {
        duration: 4000
      });
      return;
    }

    setIsLoading(true);

    try {
      // Create dates in local timezone to avoid timezone shifts
      console.log('🕒 Creating booking with times:', {
        startDate: formData.startDate,
        startTime: formData.startTime,
        endTime: formData.endTime
      });
      
      const startDateTime = createLocalDateTime(formData.startDate, formData.startTime);
      const endDateTime = createLocalDateTime(formData.startDate, formData.endTime);
      
      console.log('🕒 Created date objects:', {
        startDateTime: startDateTime.toString(),
        endDateTime: endDateTime.toString(),
        startHours: startDateTime.getHours(),
        startMinutes: startDateTime.getMinutes(),
        endHours: endDateTime.getHours(),
        endMinutes: endDateTime.getMinutes()
      });

      // Final conflict check (in case of race conditions)
      console.log('🔍 Final conflict check before booking...');
      const finalConflicts = await firebaseService.checkBookingConflicts(
        resource.id,
        toLocalISOString(startDateTime),
        toLocalISOString(endDateTime)
      );
      
      if (finalConflicts.length > 0) {
        console.log('⚠️ Last-minute conflicts detected');
        setConflicts(finalConflicts);
        toast.error('A conflict was detected. Please choose a different time.', {
          duration: 4000
        });
        setIsLoading(false);
        return;
      }
      
      console.log('✅ No conflicts found, creating booking...');

      const startTimeISO = toLocalISOString(startDateTime);
      const endTimeISO = toLocalISOString(endDateTime);
      
      console.log('🕒 Final ISO strings for storage:', {
        startTimeISO,
        endTimeISO,
        startTimeFormatted: formatLocalDateTime(startTimeISO),
        endTimeFormatted: formatLocalDateTime(endTimeISO)
      });

      const bookingData: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'> = {
        userId: currentUser.id,
        userName: currentUser.username,
        userRole: currentUser.role,
        resourceId: resource.id,
        resourceName: resource.name,
        startTime: startTimeISO,
        endTime: endTimeISO,
        purpose: formData.purpose,
        attendees: parseInt(formData.attendees) || 1,
        status: 'pending',
        isRecurring: false
      };

      console.log('📝 Creating booking with user ID:', currentUser.id);
      console.log('📝 Booking data:', bookingData);

      await firebaseService.createBooking(bookingData);
      
      toast.success('Booking created successfully!', {
        duration: 4000
      });
      onBookingCreated();
      onClose();
      
      // Reset form
      setFormData({
        startDate: '',
        startTime: '',
        endTime: '',
        purpose: '',
        attendees: '1',
        notes: ''
      });
    } catch (error: any) {
      console.error('Booking creation failed:', error);
      toast.error(error.message || 'Failed to create booking', {
        duration: 4000
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !resource) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-xl w-full max-w-md sm:max-w-lg max-h-[95vh] sm:max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
        {/* Mobile-optimized header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 pr-4 leading-tight">
            Book Resource: {resource.name}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400 p-2 -mr-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            style={{ minHeight: '44px', minWidth: '44px' }}
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6" noValidate>
          {/* Resource Info - Mobile optimized */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 sm:p-4 mb-4">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3 text-sm sm:text-base">Resource Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              <p><strong>Name:</strong> {resource.name}</p>
              <p><strong>Category:</strong> {resource.category}</p>
              <p><strong>Location:</strong> {resource.location}</p>
              <p><strong>Capacity:</strong> {resource.capacity || 'N/A'}</p>
            </div>
          </div>

          {/* Date and Time - Mobile responsive */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Start Date *
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Start Time *
              </label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => handleInputChange('startTime', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                End Time *
              </label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => handleInputChange('endTime', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Number of Attendees
              </label>
              <input
                type="number"
                value={formData.attendees}
                onChange={(e) => handleInputChange('attendees', e.target.value)}
                placeholder="1"
                min="1"
                max={String(resource.capacity || 100)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>

          {/* Conflict Warning - Mobile optimized */}
          {checkingConflicts && (
            <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 dark:border-blue-400"></div>
              <span className="text-sm">Checking availability...</span>
            </div>
          )}
          
          {conflicts.length > 0 && !checkingConflicts && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-3 sm:p-4">
              <div className="flex items-center space-x-2 mb-3">
                <div className="w-5 h-5 bg-red-100 dark:bg-red-800 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-red-600 dark:text-red-400 text-xs">⚠️</span>
                </div>
                <h4 className="text-sm font-medium text-red-800 dark:text-red-300">Time Conflict Detected</h4>
              </div>
              <div className="text-xs sm:text-sm text-red-700 dark:text-red-300 space-y-2">
                <p>This resource is already booked for the selected time:</p>
                <div className="space-y-1 ml-2">
                  {conflicts.map((conflict, index) => {
                    const start = new Date(conflict.startTime).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    });
                    const end = new Date(conflict.endTime).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    });
                    const status = conflict.status === 'approved' ? '✅ Approved' : '⏳ Pending';
                    return (
                      <div key={index} className="flex flex-col sm:flex-row sm:items-center gap-1">
                        <span>• {start} - {end}</span>
                        <span className="text-xs opacity-75">({status})</span>
                      </div>
                    );
                  })}
                </div>
                <p className="mt-2 font-medium">Please choose a different time or date.</p>
              </div>
            </div>
          )}

          {/* Purpose */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Purpose *
            </label>
            <input
              type="text"
              value={formData.purpose}
              onChange={(e) => handleInputChange('purpose', e.target.value)}
              placeholder="e.g., Study session, Meeting, Lab work"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              required
            />
          </div>

          {/* Notes - Mobile optimized */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Additional Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              className="w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-base resize-none"
              rows={3}
              placeholder="Any additional information..."
            />
          </div>

          {/* Action Buttons - Mobile optimized */}
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 pt-4 sticky bottom-0 bg-white dark:bg-gray-800 -mx-4 sm:-mx-6 px-4 sm:px-6 pb-4 sm:pb-6 border-t sm:border-t-0 border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="w-full sm:flex-1 mobile-button"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={isLoading}
              disabled={conflicts.length > 0 || checkingConflicts}
              className="w-full sm:flex-1 mobile-button"
            >
              {conflicts.length > 0 ? 'Time Conflict - Cannot Book' : 'Create Booking'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingModal; 