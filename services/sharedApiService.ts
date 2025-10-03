// services/sharedApiService.ts

import baseApi from "./baseApiService";
import type {
  User,
  Branch,
  LeaveApplication,
  LeaveSetting,
  TeacherAttendanceRecord,
} from "../types";

// Session is now managed by reacting to API responses, not by direct manipulation here.
let currentSession: User | null = null;
try {
  const sessionData = sessionStorage.getItem("verticxSession");
  if (sessionData) {
    currentSession = JSON.parse(sessionData);
  }
} catch (e) {
  console.error("Could not parse session data", e);
}

export class SharedApiService {
  // =================================================================
  // SESSION & AUTHENTICATION
  // =================================================================
  async login(
    identifier: string,
    password: string
  ): Promise<(User & { otpRequired?: boolean }) | null> {
    const { data } = await baseApi.post("/auth/login", {
      identifier,
      password,
    });

    // FIX: The backend returns `{ user, token }`. Only store the `user` object in the session.
    if (data && data.user && !data.otpRequired) {
      currentSession = data.user;
      sessionStorage.setItem("verticxSession", JSON.stringify(data.user));
    }
    return data;
  }

  async verifyOtp(userId: string, otp: string): Promise<User | null> {
      console.log(
        "%c--- EXECUTING LATEST verifyOtp FUNCTION ---",
        "color: lime; font-weight: bold;"
      );
      console.log("Sending this payload to the backend:", { userId, otp });
    const { data } = await baseApi.post("/auth/verify-otp", { userId, otp });

    // FIX: The backend returns `{ user, token }`. Only store and return the `user` object.
    if (data && data.user) {
      currentSession = data.user;
      sessionStorage.setItem("verticxSession", JSON.stringify(data.user));
      return data.user;
    }
    return null;
  }

  async logout(): Promise<void> {
    try {
      await baseApi.post("/auth/logout");
    } catch (error) {
      console.error("Logout request failed, clearing session locally.", error);
    } finally {
      currentSession = null;
      sessionStorage.removeItem("verticxSession");
    }
  }

  async checkSession(): Promise<User | null> {
    try {
      // FIX: The backend returns `{ user }`. We need to extract the user object.
      const { data } = await baseApi.get("/auth/session");
      if (data && data.user) {
        currentSession = data.user;
        sessionStorage.setItem("verticxSession", JSON.stringify(data.user));
        return data.user;
      }
      // If response is malformed, treat as logged out.
      throw new Error("Invalid session response");
    } catch (error) {
      currentSession = null;
      sessionStorage.removeItem("verticxSession");
      return null;
    }
  }

  async registerSchool(data: {
    principalName: string;
    schoolName: string;
    email: string;
    phone: string;
    location: string;
    registrationId: string; // This likely isn't sent from frontend, but keeping for consistency.
    principalPassword?: string; // Need to send password
  }): Promise<void> {
    await baseApi.post("/auth/register-school", data);
  }

  async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    await baseApi.post("/auth/change-password", {
      currentPassword,
      newPassword,
    });
  }

  async resetUserPassword(userId: string): Promise<{ newPassword: string }> {
    const { data } = await baseApi.post(`/users/${userId}/reset-password`);
    return data;
  }

  // =================================================================
  // USER PROFILE & SHARED FEATURES
  // =================================================================

  async getUserById(userId: string): Promise<User | null> {
    const { data } = await baseApi.get<User | null>(`/users/${userId}`);
    return data;
  }

  async getBranchById(branchId: string): Promise<Branch | null> {
    const { data } = await baseApi.get<Branch | null>(`/branches/${branchId}`);
    return data;
  }

  async updateUserProfile(updates: {
    name?: string;
    email?: string;
    phone?: string;
  }): Promise<User> {
    const { data } = await baseApi.put<User>("/profile", updates);
    if (currentSession) {
      currentSession = { ...currentSession, ...data };
      sessionStorage.setItem("verticxSession", JSON.stringify(currentSession));
    }
    return data;
  }

  async createLeaveApplication(
    data: Omit<LeaveApplication, "id" | "status">
  ): Promise<void> {
    await baseApi.post("/leaves/applications", data);
  }

  async getLeaveApplicationsForUser(id?: string): Promise<LeaveApplication[]> {
    const { data } = await baseApi.get<LeaveApplication[]>(
      "/leaves/my-applications"
    );
    return data;
  }

  async getLeaveSettingsForBranch(): Promise<LeaveSetting[]> {
    const { data } = await baseApi.get<LeaveSetting[]>("/leaves/settings");
    return data;
  }

  async getStaffListForBranch(): Promise<
    (User & { attendancePercentage?: number })[]
  > {
    const { data } = await baseApi.get<
      (User & { attendancePercentage?: number })[]
    >("/staff/list");
    return data;
  }

  async getStaffAttendanceAndLeaveForMonth(
    year: number,
    month: number
  ): Promise<{
    attendance: TeacherAttendanceRecord[];
    leaves: LeaveApplication[];
  }> {
    const { data } = await baseApi.get("/staff/my-attendance-and-leaves", {
      params: { year, month },
    });
    return data;
  }

  async getSuperAdminContactDetails(): Promise<User | null> {
    const { data } = await baseApi.get<User | null>(
      "/super-admin/contact-details"
    );
    return data;
  }
}
