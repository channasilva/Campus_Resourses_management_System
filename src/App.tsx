import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import Dashboard from './pages/Dashboard'
import ProfileImageDemo from './components/ProfileImageDemo'
import { ThemeProvider } from './contexts/ThemeContext'
import { Toaster } from 'react-hot-toast'
import { profileImageUploader } from './utils/profileImageUploader'

function App() {
  // Initialize profile image system on app start
  useEffect(() => {
    console.log('🚀 Initializing profile image system...');
    profileImageUploader.initialize();
    
    // Global error boundary for third-party script errors
    const handleGlobalError = (event: ErrorEvent) => {
      if (event.filename && (event.filename.includes('ma_payload.js') || 
          event.filename.includes('facebook') || 
          event.filename.includes('fb') ||
          event.error?.message?.includes('getAttribute') ||
          event.error?.message?.includes('Cannot read properties of null'))) {
        console.warn('🚫 Global: Third-party script error blocked:', {
          filename: event.filename,
          error: event.error?.message,
          line: event.lineno,
          column: event.colno
        });
        event.preventDefault();
        event.stopPropagation();
        return false;
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (event.reason?.message?.includes('getAttribute') || 
          event.reason?.message?.includes('Cannot read properties of null') ||
          event.reason?.message?.includes('querySelector')) {
        console.warn('🚫 Global: Third-party script promise rejection blocked:', event.reason);
        event.preventDefault();
        return false;
      }
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    // Cleanup on unmount
    return () => {
      profileImageUploader.cleanup();
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return (
    <ThemeProvider>
      <div className="min-h-screen transition-all duration-300">
        <Toaster
          position="top-right"
          toastOptions={{
            className: 'dark:bg-gray-800 dark:text-gray-100',
            duration: 4000,
          }}
        />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/demo" element={<ProfileImageDemo />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </ThemeProvider>
  )
}

export default App