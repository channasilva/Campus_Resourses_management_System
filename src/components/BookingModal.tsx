import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Users } from 'lucide-react';
import Button from './Button';
import Input from './Input';
import { firebaseService } from '../services/firebase-service';
import { Booking, Resource } from '../types';
import { createLocalDateTime, toLocalISOString } from '../utils/date-utils';
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
    attendees: '',
    notes: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [conflicts, setConflicts] = useState<Booking[]>([]);
  const [checkingConflicts, setCheckingConflicts] = useState(false);

  // Clear conflicts when modal opens
  useEffect(() => {
    if (isOpen) {
      setConflicts([]);
      setCheckingConflicts(false);
    }
  }, [isOpen]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    
    // Check for conflicts when date or time changes
    if (['startDate', 'startTime', 'endTime'].includes(field)) {
      checkForConflicts();
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

    setIsLoading(true);

    try {
      // Create dates in local timezone to avoid timezone shifts
      const startDateTime = createLocalDateTime(formData.startDate, formData.startTime);
      const endDateTime = createLocalDateTime(formData.startDate, formData.endTime);

      // Check for booking conflicts before creating the booking
      console.log('🔍 Checking for booking conflicts...');
      const conflicts = await firebaseService.checkBookingConflicts(
        resource.id,
        toLocalISOString(startDateTime),
        toLocalISOString(endDateTime)
      );
      
      if (conflicts.length > 0) {
        console.log('⚠️ Booking conflicts found:', conflicts);
        
        // Create detailed conflict message
        const conflictDetails = conflicts.map(conflict => {
          const start = new Date(conflict.startTime).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          });
          const end = new Date(conflict.endTime).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          });
          const status = conflict.status === 'approved' ? '✅ Approved' : '⏳ Pending';
          return `${start} - ${end} (${status})`;
        }).join('\n');
        
        const message = `⚠️ This resource is already booked for the selected time:\n\n${conflictDetails}\n\nPlease choose a different time or date.`;
        
        toast.error(message, {
          duration: 8000,
          style: {
            maxWidth: '500px',
            whiteSpace: 'pre-line',
            fontSize: '14px'
          }
        });
        
        setIsLoading(false);
        return;
      }
      
      console.log('✅ No conflicts found, creating booking...');

      const bookingData: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'> = {
        userId: currentUser.id,
        userName: currentUser.username,
        userRole: currentUser.role,
        resourceId: resource.id,
        resourceName: resource.name,
        startTime: toLocalISOString(startDateTime),
        endTime: toLocalISOString(endDateTime),
        purpose: formData.purpose,
        attendees: parseInt(formData.attendees) || 1,
        status: 'pending',
        isRecurring: false
      };

      console.log('📝 Creating booking with user ID:', currentUser.id);
      console.log('📝 Booking data:', bookingData);

      await firebaseService.createBooking(bookingData);
      
      toast.success('Booking created successfully!');
      onBookingCreated();
      onClose();
      
      // Reset form
      setFormData({
        startDate: '',
        startTime: '',
        endTime: '',
        purpose: '',
        attendees: '',
        notes: ''
      });
    } catch (error: any) {
      console.error('Booking creation failed:', error);
      toast.error(error.message || 'Failed to create booking');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !resource) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Book Resource: {resource.name}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Resource Info */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Resource Details</h3>
            <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <p><strong>Name:</strong> {resource.name}</p>
              <p><strong>Category:</strong> {resource.category}</p>
              <p><strong>Location:</strong> {resource.location}</p>
              <p><strong>Capacity:</strong> {resource.capacity || 'N/A'}</p>
            </div>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              value={formData.startDate}
              onChange={(value) => handleInputChange('startDate', value)}
              error={errors.startDate}
              required
            />
            
            <Input
              label="Start Time"
              type="time"
              value={formData.startTime}
              onChange={(value) => handleInputChange('startTime', value)}
              error={errors.startTime}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="End Time"
              type="time"
              value={formData.endTime}
              onChange={(value) => handleInputChange('endTime', value)}
              error={errors.endTime}
              required
            />

            <Input
              label="Number of Attendees"
              type="number"
              value={formData.attendees}
              onChange={(value) => handleInputChange('attendees', value)}
              placeholder="1"
              min="1"
              max={resource.capacity || 100}
            />
          </div>

          {/* Conflict Warning */}
          {checkingConflicts && (
            <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 dark:border-blue-400"></div>
              <span className="text-sm">Checking availability...</span>
            </div>
          )}
          
          {conflicts.length > 0 && !checkingConflicts && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-600 text-xs">⚠️</span>
                </div>
                <h4 className="text-sm font-medium text-red-800">Time Conflict Detected</h4>
              </div>
              <div className="text-sm text-red-700 space-y-1">
                <p>This resource is already booked for the selected time:</p>
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
                    <div key={index} className="ml-4">
                      • {start} - {end} ({status})
                    </div>
                  );
                })}
                <p className="mt-2 font-medium">Please choose a different time or date.</p>
              </div>
            </div>
          )}

          {/* Purpose */}
          <Input
            label="Purpose"
            type="text"
            value={formData.purpose}
            onChange={(value) => handleInputChange('purpose', value)}
            error={errors.purpose}
            placeholder="e.g., Study session, Meeting, Lab work"
            required
          />

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="Any additional information..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={isLoading}
              disabled={conflicts.length > 0 || checkingConflicts}
              className="flex-1"
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