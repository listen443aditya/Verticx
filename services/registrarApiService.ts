// services/registrarApiService.ts

import baseApi from "./baseApiService";
import type {
  User,
  Student,
  Teacher,
  SchoolClass,
  Subject,
  FeeTemplate,
  Application,
  RegistrarDashboardData,
  SuspensionRecord,
  RectificationRequest,
  SyllabusChangeRequest,
  ExamMarkRectificationRequest,
  Announcement,
  SmsMessage,
  SchoolDocument,
  Hostel,
  Room,
  FeeRecord,
  BusStop,
  AttendanceRecord,
  InventoryItem,
  InventoryLog,
  TransportRoute,
  Examination,
  ExamSchedule,
  ClassFeeSummary,
  TimetableConfig,
  TimetableSlot,
  DefaulterDetails,
  SchoolEvent,
  TeacherAttendanceRecord,
  LeaveApplication,
  LeaveSetting,
  AttendanceListItem,
  FacultyApplication,
  ClassDetails,
  StudentProfile,
  FeeRectificationRequest,
} from "../types";

export class RegistrarApiService {
  // --- Dashboard ---
  async getRegistrarDashboardData(): Promise<RegistrarDashboardData> {
    const { data } = await baseApi.get<RegistrarDashboardData>(
      "/registrar/dashboard"
    );
    return data;
  }

  // --- Admissions & Applications ---
  async getApplications(): Promise<Application[]> {
    const { data } = await baseApi.get<Application[]>(
      "/registrar/admissions/applications"
    );
    return data;
  }

  async updateApplicationStatus(
    appId: string,
    status: "approved" | "denied"
  ): Promise<void> {
    await baseApi.put(`/registrar/admissions/applications/${appId}/status`, {
      status,
    });
  }

  async getFacultyApplications(): Promise<FacultyApplication[]> {
    const { data } = await baseApi.get<FacultyApplication[]>(
      "/registrar/faculty/applications"
    );
    return data;
  }

  async submitFacultyApplication(data: Partial<Teacher>): Promise<void> {
    await baseApi.post("/registrar/faculty/applications", data);
  }

  async admitStudent(
    studentData: Partial<Student>
  ): Promise<{ credentials: { id: string; password: string } }> {
    // Nest the payload inside a `studentData` object to match the backend
    const { data } = await baseApi.post("/registrar/admissions/admit-student", {
      studentData,
    });
    return data;
  }

  // --- Student Information System ---
  async getStudentsByBranch(
    branchId: string,
    config: any = {}
  ): Promise<Student[]> {
    // Merge the required branchId param with any extra config (like cache-busting)
    const options = {
      ...config,
      params: {
        ...config.params,
        branchId,
      },
    };

    const { data } = await baseApi.get<Student[]>(
      "/registrar/students",
      options
    );
    return data;
  }

  // Add this method inside your RegistrarApiService class

  async getStudentProfileDetails(studentId: string): Promise<StudentProfile> {
    try {
      const response = await baseApi.get<StudentProfile>(
        `/registrar/students/${studentId}/profile`
      );
      return response.data;
    } catch (error) {
      console.error(
        `Failed to fetch profile for student ID ${studentId}:`,
        error
      );
      throw new Error("Could not retrieve student profile details.");
    }
  }

  async getStudentsByGrade(gradeLevel: number): Promise<Student[]> {
    const { data } = await baseApi.get<Student[]>(`/registrar/students`, {
      params: { grade: gradeLevel },
    });
    return data;
  }
  async getStudents(): Promise<Student[]> {
    const { data } = await baseApi.get<Student[]>("/registrar/students");
    return data;
  }
  async getSchoolClasses(): Promise<SchoolClass[]> {
    const { data } = await baseApi.get<SchoolClass[]>("/registrar/classes");
    return data;
  }
  async getSuspensionRecords(): Promise<SuspensionRecord[]> {
    const { data } = await baseApi.get<SuspensionRecord[]>(
      "/registrar/suspension-records"
    );
    return data;
  }
  async getFeeRecords(): Promise<FeeRecord[]> {
    const { data } = await baseApi.get<FeeRecord[]>("/registrar/fee-records");
    return data;
  }
  async getAttendanceRecords(): Promise<AttendanceRecord[]> {
    const { data } = await baseApi.get<AttendanceRecord[]>(
      "/registrar/attendance-records"
    );
    return data;
  }

