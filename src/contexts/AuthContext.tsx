import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, phone: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Set up axios defaults based on environment
const getApiBaseUrl = () => {
  // In production, use the Netlify proxy (which forwards to our backend)
  if (import.meta.env.PROD) {
    return '';
  }
  
  // In development, use the explicit backend URL
  return import.meta.env.VITE_API_URL || 'http://localhost:3002';
};

const API_BASE_URL = getApiBaseUrl();
axios.defaults.baseURL = API_BASE_URL;

// Add request interceptor for debugging
axios.interceptors.request.use(
  (config) => {
    console.log('🔄 Making request to:', (config.baseURL || '') + config.url);
    console.log('🔄 Request method:', config.method?.toUpperCase());
    console.log('🔄 Environment:', import.meta.env.MODE);
    console.log('🔄 Backend URL:', import.meta.env.PROD ? 'Netlify Proxy -> chamaaapp.onrender.com' : API_BASE_URL);
    if (config.data) {
      console.log('🔄 Request data keys:', Object.keys(config.data));
    }
    return config;
  },
  (error) => {
    console.error('❌ Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
axios.interceptors.response.use(
  (response) => {
    console.log('✅ Response received:', response.status, response.data?.success ? 'Success' : 'Failed');
    return response;
  },
  (error) => {
    console.error('❌ Response error:', error.response?.status, error.response?.data?.message || error.message);
    
    // Handle network errors
    if (!error.response) {
      console.error('❌ Network error - check backend deployment at chamaaapp.onrender.com');
    }
    
    return Promise.reject(error);
  }
);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        try {
          console.log('🔍 Validating stored token...');
          const response = await axios.get('/api/auth/me');
          if (response.data.success) {
            setUser(response.data.user);
            console.log('✅ Token valid, user logged in:', response.data.user.email);
          } else {
            console.log('❌ Token invalid, removing...');
            localStorage.removeItem('token');
            delete axios.defaults.headers.common['Authorization'];
          }
        } catch (error) {
          console.error('❌ Token validation failed:', error);
          localStorage.removeItem('token');
          delete axios.defaults.headers.common['Authorization'];
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log('🔐 Attempting login for:', email);
      console.log('🔐 Using backend:', import.meta.env.PROD ? 'chamaaapp.onrender.com (via Netlify proxy)' : API_BASE_URL);
      
      const response = await axios.post('/api/auth/login', {
        email,
        password
      });

      if (response.data.success) {
        const { token, user } = response.data;
        localStorage.setItem('token', token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setUser(user);
        console.log('✅ Login successful for:', user.email);
      } else {
        throw new Error(response.data.message || 'Login failed');
      }
    } catch (error: any) {
      console.error('❌ Login failed:', error.response?.data || error.message);
      
      // Provide more specific error messages
      if (!error.response) {
        throw new Error('Unable to connect to server. Please check your internet connection or try again later.');
      }
      
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  };

  const register = async (name: string, email: string, phone: string, password: string) => {
    try {
      console.log('📝 Attempting registration for:', email);
      console.log('📝 Using backend:', import.meta.env.PROD ? 'chamaaapp.onrender.com (via Netlify proxy)' : API_BASE_URL);
      console.log('📝 Registration data:', { name, email, phone, passwordLength: password.length });
      
      const response = await axios.post('/api/auth/register', {
        name,
        email,
        phone,
        password
      });

      console.log('📝 Registration response:', response.data);

      if (response.data.success) {
        const { token, user } = response.data;
        localStorage.setItem('token', token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setUser(user);
        console.log('✅ Registration successful for:', user.email);
      } else {
        throw new Error(response.data.message || 'Registration failed');
      }
    } catch (error: any) {
      console.error('❌ Registration failed:', error.response?.data || error.message);
      
      // Provide more specific error messages
      if (!error.response) {
        throw new Error('Unable to connect to server. Please check your internet connection or try again later.');
      }
      
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  };

  const logout = () => {
    console.log('👋 Logging out user');
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};