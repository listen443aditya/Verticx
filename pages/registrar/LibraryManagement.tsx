import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useAuth } from "../../hooks/useAuth";
import { LibrarianApiService } from "../../services/librarianApiService";
import type {
  LibraryBook,
  BookIssuance,
  Student,
  Teacher,
  User,
} from "../../types";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import { RegistrarApiService } from "../../services/registrarApiService";

const apiService = new LibrarianApiService();
const registrarApiService = new RegistrarApiService();

// Issue Book Modal
const IssueBookModal: React.FC<{
  book: LibraryBook;
  members: (Student | User)[];
  onClose: () => void;
  onIssue: (
    memberId: string,
    memberType: "Student" | "Teacher",
    dueDate: Date,
    finePerDay: number
  ) => void;
}> = ({ book, members, onClose, onIssue }) => {
  const [selectedMember, setSelectedMember] = useState("");
  const [dueDate, setDueDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 14);
    return date.toISOString().split("T")[0];
  });
  const [finePerDay, setFinePerDay] = useState("1.00");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;
    const [memberType, memberId] = selectedMember.split("-");
    onIssue(
      memberId,
      memberType as "Student" | "Teacher",
      new Date(dueDate),
      Number(finePerDay)
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <h2 className="text-xl font-bold text-text-primary-dark mb-2">
          Issue Book
        </h2>
        <p className="text-text-secondary-dark mb-4">{book.title}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary-dark mb-1">
              Select Member
            </label>
            <select
              value={selectedMember}
              onChange={(e) => setSelectedMember(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-md py-2 px-3"
              required
            >
              <option value="">-- Select a student or teacher --</option>
              {members.map((m) => (
                <option
                  key={m.id}
                  value={`${
                    (m as User).role === "Teacher" ? "Teacher" : "Student"
                  }-${m.id}`}
                >
                  {m.name} (
                  {(m as User).role === "Teacher"
                    ? "Teacher"
                    : `Student - Grade ${(m as Student).gradeLevel}`}
                  )
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Due Date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            required
          />
          <Input
            label="Fine per Day"
            type="number"
            min="0"
            step="0.01"
            value={finePerDay}
            onChange={(e) => setFinePerDay(e.target.value)}
            required
          />
          <div className="flex justify-end gap-4 pt-4">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Issue Book</Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

const LibraryManagement: React.FC = () => {
  const { user } = useAuth();
  const [books, setBooks] = useState<LibraryBook[]>([]);
  const [issuances, setIssuances] = useState<BookIssuance[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"Catalog" | "Issued">("Catalog");
  const [issuingBook, setIssuingBook] = useState<LibraryBook | null>(null);

  const fetchData = useCallback(async () => {
    if (!user?.branchId) return;
    setLoading(true);
    // FIX: Added missing branchId to registrarApiService calls.
    const [bookData, issuanceData, studentData, allStaff] = await Promise.all([
      apiService.getLibraryBooks(user.branchId),
      apiService.getBookIssuances(user.branchId),
      registrarApiService.getStudentsByBranch(user.branchId),
      registrarApiService.getAllStaff(user.branchId),
    ]);
    setBooks(bookData);
    setIssuances(issuanceData);
    setStudents(studentData);
    setTeachers(allStaff.filter((s) => s.role === "Teacher"));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleIssueBook = async (
    memberId: string,
    memberType: "Student" | "Teacher",
    dueDate: Date,
    finePerDay: number
  ) => {
    if (!issuingBook || !user?.branchId) return;
    // FIX: Corrected the order of arguments, placing branchId first.
    await apiService.issueBook(
      user.branchId,
      issuingBook.id,
      memberId,
      memberType,
      dueDate,
      finePerDay
    );
    setIssuingBook(null);
    fetchData();
  };

  const handleReturnBook = async (issuanceId: string) => {
    await apiService.returnBook(issuanceId);
    fetchData();
  };

  const getMemberName = (
    memberId: string,
    memberType: "Student" | "Teacher"
  ) => {
    if (memberType === "Student") {
      return students.find((s) => s.id === memberId)?.name || "Unknown Student";
    }
    return teachers.find((t) => t.id === memberId)?.name || "Unknown Teacher";
  };
  const getBookTitle = (bookId: string) =>
    books.find((b) => b.id === bookId)?.title || "Unknown";
  const allMembers = useMemo(
    () => [...students, ...teachers],
    [students, teachers]
  );

  return (
    <div>
      <h1 className="text-3xl font-bold text-text-primary-dark mb-6">
        Library Management
      </h1>
      <Card>
        <div className="flex justify-between items-center mb-4 border-b border-slate-200 pb-4">
          <div className="flex gap-2">
            <Button
              variant={view === "Catalog" ? "primary" : "secondary"}
              onClick={() => setView("Catalog")}
            >
              Book Catalog
            </Button>
            <Button
              variant={view === "Issued" ? "primary" : "secondary"}
              onClick={() => setView("Issued")}
            >
              Issued Books
            </Button>
          </div>
          {view === "Catalog" && <Button>Add New Book</Button>}
        </div>
        {loading ? (
          <p>Loading...</p>
        ) : view === "Catalog" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-slate-200 text-sm text-text-secondary-dark">
                <tr>
                  <th className="p-4">Title</th>
                  <th className="p-4">Author</th>
                  <th className="p-4 text-center">Available</th>
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody>
                {books.map((book) => (
                  <tr
                    key={book.id}
                    className="border-b border-slate-100 hover:bg-slate-50"
                  >
                    <td className="p-4 font-medium text-text-primary-dark">
                      {book.title}
                    </td>
                    <td className="p-4">{book.author}</td>
                    <td className="p-4 text-center">
                      {book.availableCopies} / {book.totalCopies}
                    </td>
                    <td className="p-4 text-right">
                      <Button
                        className="!px-3 !py-1 text-xs"
                        disabled={book.availableCopies === 0}
                        onClick={() => setIssuingBook(book)}
                      >
                        Issue
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-slate-200 text-sm text-text-secondary-dark">
                <tr>
                  <th className="p-4">Book Title</th>
                  <th className="p-4">Issued To</th>
                  <th className="p-4">Due Date</th>
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody>
                {issuances
                  .filter((i) => !i.returnedDate)
                  .map((issuance) => (
                    <tr
                      key={issuance.id}
                      className="border-b border-slate-100 hover:bg-slate-50"
                    >
                      <td className="p-4 font-medium text-text-primary-dark">
                        {getBookTitle(issuance.bookId)}
                      </td>
                      <td className="p-4">
                        {getMemberName(issuance.memberId, issuance.memberType)}{" "}
                        ({issuance.memberType})
                      </td>
                      <td className="p-4">
                        {new Date(issuance.dueDate).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-right">
                        <Button
                          variant="secondary"
                          className="!px-3 !py-1 text-xs"
                          onClick={() => handleReturnBook(issuance.id)}
                        >
                          Return
                        </Button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      {issuingBook && (
        <IssueBookModal
          book={issuingBook}
          members={allMembers}
          onClose={() => setIssuingBook(null)}
          onIssue={handleIssueBook}
        />
      )}
    </div>
  );
};

export default LibraryManagement;
