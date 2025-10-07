// // services/baseApiService.ts
// import { db, saveDb } from "./database.ts";
// import type {
//   User,
//   Student,
//   Teacher,
//   SchoolClass,
//   Subject,
//   Course,
//   Examination,
//   LibraryBook,
//   Branch,
//   FeeTemplate,
//   SchoolEvent,
//   StudentProfile,
//   GradeWithCourse,
//   AttendanceRecord,
//   FeeRecord,
//   FeePayment,
//   FeeAdjustment,
//   FeeHistoryItem,
//   SkillAssessment,
//   TransportRoute,
//   Hostel,
//   Room,
//   ClassDetails,
// } from "../types.ts";

// import axios from "axios";

// // ✅ Vite automatically injects import.meta.env.VITE_API_URL (no need to redeclare ImportMeta)
// // const baseApi = axios.create({
// //   baseURL: import.meta.env.VITE_API_URL,
// // });

// const API_BASE = import.meta.env.VITE_API_URL || "/api";

// const baseApi = axios.create({
//   baseURL: API_BASE,
//   // You can add other axios defaults here (timeout, headers, etc.)
// });

// // Attach token if exists
// baseApi.interceptors.request.use((config) => {
//   try {
//     const token = localStorage.getItem("token");
//     if (token && config.headers) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//   } catch (e) {
//     // localStorage may be unavailable in some contexts; ignore silently
//   }
//   return config;
// });


// // --- Helper Functions ---
// const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));
// const generatePassword = () => Math.random().toString(36).slice(-8);

// export const SKILL_LIST = [
//   "Problem Solving",
//   "Creativity",
//   "Teamwork",
//   "Leadership",
//   "Communication",
// ];

// export const generateUniqueId = (
//   type: "student" | "teacher" | "registrar" | "librarian"
// ) => {
//   let prefix: string;
//   let count: number;
//   const allUsers = db.users as User[];

//   switch (type) {
//     case "student":
//       prefix = "STU";
//       count = db.students.length;
//       return `VRTX-${prefix}-${(count + 1).toString().padStart(7, "0")}`;
//     case "teacher":
//       prefix = "TCH";
//       count = db.teachers.length;
//       return `VRTX-${prefix}-${(count + 1).toString().padStart(7, "0")}`;
//     case "registrar":
//       prefix = "REG";
//       count = allUsers.filter((u) => u.role === "Registrar").length;
//       return `VRTX-${prefix}-${(count + 1).toString().padStart(7, "0")}`;
//     case "librarian":
//       prefix = "LIB";
//       count = allUsers.filter((u) => u.role === "Librarian").length;
//       return `VRTX-${prefix}-${(count + 1).toString().padStart(7, "0")}`;
//     default:
//       return `${type}-${Math.random().toString(36).substr(2, 9)}`;
//   }
// };

// export abstract class BaseApiService {
//   protected delay = delay;
//   protected generateId = (prefix: string) =>
//     `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
//   protected generatePassword = generatePassword;

//   // =================================================================
//   // Shared data access helpers
//   // =================================================================
//   getStudentById = (id: string): Student | undefined =>
//     (db.students as Student[]).find((s) => s.id === id);
//   getTeacherById = (id: string): Teacher | undefined =>
//     (db.teachers as Teacher[]).find((t) => t.id === id);
//   getUserById = (id: string): User | undefined =>
//     (db.users as User[]).find((u) => u.id === id);
//   getClassById = (id: string): SchoolClass | undefined =>
//     (db.schoolClasses as SchoolClass[]).find((c) => c.id === id);
//   getSubjectById = (id: string): Subject | undefined =>
//     (db.subjects as Subject[]).find((s) => s.id === id);
//   getCourseById = (id: string): Course | undefined =>
//     (db.courses as Course[]).find((c) => c.id === id);
//   getCourseNameById = (id: string): string =>
//     this.getCourseById(id)?.name || "Unknown Course";
//   getExaminationById = (id: string): Examination | undefined =>
//     (db.examinations as Examination[]).find((e) => e.id === id);
//   getLibraryBookById = (bookId: string): LibraryBook | undefined =>
//     (db.libraryBooks as LibraryBook[]).find((b) => b.id === bookId);
//   getBookTitle = (bookId: string): string =>
//     this.getLibraryBookById(bookId)?.title || "Unknown";
//   getMemberName(memberId: string, memberType: "Student" | "Teacher"): string {
//     const member =
//       memberType === "Student"
//         ? this.getStudentById(memberId)
//         : this.getTeacherById(memberId);
//     return member?.name || "Unknown Member";
//   }

//   async getBranchById(branchId: string): Promise<Branch | null> {
//     await this.delay(100);
//     return (db.branches as Branch[]).find((b) => b.id === branchId) || null;
//   }

