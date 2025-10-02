import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../../hooks/useAuth";
// FIX: Correctly import the service class and create an instance.
import { RegistrarApiService } from "../../services/registrarApiService";
import type { LeaveApplication } from "../../types";
import Button from "../../components/ui/Button";

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
    // FIX: Updated method call to align with the new API service (no branchId).
    const data = await apiService.getLeaveApplications();
    setLeaveRequests(data);
    setLoading(false);
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
      // FIX: Updated method call to align with the new API service (no reviewerId).
      await apiService.processLeaveApplication(requestId, status);
      fetchData();
    } catch (error) {
      console.error("Failed to process leave request:", error);
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
      No {view.toLowerCase()} leave requests found.
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
                {req.startDate} to {req.endDate}
              </td>
              <td className="p-4 text-sm">{req.leaveType}</td>
              <td className="p-4 text-sm italic">"{req.reason}"</td>
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
                  <p className="text-xs font-semibold text-text-secondary-dark">
                    Reviewed by {req.reviewedBy}
                  </p>
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
