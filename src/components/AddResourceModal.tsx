import React, { useState } from 'react';
import { X, Plus, MapPin, Users, Shield, Wrench, Calendar } from 'lucide-react';
import Button from './Button';
import Input from './Input';
import firebaseService from '../services/firebase-service';
import toast from 'react-hot-toast';

interface AddResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResourceAdded: () => void;
}

interface ResourceFormData {
  name: string;
  description: string;
  category: string;
  location: string;
  capacity: string;
  status: string;
  equipment: string;
  maintenanceSchedule: string;
}

const AddResourceModal: React.FC<AddResourceModalProps> = ({ isOpen, onClose, onResourceAdded }) => {
  const [formData, setFormData] = useState<ResourceFormData>({
    name: '',
    description: '',
    category: '',
    location: '',
    capacity: '',
    status: 'available',
    equipment: '',
    maintenanceSchedule: ''
  });

  const [isLoading, setIsLoading] = useState(false);

  const categoryOptions = [
    { value: 'Laboratory', label: 'Laboratory' },
    { value: 'Meeting Room', label: 'Meeting Room' },
    { value: 'Classroom', label: 'Classroom' },
    { value: 'Auditorium', label: 'Auditorium' },
    { value: 'Computer Lab', label: 'Computer Lab' },
    { value: 'Equipment', label: 'Equipment' },
    { value: 'Vehicle', label: 'Vehicle' },
    { value: 'Sports Facility', label: 'Sports Facility' },
    { value: 'Library', label: 'Library' },
    { value: 'Other', label: 'Other' }
  ];

  const statusOptions = [
    { value: 'available', label: 'Available' },
    { value: 'booked', label: 'Booked' },
    { value: 'maintenance', label: 'Under Maintenance' },
    { value: 'unavailable', label: 'Unavailable' }
  ];

  const maintenanceOptions = [
    { value: 'Weekly', label: 'Weekly' },
    { value: 'Monthly', label: 'Monthly' },
    { value: 'Quarterly', label: 'Quarterly' },
    { value: 'Annually', label: 'Annually' },
    { value: 'As Needed', label: 'As Needed' }
  ];

  const handleInputChange = (field: keyof ResourceFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.description || !formData.category || !formData.location) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);

    try {
      const equipmentArray = formData.equipment
        .split(',')
        .map(item => item.trim())
        .filter(item => item.length > 0);

      await firebaseService.createResource({
        name: formData.name,
        description: formData.description,
        category: formData.category,
        location: formData.location,
        capacity: parseInt(formData.capacity) || 0,
        status: formData.status as 'available' | 'booked' | 'maintenance' | 'unavailable',
        equipment: equipmentArray,
        maintenanceSchedule: formData.maintenanceSchedule
      });

      toast.success('Resource added successfully!');
      onResourceAdded();
      onClose();
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        category: '',
        location: '',
        capacity: '',
        status: 'available',
        equipment: '',
        maintenanceSchedule: ''
      });
    } catch (error: any) {
      console.error('Error adding resource:', error);
      console.error('Error details:', error.message, error.stack);
      
      // More specific error messages
      if (error.message.includes('permission')) {
        toast.error('Permission denied. Please check your admin privileges.');
      } else if (error.message.includes('network')) {
        toast.error('Network error. Please check your connection.');
      } else if (error.message.includes('firestore')) {
        toast.error('Database error. Please try again.');
      } else {
        toast.error(`Failed to add resource: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Plus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Add New Resource</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Resource Name */}
            <div className="md:col-span-2">
              <Input
                label="Resource Name *"
                type="text"
                value={formData.name}
                onChange={(value) => handleInputChange('name', value)}
                placeholder="Enter resource name"
                required
                icon={<Shield className="w-4 h-4" />}
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Enter resource description"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  rows={3}
                  required
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <Input
                label="Category *"
                type="select"
                value={formData.category}
                onChange={(value) => handleInputChange('category', value)}
                options={categoryOptions}
                required
                icon={<Shield className="w-4 h-4" />}
              />
            </div>

            {/* Location */}
            <div>
              <Input
                label="Location *"
                type="text"
                value={formData.location}
                onChange={(value) => handleInputChange('location', value)}
                placeholder="Building, Room number"
                required
                icon={<MapPin className="w-4 h-4" />}
              />
            </div>

            {/* Capacity */}
            <div>
              <Input
                label="Capacity"
                type="text"
                value={formData.capacity}
                onChange={(value) => handleInputChange('capacity', value)}
                placeholder="Number of people/items"
                icon={<Users className="w-4 h-4" />}
              />
            </div>

            {/* Status */}
            <div>
              <Input
                label="Status"
                type="select"
                value={formData.status}
                onChange={(value) => handleInputChange('status', value)}
                options={statusOptions}
                icon={<Shield className="w-4 h-4" />}
              />
            </div>

            {/* Equipment */}
            <div className="md:col-span-2">
              <Input
                label="Equipment (comma-separated)"
                type="text"
                value={formData.equipment}
                onChange={(value) => handleInputChange('equipment', value)}
                placeholder="Computers, Projector, Whiteboard"
                icon={<Wrench className="w-4 h-4" />}
              />
            </div>

            {/* Maintenance Schedule */}
            <div className="md:col-span-2">
              <Input
                label="Maintenance Schedule"
                type="select"
                value={formData.maintenanceSchedule}
                onChange={(value) => handleInputChange('maintenanceSchedule', value)}
                options={maintenanceOptions}
                icon={<Calendar className="w-4 h-4" />}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex items-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Adding...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Add Resource</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddResourceModal; 