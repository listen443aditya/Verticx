import React, { useState, useEffect, useCallback, useMemo } from "react";
import { PrincipalApiService } from "../../services";
import type {
  Announcement,
  SmsMessage,
  Student,
  PrincipalQuery,
} from "../../types.ts";
import Card from "../../components/ui/Card.tsx";
import Button from "../../components/ui/Button.tsx";
import Input from "../../components/ui/Input.tsx";
import ConfirmationModal from "../../components/ui/ConfirmationModal.tsx";
import { useAuth } from "../../hooks/useAuth.ts";
//import { TrashIcon } from "../../components/icons/Icons.tsx"; // Ensure you have this or use text

const apiService = new PrincipalApiService();

const Communication: React.FC = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [smsHistory, setSmsHistory] = useState<SmsMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Unified tab state
  const [activeTab, setActiveTab] = useState<
    "announcement" | "sms" | "queries"
  >("announcement");

  // Announcement form state
  const [title, setTitle] = useState("");
  const [announcementMessage, setAnnouncementMessage] = useState("");
  const [audience, setAudience] = useState<
    "All" | "Staff" | "Students" | "Parents"
  >("All");

  // SMS form state
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<Student[]>([]);
  const [smsMessage, setSmsMessage] = useState("");
  const [isSendingSms, setIsSendingSms] = useState(false);
  const [smsConfirmation, setSmsConfirmation] = useState("");

  // Query form state
  const [queries, setQueries] = useState<PrincipalQuery[]>([]);
  const [querySubject, setQuerySubject] = useState("");
  const [queryText, setQueryText] = useState("");
  const [isSendingQuery, setIsSendingQuery] = useState(false);
  const [queryStatus, setQueryStatus] = useState("");

  // Clear History State
  const [clearingHistoryType, setClearingHistoryType] = useState<
    "announcement" | "sms" | null
  >(null);
  const [isClearing, setIsClearing] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [announcementsData, smsData, studentsData, queriesData] =
        await Promise.all([
          apiService.getAnnouncements(),
          apiService.getSmsHistory(),
          apiService.getStudents(),
          apiService.getQueries(),
        ]);
      setAnnouncements(announcementsData);
      setSmsHistory(smsData);
      setAllStudents(studentsData);
      setQueries(queriesData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const searchResults = useMemo(() => {
    if (searchQuery.length < 2) return [];
    const lowercasedQuery = searchQuery.toLowerCase();
    return allStudents
      .filter(
        (student) =>
          student.name.toLowerCase().includes(lowercasedQuery) ||
          student.id.toLowerCase().includes(lowercasedQuery)
      )
      .slice(0, 5);
  }, [searchQuery, allStudents]);

  const handleSelectStudent = (student: Student) => {
    if (!selectedStudents.some((s) => s.id === student.id)) {
      setSelectedStudents((prev) => [...prev, student]);
    }
    setSearchQuery("");
  };

  const handleRemoveStudent = (studentId: string) => {
    setSelectedStudents((prev) => prev.filter((s) => s.id !== studentId));
  };

  const handleSendAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title || !announcementMessage) return;
    setSending(true);
    try {
      await apiService.sendAnnouncement({
        title,
        message: announcementMessage,
        audience,
      });
      setTitle("");
      setAnnouncementMessage("");
      setAudience("All");
      await fetchData();
    } catch (e) {
      alert("Failed to send");
    }
    setSending(false);
  };

  const handleSendSms = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || selectedStudents.length === 0 || !smsMessage) return;
    setIsSendingSms(true);
    setSmsConfirmation("");
    try {
      const studentIds = selectedStudents.map((s) => s.id);
      const result = await apiService.sendSmsToStudents(studentIds, smsMessage);
      if (result.success) {
        setSmsConfirmation(`SMS sent to parents of ${result.count} students.`);
        setSelectedStudents([]);
        setSmsMessage("");
        fetchData();
      }
    } catch (error) {
      setSmsConfirmation("Failed to send SMS. Please try again.");
    } finally {
      setIsSendingSms(false);
      setTimeout(() => setSmsConfirmation(""), 5000);
    }
  };

  const handleSendQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.schoolName || !querySubject || !queryText) return;

    setIsSendingQuery(true);
    setQueryStatus("");
    try {
      await apiService.raiseQueryToAdmin({
        branchId: user.branchId!,
        principalId: user.id,
        principalName: user.name,
        schoolName: user.schoolName!,
        subject: querySubject,
        queryText: queryText,
      });
      setQueryStatus("Query sent successfully.");
      setQuerySubject("");
      setQueryText("");
      fetchData();
    } catch (error) {
      setQueryStatus("Failed to send query.");
    } finally {
      setIsSendingQuery(false);
      setTimeout(() => setQueryStatus(""), 5000);
    }
  };

  const handleClearHistory = async () => {
    if (!clearingHistoryType) return;
    setIsClearing(true);
    try {
      if (clearingHistoryType === "announcement") {
        await apiService.clearAnnouncementsHistory();
      } else if (clearingHistoryType === "sms") {
        await apiService.clearSmsHistory();
      }
      await fetchData(); // Refresh lists
      setClearingHistoryType(null);
    } catch (error) {
      console.error("Failed to clear history:", error);
      alert("Failed to clear history.");
    } finally {
      setIsClearing(false);
    }
  };

  const compositionTabButtonClasses = (isActive: boolean) =>
    `w-full py-2 text-center font-medium transition-colors focus:outline-none ${
      isActive
        ? "bg-brand-secondary text-white rounded-t-lg"
        : "bg-slate-200 text-text-secondary-dark hover:bg-slate-300"
    }`;

  const historyTabButtonClasses = (isActive: boolean) =>
    `px-4 py-2 text-sm font-medium transition-colors focus:outline-none ${
      isActive
        ? "border-b-2 border-brand-secondary text-brand-secondary"
        : "text-text-secondary-dark hover:text-text-primary-dark"
    }`;

  return (
    <div>
      <h1 className="text-3xl font-bold text-text-primary-dark mb-6">
        Communication Center
      </h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 !p-0">
          <div className="flex">
            <button
              className={compositionTabButtonClasses(
                activeTab === "announcement"
              )}
              onClick={() => setActiveTab("announcement")}
            >
              Announcement
            </button>
            <button
              className={compositionTabButtonClasses(activeTab === "sms")}
              onClick={() => setActiveTab("sms")}
            >
              SMS
            </button>
            <button
              className={compositionTabButtonClasses(activeTab === "queries")}
              onClick={() => setActiveTab("queries")}
            >
              Query to Admin
            </button>
          </div>
          <div className="p-6">
            {activeTab === "announcement" && (
              <form onSubmit={handleSendAnnouncement} className="space-y-4">
                <Input
                  label="Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
                <div>
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium text-text-secondary-dark mb-1"
                  >
                    Message
                  </label>
                  <textarea
                    id="message"
                    value={announcementMessage}
                    onChange={(e) => setAnnouncementMessage(e.target.value)}
                    rows={5}
                    className="w-full bg-white border border-slate-300 rounded-md py-2 px-3 text-text-primary-dark"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="audience"
                    className="block text-sm font-medium text-text-secondary-dark mb-1"
                  >
                    Audience
                  </label>
                  <select
                    id="audience"
                    value={audience}
                    onChange={(e) => setAudience(e.target.value as any)}
                    className="w-full bg-white border border-slate-300 rounded-md py-2 px-3"
                  >
                    <option>All</option>
                    <option>Staff</option>
                    <option>Students</option>
                    <option>Parents</option>
                  </select>
                </div>
                <Button type="submit" className="w-full" disabled={sending}>
                  {sending ? "Sending..." : "Send Announcement"}
                </Button>
              </form>
            )}
            {activeTab === "sms" && (
              <form onSubmit={handleSendSms} className="space-y-4">
                <div className="relative">
                  <Input
                    label="Search Students (by Name or ID)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoComplete="off"
                  />
                  {searchResults.length > 0 && (
                    <ul className="absolute z-10 w-full bg-white border border-slate-300 rounded-md mt-1 shadow-lg max-h-40 overflow-y-auto">
                      {searchResults.map((student) => (
                        <li
                          key={student.id}
                          onClick={() => handleSelectStudent(student)}
                          className="px-4 py-2 hover:bg-slate-100 cursor-pointer text-sm"
                        >
                          {student.name} ({student.id})
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                {selectedStudents.length > 0 && (
                  <div className="p-2 border border-slate-200 rounded-md max-h-28 overflow-y-auto">
                    <p className="text-xs font-semibold text-text-secondary-dark mb-2">
                      Recipients ({selectedStudents.length}):
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {selectedStudents.map((student) => (
                        <span
                          key={student.id}
                          className="bg-brand-primary text-white text-xs font-medium px-2 py-1 rounded-full flex items-center"
                        >
                          {student.name}
                          <button
                            type="button"
                            onClick={() => handleRemoveStudent(student.id)}
                            className="ml-2 text-white hover:text-brand-accent"
                          >
                            &times;
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <label
                    htmlFor="sms_message"
                    className="block text-sm font-medium text-text-secondary-dark mb-1"
                  >
                    Message
                  </label>
                  <textarea
                    id="sms_message"
                    value={smsMessage}
                    onChange={(e) => setSmsMessage(e.target.value)}
                    rows={5}
                    className="w-full bg-white border border-slate-300 rounded-md py-2 px-3"
                    required
                  />
                </div>
                {smsConfirmation && (
                  <p className="text-sm text-center text-green-600">
                    {smsConfirmation}
                  </p>
                )}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSendingSms || selectedStudents.length === 0}
                >
                  {isSendingSms ? "Sending..." : "Send SMS"}
                </Button>
              </form>
            )}
            {activeTab === "queries" && (
              <form onSubmit={handleSendQuery} className="space-y-4">
                <Input
                  label="Subject"
                  value={querySubject}
                  onChange={(e) => setQuerySubject(e.target.value)}
                  required
                />
                <div>
                  <label className="block text-sm font-medium">
                    Query Details
                  </label>
                  <textarea
                    value={queryText}
                    onChange={(e) => setQueryText(e.target.value)}
                    rows={5}
                    className="w-full bg-white border border-slate-300 rounded-md py-2 px-3 mt-1"
                    required
                  />
                </div>
                {queryStatus && (
                  <p className="text-sm text-center text-green-600">
                    {queryStatus}
                  </p>
                )}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSendingQuery}
                >
                  {isSendingQuery ? "Sending..." : "Send Query"}
                </Button>
              </form>
            )}
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <div className="flex justify-between items-center border-b border-slate-200 mb-4 pb-2">
            <div className="flex gap-4">
              <button
                className={historyTabButtonClasses(
                  activeTab === "announcement"
                )}
                onClick={() => setActiveTab("announcement")}
              >
                Announcements
              </button>
              <button
                className={historyTabButtonClasses(activeTab === "sms")}
                onClick={() => setActiveTab("sms")}
              >
                SMS History
              </button>
              <button
                className={historyTabButtonClasses(activeTab === "queries")}
                onClick={() => setActiveTab("queries")}
              >
                My Queries
              </button>
            </div>

            {/* --- CLEAR HISTORY BUTTON --- */}
            {activeTab !== "queries" && (
              <Button
                variant="danger"
                className="!px-3 !py-1 text-xs"
                onClick={() =>
                  setClearingHistoryType(
                    activeTab === "announcement" ? "announcement" : "sms"
                  )
                }
                disabled={
                  activeTab === "announcement"
                    ? announcements.length === 0
                    : smsHistory.length === 0
                }
              >
                Clear History
              </Button>
            )}
          </div>

          {loading ? (
            <p>Loading history...</p>
          ) : (
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              {activeTab === "announcement" &&
                (announcements.length > 0 ? (
                  announcements.map((ann) => (
                    <div key={ann.id} className="bg-slate-50 p-4 rounded-lg">
                      <h3 className="font-bold text-text-primary-dark">
                        {ann.title}
                      </h3>
                      <p className="text-xs text-text-secondary-dark">
                        To: {ann.audience} |{" "}
                        {new Date(ann.sentAt).toLocaleString()}
                      </p>
                      <p className="mt-2 text-sm text-text-primary-dark whitespace-pre-wrap">
                        {ann.message}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-text-secondary-dark pt-8">
                    No announcements found.
                  </p>
                ))}
              {activeTab === "sms" &&
                (smsHistory.length > 0 ? (
                  smsHistory.map((sms) => (
                    <div key={sms.id} className="bg-slate-50 p-4 rounded-lg">
                      <p className="text-xs text-text-secondary-dark">
                        To: {sms.recipientCount} recipients | Sent by:{" "}
                        {sms.sentBy} on {new Date(sms.sentAt).toLocaleString()}
                      </p>
                      <p className="mt-2 text-sm text-text-primary-dark whitespace-pre-wrap">
                        {sms.message}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-text-secondary-dark pt-8">
                    No SMS history found.
                  </p>
                ))}
              {activeTab === "queries" &&
                (queries.length > 0 ? (
                  queries.map((q) => (
                    <details
                      key={q.id}
                      className="bg-slate-50 p-4 rounded-lg"
                      open={q.status === "Open"}
                    >
                      <summary className="cursor-pointer font-semibold text-text-primary-dark flex justify-between items-center">
                        <div>
                          <p>{q.subject}</p>
                          <p className="text-xs font-normal text-text-secondary-dark">
                            {new Date(q.submittedAt).toLocaleString()}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            q.status === "Open"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {q.status}
                        </span>
                      </summary>
                      <div className="mt-2 pt-2 border-t">
                        <p className="text-sm text-text-primary-dark whitespace-pre-wrap">
                          {q.queryText}
                        </p>
                        {q.status === "Resolved" &&
                          q.resolvedAt &&
                          q.adminNotes && (
                            <div className="mt-3 p-3 bg-green-50 border-l-4 border-green-400">
                              <p className="font-semibold text-sm text-green-800">
                                Admin Response (
                                {new Date(q.resolvedAt).toLocaleDateString()}):
                              </p>
                              <p className="text-sm italic text-green-900">
                                "{q.adminNotes}"
                              </p>
                            </div>
                          )}
                      </div>
                    </details>
                  ))
                ) : (
                  <p className="text-center text-text-secondary-dark pt-8">
                    You have not sent any queries.
                  </p>
                ))}
            </div>
          )}
        </Card>
      </div>

      {/* Confirmation Modal for Clearing History */}
      {clearingHistoryType && (
        <ConfirmationModal
          isOpen={true}
          onClose={() => setClearingHistoryType(null)}
          onConfirm={handleClearHistory}
          title={`Clear ${
            clearingHistoryType === "announcement" ? "Announcement" : "SMS"
          } History`}
          message={
            <>
              Are you sure you want to delete <strong>ALL</strong> history for{" "}
              {clearingHistoryType === "announcement" ? "Announcements" : "SMS"}
              ? This cannot be undone.
            </>
          }
          confirmVariant="danger"
          confirmText="Clear All"
          isConfirming={isClearing}
        />
      )}
    </div>
  );
};

export default Communication;
