/**
 * Cloudinary + Firebase Profile Image Manager
 * Handles profile image upload to Cloudinary, Firebase persistence, and URL management
 */

import { cloudinaryService } from '../services/cloudinary-service';
import firebaseService from '../services/firebase-service';

interface ProfileImageData {
  cloudinaryUrl: string;
  publicId: string;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
  userId: string;
}

class ProfileImageManager {
  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private readonly ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

  /**
   * Validate image file before processing
   */
  validateImageFile(file: File): { isValid: boolean; error?: string } {
    // Check file type
    if (!this.ALLOWED_TYPES.includes(file.type)) {
      return {
        isValid: false,
        error: 'Please select a valid image file (JPEG, PNG, GIF, or WebP)'
      };
    }

    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: 'Image file size must be less than 5MB'
      };
    }

    return { isValid: true };
  }


  /**
   * Save Google profile photo URL to Firebase (without uploading to Cloudinary)
   */
  async saveGoogleProfileImage(googlePhotoUrl: string, userId: string): Promise<string> {
    try {
      console.log('🚀 Saving Google profile image for user:', userId);
      console.log('📸 Google photo URL:', googlePhotoUrl);

      // Save Google photo URL directly to Firebase user profile
      await firebaseService.updateUserProfile(userId, {
        profilePicture: googlePhotoUrl,
        profilePicturePublicId: null // Google photos don't have Cloudinary public IDs
      });
      
      console.log('✅ Google profile image saved successfully');
      return googlePhotoUrl;
    } catch (error) {
      console.error('❌ Failed to save Google profile image:', error);
      throw error;
    }
  }

  /**
   * Upload profile image to Cloudinary and save URL to Firebase
   */
  async saveProfileImage(file: File, userId: string): Promise<string> {
    try {
      console.log('🚀 Starting profile image upload process for user:', userId);

      // Validate file
      const validation = this.validateImageFile(file);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      console.log('✅ File validation passed');

      // Upload to Cloudinary
      console.log('📤 Uploading to Cloudinary...');
      const cloudinaryResponse = await cloudinaryService.uploadImage(file, userId);
      console.log('✅ Cloudinary upload successful:', cloudinaryResponse.public_id);
      console.log('🔗 Cloudinary secure_url:', cloudinaryResponse.secure_url);

      // Apply 300x300 crop: fill transformation using public method
      const transformedUrl = cloudinaryService.getOptimizedImageUrl(cloudinaryResponse.secure_url, 'profile');
      console.log('🎨 Applied 300x300 crop: fill transformation:', transformedUrl);

      // Save URL to Firebase user profile
      console.log('💾 Saving to Firebase user profile...');
      await firebaseService.updateUserProfile(userId, {
        profilePicture: transformedUrl,
        profilePicturePublicId: cloudinaryResponse.public_id
      });
      console.log('✅ Firebase profile updated successfully');

      console.log('🎉 Profile image upload completed successfully:', {
        userId,
        cloudinaryUrl: transformedUrl,
        publicId: cloudinaryResponse.public_id,
        originalUrl: cloudinaryResponse.secure_url
      });

      return transformedUrl;
    } catch (error) {
      console.error('❌ Failed to save profile image:', error);
      throw error;
    }
  }

  /**
   * Get profile image URL from Firebase user profile
   */
  async getProfileImage(userId: string): Promise<string | null> {
    try {
      console.log('🔍 Fetching profile image for user:', userId);

      // Get user document from Firebase
      const userDoc = await firebaseService.getUserById(userId);

      if (!userDoc || !userDoc.profilePicture) {
        console.log('No profile image found for user:', userId);
        return null;
      }

      console.log('✅ Profile image found:', userDoc.profilePicture);
      return userDoc.profilePicture;
    } catch (error) {
      console.error('❌ Failed to retrieve profile image:', error);
      return null;
    }
  }

  /**
   * Remove profile image from Firebase user profile
   */
  async removeProfileImage(userId: string): Promise<void> {
    try {
      console.log('🗑️ Removing profile image for user:', userId);

      // Update Firebase user profile to remove profile picture
      await firebaseService.updateUserProfile(userId, {
        profilePicture: null,
        profilePicturePublicId: null
      });

      console.log('✅ Profile image removed successfully');
    } catch (error) {
      console.error('❌ Failed to remove profile image:', error);
      throw error;
    }
  }

  /**
   * Update profile image from Google Sign-In if user doesn't have one
   */
  async updateFromGoogleIfNeeded(userId: string, googlePhotoUrl: string | null): Promise<string | null> {
    try {
      if (!googlePhotoUrl) {
        console.log('ℹ️ No Google photo URL provided');
        return null;
      }

      console.log('🔍 Checking if user needs Google profile image update');
      
      // Get current user profile
      const userDoc = await firebaseService.getUserById(userId);
      
      if (!userDoc) {
        console.log('❌ User not found');
        return null;
      }

      // If user doesn't have a profile picture, use Google's
      if (!userDoc.profilePicture) {
        console.log('📸 User has no profile picture, using Google photo');
        return await this.saveGoogleProfileImage(googlePhotoUrl, userId);
      }

      // If user has a Google profile picture but it's different, update it
      if (userDoc.profilePicture.includes('googleusercontent.com') && userDoc.profilePicture !== googlePhotoUrl) {
        console.log('🔄 Updating existing Google profile picture');
        return await this.saveGoogleProfileImage(googlePhotoUrl, userId);
      }

      console.log('✅ User already has a profile picture, keeping existing one');
      return userDoc.profilePicture;
    } catch (error) {
      console.error('❌ Failed to update from Google profile:', error);
      return null;
    }
  }

  /**
   * Check if profile image exists
   */
  async hasProfileImage(userId: string): Promise<boolean> {
    try {
      const imageUrl = await this.getProfileImage(userId);
      return imageUrl !== null;
    } catch (error) {
      console.error('❌ Error checking profile image existence:', error);
      return false;
    }
  }

  /**
   * Check if current profile image is from Google
   */
  async isGoogleProfileImage(userId: string): Promise<boolean> {
    try {
      const imageUrl = await this.getProfileImage(userId);
      return imageUrl ? imageUrl.includes('googleusercontent.com') : false;
    } catch (error) {
      console.error('❌ Error checking if profile image is from Google:', error);
      return false;
    }
  }

  /**
   * Resize image to specified dimensions (optional enhancement)
   */
  async resizeImage(file: File, maxWidth: number = 300, maxHeight: number = 300): Promise<string> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;

        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        // Set canvas size
        canvas.width = width;
        canvas.height = height;

        // Draw resized image
        ctx?.drawImage(img, 0, 0, width, height);

        // Convert to base64
        const resizedBase64 = canvas.toDataURL(file.type, 0.9);
        resolve(resizedBase64);
      };

      img.onerror = () => {
        reject(new Error('Failed to resize image'));
      };

      img.src = URL.createObjectURL(file);
    });
  }
}

// Export singleton instance
export const profileImageManager = new ProfileImageManager();
export default profileImageManager;