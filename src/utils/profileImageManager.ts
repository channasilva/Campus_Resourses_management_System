/**
 * Client-side Profile Image Manager
 * Handles profile image upload, localStorage persistence, and base64 encoding
 */

interface ProfileImageData {
  base64: string;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
  userId: string;
}

class ProfileImageManager {
  private readonly STORAGE_KEY = 'campus_profile_image';
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
   * Convert file to base64 string
   */
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      reader.readAsDataURL(file);
    });
  }

  /**
   * Save profile image to localStorage
   */
  async saveProfileImage(file: File, userId: string): Promise<string> {
    try {
      // Validate file
      const validation = this.validateImageFile(file);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      // Convert to base64
      const base64 = await this.fileToBase64(file);

      // Create image data object
      const imageData: ProfileImageData = {
        base64,
        fileName: file.name,
        fileSize: file.size,
        uploadedAt: new Date().toISOString(),
        userId
      };

      // Save to localStorage
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(imageData));

      console.log('Profile image saved successfully:', {
        fileName: file.name,
        fileSize: file.size,
        userId
      });

      return base64;
    } catch (error) {
      console.error('Failed to save profile image:', error);
      throw error;
    }
  }

  /**
   * Get profile image from localStorage
   */
  getProfileImage(userId?: string | number): string | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        console.log('No profile image found in localStorage');
        return null;
      }

      const imageData: ProfileImageData = JSON.parse(stored);
      console.log('Retrieved profile image data:', {
        storedUserId: imageData.userId,
        storedUserIdType: typeof imageData.userId,
        requestedUserId: userId,
        requestedUserIdType: typeof userId
      });

      // If userId is provided, check if it matches (handle both string and number)
      if (userId !== undefined) {
        const storedUserId = String(imageData.userId);
        const requestedUserId = String(userId);

        if (storedUserId !== requestedUserId) {
          console.log('UserId mismatch - stored:', storedUserId, 'requested:', requestedUserId);
          return null;
        }
      }

      console.log('Profile image found and matches userId');
      return imageData.base64;
    } catch (error) {
      console.error('Failed to retrieve profile image:', error);
      return null;
    }
  }

  /**
   * Remove profile image from localStorage
   */
  removeProfileImage(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      console.log('Profile image removed successfully');
    } catch (error) {
      console.error('Failed to remove profile image:', error);
    }
  }

  /**
   * Get profile image metadata
   */
  getProfileImageMetadata(): ProfileImageData | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to get profile image metadata:', error);
      return null;
    }
  }

  /**
   * Check if profile image exists
   */
  hasProfileImage(userId?: string | number): boolean {
    return this.getProfileImage(userId) !== null;
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