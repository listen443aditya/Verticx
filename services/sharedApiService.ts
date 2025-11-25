// services/sharedApiService.ts

import baseApi from "./baseApiService";
import type {
  User,
  Branch,
  LeaveApplication,
  LeaveSetting,
  TeacherAttendanceRecord,
  Teacher,
  Subject,
  SchoolEvent,
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
      localStorage.setItem("token", data.token);
      sessionStorage.setItem("verticxSession", JSON.stringify(data.user));
    }
    return data;
  }

  async logout(): Promise<void> {
    sessionStorage.removeItem("verticxSession");
    localStorage.removeItem("token");
    try {
      await baseApi.post("/auth/logout");
    } catch (error) {
      console.log(
        "Logout notification to server failed (this is often normal)."
      );
    }
  }

  async checkSession(): Promise<User | null> {
    try {
      const { data } = await baseApi.get("/auth/session");
      if (data && data.user) {
        sessionStorage.setItem("verticxSession", JSON.stringify(data.user));
        return data.user;
      }
      throw new Error("Invalid session response");
    } catch (error) {
      sessionStorage.removeItem("verticxSession");
      localStorage.removeItem("token");
      return null;
    }
  }

  // FIX: This signature now correctly matches the landing page form and the backend controller.
  async registerSchool(data: {
    schoolName: string;
    registrationId: string;
    principalName: string;
    email: string;
    phone: string;
    location: string;
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

  // ... The rest of the file is unchanged ...

  async resetUserPassword(
    userId: string
  ): Promise<{ userId: string; newPassword: string }> {
    try {
      // This calls the new route we just made.
      // Note: The /api/registrar prefix is added by your baseApi
      const response = await baseApi.post(
        `/registrar/users/${userId}/reset-password`
      );
      return response.data; // Returns { message, userId, newPassword }
    } catch (error) {
      console.error("Failed to reset user password:", error);
      throw error;
    }
  }

  async getBranchById(branchId: string): Promise<Branch | null> {
    const { data } = await baseApi.get<Branch | null>(
      `/general/branches/${branchId}`
    );
    return data;
  }
  async getTeachersByBranch(branchId: string): Promise<Teacher[]> {
    const { data } = await baseApi.get<Teacher[]>("/general/teachers", {
      params: { branchId },
    });
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

  async getStaffListForBranch(): Promise<User[]> {
    const { data } = await baseApi.get<User[]>("/principal/staff");
    return data;
  }

  async getStaffAttendanceAndLeaveForMonth(
    staffId: string, // Add the staffId parameter
    year: number,
    month: number
  ): Promise<{ attendance: any[]; leaves: any[] }> {
    // Use the new, correct endpoint for principals
    const { data } = await baseApi.get(
      `/principal/staff/${staffId}/attendance/${year}/${month}`
    );
    return data;
  }
  async getSchoolEvents(branchId: string): Promise<SchoolEvent[]> {
    // Calls the shared/general endpoint
    const { data } = await baseApi.get<SchoolEvent[]>("/general/events", {
      params: { branchId },
    });
    return data;
  }
  async getSubjectsByBranch(branchId: string): Promise<Subject[]> {
    // Calls the new backend route /api/general/subjects
    const { data } = await baseApi.get<Subject[]>("/general/subjects", {
      params: { branchId },
    });
    return data;
  }
  async getSuperAdminContactDetails(): Promise<User> {
    const { data } = await baseApi.get<User>("/admin/contact-details");
    return data;
  }
}
