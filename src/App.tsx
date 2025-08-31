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
    
    // Cleanup on unmount
    return () => {
      profileImageUploader.cleanup();
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