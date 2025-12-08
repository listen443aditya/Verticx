import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../../hooks/useAuth";
import { LibrarianApiService } from "../../services/librarianApiService";
import type {
  HydratedBookIssuance,
  LibraryBook,
  Student,
  Teacher,
} from "../../types";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import { BarcodeIcon } from "../../components/icons/Icons";

const apiService = new LibrarianApiService();

const IssuanceManagement: React.FC = () => {
  const { user } = useAuth();
  const [issuances, setIssuances] = useState<HydratedBookIssuance[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"issued" | "history">("issued");

  // --- Search & Filter State (New) ---
  const [issuedSearchQuery, setIssuedSearchQuery] = useState("");
  const [issuedClassFilter, setIssuedClassFilter] = useState("All");

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
    try {
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
    } catch (error) {
      console.error("Failed to load library data", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Dynamic Filter Options ---
  // Automatically extract "Grade X" from the issuance list to populate the dropdown
  const availableClasses = useMemo(() => {
    const classes = new Set<string>();
    issuances.forEach((i) => {
      // Assuming memberDetails format is "Grade X - Section" or similar
      if (i.memberDetails && i.memberDetails.includes("Grade")) {
        const match = i.memberDetails.match(/(Grade\s\d+)/);
        if (match) classes.add(match[1]);
      } else if (i.memberDetails && i.memberDetails.includes("Teacher")) {
        classes.add("Teachers");
      }
    });
    // Sort naturally (Grade 5 before Grade 10)
    return Array.from(classes).sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true })
    );
  }, [issuances]);

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
          member.userId.toLowerCase().includes(lowerQuery)
      );
      setMemberSuggestions(filtered.slice(0, 5));
    } else {
      setMemberSuggestions([]);
    }
  };

  const selectBook = (book: LibraryBook) => {
    setBookIdentifier(book.isbn);
    setBookSuggestions([]);
  };

  const selectMember = (member: Student | Teacher) => {
    setMemberId(member.userId);
    setMemberSuggestions([]);
  };

  // --- Filtering Logic ---
  const currentlyIssued = useMemo(() => {
    return issuances
      .filter((i) => {
        // 1. Must not be returned
        if (i.returnedDate) return false;

        // 2. Class Filter
        if (
          issuedClassFilter !== "All" &&
          !i.memberDetails.includes(issuedClassFilter)
        ) {
          if (issuedClassFilter === "Teachers" && i.memberDetails !== "Teacher")
            return false;
          if (issuedClassFilter !== "Teachers") return false;
        }

        // 3. Search Query
        if (issuedSearchQuery) {
          const q = issuedSearchQuery.toLowerCase();
          return (
            i.bookTitle.toLowerCase().includes(q) ||
            i.memberName.toLowerCase().includes(q) ||
            i.memberDetails.toLowerCase().includes(q)
          );
        }

        return true;
      })
      .sort(
        (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      );
  }, [issuances, issuedClassFilter, issuedSearchQuery]);

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
      <h1 className="text-3xl font-bold mb-6 text-text-primary-dark">
        Issue & Returns Management
      </h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Issue Form */}
        <Card className="lg:col-span-1 h-fit">
          <h2 className="text-xl font-semibold mb-4 text-text-primary-dark">
            Issue a Book
          </h2>
          <form onSubmit={handleIssue} className="space-y-4">
            <div className="relative">
              <Input
                label="Book ID or ISBN"
                value={bookIdentifier}
                onChange={handleBookIdentifierChange}
                onBlur={() => setTimeout(() => setBookSuggestions([]), 150)}
                required
                placeholder="Scan or type..."
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
                placeholder="Scan or type..."
                icon={<BarcodeIcon className="h-5 w-5 text-slate-400" />}
                autoComplete="off"
              />
              {memberSuggestions.length > 0 && (
                <ul className="absolute z-10 w-full bg-white border border-slate-300 rounded-md mt-1 shadow-lg max-h-40 overflow-y-auto">
                  {memberSuggestions.map((member) => (
                    <li
                      key={member.userId}
                      onClick={() => selectMember(member)}
                      className="px-4 py-2 hover:bg-slate-100 cursor-pointer text-sm"
                    >
                      <p className="font-semibold">{member.name}</p>
                      <p className="text-xs text-slate-500">
                        {member.userId} -{" "}
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

        {/* Right Column: Lists */}
        <Card className="lg:col-span-2 flex flex-col min-h-[500px]">
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

          {/* Filters Bar (Only visible for Issued tab) */}
          {activeTab === "issued" && (
            <div className="flex flex-col md:flex-row gap-3 mb-4 p-2 bg-slate-50 rounded-lg">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search by Book, Name or ID..."
                  value={issuedSearchQuery}
                  onChange={(e) => setIssuedSearchQuery(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
              </div>
              <div className="w-full md:w-40">
                <select
                  value={issuedClassFilter}
                  onChange={(e) => setIssuedClassFilter(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary"
                >
                  <option value="All">All Classes</option>
                  {availableClasses.map((cls) => (
                    <option key={cls} value={cls}>
                      {cls}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="overflow-auto flex-grow">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-white z-10 shadow-sm">
                <tr className="border-b bg-slate-50 text-slate-700">
                  <th className="p-3 font-semibold">Book Title</th>
                  <th className="p-3 font-semibold">Issued To</th>
                  <th className="p-3 font-semibold">
                    {activeTab === "issued" ? "Due Date" : "Returned On"}
                  </th>
                  <th className="p-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(activeTab === "issued" ? currentlyIssued : history).length >
                0 ? (
                  (activeTab === "issued" ? currentlyIssued : history).map(
                    (item) => {
                      const isOverdue =
                        !item.returnedDate &&
                        new Date(item.dueDate) < new Date();
                      return (
                        <tr
                          key={item.id}
                          className={`group transition-colors ${
                            isOverdue
                              ? "bg-red-50 hover:bg-red-100"
                              : "hover:bg-slate-50"
                          }`}
                        >
                          <td className="p-3">
                            <span className="font-medium text-slate-900 block">
                              {item.bookTitle}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="font-medium text-slate-900 block">
                              {item.memberName}
                            </span>
                            <span className="text-xs text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200 inline-block mt-1">
                              {item.memberDetails}
                            </span>
                          </td>
                          <td className="p-3">
                            {activeTab === "issued" ? (
                              <span
                                className={`font-medium ${
                                  isOverdue ? "text-red-600" : "text-slate-600"
                                }`}
                              >
                                {new Date(item.dueDate).toLocaleDateString()}
                                {isOverdue && (
                                  <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-red-600 border border-red-200 px-1 rounded">
                                    Overdue
                                  </span>
                                )}
                              </span>
                            ) : (
                              <span className="text-slate-600">
                                {new Date(
                                  item.returnedDate!
                                ).toLocaleDateString()}
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            {activeTab === "issued" && (
                              <Button
                                variant="secondary"
                                className="!px-3 !py-1 text-xs border-slate-300 hover:border-brand-primary hover:text-brand-primary bg-white"
                                onClick={() => handleReturn(item.id)}
                              >
                                Return
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    }
                  )
                ) : (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-400">
                      No records found matching your filters.
                    </td>
                  </tr>
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