  async updateStudent(
    studentId: string,
    updates: Partial<Student>
  ): Promise<void> {
    await baseApi.patch(`/registrar/students/${studentId}`, updates);
  }

  async deleteStudent(studentId: string): Promise<void> {
    await baseApi.delete(`/registrar/students/${studentId}`);
  }

  async suspendStudent(
    studentId: string,
    reason: SuspensionRecord["reason"],
    endDate: string
  ): Promise<void> {
    await baseApi.put(`/registrar/students/${studentId}/suspend`, {
      reason,
      endDate,
    });
  }

  async removeSuspension(studentId: string): Promise<void> {
    await baseApi.put(`/registrar/students/${studentId}/reinstate`);
  }

  async markFeesAsPaidAndUnsuspend(studentId: string): Promise<void> {
    await baseApi.put(`/registrar/students/${studentId}/pay-and-reinstate`);
  }

  async promoteStudents(
    studentIds: string[],
    targetClassId: string,
    academicSession: string
  ): Promise<void> {
    await baseApi.post("/registrar/students/promote", {
      studentIds,
      targetClassId,
      academicSession,
    });
  }

  async demoteStudents(
    studentIds: string[],
    targetClassId: string
  ): Promise<void> {
    await baseApi.post("/registrar/students/demote", {
      studentIds,
      targetClassId,
    });
  }

  // async getSuspensionRecords(): Promise<SuspensionRecord[]> {
  //   const { data } = await baseApi.get<SuspensionRecord[]>(
  //     "/registrar/students/suspensions"
  //   );
  //   return data;
  // }

  async resetStudentAndParentPasswords(studentId: string): Promise<{
    student: { id: string; pass: string };
    parent: { id: string; pass: string } | null;
  }> {
    const { data } = await baseApi.post(
      `/registrar/students/${studentId}/reset-passwords`
    );
    return data;
  }

  // --- Faculty & Staff Information System ---
  async getAllStaff(
    config: any = {}
  ): Promise<(User & Teacher & { attendancePercentage?: number })[]> {
    const { data } = await baseApi.get<
      (User & Teacher & { attendancePercentage?: number })[]
    >("/registrar/staff/all", config); // Pass config to baseApi
    return data;
  }

  async getSupportStaff(): Promise<User[]> {
    const { data } = await baseApi.get<User[]>("/registrar/staff/support");
    return data;
  }

  async createSupportStaff(data: {
    name: string;
    email: string;
    phone?: string;
    designation: string;
    salary: number;
  }): Promise<{ credentials: { id: string; password: string } }> {
    const { data: responseData } = await baseApi.post(
      "/registrar/staff/support",
      data
    );
    return responseData;
  }

  async updateTeacher(
    teacherId: string,
    updates: Partial<Teacher>
  ): Promise<void> {
    await baseApi.put(`/registrar/teachers/${teacherId}`, updates);
  }

  async updateSupportStaff(
    staffId: string,
    updates: Partial<User>
  ): Promise<void> {
    await baseApi.put(`/registrar/staff/support/${staffId}`, updates);
  }

  async deleteSupportStaff(staffId: string): Promise<void> {
    await baseApi.delete(`/registrar/staff/support/${staffId}`);
  }

  // --- Class & Subject Management ---
  // async getSchoolClasses(): Promise<SchoolClass[]> {
  //   const { data } = await baseApi.get<SchoolClass[]>("/registrar/classes");
  //   return data;
  // }

  async getStudentsForClass(classId: string): Promise<Student[]> {
    const { data } = await baseApi.get<Student[]>(
      `/registrar/classes/${classId}/students`
    );
    return data;
  }

  async getSubjects(): Promise<Subject[]> {
    const { data } = await baseApi.get<Subject[]>("/registrar/subjects");
    return data;
  }

  async createSubject(data: {
    name: string;
    teacherId?: string;
  }): Promise<void> {
    await baseApi.post("/registrar/subjects", data);
  }

