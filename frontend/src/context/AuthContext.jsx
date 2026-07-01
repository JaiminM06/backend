import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);   // null = not yet loaded
  const [loading, setLoading] = useState(true);   // true until first fetch completes
  const [error, setError]     = useState(null);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/users/current-user`,
        { withCredentials: true }
      );
      setUser(res.data.data);
      setError(null);
    } catch (err) {
      if (err.response?.status === 401) {
        setUser(null);   // not logged in — normal state
      } else {
        setError('Connection error');   // network/server issue — do not log out
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch once on app mount
  useEffect(() => {
    fetchUser();
  }, []);

  // Call this after login to update context without a page reload
  const login = (userData) => setUser(userData);

  // Call this after logout to clear context
  const logout = () => setUser(null);

  // Call this to manually refetch (e.g. after updating profile)
  const refreshUser = () => fetchUser();

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook — use this in every component instead of fetching /current-user
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};

export default AuthContext;
