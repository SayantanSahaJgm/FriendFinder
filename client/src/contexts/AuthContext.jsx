import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/auth/me`);
          setUser(res.data);
        } catch (error) {
          console.error('Failed to load user:', error);
          localStorage.removeItem('token');
          setToken(null);
        }
      }
      setLoading(false);
    };

    loadUser();
  }, [token]);

  const login = async (email, password) => {
    const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
      email,
      password,
    });
    const { token: newToken, ...userData } = res.data;
    localStorage.setItem('token', newToken);
    setToken(newToken);
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    setUser(userData);
    return res.data;
  };

  const register = async (name, email, password) => {
    const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/register`, {
      name,
      email,
      password,
    });
    const { token: newToken, ...userData } = res.data;
    localStorage.setItem('token', newToken);
    setToken(newToken);
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    setUser(userData);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
