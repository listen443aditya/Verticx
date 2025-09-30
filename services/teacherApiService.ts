// services/teacherApiService.ts

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
} from "../types.ts";

export class TeacherApiService {
  // --- Dashboard & Core Info ---
  async getTeacherDashboardData(): Promise<TeacherDashboardData> {
    const { data } = await baseApi.get<TeacherDashboardData>(
      "/teacher/dashboard"
    );
    return data;
  }

  async getStudentsForTeacher(): Promise<Student[]> {
    const { data } = await baseApi.get<Student[]>("/teacher/students");
    return data;
  }

  async getTeacherCourses(): Promise<TeacherCourse[]> {
    const { data } = await baseApi.get<TeacherCourse[]>("/teacher/courses");
    return data;
  }

  async findCourseByTeacherAndSubject(
    subjectId: string
  ): Promise<Course | undefined> {
    const { data } = await baseApi.get<Course | undefined>(
      "/teacher/courses/find",
      { params: { subjectId } }
    );
    return data;
  }

  async getTeacherAttendance(): Promise<TeacherAttendanceRecord[]> {
    const { data } = await baseApi.get<TeacherAttendanceRecord[]>(
      "/teacher/my-attendance"
    );
    return data;
  }

  // --- Assignments ---
  async getAssignmentsByTeacher(): Promise<Assignment[]> {
    const { data } = await baseApi.get<Assignment[]>("/teacher/assignments");
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
  async getQuizzesForTeacher(): Promise<Quiz[]> {
    const { data } = await baseApi.get<Quiz[]>("/teacher/quizzes");
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
    lectures: Partial<Lecture>[]
  ): Promise<void> {
    await baseApi.post("/teacher/syllabus/lectures/save", {
      classId,
      subjectId,
      lectures,
    });
  }

  async updateLectureStatus(
    lectureId: string,
    status: "completed"
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

  async getCourseContentForTeacher(): Promise<CourseContent[]> {
    const { data } = await baseApi.get<CourseContent[]>(
      "/teacher/course-content"
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
  async getMeetingRequestsForTeacher(): Promise<HydratedMeetingRequest[]> {
    const { data } = await baseApi.get<HydratedMeetingRequest[]>(
      "/teacher/meetings"
    );
    return data;
  }

  async updateMeetingRequest(
    requestId: string,
    updates: Partial<MeetingRequest>
  ): Promise<void> {
    await baseApi.put(`/teacher/meetings/${requestId}`, updates);
  }

  async getTeacherAvailability(date: string): Promise<string[]> {
    const { data } = await baseApi.get<string[]>("/teacher/availability", {
      params: { date },
    });
    return data;
  }

  // --- Examinations & Marks ---
  async getExaminations(): Promise<Examination[]> {
    const { data } = await baseApi.get<Examination[]>("/teacher/examinations");
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
  async getLeaveApplicationsForUser(): Promise<LeaveApplication[]> {
    const { data } = await baseApi.get<LeaveApplication[]>(
      "/teacher/leaves/my-applications"
    );
    return data;
  }

  async getLeaveApplicationsForTeacher(): Promise<LeaveApplication[]> {
    const { data } = await baseApi.get<LeaveApplication[]>(
      "/teacher/leaves/student-applications"
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

  // --- Shared Services ---
  async searchLibraryBooks(query: string): Promise<LibraryBook[]> {
    const { data } = await baseApi.get<LibraryBook[]>("/library/search", {
      params: { q: query },
    });
    return data;
  }
}
