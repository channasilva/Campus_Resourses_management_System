/**
 * Profile Image Upload Component
 * React component for handling profile image uploads with real-time updates
 */

import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, User, X, AlertCircle, CheckCircle } from 'lucide-react';
import { profileImageUploader } from '../utils/profileImageUploader';
import { auth } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import toast from 'react-hot-toast';

interface ProfileImageUploadProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showUploadButton?: boolean;
  showRemoveButton?: boolean;
  onImageUploaded?: (imageUrl: string) => void;
  onImageRemoved?: () => void;
}

const ProfileImageUpload: React.FC<ProfileImageUploadProps> = ({
  className = '',
  size = 'md',
  showUploadButton = true,
  showRemoveButton = true,
  onImageUploaded,
  onImageRemoved
}) => {
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Size configurations
  const sizeConfig = {
    sm: { container: 'w-12 h-12', icon: 'w-4 h-4', button: 'text-xs px-2 py-1' },
    md: { container: 'w-16 h-16', icon: 'w-5 h-5', button: 'text-sm px-3 py-1.5' },
    lg: { container: 'w-24 h-24', icon: 'w-6 h-6', button: 'text-sm px-4 py-2' },
    xl: { container: 'w-32 h-32', icon: 'w-8 h-8', button: 'text-base px-4 py-2' }
  };

  const config = sizeConfig[size];

  // Initialize and listen for auth changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        // Load current profile image
        try {
          const imageUrl = await profileImageUploader.getCurrentProfileImage();
          setCurrentImageUrl(imageUrl);
        } catch (error) {
          console.error('Error loading profile image:', error);
        }
      } else {
        setCurrentUser(null);
        setCurrentImageUrl(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // Handle file selection
  const handleFileSelect = async (file: File) => {
    if (!currentUser) {
      toast.error('Please sign in to upload a profile image');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev + Math.random() * 15;
          return newProgress >= 90 ? 90 : newProgress;
        });
      }, 200);

      const imageUrl = await profileImageUploader.uploadProfileImage(file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Update local state
      setCurrentImageUrl(imageUrl);
      
      // Call callback
      if (onImageUploaded) {
        onImageUploaded(imageUrl);
      }

      toast.success('Profile image uploaded successfully! 🎉');
      
      // Reset progress after a delay
      setTimeout(() => {
        setUploadProgress(0);
      }, 1500);

    } catch (error: any) {
      console.error('Upload failed:', error);
      toast.error(error.message || 'Failed to upload profile image');
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  // Handle file input change
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    // Reset input value to allow re-uploading the same file
    event.target.value = '';
  };

  // Handle drag and drop
  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  // Handle remove image
  const handleRemoveImage = async () => {
    if (!currentUser) return;

    try {
      await profileImageUploader.removeProfileImage();
      setCurrentImageUrl(null);
      
      if (onImageRemoved) {
        onImageRemoved();
      }
      
      toast.success('Profile image removed successfully');
    } catch (error: any) {
      console.error('Remove failed:', error);
      toast.error(error.message || 'Failed to remove profile image');
    }
  };

  // Handle click to upload
  const handleClick = () => {
    if (!isUploading) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Main Image Container */}
      <div
        className={`
          ${config.container} 
          relative rounded-full overflow-hidden border-2 border-gray-200 dark:border-gray-600 
          cursor-pointer transition-all duration-300 group
          ${dragOver ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''}
          ${isUploading ? 'opacity-75' : 'hover:border-blue-500'}
        `}
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        title="Click to upload or drag and drop an image"
      >
        {/* Profile Image or Placeholder */}
        {currentImageUrl ? (
          <img
            id="profileIcon"
            src={currentImageUrl}
            alt="Profile"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            onError={(e) => {
              console.error('Profile image failed to load');
              setCurrentImageUrl(null);
            }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
            <User className={`${config.icon} text-gray-400 dark:text-gray-500`} />
          </div>
        )}

        {/* Upload Overlay */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <Camera className={`${config.icon} text-white`} />
        </div>

        {/* Upload Progress */}
        {isUploading && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mb-2"></div>
              <div className="text-white text-xs font-medium">
                {uploadProgress > 0 ? `${Math.round(uploadProgress)}%` : 'Uploading...'}
              </div>
            </div>
          </div>
        )}

        {/* Remove Button */}
        {currentImageUrl && showRemoveButton && !isUploading && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleRemoveImage();
            }}
            className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors duration-200 shadow-lg"
            title="Remove profile image"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Upload Button */}
      {showUploadButton && (
        <button
          onClick={handleClick}
          disabled={isUploading}
          className={`
            mt-2 ${config.button} bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 
            text-white rounded-lg font-medium transition-colors duration-200 
            flex items-center justify-center gap-2 w-full
          `}
        >
          <Upload className="w-4 h-4" />
          {isUploading ? 'Uploading...' : 'Upload Image'}
        </button>
      )}

      {/* File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleInputChange}
        className="hidden"
      />

      {/* Drag and Drop Indicator */}
      {dragOver && (
        <div className="absolute inset-0 border-2 border-dashed border-blue-500 rounded-full bg-blue-50/50 dark:bg-blue-900/20 flex items-center justify-center">
          <div className="text-blue-600 dark:text-blue-400 text-center">
            <Upload className={`${config.icon} mx-auto mb-1`} />
            <div className="text-xs font-medium">Drop image here</div>
          </div>
        </div>
      )}

      {/* Upload Status */}
      {isUploading && uploadProgress > 0 && (
        <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${uploadProgress}%` }}
          ></div>
        </div>
      )}

      {/* Help Text */}
      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
        <div>JPEG, PNG, WebP • Max 5MB</div>
        <div>300×300 recommended</div>
      </div>
    </div>
  );
};

export default ProfileImageUpload;