// services/sharedApiService.ts

import baseApi from "./baseApiService";
import type {
  User,
  Branch,
  LeaveApplication,
  LeaveSetting,
  TeacherAttendanceRecord,
} from "../types";

type LoginResponse = {
  user: User;
  token?: string;
  otpRequired?: boolean;
};

export class SharedApiService {
  // =================================================================
  // SESSION & AUTHENTICATION
  // =================================================================
  async login(
    identifier: string,
    password: string
  ): Promise<LoginResponse | null> {
    const { data } = await baseApi.post("/auth/login", {
      identifier,
      password,
    });

    if (data?.user && data.token && !data.otpRequired) {
      // FIX: Save the token to localStorage
      localStorage.setItem("token", data.token);
      sessionStorage.setItem("verticxSession", JSON.stringify(data.user));
    }
    return data;
  }

  async verifyOtp(
    userId: string,
    otp: string
  ): Promise<{ user: User; token: string } | null> {
    const { data } = await baseApi.post("/auth/verify-otp", { userId, otp });

    if (data?.user && data.token) {
      // FIX: Save the token to localStorage
      localStorage.setItem("token", data.token);
      sessionStorage.setItem("verticxSession", JSON.stringify(data.user));
    }
    // The context needs the full response to hydrate the user
    return data;
  }

  async logout(): Promise<void> {
    try {
      await baseApi.post("/auth/logout");
    } catch (error) {
      console.error("Logout request failed, clearing session locally.", error);
    } finally {
      // FIX: Clear both the user and the token
      sessionStorage.removeItem("verticxSession");
      localStorage.removeItem("token");
    }
  }

  async checkSession(): Promise<User | null> {
    try {
      // The auth token is sent automatically by the baseApi interceptor
      const { data } = await baseApi.get("/auth/session");
      if (data && data.user) {
        sessionStorage.setItem("verticxSession", JSON.stringify(data.user));
        return data.user;
      }
      throw new Error("Invalid session response");
    } catch (error) {
      sessionStorage.removeItem("verticxSession");
      localStorage.removeItem("token"); // Also clear token on session fail
      return null;
    }
  }

  async registerSchool(data: {
    principalName: string;
    schoolName: string;
    email: string;
    phone: string;
    location: string;
    principalPassword?: string;
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

  // ... The rest of your file does not need to be changed ...

  async resetUserPassword(userId: string): Promise<{ newPassword: string }> {
    const { data } = await baseApi.post(`/users/${userId}/reset-password`);
    return data;
  }

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
    const sessionData = sessionStorage.getItem("verticxSession");
    if (sessionData) {
      let sessionUser = JSON.parse(sessionData);
      sessionUser = { ...sessionUser, ...data };
      sessionStorage.setItem("verticxSession", JSON.stringify(sessionUser));
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
