/**
 * Cloudinary Service for Image Uploads
 * Handles profile picture uploads to Cloudinary
 */

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

class CloudinaryService {
  // Cloudinary configuration from config file
  private cloudName = cloudinaryConfig.cloudName;
  private uploadPreset = cloudinaryConfig.uploadPreset;

  // Flag to check if service is properly configured
  private isConfigured = false;

  constructor() {
    this.checkConfiguration();
  }

  /**
   * Configure the Cloudinary service with your credentials
   * @param cloudName - Your Cloudinary cloud name
   * @param uploadPreset - Your upload preset name
   */
  configure(cloudName: string, uploadPreset: string) {
    this.cloudName = cloudName;
    this.uploadPreset = uploadPreset;
    this.checkConfiguration();
  }

  /**
   * Check if the service is properly configured
   */
  private checkConfiguration() {
    this.isConfigured = !!(this.cloudName && this.uploadPreset &&
                          this.cloudName !== 'demo' && this.uploadPreset !== 'unsigned_preset');
  }

  /**
   * Get configuration status
   */
  getConfigurationStatus() {
    return {
      isConfigured: this.isConfigured,
      cloudName: this.cloudName,
      uploadPreset: this.uploadPreset
    };
  }

  /**
   * Upload an image file to Cloudinary
   * @param file - The image file to upload
   * @param userId - The user ID for organizing uploads
   * @returns Promise with the upload response
   */
  async uploadImage(file: File, userId: string): Promise<CloudinaryUploadResponse> {
    // Check if service is properly configured
    if (!this.isConfigured) {
      console.warn('Cloudinary service not properly configured. Using demo mode.');

      // Return a mock response for demo purposes
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            public_id: `demo_profile_${userId}_${Date.now()}`,
            secure_url: `https://via.placeholder.com/300x300/4F46E5/FFFFFF?text=${userId}`,
            url: `https://via.placeholder.com/300x300/4F46E5/FFFFFF?text=${userId}`,
            format: 'jpg',
            width: 300,
            height: 300,
            bytes: 1024
          });
        }, 2000); // Simulate upload delay
      });
    }

    return new Promise((resolve, reject) => {
      const formData = new FormData();

      // Add the file
      formData.append('file', file);

      // Add upload preset
      formData.append('upload_preset', this.uploadPreset);

      // Add public ID with user ID for organization
      formData.append('public_id', `profile_${userId}_${Date.now()}`);

      // Add transformation for profile pictures (square crop, 300x300)
      formData.append('transformation', JSON.stringify([
        { width: 300, height: 300, crop: 'fill', gravity: 'face' },
        { quality: 'auto' }
      ]));

      const xhr = new XMLHttpRequest();

      xhr.open('POST', `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`, true);

      xhr.onload = () => {
        console.log('Cloudinary upload response status:', xhr.status);
        console.log('Cloudinary upload response:', xhr.responseText);

        if (xhr.status === 200) {
          try {
            const response: CloudinaryUploadResponse = JSON.parse(xhr.responseText);
            console.log('Upload successful:', response);
            resolve(response);
          } catch (error) {
            console.error('Failed to parse Cloudinary response:', error);
            reject(new Error('Invalid response from Cloudinary'));
          }
        } else {
          try {
            const errorResponse = JSON.parse(xhr.responseText);
            console.error('Cloudinary upload error:', errorResponse);
            reject(new Error(errorResponse.error?.message || `Upload failed: ${xhr.status}`));
          } catch (error) {
            console.error('Cloudinary upload failed with status:', xhr.status);
            reject(new Error(`Upload failed with status ${xhr.status}. Please check your Cloudinary configuration.`));
          }
        }
      };

      xhr.onerror = () => {
        console.error('Network error during Cloudinary upload');
        reject(new Error('Network error during upload. Please check your internet connection.'));
      };

      xhr.ontimeout = () => {
        console.error('Cloudinary upload timeout');
        reject(new Error('Upload timeout. Please try again.'));
      };

      xhr.timeout = 30000; // 30 second timeout

      console.log('Starting Cloudinary upload to:', `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`);
      xhr.send(formData);
    });
  }

  /**
   * Delete an image from Cloudinary
   * @param publicId - The public ID of the image to delete
   * @returns Promise with the delete response
   */
  async deleteImage(publicId: string): Promise<any> {
    // Note: Deleting images requires server-side implementation with API key
    // For now, we'll just return a success response
    // In production, this should be handled by your backend
    console.log('Delete image request for:', publicId);
    return Promise.resolve({ result: 'ok' });
  }

  /**
   * Validate image file before upload
   * @param file - The file to validate
   * @returns Object with validation result and error message if any
   */
  validateImageFile(file: File): { isValid: boolean; error?: string } {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: 'Please select a valid image file (JPEG, PNG, GIF, or WebP)'
      };
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      return {
        isValid: false,
        error: 'Image file size must be less than 5MB'
      };
    }

    return { isValid: true };
  }

  /**
   * Generate optimized image URLs for different sizes
   * @param baseUrl - The base Cloudinary URL
   * @param size - The desired size (thumbnail, small, medium, large)
   * @returns Optimized image URL
   */
  getOptimizedImageUrl(baseUrl: string, size: 'thumbnail' | 'small' | 'medium' | 'large' = 'medium'): string {
    const transformations = {
      thumbnail: 'w_50,h_50,c_fill,g_face,f_auto,q_auto',
      small: 'w_100,h_100,c_fill,g_face,f_auto,q_auto',
      medium: 'w_200,h_200,c_fill,g_face,f_auto,q_auto',
      large: 'w_400,h_400,c_fill,g_face,f_auto,q_auto'
    };

    // Insert transformation parameters into the URL
    const urlParts = baseUrl.split('/upload/');
    if (urlParts.length === 2) {
      return `${urlParts[0]}/upload/${transformations[size]}/${urlParts[1]}`;
    }

    return baseUrl;
  }
}

export const cloudinaryService = new CloudinaryService();
export default cloudinaryService;