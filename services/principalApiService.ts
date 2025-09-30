// services/principalApiService.ts

// ✅ STEP 1: Consolidate imports. Only 'baseApi' for communication and 'types' for contracts are needed.
//    All dependencies on local database, helpers, and other services are severed.
import baseApi from "./baseApiService";
import type {
  User,
  Teacher,
  FacultyApplication,
  TeacherProfile,
  Branch,
  PrincipalDashboardData,
  SchoolEvent,
  FeeRectificationRequest,
  TeacherAttendanceRectificationRequest,
  LeaveApplication,
  ComplaintAboutStudent,
  TeacherComplaint,
  FeeAdjustment,
  Announcement,
  SmsMessage,
  Examination,
  StudentWithExamMarks,
  SuspensionRecord,
  PrincipalAttendanceOverview,
  PrincipalFinancialsOverview,
  ManualExpense,
  PayrollStaffDetails,
  ManualSalaryAdjustment,
  PayrollRecord,
  PrincipalQuery,
  ErpFinancials,
  ErpPayment,
} from "../types";

// ✅ STEP 2: Rebuild the class. Every method is now a direct, purposeful API call.
//    The principal and branch are identified by the backend via the auth token, simplifying signatures.
export class PrincipalApiService {
  // --- School & Profile Management ---

  async requestProfileAccessOtp(): Promise<void> {
    await baseApi.post("/principal/profile/request-otp");
  }

  async verifyProfileAccessOtp(otp: string): Promise<boolean> {
    const { data } = await baseApi.post("/principal/profile/verify-otp", {
      otp,
    });
    return data;
  }

  async updateBranchDetails(updates: Partial<Branch>): Promise<void> {
    await baseApi.put("/principal/branch-details", updates);
  }

  async getPrincipalDashboardData(): Promise<PrincipalDashboardData> {
    // A single, powerful endpoint that delegates all complex aggregation to the backend.
    const { data } = await baseApi.get<PrincipalDashboardData>(
      "/principal/dashboard"
    );
    return data;
  }

  // --- Staff & Faculty Management ---

  async getFacultyApplications(): Promise<FacultyApplication[]> {
    const { data } = await baseApi.get<FacultyApplication[]>(
      "/principal/faculty/applications"
    );
    return data;
  }

  async getStaff(): Promise<(User & Partial<Teacher>)[]> {
    const { data } = await baseApi.get<(User & Partial<Teacher>)[]>(
      "/principal/staff"
    );
    return data;
  }

  async approveFacultyApplication(
    appId: string,
    salary: number
  ): Promise<{ credentials: { id: string; password: string } }> {
    const { data } = await baseApi.put(
      `/principal/faculty/applications/${appId}/approve`,
      { salary }
    );
    return data;
  }

  async rejectFacultyApplication(appId: string): Promise<void> {
    await baseApi.put(`/principal/faculty/applications/${appId}/reject`);
  }

  async createStaffMember(staffData: {
    name: string;
    email: string;
    phone: string;
    role: "Registrar" | "Librarian";
    salary: number;
  }): Promise<{ credentials: { id: string; password: string } }> {
    const { data } = await baseApi.post("/principal/staff", staffData);
    return data;
  }

  async suspendStaff(staffId: string): Promise<void> {
    await baseApi.put(`/principal/staff/${staffId}/suspend`);
  }

  async reinstateStaff(staffId: string): Promise<void> {
    await baseApi.put(`/principal/staff/${staffId}/reinstate`);
  }

  async deleteStaff(staffId: string): Promise<void> {
    await baseApi.delete(`/principal/staff/${staffId}`);
  }

  async getTeacherProfileDetails(teacherId: string): Promise<TeacherProfile> {
    const { data } = await baseApi.get<TeacherProfile>(
      `/principal/teachers/${teacherId}/profile`
    );
    return data;
  }

  async updateTeacher(
    teacherId: string,
    updates: Partial<Teacher>
  ): Promise<void> {
    await baseApi.put(`/principal/teachers/${teacherId}`, updates);
  }

