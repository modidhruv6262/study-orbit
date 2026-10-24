import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = async () => {
    try {
      if (apiClient.getToken()) {
        const [userData, profileData] = await Promise.all([
          apiClient.get('/auth/me'),
          apiClient.get('/profile').catch(() => null)
        ]);
        setUser({ ...userData, profile: profileData });
      } else {
        setUser(null);
      }
    } catch (err) {
      console.warn('Failed to fetch user:', err);
      apiClient.clearToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();

    const handleAuthExpired = () => setUser(null);
    window.addEventListener('auth-expired', handleAuthExpired);
    return () => window.removeEventListener('auth-expired', handleAuthExpired);
  }, []);

  const login = async (email, password) => {
    const data = await apiClient.post('/auth/login', { email, password });
    apiClient.setToken(data.access_token);
    await fetchCurrentUser();
  };

  const register = async (email, password, full_name) => {
    const data = await apiClient.post('/auth/register', { email, password, full_name });
    apiClient.setToken(data.access_token);
    await fetchCurrentUser();
  };

  const logout = () => {
    apiClient.clearToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser: fetchCurrentUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
