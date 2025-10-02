import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../../hooks/useAuth.ts";
import { LibrarianApiService } from "../../services";
import type {
  HydratedBookIssuance,
  User,
  LibraryBook,
  Student,
  Teacher,
} from "../../types.ts";
import Card from "../../components/ui/Card.tsx";
import Button from "../../components/ui/Button.tsx";
import Input from "../../components/ui/Input.tsx";
import { BarcodeIcon } from "../../components/icons/Icons.tsx";

const apiService = new LibrarianApiService();

const IssuanceManagement: React.FC = () => {
  const { user } = useAuth();
  const [issuances, setIssuances] = useState<HydratedBookIssuance[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"issued" | "history">("issued");

  // Data for suggestions
  const [allBooks, setAllBooks] = useState<LibraryBook[]>([]);
  const [allMembers, setAllMembers] = useState<(Student | Teacher)[]>([]);

  // Form state
  const [bookIdentifier, setBookIdentifier] = useState("");
  const [memberId, setMemberId] = useState("");
  const [dueDate, setDueDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 14); // Default 14 days
    return date.toISOString().split("T")[0];
  });
  const [finePerDay, setFinePerDay] = useState("1.00");
  const [actionStatus, setActionStatus] = useState({ message: "", type: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Suggestion state
  const [bookSuggestions, setBookSuggestions] = useState<LibraryBook[]>([]);
  const [memberSuggestions, setMemberSuggestions] = useState<
    (Student | Teacher)[]
  >([]);

  const fetchData = useCallback(async () => {
    if (!user?.branchId) return;
    setLoading(true);
    // FIX: Restored branchId and corrected method names.
    // Your LibrarianApiService must implement getStudentsByBranch and getTeachersByBranch.
    const [issuanceData, bookData, studentData, teacherData] =
      await Promise.all([
        apiService.getBookIssuancesWithMemberDetails(user.branchId),
        apiService.getLibraryBooks(user.branchId),
        apiService.getStudentsByBranch(user.branchId),
        apiService.getTeachersByBranch(user.branchId),
      ]);
    setIssuances(issuanceData);
    setAllBooks(bookData);
    setAllMembers([...studentData, ...teacherData]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.branchId || !bookIdentifier || !memberId) return;

    setIsSubmitting(true);
    setActionStatus({ message: "", type: "" });
    try {
      const bookToIssue =
        allBooks.find((b) => b.isbn === bookIdentifier) ||
        allBooks.find((b) => b.id === bookIdentifier);
      const bookIdToSubmit = bookToIssue ? bookToIssue.id : bookIdentifier;

      // FIX: Restored the mandatory branchId argument.
      const response = await apiService.issueBookByIsbnOrId(
        user.branchId,
        bookIdToSubmit,
        memberId,
        dueDate,
        Number(finePerDay)
      );
      setActionStatus({
        message: `Successfully issued "${response.bookTitle}" to ${response.memberName}.`,
        type: "success",
      });
      setBookIdentifier("");
      setMemberId("");
      await fetchData();
    } catch (error: any) {
      setActionStatus({ message: error.message, type: "error" });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setActionStatus({ message: "", type: "" }), 5000);
    }
  };

  const handleReturn = async (issuanceId: string) => {
    // Assuming returnBook does not need branchId as issuanceId is unique
    await apiService.returnBook(issuanceId);
    await fetchData();
  };

  const handleBookIdentifierChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const query = e.target.value;
    setBookIdentifier(query);
    if (query.length > 1) {
      const lowerQuery = query.toLowerCase();
      const filtered = allBooks.filter(
        (book) =>
          book.title.toLowerCase().includes(lowerQuery) ||
          book.isbn.toLowerCase().includes(lowerQuery) ||
          book.id.toLowerCase().includes(lowerQuery)
      );
      setBookSuggestions(filtered.slice(0, 5));
    } else {
      setBookSuggestions([]);
    }
  };

  const handleMemberIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setMemberId(query);
    if (query.length > 1) {
      const lowerQuery = query.toLowerCase();
      const filtered = allMembers.filter(
        (member) =>
          member.name.toLowerCase().includes(lowerQuery) ||
          member.id.toLowerCase().includes(lowerQuery)
      );
      setMemberSuggestions(filtered.slice(0, 5));
    } else {
      setMemberSuggestions([]);
    }
  };

  const selectBook = (book: LibraryBook) => {
    setBookIdentifier(book.isbn); // Use ISBN as it's scan-friendly
    setBookSuggestions([]);
  };

  const selectMember = (member: Student | Teacher) => {
    setMemberId(member.id);
    setMemberSuggestions([]);
  };

  const currentlyIssued = useMemo(
    () =>
      issuances
        .filter((i) => !i.returnedDate)
        .sort(
          (a, b) =>
            new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        ),
    [issuances]
  );
  const history = useMemo(
    () =>
      issuances
        .filter((i) => i.returnedDate)
        .sort(
          (a, b) =>
            new Date(b.returnedDate!).getTime() -
            new Date(a.issuedDate).getTime()
        ),
    [issuances]
  );

  const tabButtonClasses = (isActive: boolean) =>
    `px-4 py-2 text-sm font-medium transition-colors focus:outline-none ${
      isActive
        ? "border-b-2 border-brand-secondary text-brand-secondary"
        : "text-text-secondary-dark hover:text-text-primary-dark"
    }`;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Issue & Returns Management</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <h2 className="text-xl font-semibold mb-4">Issue a Book</h2>
          <form onSubmit={handleIssue} className="space-y-4">
            <div className="relative">
              <Input
                label="Book ID or ISBN"
                value={bookIdentifier}
                onChange={handleBookIdentifierChange}
                onBlur={() => setTimeout(() => setBookSuggestions([]), 150)}
                required
                placeholder="Scan or type to search book..."
                icon={<BarcodeIcon className="h-5 w-5 text-slate-400" />}
                autoComplete="off"
              />
              {bookSuggestions.length > 0 && (
                <ul className="absolute z-20 w-full bg-white border border-slate-300 rounded-md mt-1 shadow-lg max-h-40 overflow-y-auto">
                  {bookSuggestions.map((book) => (
                    <li
                      key={book.id}
                      onClick={() => selectBook(book)}
                      className="px-4 py-2 hover:bg-slate-100 cursor-pointer text-sm"
                    >
                      <p className="font-semibold">{book.title}</p>
                      <p className="text-xs text-slate-500">{book.isbn}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="relative">
              <Input
                label="Student or Teacher ID"
                value={memberId}
                onChange={handleMemberIdChange}
                onBlur={() => setTimeout(() => setMemberSuggestions([]), 150)}
                required
                placeholder="Scan or type to search member..."
                icon={<BarcodeIcon className="h-5 w-5 text-slate-400" />}
                autoComplete="off"
              />
              {memberSuggestions.length > 0 && (
                <ul className="absolute z-10 w-full bg-white border border-slate-300 rounded-md mt-1 shadow-lg max-h-40 overflow-y-auto">
                  {memberSuggestions.map((member) => (
                    <li
                      key={member.id}
                      onClick={() => selectMember(member)}
                      className="px-4 py-2 hover:bg-slate-100 cursor-pointer text-sm"
                    >
                      <p className="font-semibold">{member.name}</p>
                      <p className="text-xs text-slate-500">
                        {member.id} -{" "}
                        {(member as Student).gradeLevel ? "Student" : "Teacher"}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
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

            {actionStatus.message && (
              <p
                className={`text-sm text-center p-2 rounded ${
                  actionStatus.type === "success"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {actionStatus.message}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Processing..." : "Issue Book"}
            </Button>
          </form>
        </Card>
        <Card className="lg:col-span-2">
          <div className="flex border-b border-slate-200 mb-4">
            <button
              className={tabButtonClasses(activeTab === "issued")}
              onClick={() => setActiveTab("issued")}
            >
              Currently Issued ({currentlyIssued.length})
            </button>
            <button
              className={tabButtonClasses(activeTab === "history")}
              onClick={() => setActiveTab("history")}
            >
              History ({history.length})
            </button>
          </div>

          <div className="overflow-auto max-h-[60vh]">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-surface-dark">
                <tr className="border-b">
                  <th className="p-2">Book Title</th>
                  <th className="p-2">Issued To</th>
                  <th className="p-2">
                    {activeTab === "issued" ? "Due Date" : "Issued / Returned"}
                  </th>
                  <th className="p-2"></th>
                </tr>
              </thead>
              <tbody>
                {(activeTab === "issued" ? currentlyIssued : history).map(
                  (item) => {
                    const isOverdue =
                      !item.returnedDate && new Date(item.dueDate) < new Date();
                    return (
                      <tr
                        key={item.id}
                        className={`border-b ${
                          isOverdue ? "bg-red-50" : "hover:bg-slate-50"
                        }`}
                      >
                        <td className="p-2 font-medium">{item.bookTitle}</td>
                        <td className="p-2">
                          {item.memberName} <br />
                          <span className="text-xs text-slate-500">
                            {item.memberDetails}
                          </span>
                        </td>
                        <td
                          className={`p-2 font-semibold ${
                            isOverdue ? "text-red-600" : ""
                          }`}
                        >
                          {activeTab === "issued"
                            ? new Date(item.dueDate).toLocaleDateString()
                            : `${new Date(
                                item.issuedDate
                              ).toLocaleDateString()} - ${new Date(
                                item.returnedDate!
                              ).toLocaleDateString()}`}
                        </td>
                        <td className="p-2 text-right">
                          {activeTab === "issued" && (
                            <Button onClick={() => handleReturn(item.id)}>
                              Return
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default IssuanceManagement;