  // --- Academics & Student Management ---

  async getPrincipalClassView(): Promise<any[]> {
    const { data } = await baseApi.get<any[]>("/principal/classes/view");
    return data;
  }

  async getExaminationsWithResultStatus(): Promise<Examination[]> {
    const { data } = await baseApi.get<Examination[]>(
      "/principal/examinations"
    );
    return data;
  }

  async publishExaminationResults(examinationId: string): Promise<void> {
    await baseApi.put(`/principal/examinations/${examinationId}/publish`);
  }

  async getStudentResultsForExamination(
    examinationId: string
  ): Promise<StudentWithExamMarks[]> {
    const { data } = await baseApi.get<StudentWithExamMarks[]>(
      `/principal/examinations/${examinationId}/results`
    );
    return data;
  }

  async getAttendanceOverview(): Promise<PrincipalAttendanceOverview> {
    const { data } = await baseApi.get<PrincipalAttendanceOverview>(
      "/principal/attendance/overview"
    );
    return data;
  }

  // --- Requests & Approvals ---

  async getFeeRectificationRequests(): Promise<FeeRectificationRequest[]> {
    const { data } = await baseApi.get<FeeRectificationRequest[]>(
      "/principal/requests/fees"
    );
    return data;
  }

  async processFeeRectificationRequest(
    requestId: string,
    status: "Approved" | "Rejected"
  ): Promise<void> {
    await baseApi.put(`/principal/requests/fees/${requestId}/process`, {
      status,
    });
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
    status: "Approved" | "Rejected"
  ): Promise<void> {
    await baseApi.put(`/principal/requests/attendance/${requestId}/process`, {
      status,
    });
  }

  async getLeaveApplications(): Promise<LeaveApplication[]> {
    const { data } = await baseApi.get<LeaveApplication[]>(
      "/principal/requests/leaves"
    );
    return data;
  }

  async processLeaveApplication(
    requestId: string,
    status: "Approved" | "Rejected"
  ): Promise<void> {
    await baseApi.put(`/principal/requests/leaves/${requestId}/process`, {
      status,
    });
  }

  // --- Grievances & Discipline ---

  async raiseComplaintAboutStudent(
    complaintData: Omit<ComplaintAboutStudent, "id" | "submittedAt">
  ): Promise<void> {
    await baseApi.post("/principal/complaints/student", complaintData);
  }

  async getComplaintsAboutStudents(): Promise<ComplaintAboutStudent[]> {
    const { data } = await baseApi.get<ComplaintAboutStudent[]>(
      "/principal/complaints/student"
    );
    return data;
  }

  async getTeacherComplaints(): Promise<TeacherComplaint[]> {
    const { data } = await baseApi.get<TeacherComplaint[]>(
      "/principal/complaints/teacher"
    );
    return data;
  }

  async getSuspensionRecords(): Promise<SuspensionRecord[]> {
    const { data } = await baseApi.get<SuspensionRecord[]>(
      "/principal/students/suspensions"
    );
    return data;
  }

  // --- Financials & Payroll ---

  async getFinancialsOverview(): Promise<PrincipalFinancialsOverview> {
    const { data } = await baseApi.get<PrincipalFinancialsOverview>(
      "/principal/financials/overview"
    );
    return data;
  }

  async addFeeAdjustment(
    studentId: string,
    type: "concession" | "charge",
    amount: number,
    reason: string
  ): Promise<void> {
    await baseApi.post(`/principal/students/${studentId}/fee-adjustments`, {
      type,
      amount,
      reason,
    });
  }

  async getManualExpenses(): Promise<ManualExpense[]> {
    const { data } = await baseApi.get<ManualExpense[]>("/principal/expenses");
    return data;
  }

  async addManualExpense(
    expenseData: Omit<ManualExpense, "id">
  ): Promise<void> {
    await baseApi.post("/principal/expenses", expenseData);
  }

