import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  UserCredential,
  GoogleAuthProvider
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
import { auth, db, storage } from '../config/firebase';

// Initialize Google Auth Provider
const googleProvider = new GoogleAuthProvider();
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
      console.log('?? Starting registration process...', { email: userData.email, username: userData.username });
      
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
      console.log('? Firebase Auth user created:', user.uid);
      
      const userProfile: User = {
        id: user.uid,
        username: userData.username,
        email: userData.email,
        role: userData.role,
        department: userData.department,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      console.log('?? Storing user profile in Firestore...', userProfile);
      await setDoc(doc(db, 'users', user.uid), userProfile);
      console.log('? User profile stored successfully in Firestore!');
      
      const token = await user.getIdToken();
      console.log('?? Registration completed successfully!');

      return { user: userProfile, token };
    } catch (error: any) {
      console.error('? Registration error:', error);
      
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
        
        // Try to create a basic user profile for old users
        console.log('🔧 Attempting to create missing user profile...');
        const basicUserProfile: User = {
          id: firebaseUser.uid,
          username: firebaseUser.displayName || firebaseUser.email!.split('@')[0],
          email: firebaseUser.email!,
          role: 'student', // Default role for old users
          department: 'General',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        };
        
        try {
          await setDoc(doc(db, 'users', firebaseUser.uid), basicUserProfile);
          console.log('✅ Created missing user profile for old user');
          
          const token = await firebaseUser.getIdToken();
          return { user: basicUserProfile, token };
        } catch (createError) {
          console.error('❌ Failed to create user profile:', createError);
          throw new Error('User profile not found and could not be created. Please contact support or try registering again.');
        }
      }

      const userData = userDoc.data() as User;
      console.log('✅ User profile found:', userData.username);
      
      // Validate and fix missing required fields for old users
      const updatedUserData = this.validateAndFixUserData(userData, firebaseUser);
      
      // Update user data if any fields were missing
      if (JSON.stringify(userData) !== JSON.stringify(updatedUserData)) {
        console.log('🔧 Updating user data with missing fields...');
        await updateDoc(doc(db, 'users', firebaseUser.uid), updatedUserData);
        console.log('✅ User data updated successfully');
      }
      
      const token = await firebaseUser.getIdToken();

      // Update last login
      await updateDoc(doc(db, 'users', firebaseUser.uid), {
        lastLogin: new Date().toISOString()
      });

      console.log('🎉 Login completed successfully!');
      return { user: updatedUserData, token };
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
      } else if (error.code === 'auth/invalid-credential') {
        throw new Error('Invalid email or password. Please check your credentials and try again.');
      } else {
        throw new Error(error.message || 'Login failed. Please check your credentials and try again.');
      }
    }
  }

  // Helper method to validate and fix user data for old users
  private validateAndFixUserData(userData: any, firebaseUser: any): User {
    const fixedUserData: User = {
      id: userData.id || firebaseUser.uid,
      username: userData.username || firebaseUser.displayName || firebaseUser.email!.split('@')[0],
      email: userData.email || firebaseUser.email!,
      role: userData.role || 'student', // Default role for old users
      department: userData.department || 'General',
      profilePicture: userData.profilePicture || undefined,
      profilePicturePublicId: userData.profilePicturePublicId || undefined,
      contactInfo: userData.contactInfo || undefined,
      createdAt: userData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLogin: userData.lastLogin || new Date().toISOString()
    };
    
    return fixedUserData;
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
      console.log('?? Searching for user with email:', email);
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email), limit(1));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        console.log('? No user found with email:', email);
        return null;
      }
      
      const userDoc = querySnapshot.docs[0];
      const userData = { id: userDoc.id, ...userDoc.data() } as User;
      console.log('? User found with email:', email, '- Username:', userData.username);
      return userData;
    } catch (error: any) {
      console.error('? Error fetching user by email:', error);
      return null;
    }
  }

  async getUserById(userId: string): Promise<User | null> {
    try {
      console.log('?? Fetching user by ID:', userId);
      const userDoc = await getDoc(doc(db, 'users', userId));

      if (!userDoc.exists()) {
        console.log('? User not found:', userId);
        return null;
      }

      const userData = { id: userDoc.id, ...userDoc.data() } as User;
      console.log('? User found:', userData.username);
      return userData;
    } catch (error: any) {
      console.error('? Error fetching user by ID:', error);
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
      console.log('?? Fetching all users...');
      const usersRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersRef);
      const users = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as User));
      console.log(`? Successfully fetched ${users.length} users`);
      return users;
    } catch (error) {
      console.error('? Error fetching users:', error);
      throw new Error('Failed to fetch users');
    }
  }

  async signInWithGoogle(): Promise<{ user: User; token: string }> {
    try {
      console.log('🚀 Starting Google Sign-In process...');
      console.log('🌐 Current URL:', window.location.href);
      console.log('🌐 Current origin:', window.location.origin);
      
      // Configure Google provider with additional settings for better compatibility
      googleProvider.setCustomParameters({
        prompt: 'select_account',
        access_type: 'online'
      });
      
      console.log('🔧 Google provider configured with parameters');
      
      // Sign in with Google popup
      console.log('🔐 Attempting Google Sign-In popup...');
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;
      
      console.log('✅ Google Sign-In successful:', firebaseUser.email);
      console.log('🔍 Firebase User UID:', firebaseUser.uid);
      
      // Check if user exists in our Firestore database
      console.log('🔍 Checking if user exists in Firestore...');
      let existingUser = await this.getUserByEmail(firebaseUser.email!);
      
      if (!existingUser) {
        // Create new user in Firestore for Google Sign-In
        console.log('👤 Creating new user profile for Google Sign-In...');
        const newUser: User = {
          id: firebaseUser.uid,
          username: firebaseUser.displayName || firebaseUser.email!.split('@')[0],
          email: firebaseUser.email!,
          role: 'student', // Default role for Google sign-ins
          department: 'General',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        };
        
        await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
        console.log('✅ New user profile created successfully!');
        existingUser = newUser;
      } else {
        // Update last login for existing user
        console.log('✅ User found in system:', existingUser.username);
        await updateDoc(doc(db, 'users', firebaseUser.uid), {
          lastLogin: new Date().toISOString()
        });
      }
      
      const token = await firebaseUser.getIdToken();
      console.log('🎉 Google Sign-In completed successfully!');
      
      return { user: existingUser, token };
    } catch (error: any) {
      console.error('❌ Google Sign-In error:', error);
      
      // Handle specific Google Sign-In errors
      if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Google Sign-In was cancelled. Please try again.');
      } else if (error.code === 'auth/popup-blocked') {
        throw new Error('Popup was blocked by your browser. Please allow popups and try again.');
      } else if (error.code === 'auth/network-request-failed') {
        throw new Error('Network error. Please check your internet connection and try again.');
      } else if (error.code === 'auth/unauthorized-domain') {
        throw new Error('This domain is not authorized for Google Sign-In. Please contact support.');
      } else {
        throw new Error(error.message || 'Google Sign-In failed. Please try again.');
      }
    }
  }

  // Add other methods from the original service here...
  // (Resource management, booking management, etc.)
}

export const firebaseService = new FirebaseService();
