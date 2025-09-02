import React, { useState } from 'react';
import { X, Send } from 'lucide-react';
import firebaseService from '../services/firebase-service';
import Button from './Button';
import Input from './Input';
import toast from 'react-hot-toast';

interface CreateNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
  onNotificationCreated: () => void;
}

const CreateNotificationModal: React.FC<CreateNotificationModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onNotificationCreated
}) => {
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'admin_announcement' as const
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    }

    if (formData.title.length > 100) {
      newErrors.title = 'Title must be less than 100 characters';
    }

    if (formData.message.length > 1000) {
      newErrors.message = 'Message must be less than 1000 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);

              try {
       // Create notification data
       const notificationData: any = {
         title: formData.title.trim(),
         message: formData.message.trim(),
         type: formData.type,
         isRead: false,
         createdBy: currentUser.username,
         isSystemNotification: true
       };

      console.log('📢 Creating system notification:', notificationData);
      
      await firebaseService.createNotification(notificationData);
      
      toast.success('Notification sent successfully to all users!');
      onNotificationCreated();
      onClose();
      
             // Reset form
       setFormData({
         title: '',
         message: '',
         type: 'admin_announcement'
       });
    } catch (error: any) {
      console.error('Notification creation failed:', error);
      toast.error(error.message || 'Failed to create notification');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white/95 backdrop-blur-xl rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Create System Notification
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Notification Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notification Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => handleInputChange('type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="admin_announcement">Announcement</option>
              <option value="maintenance_alert">Maintenance Alert</option>
              <option value="system_announcement">System Update</option>
            </select>
          </div>

          {/* Title */}
          <Input
            label="Notification Title"
            type="text"
            value={formData.title}
            onChange={(value) => handleInputChange('title', value)}
            error={errors.title}
            placeholder="Enter notification title..."
            required
          />

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message
            </label>
            <textarea
              value={formData.message}
              onChange={(e) => handleInputChange('message', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
              placeholder="Enter notification message..."
              required
            />
            {errors.message && (
              <p className="text-red-500 text-sm mt-1">{errors.message}</p>
            )}
          </div>

          

          {/* Preview */}
          {(formData.title || formData.message) && (
            <div className="bg-gray-50/80 backdrop-blur-sm rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Preview</h4>
              <div className="border border-gray-200 rounded-lg p-4 bg-white/90 backdrop-blur-sm">
                {formData.title && (
                  <h5 className="font-semibold text-gray-900 mb-2">{formData.title}</h5>
                )}
                {formData.message && (
                  <p className="text-gray-700 text-sm">{formData.message}</p>
                )}
                
              </div>
            </div>
          )}

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
               className="flex-1"
             >
              <Send className="w-4 h-4 mr-2" />
              Send Notification
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateNotificationModal; 