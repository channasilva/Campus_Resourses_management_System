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
  // Query helper methods
  private createQuery<T extends DocumentData>(
    collectionRef: CollectionReference<T>,
    conditions: { field: string; operator: '==' | '>' | '<' | '>=' | '<='; value: any }[] = [],
    sortOptions: { field: string; direction: 'asc' | 'desc' }[] = []
  ): Query<T> {
    let q: Query<T> = collectionRef as Query<T>;

    // Apply where conditions
    conditions.forEach(({ field, operator, value }) => {
      q = query(q, where(field, operator, value));
    });

    // Apply sort options
    sortOptions.forEach(({ field, direction }) => {
      q = query(q, orderBy(field, direction));
    });

    return q;
  }

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

      await setDoc(doc(db, 'users', user.uid), userProfile);
      
      const token = await user.getIdToken();
      console.log('🎉 Registration completed successfully!');

      return { user: userProfile, token };
    } catch (error: any) {
      console.error('❌ Registration error:', error);
      throw new Error(error.message);
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

  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    try {
      const userCredential: UserCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        throw new Error('User data not found');
      }

      const userData = userDoc.data() as User;
      const token = await user.getIdToken();

      return { user: userData, token };
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.message);
    }
  }

  // Resource Management
  async createResource(data: Omit<Resource, 'id' | 'createdAt' | 'updatedAt'>): Promise<Resource> {
    try {
      console.log('📝 Creating new resource...', data);

      const resourceData = {
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, 'resources'), resourceData);

      return {
        id: docRef.id,
        ...resourceData
      } as Resource;
    } catch (error: any) {
      console.error('❌ Error creating resource:', error);
      throw new Error(error.message);
    }
  }

  async initializeTestData(): Promise<void> {
    try {
      const resource: Omit<Resource, 'id' | 'createdAt' | 'updatedAt'> = {
        name: 'Computer Lab 101',
        type: 'lab',
        category: 'Laboratory',
        description: 'Main computer laboratory with 30 workstations',
        location: 'Building A, First Floor',
        capacity: 30,
        status: 'available',
        isUnderMaintenance: false,
        maintenanceNote: '',
        features: ['High-speed Internet', 'Air Conditioning'],
        equipment: ['Computers', 'Projector', 'Whiteboard'],
        maintenanceSchedule: 'Monthly'
      };

      await this.createResource(resource);
      console.log('✅ Test data initialized successfully');
    } catch (error: any) {
      console.error('❌ Error initializing test data:', error);
      throw new Error(error.message);
    }
  }

  async getMaintenanceRecords(resourceId?: string): Promise<MaintenanceRecord[]> {
    try {
      const maintenanceRef = collection(db, 'maintenance');
      const conditions = resourceId ? [{ field: 'resourceId', operator: '==', value: resourceId }] : [];
      const sortOptions = [{ field: 'reportedAt', direction: 'desc' as const }];
      
      const q = this.createQuery(maintenanceRef, conditions, sortOptions);
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as MaintenanceRecord));
    } catch (error: any) {
      console.error('Error fetching maintenance records:', error);
      throw new Error(error.message);
    }
  }
}

export const firebaseService = new FirebaseService();
