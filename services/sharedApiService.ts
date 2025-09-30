// services/sharedApiService.ts

// ✅ STEP 1: Dependencies are simplified. 'baseApi' is the sole connection to the backend.
import baseApi from "./baseApiService";
// ✅ STEP 2: All necessary types for shared data contracts are imported.
import type {
  User,
  LeaveApplication,
  LeaveSetting,
  TeacherAttendanceRecord,
} from "../types.ts";

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
    // Backend now handles user lookup, password verification, and OTP logic.
    const { data } = await baseApi.post("/auth/login", {
      identifier,
      password,
    });

    if (data && !data.otpRequired) {
      currentSession = data;
      sessionStorage.setItem("verticxSession", JSON.stringify(data));
    }
    return data;
  }

  async verifyOtp(userId: string, otp: string): Promise<User | null> {
    const { data } = await baseApi.post("/auth/verify-otp", { userId, otp });

    if (data) {
      currentSession = data;
      sessionStorage.setItem("verticxSession", JSON.stringify(data));
    }
    return data;
  }

  async logout(): Promise<void> {
    // Informs the backend to invalidate the session/token, if applicable.
    await baseApi.post("/auth/logout");
    currentSession = null;
    sessionStorage.removeItem("verticxSession");
  }

  async checkSession(): Promise<User | null> {
    // Validates the current token with the backend to get the user session.
    try {
      const { data } = await baseApi.get("/auth/session");
      currentSession = data;
      sessionStorage.setItem("verticxSession", JSON.stringify(data));
      return data;
    } catch (error) {
      // If the session is invalid (e.g., 401 Unauthorized), clear it.
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
  }): Promise<void> {
    // Backend handles uniqueness checks and creating the registration request.
    await baseApi.post("/auth/register-school", data);
  }

  async changePassword(current: string, newPass: string): Promise<void> {
    // The user is identified by the backend via their auth token.
    await baseApi.post("/auth/change-password", { current, newPass });
  }

  // NOTE: This is an ADMIN action, moved to a generic endpoint.
  async resetUserPassword(userId: string): Promise<{ newPassword: string }> {
    const { data } = await baseApi.post(`/users/${userId}/reset-password`);
    return data;
  }

  // =================================================================
  // USER PROFILE & SHARED FEATURES
  // =================================================================
  async updateUserProfile(updates: {
    name?: string;
    email?: string;
    phone?: string;
  }): Promise<User> {
    // The user updates their OWN profile. Identified by auth token.
    const { data } = await baseApi.put<User>("/profile", updates);
    // Update the local session with the new details.
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

  async getLeaveApplicationsForUser(): Promise<LeaveApplication[]> {
    // Fetches leave applications for the currently logged-in user.
    const { data } = await baseApi.get<LeaveApplication[]>(
      "/leaves/my-applications"
    );
    return data;
  }

  async getLeaveSettingsForBranch(): Promise<LeaveSetting[]> {
    // The branch is inferred by the backend from the user's token.
    const { data } = await baseApi.get<LeaveSetting[]>("/leaves/settings");
    return data;
  }

  async getStaffListForBranch(): Promise<
    (User & { attendancePercentage?: number })[]
  > {
    // The backend is responsible for calculating derived data like attendance percentage.
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
    // Fetches data for the currently logged-in staff member.
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
