import { useState, useEffect } from 'react';
import { profileImageManager } from '../utils/profileImageManager';

interface UseProfileBackgroundReturn {
  backgroundImage: string | null;
  setBackgroundImage: (url: string | null) => void;
  loadUserBackground: (userId: string) => Promise<void>;
  clearBackground: () => void;
}

export const useProfileBackground = (): UseProfileBackgroundReturn => {
  const [backgroundImage, setBackgroundImageState] = useState<string | null>(null);

  // Load background from localStorage on mount
  useEffect(() => {
    const savedBackground = localStorage.getItem('profileBackground');
    if (savedBackground) {
      setBackgroundImageState(savedBackground);
    }
  }, []);

  const setBackgroundImage = (url: string | null) => {
    setBackgroundImageState(url);
    if (url) {
      localStorage.setItem('profileBackground', url);
    } else {
      localStorage.removeItem('profileBackground');
    }
  };

  const loadUserBackground = async (userId: string) => {
    try {
      console.log('🖼️ Loading user background for:', userId);
      const profileImageUrl = await profileImageManager.getProfileImage(userId);
      
      if (profileImageUrl) {
        console.log('✅ Profile image found, setting as background:', profileImageUrl);
        setBackgroundImage(profileImageUrl);
      } else {
        console.log('ℹ️ No profile image found for user');
        setBackgroundImage(null);
      }
    } catch (error) {
      console.error('❌ Failed to load user background:', error);
      setBackgroundImage(null);
    }
  };

  const clearBackground = () => {
    console.log('🧹 Clearing profile background');
    setBackgroundImage(null);
  };

  return {
    backgroundImage,
    setBackgroundImage,
    loadUserBackground,
    clearBackground
  };
};