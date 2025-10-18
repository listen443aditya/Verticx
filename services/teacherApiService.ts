import baseApi from "./baseApiService";
import type {
  Teacher,
  Student,
  TeacherDashboardData,
  TimetableSlot,
  Assignment,
  AtRiskStudent,
  MeetingRequest,
  TeacherAttendanceRecord,
  TeacherCourse,
  Course,
  AttendanceRecord,
  MarkingTemplate,
  StudentMark,
  Quiz,
  QuizQuestion,
  StudentQuiz,
  QuizResult,
  Lecture,
  SyllabusChangeRequest,
  HydratedMeetingRequest,
  ExamSchedule,
  ExamMark,
  ExamMarkRectificationRequest,
  CourseContent,
  ComplaintAboutStudent,
  SkillAssessment,
  LeaveApplication,
  LibraryBook,
  Examination,
  HydratedSchedule,
  SchoolEvent, // Added for getSchoolEvents
  SchoolClass, // Added for class lookups
  Subject, // Added for subject lookups
  TransportRoute, // Added for transport lookups
  BusStop, // Added for transport lookups
} from "../types.ts";

export class TeacherApiService {

  
  async getTeacherDashboardData(
    //teacherId: string
  ): Promise<TeacherDashboardData> {
    const { data } = await baseApi.get<TeacherDashboardData>(
      "/teacher/dashboard",
      //{ params: { teacherId } }
    );
    return data;
  }

  // FIX: Added teacherId based on mandatory ID requirement.
  async getStudentsForTeacher(teacherId: string): Promise<Student[]> {
    const { data } = await baseApi.get<Student[]>("/teacher/students", {
      params: { teacherId },
    });
    return data;
  }

  // NEW: Added missing function to get students for a specific class.
  async getStudentsForClass(classId: string): Promise<Student[]> {
    const { data } = await baseApi.get<Student[]>(
      `/teacher/classes/${classId}/students`
    );
    return data;
  }

  // FIX: Added teacherId based on mandatory ID requirement.
  async getTeacherCourses(teacherId: string): Promise<TeacherCourse[]> {
    const { data } = await baseApi.get<TeacherCourse[]>("/teacher/courses", {
      params: { teacherId },
    });
    return data;
  }

  // NEW: Added missing function to get all courses for a branch.
  async getCoursesByBranch(branchId: string): Promise<Course[]> {
    const { data } = await baseApi.get<Course[]>(`/teacher/courses/by-branch`, {
      params: { branchId },
    });
    return data;
  }

  async findCourseByTeacherAndSubject(
    teacherId: string,
    subjectId: string
  ): Promise<Course | undefined> {
    const { data } = await baseApi.get<Course | undefined>(
      "/teacher/courses/find",
      { params: { teacherId, subjectId } }
    );
    return data;
  }

  // FIX: Renamed and added teacherId to match component calls and requirements.
  async getTeacherAttendance(
    teacherId: string
  ): Promise<TeacherAttendanceRecord[]> {
    const { data } = await baseApi.get<TeacherAttendanceRecord[]>(
      "/teacher/my-attendance",
      { params: { teacherId } }
    );
    return data;
  }

  // --- Assignments ---
  // FIX: Added teacherId based on mandatory ID requirement.
  async getAssignmentsByTeacher(teacherId: string): Promise<Assignment[]> {
    const { data } = await baseApi.get<Assignment[]>("/teacher/assignments", {
      params: { teacherId },
    });
    return data;
  }

  async createAssignment(
    assignmentData: Omit<Assignment, "id">
  ): Promise<void> {
    await baseApi.post("/teacher/assignments", assignmentData);
  }

  async updateAssignment(
    assignmentId: string,
    updates: Partial<Assignment>
  ): Promise<void> {
    await baseApi.put(`/teacher/assignments/${assignmentId}`, updates);
  }

  // --- Attendance & Gradebook ---
  async getAttendanceForCourse(
    courseId: string,
    date: string
  ): Promise<{ isSaved: boolean; attendance: AttendanceRecord[] }> {
    const { data } = await baseApi.get(
      `/teacher/courses/${courseId}/attendance`,
      { params: { date } }
    );
    return data;
  }

  async saveAttendance(records: AttendanceRecord[]): Promise<void> {
    await baseApi.post("/teacher/courses/attendance", { records });
  }

  async submitRectificationRequest(requestData: any): Promise<void> {
    await baseApi.post("/teacher/requests/rectification", requestData);
  }

  async createMarkingTemplate(
    template: Omit<MarkingTemplate, "id">
  ): Promise<void> {
    await baseApi.post("/teacher/gradebook/templates", template);
  }

  async getMarkingTemplatesForCourse(
    courseId: string
  ): Promise<MarkingTemplate[]> {
    const { data } = await baseApi.get<MarkingTemplate[]>(
      `/teacher/courses/${courseId}/gradebook/templates`
    );
    return data;
  }

