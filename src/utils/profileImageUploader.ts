/**
 * Comprehensive Profile Image Upload System
 * Handles Cloudinary uploads, Firebase persistence, real-time listeners, and DOM updates
 */

import { auth, db } from '../config/firebase';
import { doc, updateDoc, onSnapshot, getDoc } from 'firebase/firestore';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { cloudinaryConfig } from '../config/cloudinary';

interface CloudinaryUploadResponse {
  public_id: string;
  secure_url: string;
  url: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
}

interface ProfileImageData {
  photoURL: string;
  publicId: string;
  uploadedAt: string;
}

class ProfileImageUploader {
  private unsubscribeAuth: (() => void) | null = null;
  private unsubscribeProfile: (() => void) | null = null;
  private currentUserId: string | null = null;

  constructor() {
    this.initializeAuthListener();
  }

  /**
   * Initialize authentication state listener
   */
  private initializeAuthListener(): void {
    console.log('🔐 Initializing auth state listener...');
    
    this.unsubscribeAuth = onAuthStateChanged(auth, (user: FirebaseUser | null) => {
      if (user && user.uid !== this.currentUserId) {
        console.log('👤 Auth state changed, user:', user.uid);
        this.currentUserId = user.uid;
        this.loadAndWatchProfileImage(user.uid);
      } else if (!user) {
        console.log('👤 User signed out');
        this.currentUserId = null;
        this.cleanup();
        this.clearProfileIcon();
      }
    });
  }

  /**
   * Load profile image and set up real-time listener
   */
  private async loadAndWatchProfileImage(userId: string): Promise<void> {
    try {
      console.log('🔍 Loading profile image for user:', userId);
      
      // Clean up previous listener
      if (this.unsubscribeProfile) {
        this.unsubscribeProfile();
      }

      // Set up real-time listener for user document
      const userDocRef = doc(db, 'users', userId);
      
      this.unsubscribeProfile = onSnapshot(userDocRef, (docSnapshot) => {
        if (docSnapshot.exists()) {
          const userData = docSnapshot.data();
          const photoURL = userData.photoURL || userData.profilePicture;
          
          console.log('📸 Profile image updated from Firebase:', photoURL ? 'found' : 'not found');
          
          if (photoURL) {
            this.updateProfileIcon(photoURL);
          } else {
            this.clearProfileIcon();
          }
        } else {
          console.log('❌ User document not found');
          this.clearProfileIcon();
        }
      }, (error) => {
        console.error('❌ Error listening to profile changes:', error);
      });

      // Also load initial data
      const docSnapshot = await getDoc(userDocRef);
      if (docSnapshot.exists()) {
        const userData = docSnapshot.data();
        const photoURL = userData.photoURL || userData.profilePicture;
        if (photoURL) {
          this.updateProfileIcon(photoURL);
        }
      }

    } catch (error) {
      console.error('❌ Error loading profile image:', error);
    }
  }

