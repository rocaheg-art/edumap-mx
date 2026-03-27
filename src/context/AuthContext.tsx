import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  login: (identifier: string, password?: string, role?: UserRole) => Promise<void>;
  register: (data: Partial<User>) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('edumap_user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      // Use a timeout to avoid the synchronous setState in effect warning
      const timer = setTimeout(() => {
        setUser(parsedUser);
        setIsLoading(false);
      }, 0);
      return () => clearTimeout(timer);
    } else {
      // Use a timeout to avoid the synchronous setState in effect warning
      const timer = setTimeout(() => setIsLoading(false), 0);
      return () => clearTimeout(timer);
    }
  }, []);

  const login = async (identifier: string, password?: string, role?: UserRole) => {
    try {
      const { loginUser } = await import('../api');
      const response = await loginUser(role || 'student', identifier, password);
      
      if (!response) {
        throw new Error('Credenciales incorrectas');
      }

      setUser(response);
      localStorage.setItem('edumap_user', JSON.stringify(response));
    } catch (err) {
      console.error('Login error:', err);
      throw err;
    }
  };

  const register = async (data: Partial<User>) => {
    try {
      const { registerUser } = await import('../api');
      const response = await registerUser(data);
      
      if (!response) {
        throw new Error('No se pudo registrar');
      }

      setUser(response);
      localStorage.setItem('edumap_user', JSON.stringify(response));
    } catch (err) {
      console.error('Register error:', err);
      throw err;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('edumap_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
