// services/librarianApiService.ts

import baseApi from "./baseApiService";
import type {
  LibrarianDashboardData,
  LibraryBook,
  BookIssuance,
  HydratedBookIssuance,
  Student,
  Teacher,
  TeacherAttendanceRecord,
  LeaveApplication,
} from "../types.ts";

export class LibrarianApiService {
  async getLibrarianDashboardData(
    branchId: string
  ): Promise<LibrarianDashboardData> {
    const { data } = await baseApi.get<LibrarianDashboardData>(
      "/librarian/dashboard",
      { params: { branchId } }
    );
    return data;
  }

  async getLibraryBooks(branchId: string): Promise<LibraryBook[]> {
    const { data } = await baseApi.get<LibraryBook[]>("/librarian/books", {
      params: { branchId },
    });
    return data;
  }

  async getBookIssuances(branchId: string): Promise<BookIssuance[]> {
    const { data } = await baseApi.get<BookIssuance[]>("/librarian/issuances", {
      params: { branchId },
    });
    return data;
  }

  async getBookIssuancesWithMemberDetails(
    branchId: string
  ): Promise<HydratedBookIssuance[]> {
    const { data } = await baseApi.get<HydratedBookIssuance[]>(
      "/librarian/issuances",
      { params: { details: true, branchId } }
    );
    return data;
  }

  async updateBook(
    bookId: string,
    bookData: Partial<LibraryBook>,
    pdfFile: File | null
  ): Promise<void> {
    const formData = new FormData();
    Object.entries(bookData).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        formData.append(key, String(value));
      }
    });
    if (pdfFile) {
      formData.append("pdfFile", pdfFile);
    }
    await baseApi.put(`/librarian/books/${bookId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  }

  async createBook(
    branchId: string,
    bookData: Partial<LibraryBook>,
    pdfFile: File | null
  ): Promise<void> {
    const formData = new FormData();
    formData.append("branchId", branchId);
    Object.entries(bookData).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        formData.append(key, String(value));
      }
    });
    if (pdfFile) {
      formData.append("pdfFile", pdfFile);
    }
    await baseApi.post("/librarian/books", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  }

  async deleteBook(bookId: string): Promise<void> {
    await baseApi.delete(`/librarian/books/${bookId}`);
  }

  async issueBook(
    branchId: string,
    bookId: string,
    memberId: string,
    memberType: "Student" | "Teacher",
    dueDate: Date,
    finePerDay: number
  ): Promise<void> {
    await baseApi.post("/librarian/issuances", {
      branchId,
      bookId,
      memberId,
      memberType,
      dueDate,
      finePerDay,
    });
  }

  async issueBookByIsbnOrId(
    branchId: string,
    bookIdentifier: string,
    memberId: string,
    dueDate: string,
    finePerDay: number
  ): Promise<{ bookTitle: string; memberName: string }> {
    const { data } = await baseApi.post("/librarian/issuances/by-identifier", {
      branchId,
      bookIdentifier,
      memberId,
      dueDate,
      finePerDay,
    });
    return data;
  }

  async returnBook(issuanceId: string): Promise<void> {
    await baseApi.put(`/librarian/issuances/${issuanceId}/return`);
  }

  async searchLibraryBooks(
    branchId: string,
    query: string
  ): Promise<LibraryBook[]> {
    const { data } = await baseApi.get<LibraryBook[]>(
      "/librarian/books/search",
      {
        params: { q: query, branchId },
      }
    );
    return data;
  }

  async getMyLeaveApplications(): Promise<LeaveApplication[]> {
    const { data } = await baseApi.get<LeaveApplication[]>(
      "/librarian/leaves/my-applications" // Use the new, correct route
    );
    return data;
  }

  async getLibrarianAttendance(
    branchId: string
  ): Promise<TeacherAttendanceRecord[]> {
    const { data } = await baseApi.get<TeacherAttendanceRecord[]>(
      "/librarian/attendance",
      { params: { branchId } }
    );
    return data;
  }

  async getStudentsByBranch(branchId: string): Promise<Student[]> {
    const { data } = await baseApi.get<Student[]>("/registrar/students", {
      params: { branchId },
    });
    return data;
  }

  async getTeachersByBranch(branchId: string): Promise<Teacher[]> {
    const { data } = await baseApi.get<Teacher[]>("/registrar/teachers", {
      params: { branchId },
    });
    return data;
  }
}