  async updateSubject(
    subjectId: string,
    updates: Partial<Subject>
  ): Promise<void> {
    await baseApi.put(`/registrar/subjects/${subjectId}`, updates);
  }

  async createSchoolClass(data: {
    gradeLevel: number;
    section: string;
  }): Promise<void> {
    await baseApi.post("/registrar/classes", data);
  }

  async updateSchoolClass(
    classId: string,
    data: { gradeLevel: number; section: string }
  ): Promise<void> {
    await baseApi.put(`/registrar/classes/${classId}`, data);
  }

  async deleteSchoolClass(classId: string): Promise<void> {
    await baseApi.delete(`/registrar/classes/${classId}`);
  }

  async updateClassSubjects(
    classId: string,
    subjectIds: string[]
  ): Promise<void> {
    await baseApi.put(`/registrar/classes/${classId}/subjects`, { subjectIds });
  }

  async assignStudentsToClass(
    classId: string,
    studentIds: string[]
  ): Promise<void> {
    await baseApi.post(`/registrar/classes/${classId}/students`, {
      studentIds,
    });
  }

  async removeStudentFromClass(
    classId: string,
    studentId: string
  ): Promise<void> {
    await baseApi.delete(`/registrar/classes/${classId}/students/${studentId}`);
  }

  async assignClassMentor(classId: string, teacherId: string): Promise<void> {
    await baseApi.put(`/registrar/classes/${classId}/assign-mentor`, {
      teacherId,
    });
  }

  // async updateSubject(
  //   subjectId: string,
  //   updates: Partial<Subject>
  // ): Promise<void> {
  //   await baseApi.put(`/registrar/subjects/${subjectId}`, updates);
  // }

  async deleteSubject(subjectId: string): Promise<void> {
    await baseApi.delete(`/registrar/subjects/${subjectId}`);
  }

  // --- Fee Management ---
  async getFeeTemplates(): Promise<FeeTemplate[]> {
    const { data } = await baseApi.get<FeeTemplate[]>(
      "/registrar/fees/templates"
    );
    return data;
  }

  async createFeeTemplate(template: Omit<FeeTemplate, "id">): Promise<void> {
    await baseApi.post("/registrar/fees/templates", template);
  }

  async assignFeeTemplateToClass(
    classId: string,
    feeTemplateId: string
  ): Promise<void> {
    await baseApi.put(`/registrar/classes/${classId}/assign-fee-template`, {
      feeTemplateId,
    });
  }

  async requestFeeTemplateUpdate(
    templateId: string,
    newData: Partial<FeeTemplate>,
    reason: string
  ): Promise<void> {
    await baseApi.post(
      `/registrar/fees/templates/${templateId}/request-update`,
      { newData, reason }
    );
  }

  async requestFeeTemplateDeletion(
    templateId: string,
    reason: string
  ): Promise<void> {
    await baseApi.post(
      `/registrar/fees/templates/${templateId}/request-delete`,
      { reason }
    );
  }

  async getClassFeeSummaries(): Promise<ClassFeeSummary[]> {
    const { data } = await baseApi.get<ClassFeeSummary[]>(
      "/registrar/fees/class-summaries"
    );
    return data;
  }

  async getDefaultersForClass(classId: string): Promise<DefaulterDetails[]> {
    const { data } = await baseApi.get<DefaulterDetails[]>(
      `/registrar/fees/classes/${classId}/defaulters`
    );
    return data;
  }

  // --- Attendance Monitoring ---
  async getDailyAttendanceForClass(
    classId: string,
    date: string
  ): Promise<{ isSaved: boolean; attendance: AttendanceListItem[] }> {
    const { data } = await baseApi.get(
      `/registrar/classes/${classId}/attendance`,
      { params: { date } }
    );
    return data;
  }

  async getTeacherAttendance(
    date: string
  ): Promise<{ isSaved: boolean; attendance: TeacherAttendanceRecord[] }> {
    const { data } = await baseApi.get("/registrar/staff/attendance", {
      params: { date },
    });
    return data;
  }

  async saveTeacherAttendance(
    records: Omit<TeacherAttendanceRecord, "id">[]
  ): Promise<void> {
    await baseApi.post("/registrar/staff/attendance", {
      attendanceData: records,
    });
  }