  async getStudentMarksForTemplate(templateId: string): Promise<StudentMark[]> {
    const { data } = await baseApi.get<StudentMark[]>(
      `/teacher/gradebook/templates/${templateId}/marks`
    );
    return data;
  }

  async saveStudentMarks(
    templateId: string,
    marks: { studentId: string; marksObtained: number }[]
  ): Promise<void> {
    await baseApi.post(`/teacher/gradebook/templates/${templateId}/marks`, {
      marks,
    });
  }

  async deleteMarkingTemplate(templateId: string): Promise<void> {
    await baseApi.delete(`/teacher/gradebook/templates/${templateId}`);
  }

  // --- Quizzes ---
  // FIX: Added teacherId based on mandatory ID requirement.
  async getQuizzesForTeacher(teacherId: string): Promise<Quiz[]> {
    const { data } = await baseApi.get<Quiz[]>("/teacher/quizzes", {
      params: { teacherId },
    });
    return data;
  }

  async updateQuizStatus(
    quizId: string,
    status: "published" | "paused"
  ): Promise<void> {
    await baseApi.put(`/teacher/quizzes/${quizId}/status`, { status });
  }

  async getQuizWithQuestions(
    quizId: string
  ): Promise<{ quiz: Quiz; questions: QuizQuestion[] } | null> {
    const { data } = await baseApi.get(`/teacher/quizzes/${quizId}/details`);
    return data;
  }

  async saveQuiz(
    quizData: Partial<Quiz>,
    questionsData: Partial<QuizQuestion>[]
  ): Promise<void> {
    await baseApi.post("/teacher/quizzes/save", { quizData, questionsData });
  }

  async getQuizResults(
    quizId: string
  ): Promise<{ quiz: Quiz; questions: QuizQuestion[]; results: QuizResult[] }> {
    const { data } = await baseApi.get(`/teacher/quizzes/${quizId}/results`);
    return data;
  }

  // --- Syllabus & Content ---
  async getLectures(classId: string, subjectId: string): Promise<Lecture[]> {
    const { data } = await baseApi.get<Lecture[]>(
      "/teacher/syllabus/lectures",
      { params: { classId, subjectId } }
    );
    return data;
  }

  async saveLectures(
    classId: string,
    subjectId: string,
    lectures: Partial<Lecture>[],
    branchId: string,
    newLectures: string
  ): Promise<void> {
    await baseApi.post("/teacher/syllabus/lectures/save", {
      classId,
      subjectId,
      lectures,
      branchId,
      newLectures,
    });
  }

  async updateLectureStatus(
    lectureId: string,
    status: "completed" | "pending"
  ): Promise<void> {
    await baseApi.put(`/teacher/syllabus/lectures/${lectureId}/status`, {
      status,
    });
  }

  async submitSyllabusChangeRequest(
    requestData: Omit<
      SyllabusChangeRequest,
      "id" | "teacherName" | "status" | "requestedAt"
    >
  ): Promise<void> {
    await baseApi.post("/teacher/requests/syllabus-change", requestData);
  }

  // FIX: Added teacherId based on mandatory ID requirement.
  async getCourseContentForTeacher(
    teacherId: string
  ): Promise<CourseContent[]> {
    const { data } = await baseApi.get<CourseContent[]>(
      "/teacher/course-content",
      { params: { teacherId } }
    );
    return data;
  }

