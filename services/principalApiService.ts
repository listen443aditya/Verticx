// src/services/principalApiService.ts
import baseApi from "./baseApiService";
import type {
  Branch,
  PrincipalDashboardData,
  FacultyApplication,
  TeacherProfile,
  User,
  Teacher,
  Examination,
  StudentWithExamMarks,
  PrincipalAttendanceOverview,
  PrincipalFinancialsOverview,
  FeeRectificationRequest,
  TeacherAttendanceRectificationRequest,
  LeaveApplication,
  ComplaintAboutStudent,
  TeacherComplaint,
  ManualExpense,
  PayrollRecord,
  ManualSalaryAdjustment,
  PrincipalQuery,
  ErpFinancials,
  ErpPayment,
  SchoolEvent,
  Announcement,
  SmsMessage,
  SchoolClass,
  Student,
  Complaint,
  FeeAdjustment,
  ClassDetails,
  // --- FIX: Add the missing type imports here ---
  SuspensionRecord,
  FeeRecord,
  AttendanceRecord,
} from "../types"; // adjust path to your project types

type RaiseQueryPayload = {
  branchId: string;
  principalId: string;
  principalName: string;
  schoolName: string;
  subject: string;
  queryText: string;
};
type RaiseComplaintPayload = Omit<
  ComplaintAboutStudent,
  "id" | "submittedAt" | "createdAt"
>;

export class PrincipalApiService {
  // ---------- Dashboard & Profile ----------
  async getPrincipalDashboardData(): Promise<PrincipalDashboardData> {
    const { data } = await baseApi.get<PrincipalDashboardData>(
      "/principal/dashboard"
    );
    return data;
  }

  async requestProfileAccessOtp(): Promise<void> {
    await baseApi.post("/principal/profile/request-otp");
  }

  async verifyProfileAccessOtp(otp: string): Promise<boolean> {
    const { data } = await baseApi.post("/principal/profile/verify-otp", {
      otp,
    });
    return data;
  }

  // NOTE: two useful branch endpoints:
  // - GET /branches/:id (general) to fetch any branch by id/registrationId
  // - PATCH /principal/branch-details to update the principal's branch
  async getBranchById(branchId: string): Promise<Branch> {
    const { data } = await baseApi.get<Branch>(
      `/branches/${encodeURIComponent(branchId)}`
    );
    return data;
  }

  async getBranchDetails(): Promise<Branch> {
    const { data } = await baseApi.get<Branch>("/principal/branch");
    return data;
  }

  async updateBranchDetails(updates: Partial<Branch>): Promise<Branch> {
    const { data } = await baseApi.patch<Branch>(
      "/principal/branch-details",
      updates
    );
    return data;
  }

  // ---------- Faculty & Staff Management ----------
  async getFacultyApplications(): Promise<FacultyApplication[]> {
    const { data } = await baseApi.get<FacultyApplication[]>(
      "/principal/faculty-applications"
    );
    return data;
  }

  async approveFacultyApplication(
    applicationId: string,
    salary?: number
  ): Promise<{ credentials: { username: string; password: string } }> {
    const { data } = await baseApi.post<{
      credentials: { username: string; password: string };
    }>(
      `/principal/faculty-applications/${encodeURIComponent(
        applicationId
      )}/approve`,
      { salary }
    );
    return data;
  }

  async rejectFacultyApplication(applicationId: string) {
    await baseApi.post(
      `/principal/faculty-applications/${encodeURIComponent(
        applicationId
      )}/reject`
    );
  }

  async getStaff(config: any = {}): Promise<(User & Partial<Teacher>)[]> {
    const { data } = await baseApi.get<(User & Partial<Teacher>)[]>(
      "/principal/staff",
      config
    );
    return data;
  }

  async createStaffMember(
    payload: Partial<User & { salary?: number }>
  ): Promise<{ credentials: { username: string; password: string } }> {
    const { data } = await baseApi.post<{
      credentials: { username: string; password: string };
    }>("/principal/staff", payload);
    return data;
  }

  async suspendStaff(staffId: string) {
    await baseApi.patch(
      `/principal/staff/${encodeURIComponent(staffId)}/suspend`
    );
  }

  async reinstateStaff(staffId: string) {
    await baseApi.patch(
      `/principal/staff/${encodeURIComponent(staffId)}/reinstate`
    );
  }

