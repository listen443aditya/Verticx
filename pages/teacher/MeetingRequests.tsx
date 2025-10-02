import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../../hooks/useAuth.ts";
import { TeacherApiService } from "../../services";
import type { HydratedMeetingRequest } from "../../types.ts";
import Card from "../../components/ui/Card.tsx";
import Button from "../../components/ui/Button.tsx";
import RescheduleModal from "../../components/modals/RescheduleModal.tsx";

const apiService = new TeacherApiService();

const MeetingRequests: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<HydratedMeetingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [reschedulingRequest, setReschedulingRequest] =
    useState<HydratedMeetingRequest | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const data = await apiService.getMeetingRequestsForTeacher(user.id);
    setRequests(data);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAction = async (
    requestId: string,
    status: "approved" | "denied"
  ) => {
    await apiService.updateMeetingRequest(requestId, { status });
    await fetchData();
  };

  const handleRescheduleSave = async (
    requestId: string,
    newDateTime: Date,
    notes: string
  ) => {
    await apiService.updateMeetingRequest(requestId, {
      status: "rescheduled",
      rescheduledDateTime: newDateTime,
      teacherNotes: notes,
    });
    setReschedulingRequest(null);
    await fetchData();
  };

  const groupedRequests = useMemo(() => {
    const now = new Date();
    const pending = requests.filter((r) => r.status === "pending");
    const upcoming = requests.filter(
      (r) => r.status === "approved" && new Date(r.requestedDateTime) > now
    );
    const past = requests.filter(
      (r) => r.status === "approved" && new Date(r.requestedDateTime) <= now
    );
    const other = requests.filter(
      (r) => r.status === "denied" || r.status === "rescheduled"
    );
    return { pending, upcoming, past, other };
  }, [requests]);

  const RequestCard: React.FC<{ req: HydratedMeetingRequest }> = ({ req }) => (
    <div className="bg-slate-50 p-4 rounded-lg">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-semibold">
            {req.parentName} (re: {req.studentName})
          </p>
          <p className="text-sm text-text-secondary-dark">
            {new Date(req.requestedDateTime).toLocaleString()}
          </p>
        </div>
        <span
          className={`px-2 py-1 text-xs font-semibold rounded-full ${
            req.status === "approved"
              ? "bg-green-100 text-green-800"
              : req.status === "pending"
              ? "bg-yellow-100 text-yellow-800"
              : req.status === "rescheduled"
              ? "bg-blue-100 text-blue-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {req.status}
        </span>
      </div>
      <p className="text-sm mt-2 p-2 bg-white rounded">"{req.agenda}"</p>
      {req.status === "pending" && (
        <div className="flex justify-end gap-2 mt-3">
          <Button
            className="!px-2 !py-1 text-xs"
            onClick={() => handleAction(req.id, "approved")}
          >
            Approve
          </Button>
          <Button
            variant="secondary"
            className="!px-2 !py-1 text-xs"
            onClick={() => setReschedulingRequest(req)}
          >
            Reschedule
          </Button>
          <Button
            variant="danger"
            className="!px-2 !py-1 text-xs"
            onClick={() => handleAction(req.id, "denied")}
          >
            Deny
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <div>
      <h1 className="text-3xl font-bold text-text-primary-dark mb-6">
        Meeting Requests
      </h1>
      {loading ? (
        <p>Loading requests...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <h2 className="text-xl font-semibold mb-4">
              Pending ({groupedRequests.pending.length})
            </h2>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
              {groupedRequests.pending.map((req) => (
                <RequestCard key={req.id} req={req} />
              ))}
              {groupedRequests.pending.length === 0 && (
                <p className="text-sm text-center text-text-secondary-dark">
                  No pending requests.
                </p>
              )}
            </div>
          </Card>
          <Card>
            <h2 className="text-xl font-semibold mb-4">
              Upcoming ({groupedRequests.upcoming.length})
            </h2>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
              {groupedRequests.upcoming.map((req) => (
                <RequestCard key={req.id} req={req} />
              ))}
              {groupedRequests.upcoming.length === 0 && (
                <p className="text-sm text-center text-text-secondary-dark">
                  No upcoming meetings.
                </p>
              )}
            </div>
          </Card>
          <Card>
            <h2 className="text-xl font-semibold mb-4">History</h2>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
              {[...groupedRequests.other, ...groupedRequests.past].map(
                (req) => (
                  <RequestCard key={req.id} req={req} />
                )
              )}
              {[...groupedRequests.other, ...groupedRequests.past].length ===
                0 && (
                <p className="text-sm text-center text-text-secondary-dark">
                  No past meetings or actions.
                </p>
              )}
            </div>
          </Card>
        </div>
      )}
      {reschedulingRequest && user && (
        <RescheduleModal
          request={reschedulingRequest}
          // FIX: Removed the 'teacherId' prop as the modal doesn't expect it.
          onClose={() => setReschedulingRequest(null)}
          onSave={handleRescheduleSave}
        />
      )}
    </div>
  );
};

export default MeetingRequests;