  async uploadCourseContent(
    data: Omit<
      CourseContent,
      "id" | "fileName" | "fileType" | "fileUrl" | "uploadedAt" | "branchId"
    >,
    file: File
  ): Promise<void> {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) =>
      formData.append(key, String(value))
    );
    formData.append("file", file);

    await baseApi.post("/teacher/course-content/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  }

  // --- Meetings & Availability ---
  // FIX: Added teacherId based on mandatory ID requirement.
  async getMeetingRequestsForTeacher(
    teacherId: string
  ): Promise<HydratedMeetingRequest[]> {
    const { data } = await baseApi.get<HydratedMeetingRequest[]>(
      "/teacher/meetings",
      { params: { teacherId } }
    );
    return data;
  }

  async updateMeetingRequest(
    requestId: string,
    updates: Partial<MeetingRequest>
  ): Promise<void> {
    await baseApi.put(`/teacher/meetings/${requestId}`, updates);
  }

  async getTeacherAvailability(
    teacherId: string,
    date: string
  ): Promise<string[]> {
    const { data } = await baseApi.get<string[]>("/teacher/availability", {
      params: { teacherId, date },
    });
    return data;
  }

  // --- Examinations & Marks ---
  async getExaminations(branchId: string): Promise<Examination[]> {
    const { data } = await baseApi.get<Examination[]>("/teacher/examinations", {
      params: { branchId },
    });
    return data;
  }

  async getHydratedExamSchedules(
    examinationId: string
  ): Promise<HydratedSchedule[]> {
    const { data } = await baseApi.get<HydratedSchedule[]>(
      `/teacher/examinations/${examinationId}/schedules`
    );
    return data;
  }

  async getExamMarksForSchedule(scheduleId: string): Promise<ExamMark[]> {
    const { data } = await baseApi.get<ExamMark[]>(
      `/teacher/examinations/schedules/${scheduleId}/marks`
    );
    return data;
  }

  async saveExamMarks(
    marks: Omit<ExamMark, "id" | "enteredAt">[]
  ): Promise<void> {
    await baseApi.post("/teacher/examinations/marks/save", { marks });
  }

  async submitExamMarkRectificationRequest(
    requestData: Omit<
      ExamMarkRectificationRequest,
      "id" | "status" | "requestedAt" | "teacherName" | "branchId"
    >
  ): Promise<void> {
    await baseApi.post("/teacher/requests/exam-mark", requestData);
  }

  // --- Student Interaction (Complaints & Skills) ---
  async raiseComplaintAboutStudent(
    complaintData: Omit<ComplaintAboutStudent, "id" | "submittedAt">
  ): Promise<void> {
    await baseApi.post("/teacher/complaints/student", complaintData);
  }

  async getTeacherSkillAssessmentForStudent(
    studentId: string
  ): Promise<SkillAssessment | null> {
    const { data } = await baseApi.get<SkillAssessment | null>(
      `/teacher/students/${studentId}/skill-assessment`
    );
    return data;
  }

  async submitSkillAssessment(
    assessmentData: Omit<SkillAssessment, "id" | "assessedAt">
  ): Promise<void> {
    await baseApi.post("/teacher/students/skill-assessment", assessmentData);
  }

  // --- Leaves ---
  // FIX: Added teacherId based on mandatory ID requirement.
  async getLeaveApplicationsForUser(
    teacherId: string
  ): Promise<LeaveApplication[]> {
    const { data } = await baseApi.get<LeaveApplication[]>(
      "/teacher/leaves/my-applications",
      { params: { teacherId } }
    );
    return data;
  }

  // FIX: Added teacherId based on mandatory ID requirement.
  async getLeaveApplicationsForTeacher(
    teacherId: string
  ): Promise<LeaveApplication[]> {
    const { data } = await baseApi.get<LeaveApplication[]>(
      "/teacher/leaves/student-applications",
      { params: { teacherId } }
    );
    return data;
  }

  async processLeaveApplication(
    requestId: string,
    status: "Approved" | "Rejected"
  ): Promise<void> {
    await baseApi.put(`/teacher/leaves/applications/${requestId}/process`, {
      status,
    });
  }

  // --- Shared & Utility Lookups ---
  // NOTE: These functions are for shared data and might be better placed in a SharedApiService,
  // but are added here to resolve component errors as requested.

  // NEW: Added missing function.
  async getSchoolEvents(branchId: string): Promise<SchoolEvent[]> {
    const { data } = await baseApi.get<SchoolEvent[]>("/shared/events", {
      params: { branchId },
    });
    return data;
  }

  // NEW: Added missing function.
  async getSchoolClassesByBranch(branchId: string): Promise<SchoolClass[]> {
    const { data } = await baseApi.get<SchoolClass[]>("/shared/classes", {
      params: { branchId },
    });
    return data;
  }

  // NEW: Added missing function.
  async getClassById(classId: string): Promise<SchoolClass> {
    const { data } = await baseApi.get<SchoolClass>(
      `/shared/classes/${classId}`
    );
    return data;
  }

  // NEW: Added missing function.
  async getSubjectById(subjectId: string): Promise<Subject> {
    const { data } = await baseApi.get<Subject>(
      `/shared/subjects/${subjectId}`
    );
    return data;
  }

  // NEW: Added missing function.
  async getExaminationById(examinationId: string): Promise<Examination> {
    const { data } = await baseApi.get<Examination>(
      `/shared/examinations/${examinationId}`
    );
    return data;
  }

  async getMyTransportDetails(): Promise<{
    route: TransportRoute;
    stop: BusStop;
  } | null> {
    const { data } = await baseApi.get("/teacher/my-transport-details");
    return data;
  }
  // NEW: Added missing function. This logically belongs in RegistrarApiService.
  async getTransportDetailsForMember(
    memberId: string,
    memberType: "Teacher" | "Student"
  ): Promise<{ route: TransportRoute; stop: BusStop } | null> {
    const { data } = await baseApi.get(`/registrar/transport/member-details`, {
      params: { memberId, memberType },
    });
    return data;
  }

  // FIX: Added branchId based on mandatory ID requirement.
  async searchLibraryBooks(
    query: string,
    branchId: string
  ): Promise<LibraryBook[]> {
    const { data } = await baseApi.get<LibraryBook[]>("/library/search", {
      params: { q: query, branchId },
    });
    return data;
  }
}