  // --- Timetable Management ---
  async getTimetableConfig(
    classId: string,
    config: any = {}
  ): Promise<TimetableConfig | null> {
    const options = {
      ...config,
      params: { ...config.params },
    };
    const { data } = await baseApi.get<TimetableConfig | null>(
      `/registrar/classes/${classId}/timetable-config`,
      options
    );
    return data;
  }

  async createTimetableConfig(
    classId: string,
    timeSlots: { startTime: string; endTime: string }[]
  ): Promise<void> {
    await baseApi.post(`/registrar/classes/${classId}/timetable-config`, {
      timeSlots,
    });
  }

  async getTimetableForClass(
    classId: string,
    config: any = {}
  ): Promise<TimetableSlot[]> {
    const options = {
      ...config,
      params: { ...config.params },
    };
    const { data } = await baseApi.get<TimetableSlot[]>(
      `/registrar/classes/${classId}/timetable`,
      options
    );
    return data;
  }

  async getAvailableTeachersForSlot(
    day: string,
    startTime: string
  ): Promise<Teacher[]> {
    const { data } = await baseApi.get<Teacher[]>(
      "/registrar/timetable/available-teachers",
      { params: { day, startTime } }
    );
    return data;
  }

  async setTimetableSlot(slotData: Omit<TimetableSlot, "id">): Promise<void> {
    await baseApi.post("/registrar/timetable/slots", slotData);
  }

  async deleteTimetableSlot(slotId: string): Promise<void> {
    await baseApi.delete(`/registrar/timetable/slots/${slotId}`);
  }

