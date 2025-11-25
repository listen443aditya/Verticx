// services/studentApiService.ts

import baseApi from "./baseApiService";
import type {
  Student,
  StudentDashboardData,
  AttendanceRecord,
  GradeWithCourse,
  CourseContent,
  StudentQuiz,
  Quiz,
  QuizQuestion,
  LecturePlan,
  TeacherFeedback,
  TeacherComplaint,
  ComplaintAboutStudent,
  StudentProfile,
  FeeRecord,
  LeaveApplication,
  LibraryBook,
  Assignment,
  TransportRoute,
  BusStop,
  Subject,
  Teacher,
  SchoolEvent,
} from "../types.ts";

export class StudentApiService {
  // async getTeachersByBranch(branchId: string): Promise<Teacher[]> {
  //   const { data } = await baseApi.get<Teacher[]>("/general/teachers", {
  //     params: { branchId },
  //   });
  //   return data;
  // }
  // --- Dashboard & Profile ---
  async getStudentDashboardData(): Promise<StudentDashboardData> {
    // A single, powerful call that gets the entire, pre-calculated dashboard object from the backend.
    const { data } = await baseApi.get<StudentDashboardData>(
      "/student/dashboard"
    );
    return data;
  }

  // NOTE: This method was called by the original dashboard but was missing. It is now correctly implemented.
  async getStudentProfileDetails(): Promise<StudentProfile | null> {
    const { data } = await baseApi.get<StudentProfile | null>(
      "/student/profile"
    );
    return data;
  }

  // Students typically have restricted ability to update official records. This maps to a profile update endpoint.
  async updateStudent(updates: Partial<Student>): Promise<void> {
    await baseApi.put("/student/profile", updates);
  }

  // --- Academics ---
  async getStudentAttendance(): Promise<AttendanceRecord[]> {
    const { data } = await baseApi.get<AttendanceRecord[]>(
      "/student/attendance"
    );
    return data;
  }

  async getStudentGrades(): Promise<GradeWithCourse[]> {
    const { data } = await baseApi.get<GradeWithCourse[]>("/student/grades");
    return data;
  }

  async getCourseContentForStudent(): Promise<CourseContent[]> {
    const { data } = await baseApi.get<CourseContent[]>(
      "/student/course-content"
    );
    return data;
  }

  async getLecturesForStudent(): Promise<LecturePlan[]> {
    const { data } = await baseApi.get<LecturePlan[]>("/student/lectures");
    return data;
  }

  async getStudentSelfStudyProgress(): Promise<string[]> {
    const { data } = await baseApi.get<string[]>(
      "/student/self-study/progress"
    );
    return data;
  }
  // async getSubjectsByBranch(branchId: string): Promise<Subject[]> {
  //   // Calls the new backend route /api/general/subjects
  //   const { data } = await baseApi.get<Subject[]>("/general/subjects", {
  //     params: { branchId },
  //   });
  //   return data;
  // }

  async updateStudentSelfStudyProgress(
    userId: string,
    lectureId: string,
    isCompleted: boolean
  ): Promise<void> {
    await baseApi.post("/student/self-study/progress", {
      lectureId,
      isCompleted,
    });
  }
  async getSchoolEvents(branchId: string): Promise<SchoolEvent[]> {
    // Calls the shared/general endpoint which we verified exists
    const { data } = await baseApi.get<SchoolEvent[]>("/general/events", {
      params: { branchId },
    });
    return data;
  }

  // --- Assignments & Quizzes ---
  async getAssignments(
    branchId: string
  ): Promise<{ pending: Assignment[]; graded: any[] }> {
    const { data } = await baseApi.get<{
      pending: Assignment[];
      graded: any[];
    }>("/student/assignments", { params: { branchId } }); // Pass branchId as a query parameter
    return data;
  }

  async getAvailableQuizzesForStudent(): Promise<
    (StudentQuiz & { quizTitle: string })[]
  > {
    const { data } = await baseApi.get<(StudentQuiz & { quizTitle: string })[]>(
      "/student/quizzes/available"
    );
    return data;
  }

  async getStudentQuizForAttempt(studentQuizId: string): Promise<{
    studentQuiz: StudentQuiz;
    quiz: Quiz;
    questions: QuizQuestion[];
  } | null> {
    const { data } = await baseApi.get(
      `/student/quizzes/${studentQuizId}/attempt`
    );
    return data;
  }

  async submitStudentQuiz(
    studentQuizId: string,
    answers: { questionId: string; selectedOptionIndex: number }[]
  ): Promise<void> {
    await baseApi.post(`/student/quizzes/${studentQuizId}/submit`, { answers });
  }

  // --- Fees & Financials ---
  async getFeeRecordForStudent(): Promise<FeeRecord | null> {
    const { data } = await baseApi.get<FeeRecord | null>(
      "/student/fees/record"
    );
    return data;
  }

  // This is the callback after a payment gateway interaction.
  async recordFeePayment(paymentResponse: any): Promise<void> {
    await baseApi.post("/student/fees/record-payment", paymentResponse);
  }

  // --- Feedback & Complaints ---
  async getStudentFeedbackHistory(id: string): Promise<TeacherFeedback[]> {
    const { data } = await baseApi.get<TeacherFeedback[]>(
      `/student/feedback/history/${id}`
    );
    return data;
  }
  async getMyTransportDetails(): Promise<{
    route: TransportRoute;
    stop: BusStop;
  } | null> {
    // This calls your new, secure backend route
    const { data } = await baseApi.get("/student/my-transport-details");
    return data;
  }
  async submitTeacherFeedback(
    feedbackData: Omit<TeacherFeedback, "id" | "feedbackDate">
  ): Promise<void> {
    await baseApi.post("/student/feedback/submit", feedbackData);
  }

  async getComplaintsByStudent(): Promise<TeacherComplaint[]> {
    const { data } = await baseApi.get<TeacherComplaint[]>(
      "/student/complaints/by-me"
    );
    return data;
  }

  async getComplaintsAboutStudent(): Promise<ComplaintAboutStudent[]> {
    const { data } = await baseApi.get<ComplaintAboutStudent[]>(
      "/student/complaints/about-me"
    );
    return data;
  }

  async submitTeacherComplaint(
    complaintData: Omit<
      TeacherComplaint,
      "id" | "submittedAt" | "branchId" | "studentName" | "teacherName"
    >
  ): Promise<void> {
    await baseApi.post("/student/complaints/submit", complaintData);
  }

  async resolveStudentComplaint(complaintId: string): Promise<void> {
    await baseApi.put(`/student/complaints/${complaintId}/resolve`);
  }

  // --- Leaves & Library ---
  async getLeaveApplicationsForUser(): Promise<LeaveApplication[]> {
    const { data } = await baseApi.get<LeaveApplication[]>("/student/leaves");
    return data;
  }

  async searchLibraryBooks(query: string): Promise<LibraryBook[]> {
    const { data } = await baseApi.get<LibraryBook[]>(
      "/student/library/search",
      {
        params: { q: query },
      }
    );
    return data;
  }
}
