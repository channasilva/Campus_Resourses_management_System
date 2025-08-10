import React, { useState } from 'react';
import { X, Calendar, Clock, Users, MapPin, FileText, User, Mail } from 'lucide-react';
import Button from './Button';
import { Booking, Resource } from '../types';
import { firebaseService } from '../services/firebase-service';
import toast from 'react-hot-toast';

interface BookingDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  currentUser: any;
  onBookingUpdated: () => void;
}

const BookingDetails: React.FC<BookingDetailsProps> = ({
  isOpen,
  onClose,
  booking,
  currentUser,
  onBookingUpdated
}) => {
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen || !booking) return null;

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCancelBooking = async () => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;

    setIsLoading(true);
    try {
      await firebaseService.updateBooking(booking.id, {
        ...booking,
        status: 'cancelled'
      });
      
      toast.success('Booking cancelled successfully');
      onBookingUpdated();
      onClose();
    } catch (error: any) {
      console.error('Failed to cancel booking:', error);
      toast.error('Failed to cancel booking');
    } finally {
      setIsLoading(false);
    }
  };

  const canCancelBooking = () => {
    const now = new Date();
    const bookingStart = new Date(booking.startTime);
    const hoursUntilBooking = (bookingStart.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    // Can cancel if booking is in the future and not already cancelled/rejected
    return hoursUntilBooking > 2 && 
           booking.status !== 'cancelled' && 
           booking.status !== 'rejected' &&
           (currentUser.id === booking.userId || currentUser.role?.toLowerCase() === 'admin');
  };

  const startDateTime = formatDateTime(booking.startTime);
  const endDateTime = formatDateTime(booking.endTime);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Booking Details
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(booking.status)}`}>
              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
            </span>
            <span className="text-sm text-gray-500">
              ID: {booking.id.slice(-8)}
            </span>
          </div>

          {/* Resource Information */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3 flex items-center">
              <MapPin className="w-5 h-5 mr-2 text-blue-600" />
              Resource Information
            </h3>
            <div className="space-y-2 text-sm">
              <p><strong>Name:</strong> {booking.resourceName}</p>
              <p><strong>Category:</strong> {booking.resourceCategory}</p>
              <p><strong>Department:</strong> {booking.department}</p>
            </div>
          </div>

          {/* Booking Details */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-gray-600" />
              Booking Details
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Date</p>
                <p className="font-medium">{startDateTime.date}</p>
              </div>
              <div>
                <p className="text-gray-600">Start Time</p>
                <p className="font-medium">{startDateTime.time}</p>
              </div>
              <div>
                <p className="text-gray-600">End Time</p>
                <p className="font-medium">{endDateTime.time}</p>
              </div>
              <div>
                <p className="text-gray-600">Attendees</p>
                <p className="font-medium">{booking.attendees} people</p>
              </div>
            </div>
          </div>

          {/* Purpose and Notes */}
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-2 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-gray-600" />
                Purpose
              </h3>
              <p className="text-gray-700 bg-gray-50 rounded p-3">
                {booking.purpose}
              </p>
            </div>
          </div>

          {/* User Information */}
          <div className="bg-green-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3 flex items-center">
              <User className="w-5 h-5 mr-2 text-green-600" />
              Booked By
            </h3>
            <div className="space-y-2 text-sm">
              <p><strong>Name:</strong> {booking.userName}</p>
              <p><strong>Role:</strong> {booking.userRole}</p>
            </div>
          </div>

          {/* Timestamps */}
          <div className="text-xs text-gray-500 space-y-1">
            <p>Created: {new Date(booking.createdAt).toLocaleString()}</p>
            {booking.updatedAt && booking.updatedAt !== booking.createdAt && (
              <p>Last Updated: {new Date(booking.updatedAt).toLocaleString()}</p>
            )}
          </div>

          {/* Action Buttons */}
          {canCancelBooking() && (
            <div className="flex space-x-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Close
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancelBooking}
                loading={isLoading}
                className="flex-1 text-red-600 hover:text-red-700"
              >
                Cancel Booking
              </Button>
            </div>
          )}

          {!canCancelBooking() && (
            <div className="flex justify-center pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="px-8"
              >
                Close
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingDetails; 