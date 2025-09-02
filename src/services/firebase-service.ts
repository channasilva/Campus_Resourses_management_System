import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
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
import { auth, db, storage } from '../config/firebase';
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
      console.log('?? Starting email/password login...', { email });
      
      const userCredential: UserCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      const firebaseUser = userCredential.user;
      console.log('? Firebase Auth login successful:', firebaseUser.uid);
      
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      
      if (!userDoc.exists()) {
        console.error('? User document not found in Firestore for:', firebaseUser.uid);
        throw new Error('User profile not found. Please contact support.');
      }

      const userData = userDoc.data() as User;
      console.log('? User profile found:', userData.username);
      
      const token = await firebaseUser.getIdToken();

      // Update last login
      await updateDoc(doc(db, 'users', firebaseUser.uid), {
        lastLogin: new Date().toISOString()
      });

      console.log('?? Login completed successfully!');
      return { user: userData, token };
    } catch (error: any) {
      console.error('? Login error:', error);
      
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

  // Add other methods from the original service here...
  // (Resource management, booking management, etc.)
}

export const firebaseService = new FirebaseService();
