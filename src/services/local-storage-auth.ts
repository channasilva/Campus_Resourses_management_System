export interface UserData {
  id: string;
  username: string;
  email: string;
  role: 'student' | 'lecturer';
  lecturerId?: string;
  studentId?: string;
  createdAt: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  role: 'student' | 'lecturer';
  lecturerId?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

class LocalStorageAuthService {
  private usersKey = 'campus_users';
  private currentUserKey = 'campus_current_user';

  private getUsers(): UserData[] {
    const users = localStorage.getItem(this.usersKey);
    return users ? JSON.parse(users) : [];
  }

  private saveUsers(users: UserData[]): void {
    localStorage.setItem(this.usersKey, JSON.stringify(users));
  }

  async register(data: RegisterData): Promise<{ user: UserData; token: string }> {
    try {
      const users = this.getUsers();
      
      // Check if email already exists
      const existingUser = users.find(user => user.email === data.email);
      if (existingUser) {
        throw new Error('Email address is already registered');
      }

      // Check if username already exists
      const existingUsername = users.find(user => user.username === data.username);
      if (existingUsername) {
        throw new Error('Username is already taken');
      }

      // Check if lecturer ID already exists (for lecturers)
      if (data.role === 'lecturer' && data.lecturerId) {
        const existingLecturerId = users.find(user => user.lecturerId === data.lecturerId);
        if (existingLecturerId) {
          throw new Error('Lecturer ID is already in use');
        }
      }

      // Generate user ID and student ID
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const studentId = data.role === 'student' ? `STU${Date.now()}` : undefined;

      // Create user data
      const userData: UserData = {
        id: userId,
        username: data.username,
        email: data.email,
        role: data.role,
        lecturerId: data.role === 'lecturer' ? data.lecturerId : undefined,
        studentId: data.role === 'student' ? studentId : undefined,
        createdAt: new Date().toISOString()
      };

      // Add user to storage
      users.push(userData);
      this.saveUsers(users);

      // Generate a simple token
      const token = `token_${userId}_${Date.now()}`;

      return {
        user: userData,
        token
      };
    } catch (error: any) {
      console.error('Registration error:', error);
      throw new Error(error.message);
    }
  }

  async login(data: LoginData): Promise<{ user: UserData; token: string }> {
    try {
      const users = this.getUsers();
      
      // Find user by email
      const user = users.find(u => u.email === data.email);
      if (!user) {
        throw new Error('User not found. Please check your email address.');
      }

      // In a real app, you'd verify the password hash
      // For demo purposes, we'll just check if the user exists
      // You can add password verification later

      // Generate a simple token
      const token = `token_${user.id}_${Date.now()}`;

      return {
        user,
        token
      };
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.message);
    }
  }

  // Get all users (for demo purposes)
  getAllUsers(): UserData[] {
    return this.getUsers();
  }

  // Clear all data (for testing)
  clearAllData(): void {
    localStorage.removeItem(this.usersKey);
    localStorage.removeItem(this.currentUserKey);
  }
}

export const localStorageAuthService = new LocalStorageAuthService(); 