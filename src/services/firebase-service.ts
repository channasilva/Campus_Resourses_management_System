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

  async getCurrentUser(): Promise<User | null> {
    try {
      if (!auth.currentUser) {
        console.log('❌ No authenticated user found');
        return null;
      }
      
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (!userDoc.exists()) {
        console.log('❌ User document not found in Firestore');
        return null;
      }
      
      const userData = userDoc.data();
      return {
        id: auth.currentUser.uid,
        ...userData
      } as User;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      return auth.currentUser !== null;
    } catch (error) {
      console.error('Error checking authentication:', error);
      return false;
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      console.log('🔍 Fetching all users...');
      
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
      // Return empty array instead of throwing error to prevent dashboard failure
      return [];
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
      console.log('🔍 Fetching resources from Firestore...');
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 10000);
      });
      
      const resourcesPromise = (async () => {
        const resourcesRef = collection(db, 'resources');
        const snapshot = await getDocs(resourcesRef);
        
        if (snapshot.empty) {
          console.log('📊 No resources found in Firestore');
          return [];
        }
        
        const resources = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Resource[];
        
        console.log(`✅ Successfully fetched ${resources.length} resources from Firestore`);
        console.log('📋 Resources found:', resources.map(r => `${r.name} (${r.type})`));
        return resources;
      })();
      
      return await Promise.race([resourcesPromise, timeoutPromise]);
    } catch (error: any) {
      console.error('❌ Error getting resources:', error);
      
      // Handle specific Firebase errors
      if (error.code === 'unavailable') {
        console.warn('⚠️ Firebase service temporarily unavailable');
      } else if (error.code === 'permission-denied') {
        console.warn('⚠️ Permission denied accessing resources');
      } else if (error.message === 'Request timeout') {
        console.warn('⚠️ Request timed out');
      }
      
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
    } catch (error) {
      console.error('Get all bookings error:', error);
      return [];
    }
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

  async deleteBooking(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'bookings', id));
    } catch (error: any) {
      console.error('Delete booking error:', error);
      throw new Error(error.message);
    }
  }

  // Check for booking conflicts
  checkBookingConflicts = async (resourceId: string, startTime: string, endTime: string, excludeBookingId?: string): Promise<Booking[]> => {
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
    } catch (error) {
      console.error('Get all notifications error:', error);
      return [];
    }
  }

  async getNotificationsByUser(userId: string): Promise<Notification[]> {
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
    } catch (error) {
      console.error('Get notifications error:', error);
      return []; // Return empty array instead of throwing error
    }
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      console.log('📖 Marking notification as read:', notificationId);
      await updateDoc(doc(db, 'notifications', notificationId), {
        isRead: true,
        updatedAt: new Date().toISOString()
      });
      console.log('✅ Notification marked as read successfully');
    } catch (error: any) {
      console.error('Mark notification as read error:', error);
      throw new Error(error.message);
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


}

// Create service instance
const firebaseService = new FirebaseService();

// Ensure all methods are properly exported
export const firebaseServiceWithMethods = {
  // Authentication methods
  login: firebaseService.login.bind(firebaseService),
  register: firebaseService.register.bind(firebaseService),
  logout: firebaseService.logout.bind(firebaseService),
  signInWithGoogle: firebaseService.signInWithGoogle.bind(firebaseService),
  getCurrentUser: firebaseService.getCurrentUser.bind(firebaseService),
  isAuthenticated: firebaseService.isAuthenticated.bind(firebaseService),
  
  // User methods
  getAllUsers: firebaseService.getAllUsers.bind(firebaseService),
  getUserById: firebaseService.getUserById.bind(firebaseService),
  updateUserProfile: firebaseService.updateUserProfile.bind(firebaseService),
  
  // Resource methods
  getResources: firebaseService.getResources.bind(firebaseService),
  createResource: firebaseService.createResource.bind(firebaseService),
  updateResource: firebaseService.updateResource.bind(firebaseService),
  deleteResource: firebaseService.deleteResource.bind(firebaseService),
  
  // Booking methods
  getAllBookings: firebaseService.getAllBookings.bind(firebaseService),
  getBookingsByUser: firebaseService.getBookingsByUser.bind(firebaseService),
  createBooking: firebaseService.createBooking.bind(firebaseService),
  updateBooking: firebaseService.updateBooking.bind(firebaseService),
  deleteBooking: firebaseService.deleteBooking.bind(firebaseService),
  checkBookingConflicts: firebaseService.checkBookingConflicts,
  approveBooking: firebaseService.approveBooking.bind(firebaseService),
  rejectBooking: firebaseService.rejectBooking.bind(firebaseService),
  
  // Notification methods
  getAllNotifications: firebaseService.getAllNotifications.bind(firebaseService),
  getNotificationsByUser: firebaseService.getNotificationsByUser.bind(firebaseService),
  createNotification: firebaseService.createNotification.bind(firebaseService),
  markNotificationAsRead: firebaseService.markNotificationAsRead.bind(firebaseService),
  deleteNotification: firebaseService.deleteNotification.bind(firebaseService)
};

// Export both for compatibility
export { firebaseService };
export default firebaseServiceWithMethods;
