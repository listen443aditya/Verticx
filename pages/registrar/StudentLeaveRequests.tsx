import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../../hooks/useAuth.ts";
import { RegistrarApiService } from "../../services/registrarApiService";
import type { LeaveApplication } from "../../types.ts";
import Button from "../../components/ui/Button.tsx";

const apiService = new RegistrarApiService();

const StudentLeaveRequestsView: React.FC<{
  view: "Pending" | "Approved" | "Rejected";
}> = ({ view }) => {
  const { user } = useAuth();
  const [leaveRequests, setLeaveRequests] = useState<LeaveApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>(
    {}
  );

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
 
      const data: any[] = await apiService.getLeaveApplications();

      const formattedData = data.map((req) => ({
        ...req,
        applicantName: req.applicantName || req.applicant?.name || "Unknown",
        startDate: req.startDate || req.fromDate,
        endDate: req.endDate || req.toDate,
        leaveType: req.leaveType || "General",
      }));
      const studentRequests = formattedData.filter(
        (req) =>
          req.applicant?.role === "Student" || req.applicantRole === "Student"
      );

      setLeaveRequests(studentRequests);
    } catch (error) {
      console.error("Failed to fetch leave requests", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAction = async (
    requestId: string,
    status: "Approved" | "Rejected"
  ) => {
    if (!user) return;
    setActionLoading((prev) => ({ ...prev, [requestId]: true }));
    try {
      await apiService.processLeaveApplication(requestId, status);
      await fetchData(); // Refresh the list to move the item
    } catch (error) {
      console.error("Failed to process leave request:", error);
      alert("Failed to process request.");
    } finally {
      setActionLoading((prev) => ({ ...prev, [requestId]: false }));
    }
  };

  const filteredRequests = useMemo(() => {
    return leaveRequests.filter((r) => r.status === view);
  }, [leaveRequests, view]);

  if (loading) return <p>Loading requests...</p>;

  return filteredRequests.length === 0 ? (
    <p className="text-center text-text-secondary-dark p-8">
      No {view.toLowerCase()} student leave requests found.
    </p>
  ) : (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead className="border-b border-slate-200 text-sm text-text-secondary-dark">
          <tr>
            <th className="p-4">Student</th>
            <th className="p-4">Dates</th>
            <th className="p-4">Type</th>
            <th className="p-4">Reason</th>
            <th className="p-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredRequests.map((req) => (
            <tr
              key={req.id}
              className="border-b border-slate-100 hover:bg-slate-50"
            >
              <td className="p-4 font-medium">{req.applicantName}</td>
              <td className="p-4 text-sm">
                {/* Format the dates nicely */}
                {new Date(req.startDate).toLocaleDateString()}
                <span className="mx-1 text-slate-400">to</span>
                {new Date(req.endDate).toLocaleDateString()}
              </td>
              <td className="p-4 text-sm">
                <span className="bg-slate-100 px-2 py-1 rounded text-xs font-medium">
                  {req.leaveType}
                </span>
                {req.isHalfDay && (
                  <span className="ml-2 text-xs text-amber-600 font-bold">
                    (Half Day)
                  </span>
                )}
              </td>
              <td className="p-4 text-sm italic text-slate-600">
                "{req.reason}"
              </td>
              <td className="p-4 text-right">
                {view === "Pending" && (
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="primary"
                      className="!px-3 !py-1 text-xs"
                      onClick={() => handleAction(req.id, "Approved")}
                      disabled={actionLoading[req.id]}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="danger"
                      className="!px-3 !py-1 text-xs"
                      onClick={() => handleAction(req.id, "Rejected")}
                      disabled={actionLoading[req.id]}
                    >
                      Reject
                    </Button>
                  </div>
                )}
                {view !== "Pending" && (
                  <span
                    className={`text-xs font-bold px-2 py-1 rounded ${
                      view === "Approved"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {view}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StudentLeaveRequestsView;
