// services/parentApiService.ts

// STEP 1: A single import for a single purpose: communicating with the backend.
//    All local database and internal service dependencies have been removed.
import baseApi from "./baseApiService";
import type {
  ParentDashboardData,
  StudentProfile,
  ComplaintAboutStudent,
  FeeHistoryItem,
  Teacher,
  HydratedMeetingRequest,
  MeetingRequest,
  FeeRecord,
  GradeWithCourse,
} from "../types";

//  STEP 2: The class is now a lean, focused collection of API endpoints.
//    The user (parent) is identified by the backend via their auth token, simplifying method signatures.
export class ParentApiService {
  async getParentDashboardData(): Promise<ParentDashboardData> {
    // The backend now composes the entire, complex dashboard object.
    const { data } = await baseApi.get<ParentDashboardData>(
      "/parent/dashboard"
    );
    return data;
  }

  async getStudentProfileDetails(
    studentId: string
  ): Promise<StudentProfile | null> {
    const { data } = await baseApi.get<StudentProfile | null>(
      `/parent/children/${studentId}/profile`
    );
    return data;
  }

  async getComplaintsAboutStudent(
    studentId: string
  ): Promise<ComplaintAboutStudent[]> {
    const { data } = await baseApi.get<ComplaintAboutStudent[]>(
      `/parent/children/${studentId}/complaints`
    );
    return data;
  }

  async getFeeHistoryForStudent(studentId: string): Promise<FeeHistoryItem[]> {
    const { data } = await baseApi.get<FeeHistoryItem[]>(
      `/parent/children/${studentId}/fees/history`
    );
    return data;
  }

  async getTeachersForStudent(studentId: string): Promise<Teacher[]> {
    // The backend now handles the complex logic of finding associated teachers.
    const { data } = await baseApi.get<Teacher[]>(
      `/parent/children/${studentId}/teachers`
    );
    return data;
  }

  async getMeetingRequestsForParent(): Promise<HydratedMeetingRequest[]> {
    // The backend filters and "hydrates" the meeting requests with names.
    const { data } = await baseApi.get<HydratedMeetingRequest[]>(
      "/parent/meetings"
    );
    return data;
  }

  async getTeacherAvailability(
    teacherId: string,
    date: string
  ): Promise<string[]> {
    const { data } = await baseApi.get<string[]>(
      `/parent/teachers/${teacherId}/availability`,
      { params: { date } }
    );
    return data;
  }

  async createMeetingRequest(
    request: Omit<MeetingRequest, "id" | "status">
  ): Promise<void> {
    await baseApi.post("/parent/meetings", request);
  }

  async updateMeetingRequest(
    requestId: string,
    updates: Partial<MeetingRequest>
  ): Promise<void> {
    await baseApi.put(`/parent/meetings/${requestId}`, updates);
  }

  async recordFeePayment(paymentResponse: any): Promise<void> {
    // The frontend securely forwards the payment gateway's response to the backend for verification and recording.
    await baseApi.post("/parent/fees/record-payment", paymentResponse);
  }

  async payStudentFees(
    studentId: string,
    amount: number,
    details: string
  ): Promise<void> {
    await baseApi.post(`/parent/children/${studentId}/fees/pay`, {
      amount,
      details,
    });
  }

  async getFeeRecordForStudent(studentId: string): Promise<FeeRecord | null> {
    const { data } = await baseApi.get<FeeRecord | null>(
      `/parent/children/${studentId}/fees/record`
    );
    return data;
  }

  async getStudentGrades(studentId: string): Promise<GradeWithCourse[]> {
    // This call is now direct, no longer relying on a different frontend service.
    const { data } = await baseApi.get<GradeWithCourse[]>(
      `/parent/children/${studentId}/grades`
    );
    return data;
  }
}
