import { useCallback, useEffect, useState } from 'react';
import {
    isLoggedIn as checkIsLoggedIn,
    getLoggedInUser,
    loginUser,
    logoutUser,
    UserSession,
} from './authSession';
import { initDatabase } from './database';

export type { UserSession } from './authSession';

interface UseAuthReturn {
  isLoggedIn: boolean;
  user: UserSession | null;
  isLoading: boolean;
  login: (user: UserSession) => Promise<void>;
  logout: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check session on mount
  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      try {
        await initDatabase();
        const loggedIn = await checkIsLoggedIn();

        if (loggedIn && isMounted) {
          const sessionUser = await getLoggedInUser();
          setUser(sessionUser);
          setIsLoggedIn(true);
        } else if (isMounted) {
          setUser(null);
          setIsLoggedIn(false);
        }
      } catch (error) {
        console.warn('[useAuth] checkSession error:', error);
        if (isMounted) {
          setUser(null);
          setIsLoggedIn(false);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    checkSession();
    return () => { isMounted = false; };
  }, []);

  // Login function
  const login = useCallback(async (userData: UserSession) => {
    try {
      await loginUser(userData);
      setUser(userData);
      setIsLoggedIn(true);
    } catch (error) {
      console.warn('[useAuth] login error:', error);
      throw error;
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    try {
      await logoutUser();
      setUser(null);
      setIsLoggedIn(false);
    } catch (error) {
      console.warn('[useAuth] logout error:', error);
      throw error;
    }
  }, []);

  return { isLoggedIn, user, isLoading, login, logout };
}
