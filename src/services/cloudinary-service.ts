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
    console.log('Cloudinary service initialized with config:', this.getConfigurationStatus());
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
    console.log('Upload attempt - Configuration status:', this.getConfigurationStatus());

    // Check if service is properly configured
    if (!this.isConfigured) {
      console.error('Cloudinary service not configured properly');
      throw new Error('Cloudinary service is not properly configured. Please contact your administrator to set up the credentials.');
    }

    return new Promise((resolve, reject) => {
      console.log('Creating FormData for upload...');
      const formData = new FormData();

      // Add the file
      formData.append('file', file);
      console.log('File added to FormData:', file.name, file.size, file.type);

      // Add upload preset
      formData.append('upload_preset', this.uploadPreset);
      console.log('Upload preset added:', this.uploadPreset);

      // Add public ID with user ID for organization
      const publicId = `profile_${userId}_${Date.now()}`;
      formData.append('public_id', publicId);
      console.log('Public ID added:', publicId);

      // Note: Transformations will be applied to the URL after upload
      // This avoids the "Invalid transformation component" error
      console.log('Upload will use URL-based transformations after successful upload');

      const xhr = new XMLHttpRequest();
      const uploadUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`;
      console.log('XHR request URL:', uploadUrl);

      xhr.open('POST', uploadUrl, true);
      console.log('XHR request opened');

      xhr.onload = () => {
        console.log('XHR onload triggered, status:', xhr.status);
        console.log('Cloudinary upload response status:', xhr.status);
        console.log('Cloudinary upload response:', xhr.responseText);

        if (xhr.status === 200) {
          try {
            const response: CloudinaryUploadResponse = JSON.parse(xhr.responseText);
            console.log('Upload successful:', response);

            // Apply transformation to the URL
            const transformedUrl = this.applyTransformationToUrl(response.secure_url);
            console.log('Transformed URL:', transformedUrl);

            // Return response with transformed URL
            const transformedResponse = {
              ...response,
              secure_url: transformedUrl,
              original_secure_url: response.secure_url // Keep original for reference
            };

            resolve(transformedResponse);
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

      console.log('Starting Cloudinary upload to:', uploadUrl);
      console.log('Sending FormData...');
      xhr.send(formData);
      console.log('FormData sent, waiting for response...');
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
   * Apply transformation to Cloudinary URL
   * @param baseUrl - The base Cloudinary URL
   * @param transformation - The transformation string (e.g., "w_300,h_300,c_fill")
   * @returns Transformed image URL
   */
  private applyTransformationToUrl(baseUrl: string, transformation: string = 'w_300,h_300,c_fill,f_auto,q_auto'): string {
    // Insert transformation parameters into the URL after "/upload/"
    const urlParts = baseUrl.split('/upload/');
    if (urlParts.length === 2) {
      return `${urlParts[0]}/upload/${transformation}/${urlParts[1]}`;
    }
    return baseUrl;
  }

  /**
   * Generate optimized image URLs for different sizes
   * @param baseUrl - The base Cloudinary URL
   * @param size - The desired size (thumbnail, small, medium, large)
   * @returns Optimized image URL
   */
  getOptimizedImageUrl(baseUrl: string, size: 'thumbnail' | 'small' | 'medium' | 'large' | 'profile' = 'medium'): string {
    const transformations = {
      thumbnail: 'w_50,h_50,c_fill,g_face,f_auto,q_auto',
      small: 'w_100,h_100,c_fill,g_face,f_auto,q_auto',
      medium: 'w_200,h_200,c_fill,g_face,f_auto,q_auto',
      large: 'w_400,h_400,c_fill,g_face,f_auto,q_auto',
      profile: 'w_300,h_300,c_fill,f_auto,q_auto'
    };

    // Insert transformation parameters into the URL
    const urlParts = baseUrl.split('/upload/');
    if (urlParts.length === 2) {
      return `${urlParts[0]}/upload/${transformations[size]}/${urlParts[1]}`;
    }

    return baseUrl;
  }

  /**
   * Test Cloudinary connection and configuration
   * @returns Promise with test results
   */
  async testConnection(): Promise<{ success: boolean; message: string; details?: any }> {
    console.log('🧪 Testing Cloudinary connection...');
    console.log('Configuration:', this.getConfigurationStatus());

    if (!this.isConfigured) {
      return {
        success: false,
        message: 'Cloudinary service is not properly configured',
        details: this.getConfigurationStatus()
      };
    }

    return new Promise((resolve) => {
      const formData = new FormData();

      // Create a small test image (1x1 pixel transparent PNG)
      const testImageBlob = new Blob([
        new Uint8Array([
          0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
          0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
          0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00,
          0x0B, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
          0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49,
          0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
        ])
      ], { type: 'image/png' });

      formData.append('file', testImageBlob);
      formData.append('upload_preset', this.uploadPreset);
      formData.append('public_id', `test_${Date.now()}`);

      // Note: Transformations will be applied to the URL after upload
      console.log('Test upload will use URL-based transformations after successful upload');

      const xhr = new XMLHttpRequest();
      const uploadUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`;

      xhr.open('POST', uploadUrl, true);

      xhr.onload = () => {
        console.log('Test upload response status:', xhr.status);
        console.log('Test upload response:', xhr.responseText);

        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            console.log('✅ Test upload successful:', response);

            // Apply transformation to the test URL
            const transformedUrl = this.applyTransformationToUrl(response.secure_url);
            console.log('Test transformed URL:', transformedUrl);

            resolve({
              success: true,
              message: 'Cloudinary connection successful!',
              details: {
                url: transformedUrl,
                original_url: response.secure_url,
                public_id: response.public_id,
                status: xhr.status
              }
            });
          } catch (error) {
            console.error('❌ Failed to parse test response:', error);
            resolve({
              success: false,
              message: 'Invalid response from Cloudinary',
              details: { status: xhr.status, response: xhr.responseText }
            });
          }
        } else {
          try {
            const errorResponse = JSON.parse(xhr.responseText);
            console.error('❌ Test upload failed:', errorResponse);
            resolve({
              success: false,
              message: `Upload failed: ${errorResponse.error?.message || 'Unknown error'}`,
              details: {
                status: xhr.status,
                error: errorResponse.error,
                uploadUrl,
                uploadPreset: this.uploadPreset,
                cloudName: this.cloudName
              }
            });
          } catch (error) {
            console.error('❌ Test upload failed with status:', xhr.status);
            resolve({
              success: false,
              message: `Upload failed with status ${xhr.status}`,
              details: {
                status: xhr.status,
                response: xhr.responseText,
                uploadUrl,
                uploadPreset: this.uploadPreset,
                cloudName: this.cloudName
              }
            });
          }
        }
      };

      xhr.onerror = () => {
        console.error('❌ Network error during test upload');
        resolve({
          success: false,
          message: 'Network error - check your internet connection',
          details: { uploadUrl, uploadPreset: this.uploadPreset, cloudName: this.cloudName }
        });
      };

      xhr.timeout = 10000; // 10 second timeout for test

      xhr.ontimeout = () => {
        console.error('❌ Test upload timeout');
        resolve({
          success: false,
          message: 'Upload timeout - check your Cloudinary configuration',
          details: { uploadUrl, uploadPreset: this.uploadPreset, cloudName: this.cloudName }
        });
      };

      console.log('🚀 Sending test upload to:', uploadUrl);
      xhr.send(formData);
    });
  }
}

export const cloudinaryService = new CloudinaryService();
export default cloudinaryService;