//   async getSchoolClassesByBranch(branchId: string): Promise<SchoolClass[]> {
//     return (db.schoolClasses as SchoolClass[]).filter(
//       (c) => c.branchId === branchId
//     );
//   }

//   async getSubjectsByBranch(branchId: string): Promise<Subject[]> {
//     return (db.subjects as Subject[]).filter((s) => s.branchId === branchId);
//   }

//   async getTeachersByBranch(branchId: string): Promise<Teacher[]> {
//     return (db.teachers as Teacher[]).filter((t) => t.branchId === branchId);
//   }

//   async getStudentsByBranch(branchId: string): Promise<Student[]> {
//     await this.delay(150);
//     return (db.students as Student[]).filter((s) => s.branchId === branchId);
//   }

//   async getStudentsForClass(classId: string): Promise<Student[]> {
//     const sClass = this.getClassById(classId);
//     if (!sClass) return [];
//     return (db.students as Student[]).filter((s) =>
//       sClass.studentIds.includes(s.id)
//     );
//   }

//   async getCoursesByBranch(branchId: string): Promise<Course[]> {
//     return (db.courses as Course[]).filter((c) => c.branchId === branchId);
//   }

//   async getStudentsByGrade(
//     branchId: string,
//     gradeLevel: number
//   ): Promise<Student[]> {
//     await this.delay(150);
//     return (db.students as Student[]).filter(
//       (s) => s.branchId === branchId && s.gradeLevel === gradeLevel
//     );
//   }

//   async getFeeTemplates(branchId: string): Promise<FeeTemplate[]> {
//     return (db.feeTemplates as FeeTemplate[]).filter(
//       (ft) => ft.branchId === branchId
//     );
//   }

//   async getSchoolEvents(branchId: string): Promise<SchoolEvent[]> {
//     await this.delay(200);
//     return (db.schoolEvents as SchoolEvent[]).filter(
//       (e) => e.branchId === branchId
//     );
//   }

//   async getStudentProfileDetails(
//     studentId: string
//   ): Promise<StudentProfile | null> {
//     const student = this.getStudentById(studentId);
//     if (!student) return null;
//     const grades = (db.grades as GradeWithCourse[])
//       .filter((g) => g.studentId === studentId)
//       .map((g) => ({ ...g, courseName: this.getCourseNameById(g.courseId) }));
//     const attendanceHistory = (db.attendance as AttendanceRecord[]).filter(
//       (a) => a.studentId === studentId
//     );
//     const present = attendanceHistory.filter(
//       (a) => a.status === "Present"
//     ).length;
//     const total = attendanceHistory.length;
//     const feeRecord = (db.feeRecords as FeeRecord[]).find(
//       (f) => f.studentId === studentId
//     );
//     const feeHistory: FeeHistoryItem[] = [
//       ...(db.feePayments as FeePayment[]).filter(
//         (p) => p.studentId === studentId
//       ),
//       ...(db.feeAdjustments as FeeAdjustment[]).filter(
//         (a) => a.studentId === studentId
//       ),
//     ];

//     const allAssessments = (db.skillAssessments as any[]).filter(
//       (sa) => sa.studentId === studentId
//     );
//     const aggregatedSkills: Record<string, { total: number; count: number }> =
//       {};
//     allAssessments.forEach((assessment) => {
//       Object.entries(assessment.skills).forEach(([skill, value]) => {
//         if (!aggregatedSkills[skill])
//           aggregatedSkills[skill] = { total: 0, count: 0 };
//         aggregatedSkills[skill].total += value as number;
//         aggregatedSkills[skill].count++;
//       });
//     });

//     const skills = SKILL_LIST.map((skill) => ({
//       skill,
//       value: aggregatedSkills[skill]
//         ? aggregatedSkills[skill].total / aggregatedSkills[skill].count
//         : 0,
//     }));

//     return {
//       student,
//       grades,
//       attendance: { present, absent: total - present, total },
//       attendanceHistory,
//       classInfo: student.classId
//         ? `Grade ${this.getClassById(student.classId)?.gradeLevel}-${
//             this.getClassById(student.classId)?.section
//           }`
//         : "N/A",
//       feeStatus: {
//         total: feeRecord?.totalAmount || 0,
//         paid: feeRecord?.paidAmount || 0,
//         dueDate: feeRecord?.dueDate,
//       },
//       feeHistory,
//       rank: {
//         class: Math.floor(Math.random() * 10) + 1,
//         school: student.schoolRank || 0,
//       },
//       skills,
//       recentActivity: [],
//     };
//   }

