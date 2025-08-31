/**
 * Cloudinary Service for Image Uploads
 * Handles profile picture uploads to Cloudinary
 */

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
  private cloudName = 'campus-resources'; // Configure with your Cloudinary cloud name
  private uploadPreset = 'profile_uploads'; // Configure with your upload preset

  /**
   * Upload an image file to Cloudinary
   * @param file - The image file to upload
   * @param userId - The user ID for organizing uploads
   * @returns Promise with the upload response
   */
  async uploadImage(file: File, userId: string): Promise<CloudinaryUploadResponse> {
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
        if (xhr.status === 200) {
          try {
            const response: CloudinaryUploadResponse = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (error) {
            reject(new Error('Invalid response from Cloudinary'));
          }
        } else {
          try {
            const errorResponse = JSON.parse(xhr.responseText);
            reject(new Error(errorResponse.error?.message || 'Upload failed'));
          } catch (error) {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        }
      };

      xhr.onerror = () => {
        reject(new Error('Network error during upload'));
      };

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