  async deleteStaff(staffId: string) {
    await baseApi.delete(`/principal/staff/${encodeURIComponent(staffId)}`);
  }

  async getTeacherProfileDetails(teacherId: string): Promise<TeacherProfile> {
    const { data } = await baseApi.get<TeacherProfile>(
      `/principal/teachers/${encodeURIComponent(teacherId)}/profile`
    );
    return data;
  }

  async updateTeacher(teacherId: string, updates: Partial<Teacher>) {
    await baseApi.patch(
      `/principal/teachers/${encodeURIComponent(teacherId)}`,
      updates
    );
  }

  // ---------- Academic Overview ----------
  async getPrincipalClassView(): Promise<SchoolClass[]> {
    const { data } = await baseApi.get<SchoolClass[]>("/principal/class-view");
    return data;
  }

  async getAttendanceOverview(): Promise<PrincipalAttendanceOverview> {
    const { data } = await baseApi.get<PrincipalAttendanceOverview>(
      "/principal/attendance-overview"
    );
    return data;
  }

  async getAllStaff(config: any = {}): Promise<User[]> {
    return this.getStaff(config);
  }

  async getStaffAttendanceAndLeaveForMonth(
    staffId: string,
    year: number,
    month: number,
    config: any = {}
  ): Promise<{ attendance: any[]; leaves: any[] }> {
    // This method *is* in your controller, so we just call it
    try {
      const { data } = await baseApi.get(
        `/principal/staff/${staffId}/attendance/${year}/${month}`,
        config
      );
      return data;
    } catch (error) {
      console.error(
        `Failed to fetch calendar data for staff ${staffId}:`,
        error
      );
      return { attendance: [], leaves: [] };
    }
  }

  async getExaminationsWithResultStatus(): Promise<Examination[]> {
    const { data } = await baseApi.get<Examination[]>(
      "/principal/examinations"
    );
    return data;
  }

  async publishExaminationResults(examId: string) {
    await baseApi.post(
      `/principal/examinations/${encodeURIComponent(examId)}/publish`
    );
  }

  async getStudentResultsForExamination(
    examId: string
  ): Promise<StudentWithExamMarks[]> {
    const { data } = await baseApi.get<StudentWithExamMarks[]>(
      `/principal/examinations/${encodeURIComponent(examId)}/results`
    );
    return data;
  }

  async getStudents(): Promise<Student[]> {
    const { data } = await baseApi.get<Student[]>("/principal/students");
    return data;
  }
  async getSchoolClasses(): Promise<SchoolClass[]> {
    const { data } = await baseApi.get<SchoolClass[]>("/principal/classes");
    return data;
  }
  async getSuspensionRecords(): Promise<SuspensionRecord[]> {
    const { data } = await baseApi.get<SuspensionRecord[]>(
      "/principal/suspension-records"
    );
    return data;
  }
  async getFeeRecords(): Promise<FeeRecord[]> {
    const { data } = await baseApi.get<FeeRecord[]>("/principal/fee-records");
    return data;
  }
  async getAttendanceRecords(): Promise<AttendanceRecord[]> {
    const { data } = await baseApi.get<AttendanceRecord[]>(
      "/principal/attendance-records"
    );
    return data;
  }

  async sendResultsSms(examId: string, messageTemplate: string) {
    await baseApi.post(
      `/principal/examinations/${encodeURIComponent(examId)}/send-sms`,
      { messageTemplate }
    );
  }

  // ---------- Financials ----------
  async getFinancialsOverview(): Promise<PrincipalFinancialsOverview> {
    const { data } = await baseApi.get<PrincipalFinancialsOverview>(
      "/principal/financials-overview"
    );
    return data;
  }

  async addFeeAdjustment(payload: {
    studentId: string;
    type: "concession" | "charge";
    amount: number;
    reason: string;
  }) {
    await baseApi.post("/principal/fee-adjustment", payload);
  }

  async getStaffPayrollForMonth(month: string): Promise<PayrollRecord[]> {
    const { data } = await baseApi.get<PayrollRecord[]>(
      `/principal/payroll/${encodeURIComponent(month)}`
    );
    return data;
  }

  async processPayroll(payload: any) {
    await baseApi.post("/principal/payroll/process", payload);
  }

