import React, { useState, useRef } from 'react';
import { X, User, Mail, Building, FileText, Lock, Eye, EyeOff, Camera, Upload, Trash2, Settings } from 'lucide-react';
import { firebaseService } from '../services/firebase-service';
import { cloudinaryService } from '../services/cloudinary-service';
import Button from './Button';
import Input from './Input';
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
  const [cloudinaryStatus, setCloudinaryStatus] = useState(cloudinaryService.getConfigurationStatus());
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
    try {
      console.log('Starting image upload for user:', currentUser.id);
      console.log('Cloudinary status:', cloudinaryStatus);

      const result = await cloudinaryService.uploadImage(selectedImage, currentUser.id);
      const imageUrl = result.secure_url;

      console.log('Upload successful, image URL:', imageUrl);

      // Update form data with new image URL
      setFormData(prev => ({ ...prev, profilePicture: imageUrl }));

      // Clear selected image
      setSelectedImage(null);

      // Update preview
      setImagePreview(imageUrl);

      toast.success(cloudinaryStatus.isConfigured ?
        'Profile picture uploaded successfully!' :
        'Demo mode: Profile picture updated (using placeholder image)'
      );
    } catch (error: any) {
      console.error('Image upload failed:', error);

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

            <div className="flex items-center space-x-6">
              {/* Profile Picture Preview */}
              <div className="relative">
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-gray-200 dark:border-gray-600">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Profile preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <User className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Remove button */}
                {imagePreview && (
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                    title="Remove image"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Upload Controls */}
              <div className="flex-1 space-y-3">
                <div className="flex items-center space-x-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingImage}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Choose Image
                  </Button>

                  {selectedImage && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleImageUpload}
                      loading={isUploadingImage}
                    >
                      Upload
                    </Button>
                  )}
                </div>

                <div className="text-sm text-gray-500 dark:text-gray-400">
                  <p>Supported formats: JPEG, PNG, GIF, WebP</p>
                  <p>Maximum file size: 5MB</p>
                  <p>Recommended: Square images for best results</p>
                </div>

                {selectedImage && (
                  <div className="text-sm text-blue-600 dark:text-blue-400">
                    Selected: {selectedImage.name} ({(selectedImage.size / 1024 / 1024).toFixed(2)} MB)
                  </div>
                )}

                {/* Configuration Status */}
                <div className="mt-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      <span className="font-medium">Cloudinary Status: </span>
                      <span className={cloudinaryStatus.isConfigured ? 'text-green-600' : 'text-yellow-600'}>
                        {cloudinaryStatus.isConfigured ? 'Configured' : 'Demo Mode'}
                      </span>
                    </div>
                    {!cloudinaryStatus.isConfigured && (
                      <div className="text-xs text-gray-500">
                        Using placeholder images
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Cloudinary Configuration Section (Admin Only) */}
          {currentUser?.role?.toLowerCase() === 'admin' && (
            <div className="space-y-4 pt-6 border-t">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                Cloudinary Configuration
              </h3>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
                <p className="text-sm text-yellow-800 dark:text-yellow-400 mb-3">
                  <strong>Configure Cloudinary for Image Uploads:</strong>
                </p>

                <div className="space-y-3">
                  <div className="text-xs text-yellow-700 dark:text-yellow-300">
                    <p><strong>Cloud Name:</strong> Your Cloudinary cloud name (found in your Cloudinary dashboard)</p>
                    <p><strong>Upload Preset:</strong> Create an unsigned upload preset in your Cloudinary settings</p>
                  </div>

                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="Enter cloud name"
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      onChange={(e) => {
                        const cloudName = e.target.value.trim();
                        if (cloudName) {
                          cloudinaryService.configure(cloudName, cloudinaryStatus.uploadPreset);
                          setCloudinaryStatus(cloudinaryService.getConfigurationStatus());
                        }
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Enter upload preset"
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      onChange={(e) => {
                        const uploadPreset = e.target.value.trim();
                        if (uploadPreset) {
                          cloudinaryService.configure(cloudinaryStatus.cloudName, uploadPreset);
                          setCloudinaryStatus(cloudinaryService.getConfigurationStatus());
                        }
                      }}
                    />
                  </div>

                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Current: Cloud Name: <strong>{cloudinaryStatus.cloudName}</strong> |
                    Upload Preset: <strong>{cloudinaryStatus.uploadPreset}</strong>
                  </p>
                </div>
              </div>
            </div>
          )}

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