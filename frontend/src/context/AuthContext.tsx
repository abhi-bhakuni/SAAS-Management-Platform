import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authApi } from '../services/api';

export const validatePassword = (password: string): { isValid: boolean; message: string } => {
  if (
    !password || 
    password.length < 8 || 
    !/[A-Z]/.test(password) || 
    !/[a-z]/.test(password) || 
    !/[0-9]/.test(password) || 
    !/[!@#$%^&*(),.?":{}|<>]/.test(password)
  ) {
    return { isValid: false, message: 'Password should be strong' };
  }
  
  return { isValid: true, message: '' };
};

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  selectedOrgId?: string;
  orgRole?: string;
  bio?: string;
  name?: string;
  twoFactorEnabled?: boolean;
  lastLoginAt?: string | null;
}

interface LoginCredentials {
  email: string;
  password: string;
  twoFactorToken?: string;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  inviteToken?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updateUser: (updated: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getTokenExpiry = (token: string): number | null => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('authToken'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      if (token) {
        try {
          const userData = await authApi.getCurrentUser();
          const storedUserJson = localStorage.getItem('user');
          const storedUser = storedUserJson ? JSON.parse(storedUserJson) : null;
          const mergedUser = storedUser?.bio ? { ...userData, bio: storedUser.bio } : userData;
          setUser(mergedUser);
          localStorage.setItem('user', JSON.stringify(mergedUser));
        } catch (error) {
          console.error("Failed to fetch user context", error);
          logout();
        }
      }
      setIsLoading(false);
    };
    fetchUser();
  }, [token]);

  // Auto-logout when the JWT expires
  useEffect(() => {
    if (!token) return;

    const expiry = getTokenExpiry(token);
    if (!expiry) return;

    const msUntilExpiry = expiry - Date.now();

    if (msUntilExpiry <= 0) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      setToken(null);
      setUser(null);
      window.location.href = '/login';
      return;
    }

    const timer = setTimeout(() => {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      setToken(null);
      setUser(null);
      window.location.href = '/login';
    }, msUntilExpiry);

    return () => clearTimeout(timer);
  }, [token]);

  const login = async (credentials: LoginCredentials) => {
    const data = await authApi.login(credentials);
    const { access_token, user: userData } = data;
    
    localStorage.setItem('authToken', access_token);
    setToken(access_token);
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const updateUser = (updated: Partial<User>) => {
    setUser((currentUser) => {
      if (!currentUser) return currentUser;
      const nextUser = { ...currentUser, ...updated };
      localStorage.setItem('user', JSON.stringify(nextUser));
      return nextUser;
    });
  };

  const register = async (signUpData: RegisterData) => {
    const validation = validatePassword(signUpData.password);
    if (!validation.isValid) {
      throw new Error(validation.message);
    }
    const data = await authApi.register(signUpData);
    const { access_token, user: userData } = data;
    
    localStorage.setItem('authToken', access_token);
    setToken(access_token);
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    // Note: The axios interceptor handles global re-routing for 401s,
    // but here we can just clear state and let the ProtectedRoute redirect.
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!token, isLoading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
