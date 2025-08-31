export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'lecturer' | 'student';
  department?: string;
  bio?: string;
  profilePicture?: string;
  profilePicturePublicId?: string;
  contactInfo?: {
    phone?: string;
    office?: string;
  };
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
}

export interface RegisterFormData {
  username: string;
  email: string;
  role: 'admin' | 'lecturer' | 'student';
  department?: string;
  password: string;
  confirmPassword: string;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface AuthContextType {
  user: User | null;
  login: (data: LoginFormData) => Promise<void>;
  register: (data: RegisterFormData) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
} 