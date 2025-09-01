import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, GraduationCap } from 'lucide-react';
import Input from '../components/Input';
import Button from '../components/Button';
import { LoginFormData } from '../types/auth';
import { validateEmail } from '../utils/validation';
import toast, { Toaster } from 'react-hot-toast';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Partial<LoginFormData>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [showProfileBackground, setShowProfileBackground] = useState(false);

  // Check if user has a profile image for background
  useEffect(() => {
    const checkUserProfileImage = async () => {
      try {
        const userData = localStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
          console.log('🔍 Checking user profile picture:', user.profilePicture);
          if (user.profilePicture) {
            setBackgroundImage(user.profilePicture);
            setShowProfileBackground(true);
            console.log('✅ Profile background set:', user.profilePicture);
          }
        } else {
          console.log('ℹ️ No user data found in localStorage');
        }
      } catch (error) {
        console.log('❌ Error loading user data:', error);
      }
    };
    
    checkUserProfileImage();
  }, []);


  const handleInputChange = (field: keyof LoginFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<LoginFormData> = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    
    try {
      // Import firebaseService dynamically to avoid circular imports
      const { firebaseService } = await import('../services/firebase-service');
      
      const { user, token } = await firebaseService.login(formData.email, formData.password);
      
      // Store user data in localStorage
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);
      
      
      console.log('✅ Login successful:', user);
      toast.success(`Welcome back, ${user.username}!`);
      navigate('/dashboard');
    } catch (error: any) {
      console.error('❌ Login failed:', error);
      toast.error('Invalid email or password. Please try again.');
      setErrors({ 
        email: 'Invalid email or password. Please try again.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    
    try {
      // Import firebaseService dynamically to avoid circular imports
      const { firebaseService } = await import('../services/firebase-service');
      
      const { user, token } = await firebaseService.signInWithGoogle();
      
      // Store user data in localStorage
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);
      
      
      console.log('✅ Google Sign-In successful:', user);
      toast.success(`Welcome back, ${user.username}!`);
      navigate('/dashboard');
    } catch (error: any) {
      console.error('❌ Google Sign-In failed:', error);
      toast.error(error.message || 'Google Sign-In failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center py-6 sm:py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden transition-all duration-1000 ${
        showProfileBackground
          ? 'bg-gray-900'
          : 'bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900'
      }`}
      style={{
        backgroundImage: showProfileBackground && backgroundImage
          ? `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.7)), url(${backgroundImage})`
          : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Enhanced overlay patterns */}
      {showProfileBackground && backgroundImage ? (
        <>
          <div className="absolute inset-0 bg-gradient-to-br from-primary-900/30 via-transparent to-secondary-900/30 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
          {/* Profile picture indicator */}
          <div className="absolute top-4 right-4 z-20">
            <div className="flex items-center gap-2 bg-black/30 backdrop-blur-sm rounded-full px-3 py-2 text-white text-xs">
              <div className="w-6 h-6 rounded-full overflow-hidden border border-white/30">
                <img
                  src={backgroundImage}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
              <span>Welcome back!</span>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Default decorative pattern */}
          <div className="absolute inset-0 opacity-10 dark:opacity-5">
            <div className="absolute top-10 left-10 w-32 h-32 bg-primary-500 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-10 right-10 w-40 h-40 bg-secondary-500 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
            <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-accent-purple-500 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }}></div>
          </div>
        </>
      )}
      
      <Toaster position="top-center" />
      <div className="max-w-md w-full space-y-6 sm:space-y-8 relative z-10">
        {/* Header - Mobile optimized */}
        <div className="text-center">
          <div className={`mx-auto h-12 w-12 sm:h-14 sm:w-14 rounded-xl flex items-center justify-center transition-all duration-500 ${
            showProfileBackground
              ? 'bg-white/20 backdrop-blur-sm border border-white/30'
              : 'bg-primary-600'
          }`}>
            <GraduationCap className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
          </div>
          <h2 className={`mt-4 sm:mt-6 text-2xl sm:text-3xl font-bold leading-tight transition-all duration-500 ${
            showProfileBackground
              ? 'text-white drop-shadow-lg'
              : 'text-gray-900 dark:text-gray-100'
          }`}>
            Welcome back
          </h2>
          <p className={`mt-2 text-sm sm:text-base transition-all duration-500 ${
            showProfileBackground
              ? 'text-gray-200 drop-shadow-md'
              : 'text-gray-600 dark:text-gray-400'
          }`}>
            Sign in to your Campus Resources account
          </p>
        </div>

        {/* Login Form - Mobile optimized */}
        <div className={`rounded-lg sm:rounded-xl shadow-xl p-6 sm:p-8 animate-fade-in transition-all duration-500 ${
          showProfileBackground
            ? 'bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border border-white/20 dark:border-gray-700/50'
            : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
        }`}>
          <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
            <Input
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={(value) => handleInputChange('email', value)}
              error={errors.email}
              placeholder="Enter your email"
              required
            />

            <Input
              label="Password"
              type="password"
              value={formData.password}
              onChange={(value) => handleInputChange('password', value)}
              error={errors.password}
              placeholder="Enter your password"
              required
            />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded touch-manipulation"
                  style={{ minHeight: '20px', minWidth: '20px' }}
                />
                <label htmlFor="remember-me" className="ml-3 block text-sm text-gray-900 dark:text-gray-100">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-medium text-primary-600 hover:text-primary-500 py-2 px-1 -mx-1 rounded touch-manipulation">
                  Forgot your password?
                </a>
              </div>
            </div>

            <Button
              type="submit"
              loading={isLoading}
              className="w-full"
            >
              Sign in
            </Button>
          </form>

          {/* Divider */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">Or continue with</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                variant="secondary"
                className="w-full mobile-button"
                onClick={handleGoogleSignIn}
                loading={isLoading}
                disabled={isLoading}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="ml-2">Google</span>
              </Button>

              <Button variant="secondary" className="w-full mobile-button">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806.026-1.566.247-2.229.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                </svg>
                <span className="ml-2">Twitter</span>
              </Button>
            </div>
          </div>

          {/* Sign up link - Mobile optimized */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="font-medium text-primary-600 hover:text-primary-500 py-2 px-1 -mx-1 rounded touch-manipulation"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage; 