  async addManualSalaryAdjustment(payload: ManualSalaryAdjustment) {
    await baseApi.post("/principal/salary-adjustment", payload);
  }

  async getErpFinancialsForBranch(): Promise<ErpFinancials> {
    const { data } = await baseApi.get<ErpFinancials>(
      "/principal/erp-financials"
    );
    return data;
  }

  async payErpBill(amount: number, transactionId: string) {
    await baseApi.post("/principal/erp-bill/pay", { amount, transactionId });
  }

  async getManualExpenses(): Promise<ManualExpense[]> {
    const { data } = await baseApi.get<ManualExpense[]>(
      "/principal/manual-expenses"
    );
    return data;
  }

  async addManualExpense(payload: Omit<ManualExpense, "id">) {
    await baseApi.post("/principal/manual-expenses", payload);
  }

  // ---------- Staff Requests ----------
  async getFeeRectificationRequests(): Promise<FeeRectificationRequest[]> {
    const { data } = await baseApi.get<FeeRectificationRequest[]>(
      "/principal/requests/fees"
    );
    return data;
  }

  async processFeeRectificationRequest(requestId: string, status: string) {
    await baseApi.post(
      `/principal/requests/fees/${encodeURIComponent(requestId)}/process`,
      { status }
    );
  }

  async getTeacherAttendanceRectificationRequests(): Promise<
    TeacherAttendanceRectificationRequest[]
  > {
    const { data } = await baseApi.get<TeacherAttendanceRectificationRequest[]>(
      "/principal/requests/attendance"
    );
    return data;
  }

  async processTeacherAttendanceRectificationRequest(
    requestId: string,
    status: string
  ) {
    await baseApi.post(
      `/principal/requests/attendance/${encodeURIComponent(requestId)}/process`,
      { status }
    );
  }

  async getLeaveApplications(): Promise<LeaveApplication[]> {
    const { data } = await baseApi.get<LeaveApplication[]>(
      "/principal/requests/leave"
    );
    return data;
  }

  async processLeaveApplication(applicationId: string, status: string) {
    await baseApi.post(
      `/principal/requests/leave/${encodeURIComponent(applicationId)}/process`,
      { status }
    );
  }

  // ---------- Grievances & Discipline ----------
  async raiseComplaintAboutStudent(
    payload: RaiseComplaintPayload
  ): Promise<void> {
    await baseApi.post("/principal/complaints/student", payload);
  }
  async getComplaints(): Promise<Complaint[]> {
    // A generic name is better now
    const { data } = await baseApi.get<Complaint[]>("/principal/complaints");
    return data;
  }

  async getComplaintsAboutStudents(): Promise<ComplaintAboutStudent[]> {
    const { data } = await baseApi.get<ComplaintAboutStudent[]>(
      "/principal/complaints/student"
    );
    return data;
  }

  async getComplaintsForBranch(): Promise<TeacherComplaint[]> {
    const { data } = await baseApi.get<TeacherComplaint[]>(
      "/principal/complaints/teacher"
    );
    return data;
  }
  async getTeacherComplaints(): Promise<TeacherComplaint[]> {
    // This correctly calls GET /principal/complaints/teacher
    const { data } = await baseApi.get<TeacherComplaint[]>(
      "/principal/complaints/teacher"
    );
    return data;
  }

  async getSuspensions(): Promise<any[]> {
    const { data } = await baseApi.get<any[]>("/principal/suspensions");
    return data;
  }

  // ---------- Communication & Events ----------
  async getAnnouncements(): Promise<Announcement[]> {
    const { data } = await baseApi.get<Announcement[]>(
      "/principal/announcements"
    );
    return data;
  }

  async sendAnnouncement(payload: {
    title: string;
    message: string;
    audience: string;
  }) {
    await baseApi.post("/principal/announcements", payload);
  }

  async getSmsHistory(): Promise<SmsMessage[]> {
    const { data } = await baseApi.get<SmsMessage[]>("/principal/sms-history");
    return data;
  }

  async sendSmsToStudents(
    studentIds: string[],
    message: string
  ): Promise<{ success: boolean; count: number }> {
    const { data } = await baseApi.post("/principal/sms/students", {
      studentIds,
      message,
    });
    return data;
  }

