import { useState, useEffect } from 'react';

interface User {
  id: string;
  username: string;
  isAdmin?: boolean;
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetch('/api/me', { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.ok ? r.json() : Promise.reject())
        .then((data) => {
          setUser(data);
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
