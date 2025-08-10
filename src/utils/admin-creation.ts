import { firebaseService } from '../services/firebase-service';

// Admin creation utility
// This should only be used by existing admins or through a secure process

export interface AdminCreationData {
  username: string;
  email: string;
  password: string;
  department?: string;
}

export const createAdminAccount = async (adminData: AdminCreationData) => {
  try {
    console.log('🔐 Creating admin account...', { email: adminData.email, username: adminData.username });
    
    // Create the user with admin role
    const response = await firebaseService.register({
      username: adminData.username,
      email: adminData.email,
      password: adminData.password,
      role: 'admin', // Force admin role
      department: adminData.department,
    });

    console.log('✅ Admin account created successfully!');
    return response;
  } catch (error) {
    console.error('❌ Admin creation failed:', error);
    throw error;
  }
};

// Helper function to check if current user is admin
export const isCurrentUserAdmin = (): boolean => {
  try {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      return user.role === 'admin';
    }
    return false;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

// Admin creation form component (for existing admins only)
export const AdminCreationForm = () => {
  // This would be a React component for existing admins to create new admin accounts
  // Implementation would be similar to RegisterPage but with admin role forced
  return null; // Placeholder
}; 