  async clearAnnouncementsHistory(fromDate?: string, toDate?: string) {
    // backend uses DELETE /principal/announcements/clear
    await baseApi.delete("/principal/announcements/clear", {
      data: { fromDate, toDate },
    });
  }

  async clearSmsHistory(fromDate?: string, toDate?: string) {
    await baseApi.delete("/principal/sms/clear", {
      data: { fromDate, toDate },
    });
  }

  async createSchoolEvent(
    payload: Omit<SchoolEvent, "id" | "createdAt" | "status">
  ) {
    await baseApi.post("/principal/events", payload);
  }

  async updateSchoolEvent(eventId: string, payload: Partial<SchoolEvent>) {
    await baseApi.patch(
      `/principal/events/${encodeURIComponent(eventId)}`,
      payload
    );
  }

  async updateSchoolEventStatus(eventId: string, status: string) {
    await baseApi.patch(
      `/principal/events/${encodeURIComponent(eventId)}/status`,
      { status }
    );
  }

  async getSchoolEvents(): Promise<SchoolEvent[]> {
    const { data } = await baseApi.get<SchoolEvent[]>("/principal/events");
    return data;
  }
  async deleteSchoolEvent(eventId: string): Promise<void> {
    await baseApi.delete(`/principal/events/${encodeURIComponent(eventId)}`);
  }

  // ---------- Admin Communication ----------
  async raiseQueryToAdmin(payload: RaiseQueryPayload): Promise<PrincipalQuery> {
    const { data } = await baseApi.post<PrincipalQuery>(
      "/principal/queries/admin",
      payload
    );
    return data;
  }

  async getQueriesByPrincipal(): Promise<PrincipalQuery[]> {
    const { data } = await baseApi.get<PrincipalQuery[]>("/principal/queries");
    return data;
  }
  async getQueries(): Promise<PrincipalQuery[]> {
    const { data } = await baseApi.get<PrincipalQuery[]>("/principal/queries");
    return data;
  }
  // ---------- System Actions ----------
  async startNewAcademicSession(newStartDate: string) {
    await baseApi.post("/principal/new-session", { newStartDate });
  }

  async updateUser(userId: string, updates: Partial<User>) {
    await baseApi.patch(
      `/principal/users/${encodeURIComponent(userId)}`,
      updates
    );
  }

  // ---------- Convenience: branch-scoped lists ----------
  async getTeachersByBranch(branchId: string): Promise<Teacher[]> {
    const { data } = await baseApi.get<Teacher[]>(
      `/principal/branches/${encodeURIComponent(branchId)}/teachers`
    );
    return data;
  }

  async getPrincipalClassViewByBranch(
    branchId: string
  ): Promise<SchoolClass[]> {
    const { data } = await baseApi.get<SchoolClass[]>(
      `/principal/branches/${encodeURIComponent(branchId)}/classes`
    );
    return data;
  }

  async getClassDetails(classId: string): Promise<ClassDetails> {
    const { data } = await baseApi.get<ClassDetails>(
      `/principal/classes/${encodeURIComponent(classId)}/details`
    );
    return data;
  }

  async assignClassMentor(
    classId: string,
    teacherId: string | null
  ): Promise<void> {
    await baseApi.patch(
      `/principal/classes/${encodeURIComponent(classId)}/mentor`,
      { teacherId }
    );
  }

  async assignFeeTemplateToClass(
    classId: string,
    feeTemplateId: string | null
  ): Promise<void> {
    await baseApi.patch(
      `/principal/classes/${encodeURIComponent(classId)}/fee-template`,
      { feeTemplateId }
    );
  }

  async getStudentsByBranch(branchId: string): Promise<Student[]> {
    const { data } = await baseApi.get<Student[]>(
      `/principal/branches/${encodeURIComponent(branchId)}/students`
    );
    return data;
  }

  async getFeeTemplates(branchId: string): Promise<any[]> {
    const { data } = await baseApi.get<any[]>(
      `/principal/branches/${encodeURIComponent(branchId)}/fee-templates`
    );
    return data;
  }

  async getErpPayments(): Promise<ErpPayment[]> {
    const { data } = await baseApi.get<ErpPayment[]>("/principal/erp/payments");
    return data;
  }
}

export default new PrincipalApiService();
