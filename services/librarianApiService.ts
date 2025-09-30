// services/librarianApiService.ts

// ✅ STEP 1: The single source of truth. 'baseApi' is now our only gateway to the backend.
//    The local 'database' has been honorably discharged.
import baseApi from "./baseApiService";
import type {
  LibrarianDashboardData,
  LibraryBook,
  BookIssuance,
  HydratedBookIssuance,
  ClassIssuanceSummary,
  TeacherAttendanceRecord,
} from "../types.ts";

// ✅ STEP 2: Every method is now a clear, direct conversation with your backend API.
//    All heavy lifting—calculations, data joins, and business logic—is handled by the server.
export class LibrarianApiService {
  async getLibrarianDashboardData(): Promise<LibrarianDashboardData> {
    // A single, efficient call to get the entire dashboard state.
    const { data } = await baseApi.get<LibrarianDashboardData>(
      "/librarian/dashboard"
    );
    return data;
  }

  async getLibraryBooks(): Promise<LibraryBook[]> {
    const { data } = await baseApi.get<LibraryBook[]>("/librarian/books");
    return data;
  }

  async getBookIssuances(): Promise<BookIssuance[]> {
    const { data } = await baseApi.get<BookIssuance[]>("/librarian/issuances");
    return data;
  }

  async getBookIssuancesWithMemberDetails(): Promise<HydratedBookIssuance[]> {
    // The backend now provides the fully "hydrated" data, saving frontend processing.
    const { data } = await baseApi.get<HydratedBookIssuance[]>(
      "/librarian/issuances?details=true"
    );
    return data;
  }

  async updateBook(
    bookId: string,
    bookData: Partial<LibraryBook>,
    pdfFile: File | null
  ): Promise<void> {
    // Using FormData to handle mixed content (JSON data + a potential file upload).
    const formData = new FormData();
    // Append book data fields. FormData stringifies values, backend should parse them.
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
    // The user's branchId is inferred by the backend via their auth token.
    await baseApi.post("/librarian/books", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  }

  async deleteBook(bookId: string): Promise<void> {
    // The backend is now responsible for validating if the book can be deleted.
    await baseApi.delete(`/librarian/books/${bookId}`);
  }

  async issueBook(
    bookId: string,
    memberId: string,
    memberType: "Student" | "Teacher",
    dueDate: Date,
    finePerDay: number
  ): Promise<void> {
    await baseApi.post("/librarian/issuances", {
      bookId,
      memberId,
      memberType,
      dueDate,
      finePerDay,
    });
  }

  async issueBookByIsbnOrId(
    bookIdentifier: string,
    memberId: string,
    dueDate: string,
    finePerDay: number
  ): Promise<{ bookTitle: string; memberName: string }> {
    const { data } = await baseApi.post("/librarian/issuances/by-identifier", {
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

  async searchLibraryBooks(query: string): Promise<LibraryBook[]> {
    const { data } = await baseApi.get<LibraryBook[]>(
      "/librarian/books/search",
      {
        params: { q: query },
      }
    );
    return data;
  }

  async getLibrarianAttendance(): Promise<TeacherAttendanceRecord[]> {
    // The specific user (librarian) is identified by the backend via auth token.
    const { data } = await baseApi.get<TeacherAttendanceRecord[]>(
      "/librarian/attendance"
    );
    return data;
  }
}
