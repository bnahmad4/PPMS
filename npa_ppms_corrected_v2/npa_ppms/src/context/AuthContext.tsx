import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, RoleCode, Port, InAppNotification } from '../types';
import { api, setAuthEmail } from '../api/client';

interface AuthContextType {
  currentUser: User | null;
  personas: User[];
  currentPortId: string;
  setCurrentPortId: (portId: string) => void;
  login: (email: string, password?: string) => Promise<void>;
  logout: () => void;
  hasRole: (role: RoleCode) => boolean;
  isInternal: boolean;
  notifications: InAppNotification[];
  refreshNotifications: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  ports: Port[];
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [personas, setPersonas] = useState<User[]>([]);
  const [currentPortId, setCurrentPortId] = useState<string>('ALL');
  const [ports, setPorts] = useState<Port[]>([]);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const initAuth = async () => {
    try {
      setLoading(true);
      const [personasRes, portsRes] = await Promise.all([
        api.getPersonas(),
        api.getPorts()
      ]);

      setPersonas(personasRes.personas);
      setPorts(portsRes.ports);

      // Check if user previously logged in
      const savedUserJson = localStorage.getItem('ppms_current_user');
      if (savedUserJson) {
        try {
          const savedUser = JSON.parse(savedUserJson);
          setAuthEmail(savedUser.email);
          setCurrentUser(savedUser);
          if (savedUser.assignedPortId) {
            setCurrentPortId(savedUser.assignedPortId);
          }
        } catch {
          // ignore corrupted localstorage
        }
      }
    } catch (err) {
      console.error('Failed to initialize auth state:', err);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password?: string) => {
    const res = await api.login(email, password);
    setAuthEmail(res.user.email);
    setCurrentUser(res.user);
    localStorage.setItem('ppms_current_user', JSON.stringify(res.user));
    if (res.user.assignedPortId) {
      setCurrentPortId(res.user.assignedPortId);
    }
    await refreshNotifications();
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('ppms_current_user');
    setAuthEmail('');
  };

  const refreshNotifications = async () => {
    try {
      const res = await api.getNotifications();
      setNotifications(res.notifications || []);
    } catch (err) {
      // Quiet fail for notifications
    }
  };

  const markNotificationRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error('Error marking notification read:', err);
    }
  };

  useEffect(() => {
    initAuth();
  }, []);

  // Poll / refresh notifications periodically when logged in
  useEffect(() => {
    if (!currentUser) return;
    refreshNotifications();
    const interval = setInterval(() => {
      refreshNotifications();
    }, 15000);
    return () => clearInterval(interval);
  }, [currentUser?.id, currentUser?.email]);

  const hasRole = (role: RoleCode): boolean => {
    if (!currentUser) return false;
    return currentUser.roles.includes(role);
  };

  const isInternal = currentUser?.userType === 'INTERNAL';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        personas,
        currentPortId,
        setCurrentPortId,
        login,
        logout,
        hasRole,
        isInternal,
        notifications,
        refreshNotifications,
        markNotificationRead,
        ports,
        loading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
