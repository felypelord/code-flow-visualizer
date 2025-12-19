import { useState, useEffect, useCallback } from 'react';

interface User {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  isAdmin?: boolean;
  isPro?: boolean;
  proExpiresAt?: string | null;
  emailVerified?: boolean;
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(() => {
    if (token) {
      fetch('/api/me', { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.ok ? r.json() : Promise.reject())
        .then((data) => {
          const u = (data && data.user) ? data.user : data;
          if (u && u.id) {
            setUser(u);
          } else {
            setUser(null);
          }
          setLoading(false);
        })
        .catch(() => { 
          setUser(null); 
          setToken(null); 
          localStorage.removeItem('token');
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    refreshUser();
  }, [token, refreshUser]);

  return { user, token, loading, refreshUser };
}
