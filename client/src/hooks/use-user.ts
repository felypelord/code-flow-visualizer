import { useState, useEffect } from 'react';

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

  useEffect(() => {
    if (token) {
      fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.ok ? r.json() : Promise.reject())
        .then((data) => {
          if (data?.user) {
            setUser(data.user);
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

  return { user, token, loading };
}
