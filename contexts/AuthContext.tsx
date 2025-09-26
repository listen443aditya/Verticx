import React, { createContext, useState, useEffect, useCallback } from 'react';
import type { User } from '../types.ts';
import { sharedApiService } from '../services';

// New Type for a fully authenticated user session, including school name
export interface SessionUser extends User {
    schoolName?: string; // Optional for Admin, required for others
    enabledFeatures?: Record<string, boolean>;
}

interface AuthContextType {
  user: SessionUser | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<{ user: User | null; otpRequired: boolean }>;
  verifyOtpAndLogin: (userId: string, otp: string) => Promise<User | null>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper to enrich a User object with school details for the session
  const hydrateUserSession = async (loggedInUser: User): Promise<SessionUser | null> => {
      if (loggedInUser.role !== 'Admin' && loggedInUser.role !== 'SuperAdmin' && !loggedInUser.branchId) {
          console.error(`Login error: User role ${loggedInUser.role} requires a branchId.`);
          return null; // Invalid state
      }

      let schoolName: string | undefined;
      let enabledFeatures: Record<string, boolean> | undefined;

      if (loggedInUser.branchId) {
          const branch = await sharedApiService.getBranchById(loggedInUser.branchId);
          schoolName = branch?.name;
          enabledFeatures = branch?.enabledFeatures;
      }
      
      const sessionUser: SessionUser = { ...loggedInUser, schoolName, enabledFeatures };
      setUser(sessionUser);
      return sessionUser;
  };

  const checkSession = useCallback(async () => {
    setLoading(true);
    const sessionUser = await sharedApiService.checkSession();
    if (sessionUser) {
      await hydrateUserSession(sessionUser);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const login = async (identifier: string, password: string): Promise<{ user: User | null; otpRequired: boolean }> => {
    setLoading(true);
    try {
      const loggedInUser = await sharedApiService.login(identifier, password);
      
      if (loggedInUser && (loggedInUser as any).otpRequired) {
        // OTP is required, return user data without setting the session.
        return { user: loggedInUser, otpRequired: true };
      }
      
      if (loggedInUser) {
        await hydrateUserSession(loggedInUser);
        return { user: loggedInUser, otpRequired: false };
      }
      
      setUser(null);
      return { user: null, otpRequired: false };
    } catch (error) {
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const verifyOtpAndLogin = async (userId: string, otp: string): Promise<User | null> => {
    setLoading(true);
    try {
        const verifiedUser = await sharedApiService.verifyOtp(userId, otp);
        if(verifiedUser) {
            await hydrateUserSession(verifiedUser);
            return verifiedUser;
        }
        return null;
    } catch (error) {
        setUser(null);
        throw error;
    } finally {
        setLoading(false);
    }
  };

  const logout = () => {
    sharedApiService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, verifyOtpAndLogin }}>
      {children}
    </AuthContext.Provider>
  );
};
