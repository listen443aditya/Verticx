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
    // This is a "whitelist" of roles that MUST have a branchId.
    const rolesRequiringBranch = [
      "Principal",
      "Registrar",
      "Teacher",
      "Student",
      "Parent",
      "Librarian",
    ];

    // If the user's role is in our list AND they are missing a branchId, it's an error.
    if (
      rolesRequiringBranch.includes(loggedInUser.role) &&
      !loggedInUser.branchId
    ) {
      console.error(
        `Login error: User role ${loggedInUser.role} requires a branchId.`
      );
      return null; // Invalid state
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
        // Decide if this is a critical failure. For now, we'll allow login without school name.
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
      // This is expected if the session is invalid or expired.
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
      const loggedInUser = await sharedApiService.login(identifier, password);

      if (loggedInUser && (loggedInUser as any).otpRequired) {
        return { user: loggedInUser, otpRequired: true };
      }

      if (loggedInUser) {
        // FIX: Check if the session was successfully hydrated before returning.
        const sessionUser = await hydrateUserSession(loggedInUser);
        if (sessionUser) {
          // Only return the user if hydration was successful
          return { user: sessionUser, otpRequired: false };
        }
        // If hydration fails, fall through to the failure case.
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
      const verifiedUser = await sharedApiService.verifyOtp(userId, otp);
      if (verifiedUser) {
        // FIX: Check if the session was successfully hydrated.
        const sessionUser = await hydrateUserSession(verifiedUser);
        return sessionUser; // Return the result of hydration (which could be null)
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
