/**
 * Cloudinary Configuration
 * Update these values with your actual Cloudinary credentials
 */

export const cloudinaryConfig = {
  // Replace these with your actual Cloudinary credentials
  cloudName: 'demo', // Your Cloudinary cloud name
  uploadPreset: 'unsigned_preset', // Your unsigned upload preset

  // API Key (for reference - not used in client-side uploads)
  apiKey: '249537147872617', // The API key provided by user

  // Instructions for setup:
  // 1. Go to https://cloudinary.com/console
  // 2. Sign in to your account
  // 3. Copy your Cloud Name from the dashboard
  // 4. Go to Settings > Upload
  // 5. Create an unsigned upload preset
  // 6. Update the values above
  // 7. The system will automatically detect the configuration
};

export default cloudinaryConfig;