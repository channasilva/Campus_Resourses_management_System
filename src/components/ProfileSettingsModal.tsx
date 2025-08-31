import React, { useState, useRef } from 'react';
import { X, User, Mail, Building, FileText, Lock, Eye, EyeOff, Camera, Upload, Trash2 } from 'lucide-react';
import { firebaseService } from '../services/firebase-service';
import { cloudinaryService } from '../services/cloudinary-service';
import Button from './Button';
import Input from './Input';
import ProfileImageUpload from './ProfileImageUpload';
import toast from 'react-hot-toast';

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
  onProfileUpdated: () => void;
}

const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onProfileUpdated
}) => {
  const [formData, setFormData] = useState({
    username: currentUser?.username || '',
    email: currentUser?.email || '',
    department: currentUser?.department || '',
    bio: currentUser?.bio || '',
    profilePicture: currentUser?.profilePicture || ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(currentUser?.profilePicture || null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const validation = cloudinaryService.validateImageFile(file);
      if (!validation.isValid) {
        toast.error(validation.error);
        return;
      }

      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = async () => {
    if (!selectedImage || !currentUser) return;

    setIsUploadingImage(true);
    setUploadProgress(0);
    setUploadStatus('Preparing upload...');

    try {
      console.log('Starting image upload for user:', currentUser.id);

      // Simulate progress updates for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev + Math.random() * 15;
          if (newProgress >= 90) {
            clearInterval(progressInterval);
            setUploadStatus('Processing image...');
            return 90;
          }
          setUploadStatus(`Uploading... ${Math.round(newProgress)}%`);
          return newProgress;
        });
      }, 200);

      const result = await cloudinaryService.uploadImage(selectedImage, currentUser.id);
      const imageUrl = result.secure_url;

      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadStatus('Upload complete!');

      console.log('Upload successful, image URL:', imageUrl);

      // Update form data with new image URL
      setFormData(prev => ({ ...prev, profilePicture: imageUrl }));

      // Update preview immediately
      setImagePreview(imageUrl);

      // Clear selected image after a short delay
      setTimeout(() => {
        setSelectedImage(null);
        setUploadProgress(0);
        setUploadStatus('');
      }, 1500);

      toast.success('Profile picture uploaded successfully! 🎉');

    } catch (error: any) {
      console.error('Image upload failed:', error);
      setUploadProgress(0);
      setUploadStatus('');

      let errorMessage = 'Failed to upload image';

      if (error.message.includes('Network error')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Upload timeout. Please try again.';
      } else if (error.message.includes('configuration')) {
        errorMessage = 'Cloudinary is not properly configured. Please contact your administrator.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(currentUser?.profilePicture || null);
    setFormData(prev => ({ ...prev, profilePicture: currentUser?.profilePicture || '' }));
  };

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    try {
      console.log('🧪 Starting Cloudinary connection test...');
      const result = await cloudinaryService.testConnection();

      if (result.success) {
        console.log('✅ Test successful:', result);
        toast.success('Cloudinary connection test successful! 🎉');
      } else {
        console.error('❌ Test failed:', result);
        toast.error(`Connection test failed: ${result.message}`);
      }
    } catch (error: any) {
      console.error('❌ Test error:', error);
      toast.error(`Test error: ${error.message || 'Unknown error'}`);
    } finally {
      setIsTestingConnection(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (formData.username.length > 30) {
      newErrors.username = 'Username must be less than 30 characters';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Department validation (optional)
    if (formData.department && formData.department.trim() && formData.department.trim().length > 50) {
      newErrors.department = 'Department must be less than 50 characters';
    }

    // Bio validation
    if (formData.bio.length > 500) {
      newErrors.bio = 'Bio must be less than 500 characters';
    }



    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const updateData: any = {
        username: formData.username.trim(),
        email: formData.email.trim(),
        department: formData.department.trim(),
        bio: formData.bio.trim(),
        updatedAt: new Date().toISOString()
      };

      // Note: Password changes are not supported in this version
      // Users should use the "Forgot Password" feature instead

      console.log('🔄 Updating user profile:', updateData);
      
      await firebaseService.updateUserProfile(currentUser.id, updateData);
      
      // Update local storage with new user data
      const updatedUser = {
        ...currentUser,
        ...updateData
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      toast.success('Profile updated successfully!');
      
      onProfileUpdated();
      onClose();
    } catch (error: any) {
      console.error('Profile update failed:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Profile Settings
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center">
              <User className="w-5 h-5 mr-2" />
              Basic Information
            </h3>
            
            <Input
              label="Username"
              type="text"
              value={formData.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
              error={errors.username}
              placeholder="Enter your username"
              required
            />

            <Input
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              error={errors.email}
              placeholder="Enter your email address"
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Department (Optional)
              </label>
              <select
                value={formData.department}
                onChange={(e) => handleInputChange('department', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="">Select Department (Optional)</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Engineering">Engineering</option>
                <option value="Business">Business</option>
                <option value="Arts">Arts</option>
                <option value="Science">Science</option>
                <option value="Medicine">Medicine</option>
                <option value="Law">Law</option>
                <option value="Education">Education</option>
                <option value="Other">Other</option>
              </select>
              {errors.department && (
                <p className="text-red-500 text-sm mt-1">{errors.department}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Bio
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                rows={3}
                placeholder="Tell us about yourself..."
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {formData.bio.length}/500 characters
              </p>
              {errors.bio && (
                <p className="text-red-500 text-sm mt-1">{errors.bio}</p>
              )}
            </div>
          </div>

          {/* Profile Picture Section */}
          <div className="space-y-4 pt-6 border-t">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center">
              <Camera className="w-5 h-5 mr-2" />
              Profile Picture
            </h3>

            <div className="flex items-center justify-center">
              <ProfileImageUpload
                size="xl"
                showUploadButton={true}
                showRemoveButton={true}
                onImageUploaded={(imageUrl) => {
                  console.log('Profile image uploaded in modal:', imageUrl);
                  setFormData(prev => ({ ...prev, profilePicture: imageUrl }));
                  setImagePreview(imageUrl);
                  toast.success('Profile image uploaded successfully! 🎉');
                }}
                onImageRemoved={() => {
                  console.log('Profile image removed in modal');
                  setFormData(prev => ({ ...prev, profilePicture: '' }));
                  setImagePreview(null);
                  toast.success('Profile image removed successfully');
                }}
              />
            </div>

            {/* Test Connection Button */}
            <div className="flex justify-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleTestConnection}
                loading={isTestingConnection}
              >
                Test Cloudinary Connection
              </Button>
            </div>
          </div>


                      {/* Password Change Section */}
           <div className="space-y-4 pt-6 border-t">
             <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center">
               <Lock className="w-5 h-5 mr-2" />
               Password Management
             </h3>
             <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
               <p className="text-sm text-blue-800 dark:text-blue-400">
                 <strong>Note:</strong> Password changes are not available in profile settings for security reasons. 
                 If you need to change your password, please use the "Forgot Password" feature on the login page.
               </p>
             </div>

            
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-6 border-t">
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
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileSettingsModal; 