  async addManualSalaryAdjustment(
    staffId: string,
    amount: number,
    reason: string,
    month: string
  ): Promise<void> {
    await baseApi.post("/principal/payroll/adjustments", {
      staffId,
      amount,
      reason,
      month,
    });
  }

  async getStaffPayrollForMonth(month: string): Promise<PayrollStaffDetails[]> {
    const { data } = await baseApi.get<PayrollStaffDetails[]>(
      "/principal/payroll",
      { params: { month } }
    );
    return data;
  }

  async processPayroll(payrollRecords: PayrollStaffDetails[]): Promise<void> {
    await baseApi.post("/principal/payroll/process", { payrollRecords });
  }

  // --- Communication & Events ---

  async getAnnouncements(): Promise<Announcement[]> {
    const { data } = await baseApi.get<Announcement[]>(
      "/principal/communication/announcements"
    );
    return data;
  }

  async getSmsHistory(): Promise<SmsMessage[]> {
    const { data } = await baseApi.get<SmsMessage[]>(
      "/principal/communication/sms-history"
    );
    return data;
  }

  async sendAnnouncement(announcementData: {
    title: string;
    message: string;
    audience: "All" | "Staff" | "Students" | "Parents";
  }): Promise<void> {
    await baseApi.post(
      "/principal/communication/announcements",
      announcementData
    );
  }

  async sendSmsToStudents(
    studentIds: string[],
    message: string
  ): Promise<{ success: boolean; count: number }> {
    const { data } = await baseApi.post("/principal/communication/sms", {
      studentIds,
      message,
    });
    return data;
  }

  async sendResultsSms(
    examinationId: string,
    messageTemplate: string
  ): Promise<void> {
    await baseApi.post(
      `/principal/examinations/${examinationId}/send-results-sms`,
      { messageTemplate }
    );
  }

  async clearAnnouncementsHistory(
    fromDate: string,
    toDate: string
  ): Promise<void> {
    await baseApi.post("/principal/communication/announcements/clear", {
      fromDate,
      toDate,
    });
  }

  async clearSmsHistory(fromDate: string, toDate: string): Promise<void> {
    await baseApi.post("/principal/communication/sms-history/clear", {
      fromDate,
      toDate,
    });
  }

  async createSchoolEvent(
    eventData: Omit<SchoolEvent, "id" | "status" | "createdAt">
  ): Promise<void> {
    await baseApi.post("/principal/events", eventData);
  }

  async updateSchoolEvent(
    eventId: string,
    eventData: Partial<SchoolEvent>
  ): Promise<void> {
    await baseApi.put(`/principal/events/${eventId}`, eventData);
  }

  async updateSchoolEventStatus(
    eventId: string,
    status: "Approved" | "Rejected"
  ): Promise<void> {
    await baseApi.put(`/principal/events/${eventId}/status`, { status });
  }

  // --- Admin & System ---

  async startNewAcademicSession(newStartDate: string): Promise<void> {
    await baseApi.post("/principal/academic-session/start", { newStartDate });
  }

  async payErpBill(amount: number, transactionId: string): Promise<void> {
    await baseApi.post("/principal/erp/pay", { amount, transactionId });
  }

  async raiseQueryToAdmin(
    queryData: Omit<PrincipalQuery, "id" | "submittedAt" | "status">
  ): Promise<PrincipalQuery> {
    const { data } = await baseApi.post<PrincipalQuery>(
      "/principal/queries",
      queryData
    );
    return data;
  }

  async getQueries(): Promise<PrincipalQuery[]> {
    const { data } = await baseApi.get<PrincipalQuery[]>("/principal/queries");
    return data;
  }

  async getErpPayments(): Promise<ErpPayment[]> {
    const { data } = await baseApi.get<ErpPayment[]>("/principal/erp/payments");
    return data;
  }

  async getErpFinancials(): Promise<ErpFinancials> {
    const { data } = await baseApi.get<ErpFinancials>(
      "/principal/erp/financials"
    );
    return data;
  }
}
