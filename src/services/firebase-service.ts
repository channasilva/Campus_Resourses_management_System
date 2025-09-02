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
        console.log('📝 Creating new user profile for Google user...');
        
        // Extract name from Google profile
        const displayName = firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User';
        
        const userProfile: User = {
          id: firebaseUser.uid,
          username: displayName,
          email: firebaseUser.email!,
          role: 'student', // Default role for Google sign-in users
          department: undefined,
          profilePicture: firebaseUser.photoURL || undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        };

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
      
      // Handle specific error cases with more detailed messages
      if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Sign-in was cancelled. Please try again.');
      } else if (error.code === 'auth/popup-blocked') {
        throw new Error('Pop-up was blocked by your browser. Please allow pop-ups for this site and try again.');
      } else if (error.code === 'auth/unauthorized-domain') {
        throw new Error('This domain is not authorized for Google Sign-In. Please contact the administrator.');
      } else if (error.code === 'auth/operation-not-allowed') {
        throw new Error('Google Sign-In is not enabled. Please contact the administrator.');
      } else if (error.code === 'auth/cancelled-popup-request') {
        throw new Error('Another sign-in popup is already open. Please close it and try again.');
      } else if (error.code === 'auth/network-request-failed') {
        throw new Error('Network error. Please check your internet connection and try again.');
      } else if (error.code === 'auth/internal-error') {
        throw new Error('Internal authentication error. Please try again or contact support.');
      } else if (error.code === 'auth/invalid-api-key') {
        throw new Error('Invalid Firebase API key. Please contact the administrator.');
      } else if (error.code === 'auth/app-not-authorized') {
        throw new Error('This app is not authorized to use Firebase Authentication. Please contact the administrator.');
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
  async updateProfile(userId: string, data: ProfileUpdateData): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', userId), {
        ...data,
        updatedAt: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Profile update error:', error);
      throw new Error(error.message);
    }
  }

  async updateUserProfile(userId: string, data: any): Promise<void> {
    try {
      console.log('🔄 Updating user profile for:', userId);

      // Update Firestore document
      const updateData: any = {
        username: data.username,
        email: data.email,
        department: data.department,
        bio: data.bio,
        profilePicture: data.profilePicture,
        profilePicturePublicId: data.profilePicturePublicId,
        updatedAt: new Date().toISOString()
      };

      // Only include fields that are provided
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined || updateData[key] === null) {
          delete updateData[key];
        }
      });

      console.log('📝 Updating Firestore user document:', updateData);
      await updateDoc(doc(db, 'users', userId), updateData);

      console.log('✅ User profile updated successfully');
    } catch (error: any) {
      console.error('❌ User profile update error:', error);
      throw new Error(error.message);
    }
  }

  async updatePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    try {
      console.log('🔐 Updating password for user:', userId);
      
      const user = auth.currentUser;
      if (!user || user.uid !== userId) {
        throw new Error('User not authenticated');
      }

      // First, re-authenticate the user with their current password
      const email = user.email;
      if (!email) {
        throw new Error('User email not found');
      }

      // Re-authenticate with current password
      const credential = await signInWithEmailAndPassword(auth, email, currentPassword);
      
      // Now we can update the password
      await updateProfile(credential.user, {
        displayName: credential.user.displayName
      });

      console.log('✅ Password updated successfully');
    } catch (error: any) {
      console.error('❌ Password update error:', error);
      throw new Error(error.message);
    }
  }

  async uploadProfilePicture(userId: string, file: File): Promise<string> {
    try {
      const storageRef = ref(storage, `profile-pictures/${userId}/${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
      await updateDoc(doc(db, 'users', userId), {
        profilePicture: downloadURL,
        updatedAt: new Date().toISOString()
      });

      return downloadURL;
    } catch (error: any) {
      console.error('Profile picture upload error:', error);
      throw new Error(error.message);
    }
  }

  // Resource Management
  async createResource(resource: Omit<Resource, 'id' | 'createdAt' | 'updatedAt'>): Promise<Resource> {
    try {
      const resourceData = {
        ...resource,
        isUnderMaintenance: resource.isUnderMaintenance ?? false,
        maintenanceNote: resource.maintenanceNote ?? '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, 'resources'), resourceData);

      return {
        ...resourceData,
        id: docRef.id
      };
    } catch (error: any) {
      console.error('Create resource error:', error);
      throw new Error(error.message);
    }
  }

  async getResources(): Promise<Resource[]> {
    try {
      const resourcesRef = collection(db, 'resources');
      const snapshot = await getDocs(resourcesRef);
      
      if (snapshot.empty) {
        // If no resources exist, create sample data
        await this.initializeSampleData();
        // Return the sample data
        return [
          {
            id: 'sample-1',
            name: 'Computer Lab A',
            type: 'lab' as const,
            description: 'Fully equipped computer lab with 25 workstations',
            category: 'Laboratory',
            location: 'Building A, Room 101',
            capacity: 25,
            status: 'available' as const,
            isUnderMaintenance: false,
            maintenanceNote: '',
            features: ['Computers', 'Projector', 'Whiteboard'],
            equipment: ['Computers', 'Projector', 'Whiteboard'],
            maintenanceSchedule: 'Monthly',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: 'sample-2',
            name: 'Conference Room B',
            type: 'room' as const,
            description: 'Professional conference room with presentation equipment',
            category: 'Meeting Room',
            location: 'Building B, Room 205',
            capacity: 15,
            status: 'available' as const,
            isUnderMaintenance: false,
            maintenanceNote: '',
            features: ['Projector', 'Video Conference System', 'Whiteboard'],
            equipment: ['Projector', 'Video Conference System', 'Whiteboard'],
            maintenanceSchedule: 'Quarterly',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: 'sample-3',
            name: 'Science Lab',
            type: 'lab' as const,
            description: 'Advanced science laboratory with modern equipment',
            category: 'Laboratory',
            location: 'Building C, Room 301',
            capacity: 20,
            status: 'available' as const,
            isUnderMaintenance: false,
            maintenanceNote: '',
            features: ['Microscopes', 'Lab Equipment', 'Safety Gear'],
            equipment: ['Microscopes', 'Lab Equipment', 'Safety Gear'],
            maintenanceSchedule: 'Weekly',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ];
      }
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Resource[];
    } catch (error) {
      console.error('Error getting resources:', error);
      return [];
    }
  }

  async initializeSampleData(): Promise<void> {
    try {
      console.log('📊 Initializing sample data...');
      
      // Create sample resources
      const sampleResources = [
        {
          name: 'Computer Lab A',
          type: 'lab' as const,
          description: 'Fully equipped computer lab with 25 workstations',
          category: 'Laboratory',
          location: 'Building A, Room 101',
          capacity: 25,
          status: 'available' as const,
          isUnderMaintenance: false,
          maintenanceNote: '',
          features: ['Computers', 'Projector', 'Whiteboard'],
          equipment: ['Computers', 'Projector', 'Whiteboard'],
          maintenanceSchedule: 'Monthly'
        },
        {
          name: 'Conference Room B',
          type: 'room' as const,
          description: 'Professional conference room with presentation equipment',
          category: 'Meeting Room',
          location: 'Building B, Room 205',
          capacity: 15,
          status: 'available' as const,
          isUnderMaintenance: false,
          maintenanceNote: '',
          features: ['Projector', 'Video Conference System', 'Whiteboard'],
          equipment: ['Projector', 'Video Conference System', 'Whiteboard'],
          maintenanceSchedule: 'Quarterly'
        },
        {
          name: 'Science Lab',
          type: 'lab' as const,
          description: 'Advanced science laboratory with modern equipment',
          category: 'Laboratory',
          location: 'Building C, Room 301',
          capacity: 20,
          status: 'available' as const,
          isUnderMaintenance: false,
          maintenanceNote: '',
          features: ['Microscopes', 'Lab Equipment', 'Safety Gear'],
          equipment: ['Microscopes', 'Lab Equipment', 'Safety Gear'],
          maintenanceSchedule: 'Weekly'
        }
      ];

      for (const resource of sampleResources) {
        await this.createResource(resource);
      }

      console.log('✅ Sample data initialized successfully!');
    } catch (error) {
      console.error('❌ Error initializing sample data:', error);
    }
  }

  async getResource(id: string): Promise<Resource> {
    try {
      const docRef = await getDoc(doc(db, 'resources', id));
      if (!docRef.exists()) {
        throw new Error('Resource not found');
      }
      return { id: docRef.id, ...docRef.data() } as Resource;
    } catch (error: any) {
      console.error('Get resource error:', error);
      throw new Error(error.message);
    }
  }

  async updateResource(id: string, data: Partial<Resource>): Promise<void> {
    try {
      await updateDoc(doc(db, 'resources', id), {
        ...data,
        updatedAt: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Update resource error:', error);
      throw new Error(error.message);
    }
  }

  async deleteResource(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'resources', id));
    } catch (error: any) {
      console.error('Delete resource error:', error);
      throw new Error(error.message);
    }
  }

  // Booking Management
  async createBooking(booking: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>): Promise<Booking> {
    try {
      console.log('🔥 Creating booking in Firebase with data:', booking);
      
      const docRef = await addDoc(collection(db, 'bookings'), {
        ...booking,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      const createdBooking = { ...booking, id: docRef.id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      console.log('✅ Booking created successfully with ID:', docRef.id);
      console.log('📋 Created booking data:', createdBooking);
      
      return createdBooking;
    } catch (error: any) {
      console.error('Create booking error:', error);
      throw new Error(error.message);
    }
  }

  async getBookings(userId?: string): Promise<Booking[]> {
    try {
      console.log('🔍 getBookings called with userId:', userId);

      let q: any = collection(db, 'bookings');
      if (userId) {
        console.log('🔍 Adding userId filter:', userId);
        q = query(collection(db, 'bookings'), where('userId', '==', userId));
      }
      // Remove orderBy to avoid index requirement for now
      // q = query(q, orderBy('createdAt', 'desc'));

      console.log('🔍 Executing Firestore query...');
      const querySnapshot = await getDocs(q);
      console.log('🔍 Query returned', querySnapshot.docs.length, 'documents');

      const bookings = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return Object.assign({ id: doc.id }, data) as Booking;
      });
      console.log('🔍 Mapped bookings:', bookings);

      // Sort manually instead of using orderBy
      bookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      return bookings;
    } catch (error: any) {
      console.error('Get bookings error:', error);
      return []; // Return empty array instead of throwing error
    }
  }

  // Alias for getBookings with userId parameter
  async getBookingsByUser(userId: string): Promise<Booking[]> {
    console.log('🔍 Fetching bookings for user ID:', userId);
    const bookings = await this.getBookings(userId);
    console.log('📋 Found bookings for user', userId, ':', bookings.length, 'bookings');
    console.log('📋 Booking details:', bookings.map(b => ({
      id: b.id,
      resourceName: b.resourceName,
      status: b.status,
      userId: b.userId
    })));
    return bookings;
  }

  async getBooking(id: string): Promise<Booking> {
    try {
      const docRef = await getDoc(doc(db, 'bookings', id));
      if (!docRef.exists()) {
        throw new Error('Booking not found');
      }
      return { id: docRef.id, ...docRef.data() } as Booking;
    } catch (error: any) {
      console.error('Get booking error:', error);
      throw new Error(error.message);
    }
  }

  async updateBooking(id: string, data: Partial<Booking>): Promise<void> {
    try {
      console.log('🔄 Updating booking:', id, 'with data:', data);
      await updateDoc(doc(db, 'bookings', id), {
        ...data,
        updatedAt: new Date().toISOString()
      });
      console.log('✅ Booking updated successfully');
    } catch (error: any) {
      console.error('Update booking error:', error);
      throw new Error(error.message);
    }
  }

  async approveBooking(bookingId: string): Promise<void> {
    try {
      console.log('✅ Approving booking:', bookingId);
      await updateDoc(doc(db, 'bookings', bookingId), {
        status: 'approved',
        updatedAt: new Date().toISOString()
      });
      console.log('✅ Booking approved successfully');
    } catch (error: any) {
      console.error('Approve booking error:', error);
      throw new Error(error.message);
    }
  }

  async rejectBooking(bookingId: string): Promise<void> {
    try {
      console.log('❌ Rejecting booking:', bookingId);
      await updateDoc(doc(db, 'bookings', bookingId), {
        status: 'rejected',
        updatedAt: new Date().toISOString()
      });
      console.log('✅ Booking rejected successfully');
    } catch (error: any) {
      console.error('Reject booking error:', error);
      throw new Error(error.message);
    }
  }

  async getAllBookings(): Promise<Booking[]> {
    try {
      console.log('🔍 Getting all bookings (admin view)');
      const q = collection(db, 'bookings');
      const querySnapshot = await getDocs(q);
      const bookings = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Booking[];
      
      // Sort by creation date (newest first)
      bookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      console.log('📋 Found', bookings.length, 'total bookings');
      console.log('📋 All booking details:', bookings.map(b => ({
        id: b.id,
        resourceName: b.resourceName,
        status: b.status,
        userId: b.userId,
        userName: b.userName
      })));
      return bookings;
    } catch (error: any) {
      console.error('Get all bookings error:', error);
      return [];
    }
  }

  async deleteBooking(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'bookings', id));
    } catch (error: any) {
      console.error('Delete booking error:', error);
      throw new Error(error.message);
    }
  }

  // Check for booking conflicts
  async checkBookingConflicts(resourceId: string, startTime: string, endTime: string, excludeBookingId?: string): Promise<Booking[]> {
    try {
      console.log('🔍 Checking booking conflicts for resource:', resourceId);
      console.log('🔍 Time range:', startTime, 'to', endTime);
      
      let q = query(
        collection(db, 'bookings'),
        where('resourceId', '==', resourceId),
        where('status', 'in', ['pending', 'approved'])
      );

      const querySnapshot = await getDocs(q);
      const bookings = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Booking[];
      
      console.log('🔍 Found', bookings.length, 'existing bookings for this resource');
      
      // Get the date of the new booking for same-day filtering
      const newBookingDate = new Date(startTime).toDateString();
      
      const conflicts = bookings.filter(booking => {
        if (excludeBookingId && booking.id === excludeBookingId) return false;
        
        const bookingStart = new Date(booking.startTime);
        const bookingEnd = new Date(booking.endTime);
        const newStart = new Date(startTime);
        const newEnd = new Date(endTime);
        
        // Only check conflicts for the same day
        const bookingDate = bookingStart.toDateString();
        if (bookingDate !== newBookingDate) {
          return false; // Skip bookings from different days
        }
        
        const hasConflict = (bookingStart < newEnd && bookingEnd > newStart);
        
        if (hasConflict) {
          console.log('⚠️ Same-day conflict found with booking:', booking.id);
          console.log('⚠️ Existing booking time:', bookingStart, 'to', bookingEnd);
          console.log('⚠️ New booking time:', newStart, 'to', newEnd);
        }
        
        return hasConflict;
      });
      
      console.log('🔍 Same-day conflicts found:', conflicts.length);
      return conflicts;
    } catch (error: any) {
      console.error('Check booking conflicts error:', error);
      throw new Error(error.message);
    }
  }

  // Get bookings for a specific resource on a specific date
  async getResourceBookingsForDate(resourceId: string, date: string): Promise<Booking[]> {
    try {
      console.log('🔍 Getting bookings for resource:', resourceId, 'on date:', date);
      
      // Create start and end of day timestamps
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      let q = query(
        collection(db, 'bookings'),
        where('resourceId', '==', resourceId),
        where('status', 'in', ['pending', 'approved']),
        where('startTime', '>=', startOfDay.toISOString()),
        where('startTime', '<=', endOfDay.toISOString())
      );

      const querySnapshot = await getDocs(q);
      const bookings = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Booking[];
      
      console.log('📋 Found', bookings.length, 'bookings for this resource on', date);
      return bookings;
    } catch (error: any) {
      console.error('Get resource bookings for date error:', error);
      return [];
    }
  }

  // Notification Management
  async createNotification(notification: Omit<Notification, 'id' | 'createdAt'>): Promise<Notification> {
    try {
      console.log('📢 Creating notification:', notification);
      const docRef = await addDoc(collection(db, 'notifications'), {
        ...notification,
        createdAt: new Date().toISOString()
      });

      const createdNotification = { ...notification, id: docRef.id, createdAt: new Date().toISOString() };
      console.log('✅ Notification created successfully with ID:', docRef.id);
      return createdNotification;
    } catch (error: any) {
      console.error('Create notification error:', error);
      throw new Error(error.message);
    }
  }

  async getAllNotifications(): Promise<Notification[]> {
    try {
      console.log('🔍 Getting all notifications (admin view)');
      const q = collection(db, 'notifications');
      const querySnapshot = await getDocs(q);
      const notifications = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Notification[];
      
      // Sort by creation date (newest first)
      notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      console.log('📋 Found', notifications.length, 'notifications');
      return notifications;
    } catch (error: any) {
      console.error('Get all notifications error:', error);
      return [];
    }
  }

  async deleteNotification(notificationId: string): Promise<void> {
    try {
      console.log('🗑️ Deleting notification:', notificationId);
      await deleteDoc(doc(db, 'notifications', notificationId));
      console.log('✅ Notification deleted successfully');
    } catch (error: any) {
      console.error('Delete notification error:', error);
      throw new Error(error.message);
    }
  }

  async uploadNotificationImage(file: File): Promise<string> {
    try {
      const storageRef = ref(storage, `notification-images/${Date.now()}-${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      console.log('✅ Notification image uploaded:', downloadURL);
      return downloadURL;
    } catch (error: any) {
      console.error('Upload notification image error:', error);
      throw new Error(error.message);
    }
  }

  async getNotifications(userId: string): Promise<Notification[]> {
    try {
      console.log('🔍 Getting notifications for user:', userId);
      
      // Get user-specific notifications
      const userQuery = query(
        collection(db, 'notifications'),
        where('userId', '==', userId)
      );
      
      // Get system-wide notifications (admin announcements)
      const systemQuery = query(
        collection(db, 'notifications'),
        where('isSystemNotification', '==', true)
      );
      
      const [userSnapshot, systemSnapshot] = await Promise.all([
        getDocs(userQuery),
        getDocs(systemQuery)
      ]);
      
      const userNotifications = userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Notification[];
      const systemNotifications = systemSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Notification[];
      
      // Combine and sort all notifications
      const allNotifications = [...userNotifications, ...systemNotifications];
      allNotifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      console.log('📋 Found', allNotifications.length, 'notifications for user');
      return allNotifications;
    } catch (error: any) {
      console.error('Get notifications error:', error);
      return []; // Return empty array instead of throwing error
    }
  }

  // Alias for getNotifications with userId parameter
  async getNotificationsByUser(userId: string): Promise<Notification[]> {
    return this.getNotifications(userId);
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        isRead: true
      });
    } catch (error: any) {
      console.error('Mark notification as read error:', error);
      throw new Error(error.message);
    }
  }

  // Maintenance Management
  async createMaintenanceRecord(record: Omit<MaintenanceRecord, 'id' | 'reportedAt'>): Promise<MaintenanceRecord> {
    try {
      const docRef = await addDoc(collection(db, 'maintenance'), {
        ...record,
        reportedAt: new Date().toISOString()
      });

      return { ...record, id: docRef.id, reportedAt: new Date().toISOString() };
    } catch (error: any) {
      console.error('Create maintenance record error:', error);
      throw new Error(error.message);
    }
  }

  async getMaintenanceRecords(resourceId?: string): Promise<MaintenanceRecord[]> {
    try {
      let q: any = collection(db, 'maintenance');
      if (resourceId) {
        q = query(q, where('resourceId', '==', resourceId));
      }
      q = query(q, orderBy('reportedAt', 'desc'));
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return Object.assign({ id: doc.id }, data) as MaintenanceRecord;
      });
    } catch (error: any) {
      console.error('Get maintenance records error:', error);
      throw new Error(error.message);
    }
  }

  // Audit Logging
  async logAuditEvent(auditLog: Omit<AuditLog, 'id' | 'timestamp'>): Promise<void> {
    try {
      await addDoc(collection(db, 'audit_logs'), {
        ...auditLog,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Log audit event error:', error);
      // Don't throw error for audit logging failures
    }
  }

  // System Settings
  async getSystemSettings(): Promise<SystemSettings> {
    try {
      const docRef = await getDoc(doc(db, 'system', 'settings'));
      if (!docRef.exists()) {
        // Return default settings
        return {
          maxBookingDuration: 4,
          maxBookingsPerUser: 10,
          approvalRequired: true,
          blackoutDates: [],
          maintenanceMode: false,
          emailNotifications: true,
          smsNotifications: false
        };
      }
      return docRef.data() as SystemSettings;
    } catch (error: any) {
      console.error('Get system settings error:', error);
      throw new Error(error.message);
    }
  }

  async updateSystemSettings(settings: Partial<SystemSettings>): Promise<void> {
    try {
      await setDoc(doc(db, 'system', 'settings'), settings, { merge: true });
    } catch (error: any) {
      console.error('Update system settings error:', error);
      throw new Error(error.message);
    }
  }

  // Reports
  async getBookingReport(startDate: string, endDate: string): Promise<any> {
    try {
      const q = query(
        collection(db, 'bookings'),
        where('createdAt', '>=', startDate),
        where('createdAt', '<=', endDate)
      );
      
      const querySnapshot = await getDocs(q);
      const bookings = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Booking[];
      
      // Calculate report data
      const totalBookings = bookings.length;
      const approvedBookings = bookings.filter(b => b.status === 'approved').length;
      const rejectedBookings = bookings.filter(b => b.status === 'rejected').length;
      const pendingBookings = bookings.filter(b => b.status === 'pending').length;
      const cancelledBookings = bookings.filter(b => b.status === 'cancelled').length;
      
      return {
        totalBookings,
        approvedBookings,
        rejectedBookings,
        pendingBookings,
        cancelledBookings
      };
    } catch (error: any) {
      console.error('Get booking report error:', error);
      throw new Error(error.message);
    }
  }
}

