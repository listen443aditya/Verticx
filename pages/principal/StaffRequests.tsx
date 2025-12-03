import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../../hooks/useAuth";
import { PrincipalApiService } from "../../services/principalApiService";
import type {
  TeacherAttendanceRectificationRequest,
  LeaveApplication,
  FeeRectificationRequest,
} from "../../types";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { useDataRefresh } from "../../contexts/DataRefreshContext";

// Create a single, clean instance of the service
const apiService = new PrincipalApiService();

const StaffRequests: React.FC = () => {
  const { user } = useAuth();
  const { refreshKey, triggerRefresh } = useDataRefresh();

  // State
  const [attendanceRequests, setAttendanceRequests] = useState<
    TeacherAttendanceRectificationRequest[]
  >([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveApplication[]>([]);
  const [feeRequests, setFeeRequests] = useState<FeeRectificationRequest[]>([]);

  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"Pending" | "Approved" | "Rejected">(
    "Pending"
  );
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>(
    {}
  );

  const [activeTab, setActiveTab] = useState<"attendance" | "leave" | "fees">(
    "attendance"
  );

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [attData, leaveData, feeData] = await Promise.all([
        apiService.getTeacherAttendanceRectificationRequests(),
        apiService.getLeaveApplications(),
        apiService.getFeeRectificationRequests(),
      ]);
      setAttendanceRequests(attData);
      setLeaveRequests(leaveData);
      setFeeRequests(feeData);
    } catch (error) {
      console.error("Failed to load requests:", error);
    } finally {
      setLoading(false);
    }
  }, [user, refreshKey]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAction = async (
    requestId: string,
    status: "Approved" | "Rejected",
    type: "attendance" | "leave" | "fees"
  ) => {
    if (!user) return;
    setActionLoading((prev) => ({ ...prev, [requestId]: true }));
    try {
      if (type === "attendance") {
        await apiService.processTeacherAttendanceRectificationRequest(
          requestId,
          status
        );
      } else if (type === "leave") {
        await apiService.processLeaveApplication(requestId, status);
      } else if (type === "fees") {
        await apiService.processFeeRectificationRequest(requestId, status);
      }
      triggerRefresh();
    } catch (error) {
      console.error("Failed to process request:", error);
      alert("Failed to process request.");
    } finally {
      setActionLoading((prev) => ({ ...prev, [requestId]: false }));
    }
  };

  // --- HELPER: Render Fee Changes ---
  const renderFeeChanges = (req: FeeRectificationRequest) => {
    if (req.requestType === "delete")
      return (
        <span className="text-slate-500 italic">
          Deletion of entire template
        </span>
      );

    const original = req.originalData as any;
    const newDetails = req.newData as any;

    if (!original || !newDetails)
      return <span className="text-slate-400">No details</span>;

    const changes = [];

    // Check Amount Change
    if (
      newDetails.amount !== undefined &&
      newDetails.amount !== original.amount
    ) {
      changes.push(
        <div key="amt" className="whitespace-nowrap">
          <span className="text-xs text-slate-500">Amount:</span>{" "}
          <span className="text-red-600 line-through text-xs mr-1">
            {original.amount?.toLocaleString()}
          </span>
          <span className="text-green-600 font-bold text-sm">
            {newDetails.amount?.toLocaleString()}
          </span>
        </div>
      );
    }

    // Check Name Change
    if (newDetails.name && newDetails.name !== original.name) {
      changes.push(
        <div key="name">
          <span className="text-xs text-slate-500">Name:</span>{" "}
          <span className="text-xs">
            {original.name} &rarr; <strong>{newDetails.name}</strong>
          </span>
        </div>
      );
    }

    // Check Grade Level Change
    if (
      newDetails.gradeLevel &&
      newDetails.gradeLevel !== original.gradeLevel
    ) {
      changes.push(
        <div key="grade">
          <span className="text-xs text-slate-500">Grade:</span>{" "}
          <span className="text-xs">
            {original.gradeLevel} &rarr;{" "}
            <strong>{newDetails.gradeLevel}</strong>
          </span>
        </div>
      );
    }

    // Check if breakdown was modified (simplified check)
    if (newDetails.monthlyBreakdown) {
      changes.push(
        <div key="breakdown" className="text-xs text-blue-600 mt-1">
          * Monthly breakdown updated
        </div>
      );
    }

    return (
      <div className="space-y-1">
        {changes.length > 0 ? changes : "No changes detected"}
      </div>
    );
  };

  // --- MEMOIZED FILTERS ---

  const filteredAttendanceRequests = useMemo(() => {
    return attendanceRequests
      .filter((r) => r.status === view)
      .sort(
        (a, b) =>
          new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()
      );
  }, [attendanceRequests, view]);

  const filteredLeaveRequests = useMemo(() => {
    return leaveRequests
      .filter((r) => r.status === view)
      .sort(
        (a, b) =>
          new Date(b.fromDate).getTime() - new Date(a.fromDate).getTime()
      );
  }, [leaveRequests, view]);

  const filteredFeeRequests = useMemo(() => {
    return feeRequests
      .filter((r) => r.status === view)
      .sort(
        (a, b) =>
          new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()
      );
  }, [feeRequests, view]);

  // --- STYLES ---
  const tabButtonClasses = (isActive: boolean) =>
    `px-4 py-2 text-sm font-medium transition-colors focus:outline-none ${
      isActive
        ? "bg-slate-200 rounded-t-lg font-semibold text-text-primary-dark"
        : "text-text-secondary-dark hover:bg-slate-100"
    }`;

  const viewButtonClasses = (isActive: boolean) =>
    `px-4 py-2 text-sm font-medium transition-colors focus:outline-none ${
      isActive
        ? "border-b-2 border-brand-secondary text-brand-secondary"
        : "text-text-secondary-dark hover:text-text-primary-dark"
    }`;

  return (
    <div>
      <h1 className="text-3xl font-bold text-text-primary-dark mb-6">
        Staff & System Requests
      </h1>
      <Card>
        {/* TABS */}
        <div className="flex border-b border-slate-200">
          <button
            className={tabButtonClasses(activeTab === "attendance")}
            onClick={() => setActiveTab("attendance")}
          >
            Attendance Rectification
          </button>
          <button
            className={tabButtonClasses(activeTab === "leave")}
            onClick={() => setActiveTab("leave")}
          >
            Leave Requests
          </button>
          <button
            className={tabButtonClasses(activeTab === "fees")}
            onClick={() => setActiveTab("fees")}
          >
            Fee Updates
          </button>
        </div>

        {/* FILTER BUTTONS */}
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

        {loading ? (
          <p className="text-center p-8">Loading requests...</p>
        ) : (
          <div className="overflow-x-auto">
            {/* --- ATTENDANCE TAB --- */}
            {activeTab === "attendance" &&
              (filteredAttendanceRequests.length === 0 ? (
                <p className="text-center text-text-secondary-dark p-8">
                  No {view.toLowerCase()} attendance requests.
                </p>
              ) : (
                <table className="w-full text-left">
                  <thead className="border-b border-slate-200 text-sm text-text-secondary-dark">
                    <tr>
                      <th className="p-4">Staff Member</th>
                      <th className="p-4">Date</th>
                      <th className="p-4">Change</th>
                      <th className="p-4">Reason</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAttendanceRequests.map((req) => (
                      <tr
                        key={req.id}
                        className="border-b border-slate-100 hover:bg-slate-50"
                      >
                        <td className="p-4 font-medium">{req.teacherName}</td>
                        <td className="p-4">
                          {new Date(req.date).toLocaleDateString()}
                        </td>
                        <td className="p-4 text-sm">
                          <span className="text-red-600">{req.fromStatus}</span>{" "}
                          &rarr;{" "}
                          <span className="text-green-600 font-bold">
                            {req.toStatus}
                          </span>
                        </td>
                        <td className="p-4 text-sm italic">"{req.reason}"</td>
                        <td className="p-4 text-right">
                          {view === "Pending" && (
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="primary"
                                className="!px-3 !py-1 text-xs"
                                onClick={() =>
                                  handleAction(req.id, "Approved", "attendance")
                                }
                                disabled={actionLoading[req.id]}
                              >
                                Approve
                              </Button>
                              <Button
                                variant="danger"
                                className="!px-3 !py-1 text-xs"
                                onClick={() =>
                                  handleAction(req.id, "Rejected", "attendance")
                                }
                                disabled={actionLoading[req.id]}
                              >
                                Reject
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ))}

            {/* --- LEAVE TAB --- */}
            {activeTab === "leave" &&
              (filteredLeaveRequests.length === 0 ? (
                <p className="text-center text-text-secondary-dark p-8">
                  No {view.toLowerCase()} leave requests.
                </p>
              ) : (
                <table className="w-full text-left">
                  <thead className="border-b border-slate-200 text-sm text-text-secondary-dark">
                    <tr>
                      <th className="p-4">Applicant</th>
                      <th className="p-4">Dates</th>
                      <th className="p-4">Type</th>
                      <th className="p-4">Reason</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeaveRequests.map((req) => (
                      <tr
                        key={req.id}
                        className="border-b border-slate-100 hover:bg-slate-50"
                      >
                        <td className="p-4 font-medium">
                          {req.applicantName}{" "}
                          <span className="text-xs text-slate-500">
                            ({req.applicantRole})
                          </span>
                        </td>
                        <td className="p-4 text-sm">
                          {req.startDate} - {req.endDate}
                        </td>
                        <td className="p-4 text-sm">
                          <span className="bg-slate-100 px-2 py-1 rounded">
                            {req.leaveType}
                          </span>
                        </td>
                        <td className="p-4 text-sm italic">"{req.reason}"</td>
                        <td className="p-4 text-right">
                          {view === "Pending" && (
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="primary"
                                className="!px-3 !py-1 text-xs"
                                onClick={() =>
                                  handleAction(req.id, "Approved", "leave")
                                }
                                disabled={actionLoading[req.id]}
                              >
                                Approve
                              </Button>
                              <Button
                                variant="danger"
                                className="!px-3 !py-1 text-xs"
                                onClick={() =>
                                  handleAction(req.id, "Rejected", "leave")
                                }
                                disabled={actionLoading[req.id]}
                              >
                                Reject
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ))}

            {/* --- FEE UPDATES TAB --- */}
            {activeTab === "fees" &&
              (filteredFeeRequests.length === 0 ? (
                <p className="text-center text-text-secondary-dark p-8">
                  No {view.toLowerCase()} fee update requests.
                </p>
              ) : (
                <table className="w-full text-left">
                  <thead className="border-b border-slate-200 text-sm text-text-secondary-dark">
                    <tr>
                      <th className="p-4">Requested By</th>
                      <th className="p-4">Action</th>
                      <th className="p-4">Template</th>
                      <th className="p-4">Proposed Changes</th>
                      <th className="p-4">Reason</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFeeRequests.map((req) => (
                      <tr
                        key={req.id}
                        className="border-b border-slate-100 hover:bg-slate-50"
                      >
                        <td className="p-4 font-medium">
                          {req.registrarName}{" "}
                          <span className="text-xs text-slate-500">
                            (Registrar)
                          </span>
                        </td>
                        <td className="p-4">
                          {req.requestType === "delete" ? (
                            <span className="text-red-600 font-bold bg-red-50 px-2 py-1 rounded text-xs">
                              Delete
                            </span>
                          ) : (
                            <span className="text-blue-600 font-bold bg-blue-50 px-2 py-1 rounded text-xs">
                              Update
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-sm font-medium">
                          {(req as any).template?.name || "Unknown Template"}
                        </td>
                        {/* NEW: Display changes */}
                        <td className="p-4 text-sm">{renderFeeChanges(req)}</td>

                        <td
                          className="p-4 text-sm italic max-w-xs truncate"
                          title={req.reason}
                        >
                          "{req.reason}"
                        </td>
                        <td className="p-4 text-right">
                          {view === "Pending" && (
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="primary"
                                className="!px-3 !py-1 text-xs"
                                onClick={() =>
                                  handleAction(req.id, "Approved", "fees")
                                }
                                disabled={actionLoading[req.id]}
                              >
                                Approve
                              </Button>
                              <Button
                                variant="danger"
                                className="!px-3 !py-1 text-xs"
                                onClick={() =>
                                  handleAction(req.id, "Rejected", "fees")
                                }
                                disabled={actionLoading[req.id]}
                              >
                                Reject
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default StaffRequests;