//   async getTransportDetailsForMember(
//     memberId: string,
//     memberType: "Student" | "Teacher"
//   ): Promise<{ route: TransportRoute; stop: any } | null> {
//     for (const route of db.transportRoutes as TransportRoute[]) {
//       const assignment = route.assignedMembers.find(
//         (m: any) => m.memberId === memberId && m.memberType === memberType
//       );
//       if (assignment) {
//         const stop = route.busStops.find(
//           (s: any) => s.id === assignment.stopId
//         );
//         if (stop) return { route, stop };
//       }
//     }
//     return null;
//   }

//   async getAccommodationDetailsForStudent(
//     studentId: string
//   ): Promise<{ hostel: Hostel; room: Room } | null> {
//     const student = this.getStudentById(studentId);
//     if (!student?.roomId) return null;
//     const room = (db.rooms as Room[]).find((r) => r.id === student.roomId);
//     if (!room) return null;
//     const hostel = (db.hostels as Hostel[]).find((h) => h.id === room.hostelId);
//     if (!hostel) return null;
//     return { hostel, room };
//   }

//   async assignClassMentor(
//     classId: string,
//     teacherId: string | null
//   ): Promise<void> {
//     const sClass = this.getClassById(classId);
//     if (sClass) {
//       sClass.mentorTeacherId = teacherId || undefined;
//       saveDb();
//     }
//   }

//   async getAttendanceByBranch(branchId: string): Promise<AttendanceRecord[]> {
//     const studentsInBranch = await this.getStudentsByBranch(branchId);
//     const studentIds = new Set(studentsInBranch.map((s) => s.id));
//     return (db.attendance as AttendanceRecord[]).filter((a) =>
//       studentIds.has(a.studentId)
//     );
//   }

//   async getClassDetails(classId: string): Promise<ClassDetails> {
//     const classInfo = this.getClassById(classId)!;
//     const students = (db.students as Student[])
//       .filter((s) => classInfo.studentIds.includes(s.id))
//       .map((s) => ({
//         ...s,
//         classRank: Math.floor(Math.random() * classInfo.studentIds.length) + 1,
//         schoolRank: s.schoolRank || 0,
//       }));
//     const subjects = classInfo.subjectIds.map((sid) => {
//       const sub = this.getSubjectById(sid)!;
//       const teacher = this.getTeacherById(sub.teacherId!)!;
//       return {
//         subjectId: sid,
//         subjectName: sub.name,
//         teacherName: teacher?.name || "N/A",
//         syllabusCompletion: 70 + Math.random() * 30,
//       };
//     });
//     const performance = subjects.map((s) => ({
//       subjectName: s.subjectName,
//       averageScore: 75 + Math.random() * 15,
//     }));
//     const studentIds = new Set(classInfo.studentIds);
//     const defaulters = (db.feeRecords as FeeRecord[]).filter(
//       (fr) => studentIds.has(fr.studentId) && fr.paidAmount < fr.totalAmount
//     );
//     return {
//       classInfo,
//       students,
//       subjects,
//       performance,
//       attendance: [],
//       fees: {
//         totalPending: defaulters.reduce(
//           (sum, d) => sum + (d.totalAmount - d.paidAmount),
//           0
//         ),
//         defaulters: defaulters.map((d) => ({
//           studentId: d.studentId,
//           studentName: this.getStudentById(d.studentId)!.name,
//           pendingAmount: d.totalAmount - d.paidAmount,
//         })),
//       },
//     };
//   }

//   async assignFeeTemplateToClass(
//     classId: string,
//     feeTemplateId: string | null
//   ): Promise<void> {
//     const sClass = this.getClassById(classId);
//     if (sClass) {
//       sClass.feeTemplateId = feeTemplateId || undefined;
//       saveDb();
//     }
//   }

//   async deleteSchoolEvent(eventId: string): Promise<void> {
//     db.schoolEvents = (db.schoolEvents as SchoolEvent[]).filter(
//       (e) => e.id !== eventId
//     );
//     saveDb();
//   }

//   async getFeeRecordsByBranch(branchId: string): Promise<FeeRecord[]> {
//     const studentsInBranch = (await this.getStudentsByBranch(branchId)).map(
//       (s) => s.id
//     );
//     return (db.feeRecords as FeeRecord[]).filter((fr) =>
//       studentsInBranch.includes(fr.studentId)
//     );
//   }
// }
// export default baseApi;


// src/services/baseApiService.ts

import axios from 'axios';

// Get the API base URL from your environment variables (.env.local file)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

// Create the single, real API client instance for your entire application
const baseApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach the token to every outgoing request using an interceptor
baseApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    // If a token exists, add the Authorization header
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    // Handle request setup errors
    return Promise.reject(error);
  }
);

// Export the configured instance as the default
export default baseApi;