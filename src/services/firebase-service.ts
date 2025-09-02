import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  UserCredential
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  collection, 
  query, 
  where, 
  orderBy, 
  limit,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
  CollectionReference,
  Query,
  DocumentData
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { auth, db, storage, googleProvider } from '../config/firebase';
import {
  User,
  Resource,
  Booking,
  BookingRequest,
  Notification,
  MaintenanceRecord,
  AuditLog,
  SystemSettings,
  ProfileUpdateData
} from '../types';

class FirebaseService {
  // User Management
  async register(userData: {
    username: string;
    email: string;
    password: string;
    role: 'admin' | 'lecturer' | 'student';
    department?: string;
  }): Promise<{ user: User; token: string }> {
    try {
      console.log('🚀 Starting registration process...', { email: userData.email, username: userData.username });
      
      // Check if user already exists in Firestore
      const existingUser = await this.getUserByEmail(userData.email);
      if (existingUser) {
        throw new Error('An account with this email already exists. Please sign in instead.');
      }
      
      const userCredential: UserCredential = await createUserWithEmailAndPassword(
        auth,
        userData.email,
        userData.password
      );

      const user = userCredential.user;
      console.log('✅ Firebase Auth user created:', user.uid);
      
      const userProfile: User = {
        id: user.uid,
        username: userData.username,
        email: userData.email,
        role: userData.role,
        department: userData.department,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      console.log('📝 Storing user profile in Firestore...', userProfile);
      await setDoc(doc(db, 'users', user.uid), userProfile);
      console.log('✅ User profile stored successfully in Firestore!');
      
      const token = await user.getIdToken();
      console.log('🎉 Registration completed successfully!');

      return { user: userProfile, token };
    } catch (error: any) {
      console.error('❌ Registration error:', error);
      
      // Handle specific Firebase Auth errors
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('An account with this email already exists. Please sign in instead.');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Please enter a valid email address.');
      } else if (error.code === 'auth/weak-password') {
        throw new Error('Password should be at least 6 characters long.');
      } else if (error.code === 'auth/network-request-failed') {
        throw new Error('Network error. Please check your internet connection and try again.');
      } else {
        throw new Error(error.message || 'Registration failed. Please try again.');
      }
    }
  }

  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    try {
      console.log('🚀 Starting email/password login...', { email });
      
      const userCredential: UserCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      const firebaseUser = userCredential.user;
      console.log('✅ Firebase Auth login successful:', firebaseUser.uid);
      
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      
      if (!userDoc.exists()) {
        console.error('❌ User document not found in Firestore for:', firebaseUser.uid);
        throw new Error('User profile not found. Please contact support.');
      }

      const userData = userDoc.data() as User;
      console.log('✅ User profile found:', userData.username);
      
      const token = await firebaseUser.getIdToken();

      // Update last login
      await updateDoc(doc(db, 'users', firebaseUser.uid), {
        lastLogin: new Date().toISOString()
      });

      console.log('🎉 Login completed successfully!');
      return { user: userData, token };
    } catch (error: any) {
      console.error('❌ Login error:', error);
      
      // Handle specific Firebase Auth errors
      if (error.code === 'auth/user-not-found') {
        throw new Error('No account found with this email. Please check your email or register first.');
      } else if (error.code === 'auth/wrong-password') {
        throw new Error('Incorrect password. Please try again.');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Please enter a valid email address.');
      } else if (error.code === 'auth/user-disabled') {
        throw new Error('This account has been disabled. Please contact support.');
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('Too many failed login attempts. Please try again later.');
      } else if (error.code === 'auth/network-request-failed') {
        throw new Error('Network error. Please check your internet connection and try again.');
      } else {
        throw new Error(error.message || 'Login failed. Please check your credentials and try again.');
      }
    }
  }

  async signInWithGoogle(): Promise<{ user: User; token: string }> {
    try {
      console.log('🚀 Starting Google Sign-In process...');
      console.log('🌐 Current URL:', window.location.href);
      console.log('🌐 Current origin:', window.location.origin);
      console.log('🌐 Current hostname:', window.location.hostname);
      
      // Enhanced Google provider configuration with explicit client ID
      googleProvider.setCustomParameters({
        prompt: 'select_account',
        access_type: 'online',
        include_granted_scopes: 'true'
      });
      
      console.log('🔧 Google provider configured with parameters');
      console.log(' Provider scopes:', googleProvider.getScopes());
      console.log('🔧 Provider custom params:', googleProvider.getCustomParameters());
      
      // Try to get the current user first to check auth state
      const currentUser = auth.currentUser;
      console.log('👤 Current user:', currentUser ? currentUser.email : 'None');
      
      // Sign in with Google popup
      console.log('🔐 Attempting Google Sign-In popup...');
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;
      
      console.log('✅ Google Sign-In successful:', firebaseUser.email);
      console.log('🔍 Firebase User UID:', firebaseUser.uid);
      console.log('🔍 Firebase User Provider Data:', firebaseUser.providerData);
      
      // Check if user exists in our Firestore database
      console.log('🔍 Checking if user exists in Firestore...');
      let existingUser = await this.getUserByEmail(firebaseUser.email!);
      
      if (!existingUser) {
        // Create new user in Firestore for Google Sign-In
        console.log('📝 Creating new user profile for Google user...');
        
        // Extract name from Google profile
        const displayName = firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User';
        
        // Create user profile with proper handling of undefined values
        const userProfile: any = {
          id: firebaseUser.uid,
          username: displayName,
          email: firebaseUser.email!,
          role: 'student', // Default role for Google sign-in users
          department: 'General', // Default value instead of undefined
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        };

        // Only add profilePicture if it exists
        if (firebaseUser.photoURL) {
          userProfile.profilePicture = firebaseUser.photoURL;
        }

        await setDoc(doc(db, 'users', firebaseUser.uid), userProfile);
        console.log('✅ New user profile created in Firestore!');
        
        existingUser = userProfile;
      } else {
        console.log('✅ Existing user found in system:', existingUser.username);
        
        // Update the existing user's profile with Google data if needed
        const updateData: any = {
          lastLogin: new Date().toISOString()
        };
        
        // Update profile picture if available
        if (firebaseUser.photoURL && !existingUser.profilePicture) {
          updateData.profilePicture = firebaseUser.photoURL;
        }
        
        // Update user document in Firestore
        await updateDoc(doc(db, 'users', existingUser.id), updateData);
        
        // Get updated user data
        const updatedUserDoc = await getDoc(doc(db, 'users', existingUser.id));
        existingUser = updatedUserDoc.data() as User;
      }
      
      const token = await firebaseUser.getIdToken();
      
      console.log('🎉 Google Sign-In completed successfully!');
      return { user: existingUser, token };
      
    } catch (error: any) {
      console.error('❌ Google Sign-In error:', error);
      console.error('❌ Error code:', error.code);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error stack:', error.stack);
      
      // Enhanced error handling for permission issues
      if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Sign-in popup was closed. Please try again.');
      } else if (error.code === 'auth/cancelled-popup-request') {
        throw new Error('Another sign-in popup is already open. Please close it and try again.');
      } else if (error.code === 'auth/popup-blocked') {
        throw new Error('Sign-in popup was blocked by your browser. Please allow popups and try again.');
      } else if (error.code === 'auth/unauthorized-domain') {
        throw new Error('This domain is not authorized for Google Sign-In. Please contact the administrator.');
      } else if (error.code === 'auth/operation-not-allowed') {
        throw new Error('Google Sign-In is not enabled. Please contact the administrator.');
      } else if (error.code === 'auth/network-request-failed') {
        throw new Error('Network error. Please check your internet connection and try again.');
      } else if (error.code === 'auth/internal-error') {
        throw new Error('Internal authentication error. Please try again or contact support.');
      } else if (error.code === 'auth/invalid-api-key') {
        throw new Error('Invalid Firebase API key. Please contact the administrator.');
      } else if (error.code === 'auth/app-not-authorized') {
        throw new Error('This app is not authorized to use Firebase Authentication. Please contact the administrator.');
      } else if (error.code === 'auth/unauthorized-domain') {
        throw new Error('This domain is not authorized for Google Sign-In. Please contact the administrator.');
      } else {
        // Provide more detailed error for debugging
        const errorMsg = error.code ?
          `Google Sign-In failed (${error.code}): ${error.message}` :
          'Google Sign-In failed. Please try again.';
        throw new Error(errorMsg);
      }
    }
  }

  async logout(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error: any) {
      console.error('Logout error:', error);
      throw new Error(error.message);
    }
  }

  // Efficient method to get user by email
  async getUserByEmail(email: string): Promise<User | null> {
    try {
      console.log('🔍 Searching for user with email:', email);
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email), limit(1));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        console.log('❌ No user found with email:', email);
        return null;
      }
      
      const userDoc = querySnapshot.docs[0];
      const userData = { id: userDoc.id, ...userDoc.data() } as User;
      console.log('✅ User found with email:', email, '- Username:', userData.username);
      return userData;
    } catch (error: any) {
      console.error('❌ Error fetching user by email:', error);
      return null;
    }
  }

  async getUserById(userId: string): Promise<User | null> {
    try {
      console.log('🔍 Fetching user by ID:', userId);
      const userDoc = await getDoc(doc(db, 'users', userId));

      if (!userDoc.exists()) {
        console.log('❌ User not found:', userId);
        return null;
      }

      const userData = { id: userDoc.id, ...userDoc.data() } as User;
      console.log('✅ User found:', userData.username);
      return userData;
    } catch (error: any) {
      console.error('❌ Error fetching user by ID:', error);
      throw new Error(error.message);
    }
  }

  // Helper method to check if user exists in Firestore
  async checkUserExists(userId: string): Promise<boolean> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      return userDoc.exists();
    } catch (error: any) {
      console.error('Error checking user existence:', error);
      return false;
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      console.log('🔄 Fetching all users...');
      const usersRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersRef);
      const users = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as User));
      console.log(`✅ Successfully fetched ${users.length} users`);
      return users;
    } catch (error) {
      console.error('❌ Error fetching users:', error);
      throw new Error('Failed to fetch users');
    }
  }

  // Add other methods from the original service here...
  // (Resource management, booking management, etc.)
}

export const firebaseService = new FirebaseService(); 