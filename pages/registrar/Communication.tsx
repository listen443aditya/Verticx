import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "../../hooks/useAuth";
// FIX: Correctly import the service class and create an instance.
import { RegistrarApiService } from "../../services/registrarApiService";
import type { Announcement, SmsMessage, Student } from "../../types";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";

const apiService = new RegistrarApiService();

const Communication: React.FC = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [smsHistory, setSmsHistory] = useState<SmsMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [historyTab, setHistoryTab] = useState<"announcements" | "sms">(
    "announcements"
  );
  const [compositionTab, setCompositionTab] = useState<"announcement" | "sms">(
    "announcement"
  );

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

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    // FIX: Removed branchId from API calls.
    const [announcementsData, smsData, studentsData] = await Promise.all([
      apiService.getAnnouncements(),
      apiService.getSmsHistory(),
      apiService.getStudentsByBranch(user.branchId as string), // FIX: Provided branchId argument.
    ]);
    setAnnouncements(announcementsData);
    setSmsHistory(smsData);
    setAllStudents(studentsData);
    setLoading(false);
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
          (student.id && student.id.toLowerCase().includes(lowercasedQuery))
      )
      .slice(0, 5); // Limit results for performance
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
    // FIX: Removed branchId from API call.
    await apiService.sendAnnouncement({
      title,
      message: announcementMessage,
      audience,
    });
    setTitle("");
    setAnnouncementMessage("");
    setAudience("All");
    await fetchData();
    setSending(false);
  };

  const handleSendSms = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || selectedStudents.length === 0 || !smsMessage) return;
    setIsSendingSms(true);
    setSmsConfirmation("");
    try {
      const studentIds = selectedStudents.map((s) => s.id);
      // FIX: Updated API call to match the new signature (removed user name and branchId).
      const result = await apiService.sendSmsToStudents(studentIds, smsMessage);
      if (result.success) {
        setSmsConfirmation(`SMS sent to parents of ${result.count} students.`);
        setSelectedStudents([]);
        setSmsMessage("");
        fetchData(); // Refresh history
      }
    } catch (error) {
      setSmsConfirmation("Failed to send SMS. Please try again.");
    } finally {
      setIsSendingSms(false);
      setTimeout(() => setSmsConfirmation(""), 5000);
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
                compositionTab === "announcement"
              )}
              onClick={() => setCompositionTab("announcement")}
            >
              Announcement
            </button>
            <button
              className={compositionTabButtonClasses(compositionTab === "sms")}
              onClick={() => setCompositionTab("sms")}
            >
              SMS
            </button>
          </div>
          <div className="p-6">
            {compositionTab === "announcement" ? (
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
                    className="w-full bg-white border border-slate-300 rounded-md py-2 px-3 text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent"
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
            ) : (
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
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <div className="flex border-b border-slate-200 mb-4">
            <button
              className={historyTabButtonClasses(
                historyTab === "announcements"
              )}
              onClick={() => setHistoryTab("announcements")}
            >
              Announcements
            </button>
            <button
              className={historyTabButtonClasses(historyTab === "sms")}
              onClick={() => setHistoryTab("sms")}
            >
              SMS History
            </button>
          </div>
          {loading ? (
            <p>Loading history...</p>
          ) : (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {historyTab === "announcements" ? (
                announcements.length > 0 ? (
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
                )
              ) : smsHistory.length > 0 ? (
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
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Communication;
