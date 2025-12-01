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
  SuspensionRecord,
  FeeRecord,
  AttendanceRecord,
  StudentProfile,
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

// Helper function to create a cache-busting config
const getCacheBustConfig = () => ({
  params: { _cacheBust: Date.now() },
});

export class PrincipalApiService {
  // ---------- Dashboard & Profile ----------
  async getPrincipalDashboardData(): Promise<PrincipalDashboardData> {
    const { data } = await baseApi.get<PrincipalDashboardData>(
      "/principal/dashboard",
      getCacheBustConfig() // Add cache bust
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

  async getBranchById(branchId: string): Promise<Branch> {
    const { data } = await baseApi.get<Branch>(
      `/branches/${encodeURIComponent(branchId)}`
    );
    return data;
  }

  async getBranchDetails(): Promise<Branch> {
    const { data } = await baseApi.get<Branch>(
      "/principal/branch",
      getCacheBustConfig()
    );
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
      "/principal/faculty-applications",
      getCacheBustConfig()
    );
    return data;
  }

  async approveFacultyApplication(
    applicationId: string,
    salary: number
  ): Promise<{ credentials: { userId: string; password: string } }> {
    const { data } = await baseApi.post<{
      credentials: { userId: string; password: string };
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
    // Merge passed config with cache-busting config
    const options = {
      ...config,
      params: {
        ...config.params,
        _cacheBust: Date.now(),
      },
    };
    const { data } = await baseApi.get<(User & Partial<Teacher>)[]>(
      "/principal/staff",
      options
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
      `/principal/teachers/${encodeURIComponent(teacherId)}/profile`,
      getCacheBustConfig()
    );
    return data;
  }
  async resetUserPassword(
    userId: string
  ): Promise<{ userId: string; newPassword: string }> {
    const { data } = await baseApi.post<{
      userId: string;
      newPassword: string;
    }>(`/principal/users/${encodeURIComponent(userId)}/reset-password`);
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
    const { data } = await baseApi.get<SchoolClass[]>(
      "/principal/class-view",
      getCacheBustConfig()
    );
    return data;
  }

  async getAttendanceOverview(
    config: any = {}
  ): Promise<PrincipalAttendanceOverview> {
    // Merge passed config with cache-busting config
    const options = {
      ...config,
      params: {
        ...config.params,
        _cacheBust: Date.now(),
      },
    };
    const { data } = await baseApi.get<PrincipalAttendanceOverview>(
      "/principal/attendance-overview",
      options // Pass combined options
    );
    return data;
  }

  async getAllStaff(config: any = {}): Promise<User[]> {
    return this.getStaff(config); // This already cache-busts
  }

  async getStaffAttendanceAndLeaveForMonth(
    staffId: string,
    year: number,
    month: number,
    config: any = {}
  ): Promise<{ attendance: any[]; leaves: any[] }> {
    const options = {
      ...config,
      params: {
        ...config.params,
        _cacheBust: Date.now(),
      },
    };
    try {
      const { data } = await baseApi.get(
        `/principal/staff/${staffId}/attendance/${year}/${month}`,
        options
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
      "/principal/examinations",
      getCacheBustConfig()
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
      `/principal/examinations/${encodeURIComponent(examId)}/results`,
      getCacheBustConfig()
    );
    return data;
  }

  async getStudents(): Promise<Student[]> {
    const { data } = await baseApi.get<Student[]>(
      "/principal/students",
      getCacheBustConfig()
    );
    return data;
  }

  async getStudentProfileDetails(studentId: string): Promise<StudentProfile> {
    const { data } = await baseApi.get<StudentProfile>(
      `/principal/students/${encodeURIComponent(studentId)}/profile`,
      getCacheBustConfig()
    );
    return data;
  }
  async getSchoolClasses(): Promise<SchoolClass[]> {
    const { data } = await baseApi.get<SchoolClass[]>(
      "/principal/classes",
      getCacheBustConfig()
    );
    return data;
  }
  async getSuspensionRecords(): Promise<SuspensionRecord[]> {
    const { data } = await baseApi.get<SuspensionRecord[]>(
      "/principal/suspension-records",
      getCacheBustConfig()
    );
    return data;
  }
  async getFeeRecords(): Promise<FeeRecord[]> {
    const { data } = await baseApi.get<FeeRecord[]>(
      "/principal/fee-records",
      getCacheBustConfig()
    );
    return data;
  }
  async getAttendanceRecords(): Promise<AttendanceRecord[]> {
    const { data } = await baseApi.get<AttendanceRecord[]>(
      "/principal/attendance-records",
      getCacheBustConfig()
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
      `/principal/payroll/${encodeURIComponent(month)}`,
      getCacheBustConfig()
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
      "/principal/erp-financials",
      getCacheBustConfig()
    );
    return data;
  }

  async payErpBill(amount: number, transactionId: string) {
    await baseApi.post("/principal/erp-bill/pay", { amount, transactionId });
  }

  async getManualExpenses(): Promise<ManualExpense[]> {
    const { data } = await baseApi.get<ManualExpense[]>(
      "/principal/manual-expenses",
      getCacheBustConfig()
    );
    return data;
  }

  async addManualExpense(payload: Omit<ManualExpense, "id">) {
    await baseApi.post("/principal/manual-expenses", payload);
  }

  async getErpPaymentsForBranch(branchId: string): Promise<ErpPayment[]> {
    const { data } = await baseApi.get<ErpPayment[]>(
      "/principal/erp/payments",
      getCacheBustConfig()
    );
    return data;
  }

  // ---------- Staff Requests ----------
  async getFeeRectificationRequests(): Promise<FeeRectificationRequest[]> {
    const { data } = await baseApi.get<FeeRectificationRequest[]>(
      "/principal/requests/fees",
      getCacheBustConfig()
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
      "/principal/requests/attendance",
      getCacheBustConfig()
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
      "/principal/requests/leave",
      getCacheBustConfig()
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
    const { data } = await baseApi.get<Complaint[]>(
      "/principal/complaints",
      getCacheBustConfig()
    );
    return data;
  }

  async getComplaintsAboutStudents(): Promise<ComplaintAboutStudent[]> {
    const { data } = await baseApi.get<ComplaintAboutStudent[]>(
      "/principal/complaints/student",
      getCacheBustConfig()
    );
    return data;
  }

  async getComplaintsForBranch(): Promise<TeacherComplaint[]> {
    const { data } = await baseApi.get<TeacherComplaint[]>(
      "/principal/complaints/teacher",
      getCacheBustConfig()
    );
    return data;
  }
  async getTeacherComplaints(): Promise<TeacherComplaint[]> {
    const { data } = await baseApi.get<TeacherComplaint[]>(
      "/principal/complaints/teacher",
      getCacheBustConfig()
    );
    return data;
  }

  async clearTeacherComplaints(): Promise<void> {
    await baseApi.delete("/principal/complaints/teacher/clear");
  }

  async clearStudentComplaints(): Promise<void> {
    await baseApi.delete("/principal/complaints/student/clear");
  }

  async getSuspensions(): Promise<any[]> {
    const { data } = await baseApi.get<any[]>("/principal/suspensions");
    return data;
  }

  // ---------- Communication & Events ----------
  async getAnnouncements(): Promise<Announcement[]> {
    const { data } = await baseApi.get<Announcement[]>(
      "/principal/announcements",
      getCacheBustConfig()
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
    const { data } = await baseApi.get<SmsMessage[]>(
      "/principal/sms-history",
      getCacheBustConfig()
    );
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
    const { data } = await baseApi.get<SchoolEvent[]>(
      "/principal/events",
      getCacheBustConfig()
    );
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
    const { data } = await baseApi.get<PrincipalQuery[]>(
      "/principal/queries",
      getCacheBustConfig()
    );
    return data;
  }
  async getQueries(): Promise<PrincipalQuery[]> {
    const { data } = await baseApi.get<PrincipalQuery[]>(
      "/principal/queries",
      getCacheBustConfig()
    );
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
      `/principal/branches/${encodeURIComponent(branchId)}/teachers`,
      getCacheBustConfig()
    );
    return data;
  }

  async getPrincipalClassViewByBranch(
    branchId: string
  ): Promise<SchoolClass[]> {
    const { data } = await baseApi.get<SchoolClass[]>(
      `/principal/branches/${encodeURIComponent(branchId)}/classes`,
      getCacheBustConfig()
    );
    return data;
  }

  async getClassDetails(classId: string): Promise<ClassDetails> {
    const { data } = await baseApi.get<ClassDetails>(
      `/principal/classes/${encodeURIComponent(classId)}/details`,
      getCacheBustConfig()
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
      `/principal/branches/${encodeURIComponent(branchId)}/students`,
      getCacheBustConfig()
    );
    return data;
  }

  async getFeeTemplates(branchId: string): Promise<any[]> {
    const { data } = await baseApi.get<any[]>(
      `/principal/branches/${encodeURIComponent(branchId)}/fee-templates`,
      getCacheBustConfig()
    );
    return data;
  }

  async getErpPayments(): Promise<ErpPayment[]> {
    const { data } = await baseApi.get<ErpPayment[]>(
      "/principal/erp/payments",
      getCacheBustConfig()
    );
    return data;
  }
}

export default new PrincipalApiService();
