// pages/registrar/AcademicRequests.tsx
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "../../hooks/useAuth.ts";
// Import the concrete service implementation and instantiate it
import { RegistrarApiService } from "../../services/registrarApiService";
import type {
  RectificationRequest,
  SyllabusChangeRequest,
  Lecture,
  ExamMarkRectificationRequest,
} from "../../types.ts";
import Card from "../../components/ui/Card.tsx";
import Button from "../../components/ui/Button.tsx";
import StudentLeaveRequestsView from "./StudentLeaveRequests.tsx";

const apiService = new RegistrarApiService();

const AcademicRequests: React.FC = () => {
  const { user } = useAuth();
  const [rectificationRequests, setRectificationRequests] = useState<
    RectificationRequest[]
  >([]);
  const [syllabusRequests, setSyllabusRequests] = useState<
    SyllabusChangeRequest[]
  >([]);
  const [examMarkRequests, setExamMarkRequests] = useState<
    ExamMarkRectificationRequest[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"Pending" | "Approved" | "Rejected">(
    "Pending"
  );
  const [activeTab, setActiveTab] = useState<
    "rectification" | "exam_marks" | "syllabus" | "student_leaves"
  >("rectification");
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>(
    {}
  );

  const fetchData = useCallback(async () => {
    // Service methods use auth token to scope to branch, so no branchId argument required.
    setLoading(true);
    try {
      const [rectData, syllabusData, examMarkData] = await Promise.all([
        apiService.getRectificationRequests(),
        apiService.getSyllabusChangeRequests(),
        apiService.getExamMarkRectificationRequests(),
      ]);
      setRectificationRequests(rectData || []);
      setSyllabusRequests(syllabusData || []);
      setExamMarkRequests(examMarkData || []);
    } catch (err) {
      console.error("Failed to fetch academic requests", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // service methods expect (requestId, status)
  const handleRectificationAction = async (
    requestId: string,
    status: "Approved" | "Rejected"
  ) => {
    setActionLoading((prev) => ({ ...prev, [requestId]: true }));
    try {
      await apiService.processRectificationRequest(requestId, status);
      await fetchData();
    } catch (error) {
      console.error("Failed to process request:", error);
      alert("An error occurred while processing the request.");
    } finally {
      setActionLoading((prev) => ({ ...prev, [requestId]: false }));
    }
  };

  const handleExamMarkAction = async (
    requestId: string,
    status: "Approved" | "Rejected"
  ) => {
    setActionLoading((prev) => ({ ...prev, [requestId]: true }));
    try {
      await apiService.processExamMarkRectificationRequest(requestId, status);
      await fetchData();
    } catch (error) {
      console.error("Failed to process exam mark request:", error);
      alert("An error occurred while processing the request.");
    } finally {
      setActionLoading((prev) => ({ ...prev, [requestId]: false }));
    }
  };

  const handleSyllabusAction = async (
    requestId: string,
    status: "Approved" | "Rejected"
  ) => {
    setActionLoading((prev) => ({ ...prev, [requestId]: true }));
    try {
      await apiService.processSyllabusChangeRequest(requestId, status);
      await fetchData();
    } catch (error) {
      console.error("Failed to process syllabus request:", error);
      alert("An error occurred while processing the request.");
    } finally {
      setActionLoading((prev) => ({ ...prev, [requestId]: false }));
    }
  };

  const filteredRectificationRequests = useMemo(() => {
    return rectificationRequests
      .filter((r) => r.status === view)
      .sort(
        (a, b) =>
          new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()
      );
  }, [rectificationRequests, view]);

  const filteredSyllabusRequests = useMemo(() => {
    return syllabusRequests
      .filter((r) => r.status === view)
      .sort(
        (a, b) =>
          new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()
      );
  }, [syllabusRequests, view]);

  const filteredExamMarkRequests = useMemo(() => {
    return examMarkRequests
      .filter((r) => r.status === view)
      .sort(
        (a, b) =>
          new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()
      );
  }, [examMarkRequests, view]);

  const tabButtonClasses = (isActive: boolean) =>
    `px-4 py-2 text-sm font-medium transition-colors focus:outline-none ${
      isActive
        ? "bg-slate-200 rounded-t-lg font-semibold"
        : "text-text-secondary-dark hover:bg-slate-100"
    }`;

  const viewButtonClasses = (isActive: boolean) =>
    `px-4 py-2 text-sm font-medium transition-colors focus:outline-none ${
      isActive
        ? "border-b-2 border-brand-secondary text-brand-secondary"
        : "text-text-secondary-dark hover:text-text-primary-dark"
    }`;

  const renderSyllabusChangeDetails = (req: SyllabusChangeRequest) => {
    const original = req.originalData
      ? (JSON.parse(req.originalData) as Lecture)
      : null;
    const updated = req.newData
      ? (JSON.parse(req.newData) as Partial<Lecture>)
      : null;
    if (req.requestType === "delete" && original) {
      return (
        <div className="bg-red-50 p-2 rounded text-red-800 text-xs">
          <strong>Deletion:</strong> "{original.topic}" on{" "}
          {original.scheduledDate}
        </div>
      );
    }
    if (req.requestType === "update" && original && updated) {
      return (
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-slate-100 p-2 rounded">
            <strong>From:</strong> "{original.topic}" on{" "}
            {original.scheduledDate}
          </div>
          <div className="bg-blue-50 p-2 rounded">
            <strong>To:</strong> "{updated.topic}" on {updated.scheduledDate}
          </div>
        </div>
      );
    }
    return null;
  };

  const renderContent = () => {
    if (loading) return <p>Loading requests...</p>;

    switch (activeTab) {
      case "student_leaves":
        return <StudentLeaveRequestsView view={view} />;
      case "rectification":
        return filteredRectificationRequests.length === 0 ? (
          <p className="text-center text-text-secondary-dark p-8">
            No {view.toLowerCase()} grade/attendance requests.
          </p>
        ) : (
          <table className="w-full text-left">
            <thead className="border-b">
              <tr>
                <th className="p-2">Teacher</th>
                <th className="p-2">Type</th>
                <th className="p-2">Details</th>
                <th className="p-2">Reason</th>
                <th className="p-2">Requested At</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody>
              {filteredRectificationRequests.map((req) => (
                <tr key={req.id} className="border-b">
                  <td className="p-2">{req.teacherName}</td>
                  <td className="p-2">{req.type}</td>
                  <td className="p-2 text-xs">
                    <strong>{req.details.studentName}</strong> in{" "}
                    {req.details.courseName}
                    <br />
                    Change from{" "}
                    <span className="font-semibold text-red-600">
                      {req.details.from}
                    </span>{" "}
                    to{" "}
                    <span className="font-semibold text-green-600">
                      {req.details.to}
                    </span>
                  </td>
                  <td className="p-2 text-xs">{req.reason}</td>
                  <td className="p-2 text-xs">
                    {new Date(req.requestedAt).toLocaleString()}
                  </td>
                  <td className="p-2 text-right">
                    {view === "Pending" && (
                      <div className="flex gap-2 justify-end">
                        <Button
                          onClick={() =>
                            handleRectificationAction(req.id, "Approved")
                          }
                          disabled={actionLoading[req.id]}
                        >
                          ✔
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() =>
                            handleRectificationAction(req.id, "Rejected")
                          }
                          disabled={actionLoading[req.id]}
                        >
                          ✖
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        );
      case "exam_marks":
        return filteredExamMarkRequests.length === 0 ? (
          <p className="text-center text-text-secondary-dark p-8">
            No {view.toLowerCase()} exam mark requests.
          </p>
        ) : (
          <table className="w-full text-left">
            <thead className="border-b">
              <tr>
                <th className="p-2">Teacher</th>
                <th className="p-2">Student</th>
                <th className="p-2">Exam</th>
                <th className="p-2">Change</th>
                <th className="p-2">Reason</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody>
              {filteredExamMarkRequests.map((req) => (
                <tr key={req.id} className="border-b">
                  <td className="p-2">{req.teacherName}</td>
                  <td className="p-2">{req.details.studentName}</td>
                  <td className="p-2 text-xs">
                    {req.details.examinationName} ({req.details.subjectName})
                  </td>
                  <td className="p-2 text-xs">
                    <span className="font-semibold text-red-600">
                      {req.details.fromScore}
                    </span>{" "}
                    →{" "}
                    <span className="font-semibold text-green-600">
                      {req.details.toScore}
                    </span>
                  </td>
                  <td className="p-2 text-xs">{req.reason}</td>
                  <td className="p-2 text-right">
                    {view === "Pending" && (
                      <div className="flex gap-2 justify-end">
                        <Button
                          onClick={() =>
                            handleExamMarkAction(req.id, "Approved")
                          }
                          disabled={actionLoading[req.id]}
                        >
                          ✔
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() =>
                            handleExamMarkAction(req.id, "Rejected")
                          }
                          disabled={actionLoading[req.id]}
                        >
                          ✖
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        );
      case "syllabus":
        return filteredSyllabusRequests.length === 0 ? (
          <p className="text-center text-text-secondary-dark p-8">
            No {view.toLowerCase()} syllabus requests.
          </p>
        ) : (
          <table className="w-full text-left">
            <thead className="border-b">
              <tr>
                <th className="p-2">Teacher</th>
                <th className="p-2">Details</th>
                <th className="p-2">Reason</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody>
              {filteredSyllabusRequests.map((req) => (
                <tr key={req.id} className="border-b">
                  <td className="p-2">{req.teacherName}</td>
                  <td className="p-2">{renderSyllabusChangeDetails(req)}</td>
                  <td className="p-2 text-xs">{req.reason}</td>
                  <td className="p-2 text-right">
                    {view === "Pending" && (
                      <div className="flex gap-2 justify-end">
                        <Button
                          onClick={() =>
                            handleSyllabusAction(req.id, "Approved")
                          }
                          disabled={actionLoading[req.id]}
                        >
                          ✔
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() =>
                            handleSyllabusAction(req.id, "Rejected")
                          }
                          disabled={actionLoading[req.id]}
                        >
                          ✖
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        );
      default:
        return null;
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-text-primary-dark mb-6">
        Academic & Leave Requests
      </h1>
      <Card>
        <div className="flex border-b border-slate-200">
          <button
            className={tabButtonClasses(activeTab === "student_leaves")}
            onClick={() => setActiveTab("student_leaves")}
          >
            Student Leaves
          </button>
          <button
            className={tabButtonClasses(activeTab === "rectification")}
            onClick={() => setActiveTab("rectification")}
          >
            Grade/Attendance Rectification
          </button>
          <button
            className={tabButtonClasses(activeTab === "exam_marks")}
            onClick={() => setActiveTab("exam_marks")}
          >
            Exam Marks Rectification
          </button>
          <button
            className={tabButtonClasses(activeTab === "syllabus")}
            onClick={() => setActiveTab("syllabus")}
          >
            Syllabus Changes
          </button>
        </div>

        <div className="flex justify-end my-4">
          <div className="flex border rounded-lg overflow-hidden">
            <button
              className={viewButtonClasses(view === "Pending")}
              onClick={() => setView("Pending")}
            >
              Pending
            </button>
            <button
              className={viewButtonClasses(view === "Approved")}
              onClick={() => setView("Approved")}
            >
              Approved
            </button>
            <button
              className={viewButtonClasses(view === "Rejected")}
              onClick={() => setView("Rejected")}
            >
              Rejected
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">{renderContent()}</div>
      </Card>
    </div>
  );
};

export default AcademicRequests;
