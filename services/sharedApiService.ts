// services/sharedApiService.ts

import baseApi from "./baseApiService";
import type {
  User,
  Branch,
  LeaveApplication,
  LeaveSetting,
  TeacherAttendanceRecord,
} from "../types";

let currentSession: User | null = null;
try {
  const sessionData = sessionStorage.getItem("verticxSession");
  if (sessionData) {
    currentSession = JSON.parse(sessionData);
  }
} catch (e) {
  console.error("Could not parse session data", e);
}

// FIX: Define the correct shape of the API login response
type LoginResponse = {
  user: User;
  token?: string;
  otpRequired?: boolean;
};

export class SharedApiService {
  async login(
    identifier: string,
    password: string
  ): Promise<LoginResponse | null> {
    // The API call itself is correct
    const { data } = await baseApi.post("/auth/login", {
      identifier,
      password,
    });

    if (data && data.user && !data.otpRequired) {
      currentSession = data.user;
      sessionStorage.setItem("verticxSession", JSON.stringify(data.user));
    }
    return data;
  }

  async verifyOtp(
    userId: string,
    otp: string
  ): Promise<{ user: User; token: string } | null> {
    const { data } = await baseApi.post("/auth/verify-otp", { userId, otp });

    if (data && data.user) {
      currentSession = data.user;
      sessionStorage.setItem("verticxSession", JSON.stringify(data.user));
      return data; // Return the full { user, token } object
    }
    return null;
  }

  // ... (rest of the file is unchanged)
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
      const { data } = await baseApi.get("/auth/session");
      if (data && data.user) {
        currentSession = data.user;
        sessionStorage.setItem("verticxSession", JSON.stringify(data.user));
        return data.user;
      }
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
    registrationId: string;
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
