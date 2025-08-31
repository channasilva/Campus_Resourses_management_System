// DEPRECATED: This hook was causing profile images to appear as page backgrounds
// Profile images should only appear in profile components, not as page backgrounds
// This hook is kept for backward compatibility but does nothing

interface UseProfileBackgroundReturn {
  backgroundImage: string | null;
  setBackgroundImage: (url: string | null) => void;
  loadUserBackground: (userId: string) => Promise<void>;
  clearBackground: () => void;
}

export const useProfileBackground = (): UseProfileBackgroundReturn => {
  console.warn('⚠️ useProfileBackground hook is deprecated and should not be used. Profile images should not be used as page backgrounds.');

  // Return no-op functions to prevent breaking existing code
  return {
    backgroundImage: null,
    setBackgroundImage: () => {
      console.warn('⚠️ setBackgroundImage is deprecated - profile images should not be used as backgrounds');
    },
    loadUserBackground: async () => {
      console.warn('⚠️ loadUserBackground is deprecated - profile images should not be used as backgrounds');
    },
    clearBackground: () => {
      console.warn('⚠️ clearBackground is deprecated - profile images should not be used as backgrounds');
    }
  };
};