  // --- Academic & Leave Requests ---
  async getRectificationRequests(): Promise<RectificationRequest[]> {
    const { data } = await baseApi.get<RectificationRequest[]>(
      "/registrar/requests/grade-attendance"
    );
    return data;
  }
  async getStaffAttendanceAndLeaveForMonth(
    staffId: string,
    year: number,
    month: number,
    config: any = {} // Add config
  ): Promise<{
    attendance: TeacherAttendanceRecord[];
    leaves: LeaveApplication[];
  }> {
    try {
      const { data } = await baseApi.get(
        `/registrar/staff/${staffId}/attendance/${year}/${month}`,
        config // Pass config
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

  async getSyllabusChangeRequests(): Promise<SyllabusChangeRequest[]> {
    const { data } = await baseApi.get<SyllabusChangeRequest[]>(
      "/registrar/requests/syllabus"
    );
    return data;
  }

  async getExamMarkRectificationRequests(): Promise<
    ExamMarkRectificationRequest[]
  > {
    const { data } = await baseApi.get<ExamMarkRectificationRequest[]>(
      "/registrar/requests/exam-marks"
    );
    return data;
  }

  async processRectificationRequest(
    requestId: string,
    status: "Approved" | "Rejected"
  ): Promise<void> {
    await baseApi.put(
      `/registrar/requests/grade-attendance/${requestId}/process`,
      { status }
    );
  }

  async processExamMarkRectificationRequest(
    requestId: string,
    status: "Approved" | "Rejected"
  ): Promise<void> {
    await baseApi.put(`/registrar/requests/exam-marks/${requestId}/process`, {
      status,
    });
  }

  async processSyllabusChangeRequest(
    requestId: string,
    status: "Approved" | "Rejected"
  ): Promise<void> {
    await baseApi.put(`/registrar/requests/syllabus/${requestId}/process`, {
      status,
    });
  }

  async getLeaveSettings(config: any = {}): Promise<LeaveSetting | null> {
    const { data } = await baseApi.get<LeaveSetting | null>(
      "/registrar/leaves/settings",
      config
    );
    return data;
  }

  async createLeaveApplication(
    data: Omit<LeaveApplication, "id" | "status" | "applicant">
  ): Promise<void> {
    await baseApi.post("/registrar/leaves/applications", data);
  }
  async updateLeaveSettings(settings: LeaveSetting): Promise<void> {
    await baseApi.put("/registrar/leaves/settings", settings);
  }

  async getLeaveApplications(config: any = {}): Promise<LeaveApplication[]> {
    const { data } = await baseApi.get<LeaveApplication[]>(
      "/registrar/leaves/my-applications",
      config
    );
    return data;
  }
  async processLeaveApplication(
    requestId: string,
    status: "Approved" | "Rejected"
  ): Promise<void> {
    await baseApi.put(`/registrar/leaves/applications/${requestId}/process`, {
      status,
    });
  }

  // --- Examination Management ---
  async getExaminations(): Promise<Examination[]> {
    const { data } = await baseApi.get<Examination[]>(
      "/registrar/examinations"
    );
    return data;
  }

  async createExamination(data: {
    name: string;
    startDate: string;
    endDate: string;
  }): Promise<void> {
    await baseApi.post("/registrar/examinations", data);
  }

  async getExamSchedules(examinationId: string): Promise<ExamSchedule[]> {
    const { data } = await baseApi.get<ExamSchedule[]>(
      `/registrar/examinations/${examinationId}/schedules`
    );
    return data;
  }

  async createExamSchedule(data: Omit<ExamSchedule, "id">): Promise<void> {
    await baseApi.post("/registrar/examinations/schedules", data);
  }

  // --- Communication, Documents & Events ---
  async getAnnouncements(): Promise<Announcement[]> {
    const { data } = await baseApi.get<Announcement[]>(
      "/registrar/communication/announcements"
    );
    return data;
  }

  async sendAnnouncement(data: {
    title: string;
    message: string;
    audience: "All" | "Staff" | "Students" | "Parents";
  }): Promise<void> {
    await baseApi.post("/registrar/communication/announcements", data);
  }

  async getSmsHistory(): Promise<SmsMessage[]> {
    const { data } = await baseApi.get<SmsMessage[]>(
      "/registrar/communication/sms-history"
    );
    return data;
  }

  async sendSmsToStudents(
    studentIds: string[],
    message: string
  ): Promise<{ success: boolean; count: number }> {
    const { data } = await baseApi.post("/registrar/communication/sms", {
      studentIds,
      message,
    });
    return data;
  }

  async getSchoolDocuments(): Promise<SchoolDocument[]> {
    const { data } = await baseApi.get<SchoolDocument[]>(
      "/registrar/documents"
    );
    return data;
  }
  async createSchoolDocument(data: {
    name: string;
    type: "Student" | "Staff";
    ownerId: string;
    fileUrl: string;
  }): Promise<SchoolDocument> {
    const { data: newDocument } = await baseApi.post<SchoolDocument>(
      "/registrar/documents",
      data
    );
    return newDocument;
  }

  // FIX: Added missing getSchoolEvents method
  async getSchoolEvents(): Promise<SchoolEvent[]> {
    const { data } = await baseApi.get<SchoolEvent[]>("/registrar/events");
    return data;
  }

  async createSchoolEvent(
    eventData: Omit<SchoolEvent, "id" | "status" | "createdAt">
  ): Promise<void> {
    await baseApi.post("/registrar/events", eventData);
  }

  async updateSchoolEvent(
    eventId: string,
    eventData: Partial<SchoolEvent>
  ): Promise<void> {
    await baseApi.put(`/registrar/events/${eventId}`, eventData);
  }

  // FIX: Added missing deleteSchoolEvent method
  async deleteSchoolEvent(eventId: string): Promise<void> {
    await baseApi.delete(`/registrar/events/${eventId}`);
  }

  // --- Hostel Management ---
  async getHostels(): Promise<Hostel[]> {
    const { data } = await baseApi.get<Hostel[]>("/registrar/hostels");
    return data;
  }

  async getAllRoomsByBranch(): Promise<Room[]> {
    const { data } = await baseApi.get<Room[]>("/registrar/hostels/all-rooms");
    return data;
  }

  async createHostel(hostelData: Hostel): Promise<void> {
    await baseApi.post("/registrar/hostels", hostelData);
  }

  async updateHostel(
    hostelId: string,
    data: Partial<Hostel & { rooms: Partial<Room>[] }>
  ): Promise<void> {
    await baseApi.put(`/registrar/hostels/${hostelId}`, data);
  }

  async deleteHostel(hostelId: string): Promise<void> {
    await baseApi.delete(`/registrar/hostels/${hostelId}`);
  }

  async getRooms(hostelId: string): Promise<Room[]> {
    const { data } = await baseApi.get<Room[]>(
      `/registrar/hostels/${hostelId}/rooms`
    );
    return data;
  }

  async assignStudentToRoom(studentId: string, roomId: string): Promise<void> {
    await baseApi.post(`/registrar/hostels/rooms/${roomId}/assign-student`, {
      studentId,
    });
  }

  async removeStudentFromRoom(studentId: string): Promise<void> {
    await baseApi.delete(
      `/registrar/hostels/rooms/remove-student/${studentId}`
    );
  }

  // --- Inventory Management ---
  async getInventory(): Promise<InventoryItem[]> {
    const { data } = await baseApi.get<InventoryItem[]>(
      "/registrar/inventory/items"
    );
    return data;
  }

  async getInventoryLogs(): Promise<InventoryLog[]> {
    const { data } = await baseApi.get<InventoryLog[]>(
      "/registrar/inventory/logs"
    );
    return data;
  }

  async createInventoryItem(
    data: Partial<InventoryItem>,
    reason: string
  ): Promise<void> {
    await baseApi.post("/registrar/inventory/items", { data, reason });
  }

  async updateInventoryItem(
    itemId: string,
    data: Partial<InventoryItem>,
    reason: string
  ): Promise<void> {
    await baseApi.put(`/registrar/inventory/items/${itemId}`, { data, reason });
  }

  async deleteInventoryItem(itemId: string): Promise<void> {
    await baseApi.delete(`/registrar/inventory/items/${itemId}`);
  }

  // --- Transport Management ---
  async getTransportRoutes(): Promise<TransportRoute[]> {
    const { data } = await baseApi.get<TransportRoute[]>(
      "/registrar/transport/routes"
    );
    return data;
  }

  async createTransportRoute(routeData: TransportRoute): Promise<void> {
    await baseApi.post("/registrar/transport/routes", routeData);
  }

  async updateTransportRoute(
    routeId: string,
    data: Partial<TransportRoute>
  ): Promise<void> {
    await baseApi.put(`/registrar/transport/routes/${routeId}`, data);
  }

  async deleteTransportRoute(routeId: string): Promise<void> {
    await baseApi.delete(`/registrar/transport/routes/${routeId}`);
  }

  async getUnassignedMembers(): Promise<{
    students: Student[];
    teachers: Teacher[];
  }> {
    const { data } = await baseApi.get<{
      students: Student[];
      teachers: Teacher[];
    }>("/registrar/transport/unassigned-members");
    return data;
  }

  async assignMemberToRoute(
    routeId: string,
    memberId: string,
    memberType: "Student" | "Teacher",
    stopId: string
  ): Promise<void> {
    await baseApi.post(`/registrar/transport/routes/${routeId}/assign-member`, {
      memberId,
      memberType,
      stopId,
    });
  }

  async removeMemberFromRoute(
    routeId: string,
    memberId: string
  ): Promise<void> {
    await baseApi.delete(
      `/registrar/transport/routes/${routeId}/remove-member/${memberId}`
    );
  }
  async getTransportDetailsForMember(
    memberId: string,
    memberType: "Teacher" | "Student"
  ): Promise<{ route: TransportRoute; stop: BusStop } | null> {
    const { data } = await baseApi.get(`/registrar/transport/member-details`, {
      params: { memberId, memberType },
    });
    return data;
  }

  async getUserById(userId: string, config: any = {}): Promise<User> {
    try {
      const { data } = await baseApi.get<User>(
        `/registrar/user-details/${userId}`,
        config // Pass config
      );
      return data;
    } catch (error) {
      console.error(`Failed to fetch user details for ID ${userId}:`, error);
      throw new Error("Could not retrieve user details.");
    }
  }

  async getClassDetails(classId: string): Promise<ClassDetails> {
    try {
      // This endpoint must return data matching your ClassDetails interface
      const response = await baseApi.get<ClassDetails>(
        `/registrar/classes/${classId}`
      );
      return response.data;
    } catch (error) {
      // Log a specific error for easier debugging
      console.error(`Failed to fetch details for class ID ${classId}:`, error);
      // Re-throw the error so the component can handle it
      throw new Error("Could not retrieve class details from the server.");
    }
  }
}


