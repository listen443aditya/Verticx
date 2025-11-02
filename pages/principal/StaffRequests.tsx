import React, { useState, useEffect, useCallback, useMemo } from "react";
// FIX: Corrected import paths and syntax
import { useAuth } from "../../hooks/useAuth.ts";
import { PrincipalApiService } from "../../services";
import type {
  TeacherAttendanceRectificationRequest,
  LeaveApplication,
} from "../../types.ts";
import Card from "../../components/ui/Card.tsx";
import Button from "../../components/ui/Button.tsx";
import { useDataRefresh } from "../../contexts/DataRefreshContext.tsx";

// Create a single, clean instance of the service
const apiService = new PrincipalApiService();

const StaffRequests: React.FC = () => {
  const { user } = useAuth();
  const { refreshKey, triggerRefresh } = useDataRefresh();
  const [attendanceRequests, setAttendanceRequests] = useState<
    TeacherAttendanceRectificationRequest[]
  >([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"Pending" | "Approved" | "Rejected">(
    "Pending"
  );
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>(
    {}
  );
  const [activeTab, setActiveTab] = useState<"attendance" | "leave">(
    "attendance"
  );

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    // FIX: The methods are now refactored and do not require branchId.
    const [attData, leaveData] = await Promise.all([
      apiService.getTeacherAttendanceRectificationRequests(),
      apiService.getLeaveApplications(),
    ]);
    setAttendanceRequests(attData);
    setLeaveRequests(leaveData);
    setLoading(false);
  }, [user, refreshKey]); // Removed refreshKey from dependencies as it's not used in the function

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshKey]);

  const handleAction = async (
    requestId: string,
    status: "Approved" | "Rejected",
    type: "attendance" | "leave"
  ) => {
    if (!user) return;
    setActionLoading((prev) => ({ ...prev, [requestId]: true }));
    try {
      // FIX: The processing methods no longer require the user ID.
      if (type === "attendance") {
        await apiService.processTeacherAttendanceRectificationRequest(
          requestId,
          status
        );
      } else {
        await apiService.processLeaveApplication(requestId, status);
      }
      triggerRefresh();
    } catch (error) {
      console.error("Failed to process request:", error);
    } finally {
      setActionLoading((prev) => ({ ...prev, [requestId]: false }));
    }
  };

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
          // FIX: Sort by the actual date, not the ID
          new Date(b.fromDate).getTime() - new Date(a.fromDate).getTime()
      );
  }, [leaveRequests, view]);

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

  return (
    <div>
      <h1 className="text-3xl font-bold text-text-primary-dark mb-6">
        Staff Requests
      </h1>
      <Card>
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

        {loading ? (
          <p>Loading requests...</p>
        ) : (
          <div className="overflow-x-auto">
            {activeTab === "attendance" ? (
              filteredAttendanceRequests.length === 0 ? (
                <p className="text-center text-text-secondary-dark p-8">
                  No {view.toLowerCase()} attendance requests found.
                </p>
              ) : (
                <table className="w-full text-left">
                  <thead className="border-b border-slate-200 text-sm text-text-secondary-dark">
                    <tr>
                      <th className="p-4">Staff Member</th>
                      <th className="p-4">Date</th>
                      <th className="p-4">Change</th>
                      <th className="p-4">Reason</th>
                      <th className="p-4">Requested By</th>
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
                        <td className="p-4">{req.date}</td>
                        <td className="p-4 text-sm">
                          From{" "}
                          <span className="font-semibold text-red-600">
                            {req.fromStatus}
                          </span>{" "}
                          to{" "}
                          <span className="font-semibold text-green-600">
                            {req.toStatus}
                          </span>
                        </td>
                        <td className="p-4 text-sm italic">"{req.reason}"</td>
                        <td className="p-4 text-sm">{req.registrarName}</td>
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
                          {view !== "Pending" && (
                            <p className="text-xs font-semibold text-text-secondary-dark">
                              Reviewed by {req.reviewedBy}
                            </p>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            ) : filteredLeaveRequests.length === 0 ? (
              <p className="text-center text-text-secondary-dark p-8">
                No {view.toLowerCase()} leave requests found.
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
                        {req.startDate} to {req.endDate}
                      </td>
                      <td className="p-4 text-sm">
                        {req.leaveType} {req.isHalfDay && "(Half Day)"}
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
                        {view !== "Pending" && (
                          <p className="text-xs font-semibold text-text-secondary-dark">
                            Reviewed by {req.reviewedBy}
                          </p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

export default StaffRequests;