  /**
   * Validate image file
   */
  private validateFile(file: File): { isValid: boolean; error?: string } {
    console.log('🔍 Validating file:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: 'Please select a valid image file (JPEG, PNG, or WebP)'
      };
    }

    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return {
        isValid: false,
        error: 'Image file size must be less than 5MB'
      };
    }

    return { isValid: true };
  }

  /**
   * Upload image to Cloudinary with unsigned preset
   */
  private async uploadToCloudinary(file: File, userId: string): Promise<CloudinaryUploadResponse> {
    console.log('☁️ Starting Cloudinary upload...');
    
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      
      // Add file
      formData.append('file', file);
      
      // Add unsigned upload preset
      formData.append('upload_preset', cloudinaryConfig.uploadPreset);
      
      // Organize uploads in user_profiles folder
      const publicId = `user_profiles/${userId}/profile_${Date.now()}`;
      formData.append('public_id', publicId);
      
      // Add folder for organization
      formData.append('folder', `user_profiles/${userId}`);

      const xhr = new XMLHttpRequest();
      const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`;

      xhr.open('POST', uploadUrl, true);

      xhr.onload = () => {
        console.log('☁️ Cloudinary response status:', xhr.status);
        
        if (xhr.status === 200) {
          try {
            const response: CloudinaryUploadResponse = JSON.parse(xhr.responseText);
            console.log('✅ Cloudinary upload successful:', response.public_id);
            resolve(response);
          } catch (error) {
            console.error('❌ Failed to parse Cloudinary response:', error);
            reject(new Error('Invalid response from Cloudinary'));
          }
        } else {
          try {
            const errorResponse = JSON.parse(xhr.responseText);
            console.error('❌ Cloudinary upload error:', errorResponse);
            reject(new Error(errorResponse.error?.message || `Upload failed: ${xhr.status}`));
          } catch (error) {
            console.error('❌ Cloudinary upload failed with status:', xhr.status);
            reject(new Error(`Upload failed with status ${xhr.status}. Please check your Cloudinary configuration.`));
          }
        }
      };

      xhr.onerror = () => {
        console.error('❌ Network error during Cloudinary upload');
        reject(new Error('Network error during upload. Please check your internet connection.'));
      };

      xhr.ontimeout = () => {
        console.error('❌ Cloudinary upload timeout');
        reject(new Error('Upload timeout. Please try again.'));
      };

      xhr.timeout = 30000; // 30 second timeout

      console.log('🚀 Sending upload to Cloudinary:', uploadUrl);
      xhr.send(formData);
    });
  }

  /**
   * Apply 300x300 crop transformation to Cloudinary URL
   */
  private applyTransformation(baseUrl: string): string {
    const transformation = 'w_300,h_300,c_fill,f_auto,q_auto';
    const urlParts = baseUrl.split('/upload/');
    
    if (urlParts.length === 2) {
      const transformedUrl = `${urlParts[0]}/upload/${transformation}/${urlParts[1]}`;
      console.log('🎨 Applied transformation:', transformedUrl);
      return transformedUrl;
    }
    
    console.log('⚠️ Could not apply transformation, returning original URL');
    return baseUrl;
  }

  /**
   * Save profile image URL to Firebase
   */
  private async saveToFirebase(userId: string, imageData: ProfileImageData): Promise<void> {
    try {
      console.log('💾 Saving to Firebase user profile...');
      
      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, {
        photoURL: imageData.photoURL,
        profilePicture: imageData.photoURL, // Keep both for compatibility
        profilePicturePublicId: imageData.publicId,
        profileImageUploadedAt: imageData.uploadedAt,
        updatedAt: new Date().toISOString()
      });
      
      console.log('✅ Profile image saved to Firebase');
    } catch (error) {
      console.error('❌ Error saving to Firebase:', error);
      throw new Error('Failed to save profile image to database');
    }
  }

  /**
   * Update profile icon in DOM
   */
  private updateProfileIcon(imageUrl: string): void {
    console.log('🖼️ Updating profile icon in DOM:', imageUrl);
    
    const profileIcon = document.getElementById('profileIcon') as HTMLImageElement;
    if (profileIcon) {
      profileIcon.src = imageUrl;
      profileIcon.style.display = 'block';
      console.log('✅ Profile icon updated successfully');
    } else {
      console.log('⚠️ Profile icon element not found, searching for alternatives...');
      
      // Try to find profile images by class or other selectors
      const profileImages = document.querySelectorAll('img[alt*="profile"], .profile-image, .profile-avatar');
      profileImages.forEach((img: Element) => {
        if (img instanceof HTMLImageElement) {
          img.src = imageUrl;
          console.log('✅ Updated profile image element');
        }
      });
    }
  }

  /**
   * Clear profile icon (show default)
   */
  private clearProfileIcon(): void {
    console.log('🗑️ Clearing profile icon');
    
    const profileIcon = document.getElementById('profileIcon') as HTMLImageElement;
    if (profileIcon) {
      profileIcon.src = '';
      profileIcon.style.display = 'none';
    }
    
    // Clear other profile images
    const profileImages = document.querySelectorAll('img[alt*="profile"], .profile-image, .profile-avatar');
    profileImages.forEach((img: Element) => {
      if (img instanceof HTMLImageElement) {
        img.src = '';
      }
    });
  }

  /**
   * Main upload function - handles the complete flow
   */
  async uploadProfileImage(file: File): Promise<string> {
    try {
      console.log('🚀 Starting profile image upload process...');
      
      // Check if user is authenticated
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }
      
      const userId = auth.currentUser.uid;
      console.log('👤 Uploading for user:', userId);

      // Step 1: Validate file
      const validation = this.validateFile(file);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }
      console.log('✅ File validation passed');

      // Step 2: Upload to Cloudinary
      const cloudinaryResponse = await this.uploadToCloudinary(file, userId);
      console.log('✅ Cloudinary upload completed');

      // Step 3: Apply transformation
      const transformedUrl = this.applyTransformation(cloudinaryResponse.secure_url);

      // Step 4: Update DOM immediately
      this.updateProfileIcon(transformedUrl);
      console.log('✅ DOM updated immediately');

      // Step 5: Save to Firebase (this will trigger real-time listener)
      const imageData: ProfileImageData = {
        photoURL: transformedUrl,
        publicId: cloudinaryResponse.public_id,
        uploadedAt: new Date().toISOString()
      };
      
      await this.saveToFirebase(userId, imageData);
      console.log('✅ Saved to Firebase');

      console.log('🎉 Profile image upload completed successfully!');
      return transformedUrl;

    } catch (error) {
      console.error('❌ Profile image upload failed:', error);
      throw error;
    }
  }

  /**
   * Get current profile image URL
   */
  async getCurrentProfileImage(): Promise<string | null> {
    try {
      if (!auth.currentUser) {
        return null;
      }

      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      const docSnapshot = await getDoc(userDocRef);
      
      if (docSnapshot.exists()) {
        const userData = docSnapshot.data();
        return userData.photoURL || userData.profilePicture || null;
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error getting current profile image:', error);
      return null;
    }
  }

  /**
   * Initialize profile image system on app start
   */
  async initialize(): Promise<void> {
    console.log('🔄 Initializing profile image system...');
    
    // The auth listener will handle loading profile images
    // when user signs in
    
    console.log('✅ Profile image system initialized');
  }

  /**
   * Cleanup listeners
   */
  cleanup(): void {
    console.log('🧹 Cleaning up profile image listeners...');
    
    if (this.unsubscribeAuth) {
      this.unsubscribeAuth();
      this.unsubscribeAuth = null;
    }
    
    if (this.unsubscribeProfile) {
      this.unsubscribeProfile();
      this.unsubscribeProfile = null;
    }
  }

  /**
   * Remove profile image
   */
  async removeProfileImage(): Promise<void> {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      const userId = auth.currentUser.uid;
      console.log('🗑️ Removing profile image for user:', userId);

      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, {
        photoURL: null,
        profilePicture: null,
        profilePicturePublicId: null,
        profileImageUploadedAt: null,
        updatedAt: new Date().toISOString()
      });

      this.clearProfileIcon();
      console.log('✅ Profile image removed successfully');
    } catch (error) {
      console.error('❌ Error removing profile image:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const profileImageUploader = new ProfileImageUploader();
export default profileImageUploader;