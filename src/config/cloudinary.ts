/**
 * Cloudinary Configuration
 * Update these values with your actual Cloudinary credentials
 */

export const cloudinaryConfig = {
  // Real Cloudinary credentials - configured for production use
  cloudName: 'dpb1x1r9b', // Your actual Cloudinary cloud name
  uploadPreset: 'ICBTUploads', // Your actual unsigned upload preset

  // API Key (for reference - not used in client-side uploads)
  apiKey: '249537147872617', // The API key provided by user

  // Configuration is now active - ready for real image uploads
  // The system will automatically detect this configuration and use real Cloudinary uploads
};

export default cloudinaryConfig;