// contexts/AuthContext.tsx
import React, { createContext, useState, useEffect, useCallback } from "react";
import type { User } from "../types.ts";
import { SharedApiService } from "../services";

const sharedApiService = new SharedApiService();

export interface SessionUser extends User {
  schoolName?: string;
  enabledFeatures?: Record<string, boolean>;
}

interface AuthContextType {
  user: SessionUser | null;
  loading: boolean;
  login: (
    identifier: string,
    password: string
  ) => Promise<{ user: User | null; otpRequired: boolean }>;
  verifyOtpAndLogin: (userId: string, otp: string) => Promise<User | null>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  const hydrateUserSession = async (
    loggedInUser: User
  ): Promise<SessionUser | null> => {
    const rolesRequiringBranch = [
      "Principal",
      "Registrar",
      "Teacher",
      "Student",
      "Parent",
      "Librarian",
    ];

    if (
      rolesRequiringBranch.includes(loggedInUser.role) &&
      !loggedInUser.branchId
    ) {
      console.error(
        `Login error: User role ${loggedInUser.role} requires a branchId.`
      );
      return null;
    }

    let schoolName: string | undefined;
    let enabledFeatures: Record<string, boolean> | undefined;

    if (loggedInUser.branchId) {
      try {
        const branch = await sharedApiService.getBranchById(
          loggedInUser.branchId
        );
        schoolName = branch?.name;
        enabledFeatures = branch?.enabledFeatures;
      } catch (error) {
        console.error("Failed to fetch branch details during login:", error);
      }
    }

    const sessionUser: SessionUser = {
      ...loggedInUser,
      schoolName,
      enabledFeatures,
    };
    setUser(sessionUser);
    return sessionUser;
  };

  const checkSession = useCallback(async () => {
    setLoading(true);
    try {
      const sessionUser = await sharedApiService.checkSession();
      if (sessionUser) {
        await hydrateUserSession(sessionUser);
      }
    } catch (error) {
      console.log("No active session found.");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const login = async (
    identifier: string,
    password: string
  ): Promise<{ user: User | null; otpRequired: boolean }> => {
    setLoading(true);
    try {
      const response = await sharedApiService.login(identifier, password);

      if (response?.otpRequired && response.user) {
        return { user: response.user, otpRequired: true };
      }

      if (response?.user) {
        const sessionUser = await hydrateUserSession(response.user);
        if (sessionUser) {
          return { user: sessionUser, otpRequired: false };
        }
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

  const verifyOtpAndLogin = async (
    userId: string,
    otp: string
  ): Promise<User | null> => {
    setLoading(true);
    try {
      const response = await sharedApiService.verifyOtp(userId, otp);
      if (response?.user) {
        const sessionUser = await hydrateUserSession(response.user);
        return sessionUser;
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
    <AuthContext.Provider
      value={{ user, loading, login, logout, verifyOtpAndLogin }}
    >
      {children}
    </AuthContext.Provider>
  );
};
