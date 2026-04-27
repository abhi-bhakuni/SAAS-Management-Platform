import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authApi } from '../services/api';

const hashPassword = async (password: string) => {
  if (!password) return password;
  const msgBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

const validatePassword = (password: string): { isValid: boolean; message: string } => {
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
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  updateUser: (updated: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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

  const login = async (credentials: any) => {
    const validation = validatePassword(credentials.password);
    if (!validation.isValid) {
      throw new Error(validation.message);
    }
    
    const secureCredentials = { 
      ...credentials, 
      password: await hashPassword(credentials.password) 
    };
    const data = await authApi.login(secureCredentials);
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

  const register = async (signUpData: any) => {
    const validation = validatePassword(signUpData.password);
    if (!validation.isValid) {
      throw new Error(validation.message);
    }
    
    const secureData = { 
      ...signUpData, 
      password: await hashPassword(signUpData.password) 
    };
    const data = await authApi.register(secureData);
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
