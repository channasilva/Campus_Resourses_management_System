import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, GraduationCap, Shield, UserCheck, CheckCircle, AlertCircle, Building } from 'lucide-react';
import Input from '../components/Input';
import Button from '../components/Button';
import { RegisterFormData } from '../types/auth';
import { validateEmail, validatePassword, validateUsername } from '../utils/validation';
import { firebaseService } from '../services/firebase-service';
import toast, { Toaster } from 'react-hot-toast';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<RegisterFormData>({
    username: '',
    email: '',
    role: 'student',
    department: '',
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState<Partial<RegisterFormData>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Department options for dropdown
  const departmentOptions = [
    { value: 'computer-science', label: 'Computer Science' },
    { value: 'engineering', label: 'Engineering' },
    { value: 'business', label: 'Business Administration' },
    { value: 'arts', label: 'Arts & Humanities' },
    { value: 'science', label: 'Natural Sciences' },
    { value: 'medicine', label: 'Medicine' },
    { value: 'law', label: 'Law' },
    { value: 'education', label: 'Education' },
    { value: 'social-sciences', label: 'Social Sciences' },
    { value: 'mathematics', label: 'Mathematics' },
    { value: 'physics', label: 'Physics' },
    { value: 'chemistry', label: 'Chemistry' },
    { value: 'biology', label: 'Biology' },
    { value: 'economics', label: 'Economics' },
    { value: 'psychology', label: 'Psychology' },
    { value: 'history', label: 'History' },
    { value: 'philosophy', label: 'Philosophy' },
    { value: 'languages', label: 'Languages & Literature' },
    { value: 'architecture', label: 'Architecture' },
    { value: 'design', label: 'Design & Arts' },
    { value: 'music', label: 'Music' },
    { value: 'theater', label: 'Theater & Drama' },
    { value: 'journalism', label: 'Journalism & Media' },
    { value: 'public-health', label: 'Public Health' },
    { value: 'nursing', label: 'Nursing' },
    { value: 'pharmacy', label: 'Pharmacy' },
    { value: 'dentistry', label: 'Dentistry' },
    { value: 'veterinary', label: 'Veterinary Medicine' },
    { value: 'agriculture', label: 'Agriculture' },
    { value: 'forestry', label: 'Forestry' },
    { value: 'marine-sciences', label: 'Marine Sciences' },
    { value: 'geology', label: 'Geology' },
    { value: 'astronomy', label: 'Astronomy' },
    { value: 'other', label: 'Other' }
  ];

  const handleInputChange = (field: keyof RegisterFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<RegisterFormData> = {};

    if (!validateUsername(formData.username)) {
      newErrors.username = 'Username must be at least 3 characters long';
    }

    if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!validatePassword(formData.password)) {
      newErrors.password = 'Password must be at least 6 characters long';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (formData.role === 'lecturer' && !formData.department) {
      newErrors.department = 'Department is required for lecturers';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setApiError('');
    setSuccessMessage('');

    try {
      const response = await firebaseService.register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        department: formData.department,
      });

      setSuccessMessage(`Registration successful! Welcome ${formData.username}! Your account has been created in Firebase.`);
      localStorage.setItem('user', JSON.stringify(response.user));
      localStorage.setItem('token', response.token);

      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);

    } catch (error) {
      console.error('Registration failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Registration failed. Please try again.';
      setApiError(`Registration failed: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4 transition-all duration-300">
      <Toaster position="top-right" />
      
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mb-4">
            <UserCheck className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Create Account</h2>
          <p className="text-gray-600 dark:text-gray-400">Join our campus resources management system</p>
        </div>

        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg flex items-center">
            <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
            <span className="text-green-700 dark:text-green-400">{successMessage}</span>
          </div>
        )}

        {apiError && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-red-700 dark:text-red-400">{apiError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Username"
            type="text"
            value={formData.username}
            onChange={(value) => handleInputChange('username', value)}
            error={errors.username}
            placeholder="Enter your username"
            required
          />

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
                   label="Role"
                   type="select"
                   value={formData.role}
                   onChange={(value) => handleInputChange('role', value)}
                   error={errors.role}
                   options={[
                     { value: 'student', label: 'Student' },
                     { value: 'lecturer', label: 'Lecturer' }
                   ]}
                   required
                 />

          {formData.role === 'lecturer' && (
            <Input
              label="Department"
              type="select"
              value={formData.department}
              onChange={(value) => handleInputChange('department', value)}
              error={errors.department}
              options={departmentOptions}
              required
            />
          )}

          <Input
            label="Password"
            type="password"
            value={formData.password}
            onChange={(value) => handleInputChange('password', value)}
            error={errors.password}
            placeholder="Create a strong password"
            required
          />

          <Input
            label="Confirm Password"
            type="password"
            value={formData.confirmPassword}
            onChange={(value) => handleInputChange('confirmPassword', value)}
            error={errors.confirmPassword}
            placeholder="Confirm your password"
            required
          />

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage; 