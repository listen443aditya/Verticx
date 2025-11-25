// pages/parent/ContactTeacher.tsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../../hooks/useAuth.ts";
import { ParentApiService } from "../../services/parentApiService";
import type {
  Student,
  Teacher,
  HydratedMeetingRequest,
  StudentProfile,
} from "../../types.ts";
import Card from "../../components/ui/Card.tsx";
import Button from "../../components/ui/Button.tsx";
import Input from "../../components/ui/Input.tsx";

const apiService = new ParentApiService();

const ContactTeacher: React.FC = () => {
  const { user } = useAuth();
  const [children, setChildren] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [requests, setRequests] = useState<HydratedMeetingRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedChildId, setSelectedChildId] = useState("");
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [meetingDate, setMeetingDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [meetingTime, setMeetingTime] = useState("");
  const [agenda, setAgenda] = useState("");
  const [unavailableSlots, setUnavailableSlots] = useState<string[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      // FIX: Fetch parent dashboard data to get the list of children
      // instead of relying on user.childrenIds which is missing.
      const dashboardData = await apiService.getParentDashboardData();

      const validChildren: Student[] = [];
      if (dashboardData && dashboardData.childrenData) {
        dashboardData.childrenData.forEach((childData) => {
          if (childData.student) {
            validChildren.push(childData.student);
          }
        });
      }
      setChildren(validChildren);

      // If children exist, select the first one and fetch teachers
      if (validChildren.length > 0) {
        const firstChildId = validChildren[0].id;
        setSelectedChildId(firstChildId);

        const teacherData = await apiService.getTeachersForStudent(
          firstChildId
        );
        setTeachers(teacherData);
        if (teacherData.length > 0) {
          setSelectedTeacherId(teacherData[0].id);
        }
      } else {
        setTeachers([]);
        setSelectedTeacherId("");
      }

      // Fetch meeting requests for the parent
      const meetingRequests = await apiService.getMeetingRequestsForParent();
      setRequests(meetingRequests);
    } catch (err) {
      console.error("Failed to fetch initial data", err);
    } finally {
      // FIX: Always turn off loading
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const fetchAvailability = async () => {
      if (!selectedTeacherId || !meetingDate) return;
      setUnavailableSlots([]);
      try {
        const slots = await apiService.getTeacherAvailability(
          selectedTeacherId,
          meetingDate
        );
        setUnavailableSlots(slots || []);
        setMeetingTime("");
      } catch (err) {
        console.error("Failed to fetch teacher availability", err);
      }
    };
    fetchAvailability();
  }, [selectedTeacherId, meetingDate]);

  const handleChildChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const childId = e.target.value;
    setSelectedChildId(childId);
    try {
      const teacherData = await apiService.getTeachersForStudent(childId);
      setTeachers(teacherData);
      setSelectedTeacherId(teacherData[0]?.id || "");
    } catch (err) {
      console.error("Failed to load teachers for child", err);
      setTeachers([]);
      setSelectedTeacherId("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingTime || !agenda || !user) return;

    setIsSubmitting(true);
    setStatusMessage("");

    try {
      const requestedDateTime = new Date(`${meetingDate}T${meetingTime}`);
      await apiService.createMeetingRequest({
        parentId: user.id,
        studentId: selectedChildId,
        teacherId: selectedTeacherId,
        requestedDateTime,
        agenda,
      });

      setAgenda("");
      setMeetingTime("");
      setStatusMessage("Your meeting request has been sent!");
      await fetchData(); // refresh requests
      setTimeout(() => setStatusMessage(""), 4000);
    } catch (err) {
      console.error("Failed to create meeting request", err);
      setStatusMessage("Failed to send request. Please try again.");
      setTimeout(() => setStatusMessage(""), 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestAction = async (
    requestId: string,
    status: "approved" | "denied"
  ) => {
    try {
      const backendStatus = status === "denied" ? "canceled" : status;
      await apiService.updateMeetingRequest(requestId, {
        status: backendStatus,
      } as any);
      await fetchData();
    } catch (err) {
      console.error("Failed to update meeting request", err);
    }
  };

  const timeSlots = useMemo(() => {
    const slots: string[] = [];
    for (let hour = 9; hour < 17; hour++) {
      for (const min of ["00", "30"]) {
        slots.push(`${String(hour).padStart(2, "0")}:${min}`);
      }
    }
    return slots;
  }, []);

  if (loading) return <div className="p-8 text-center">Loading data...</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold text-text-primary-dark mb-6">
        Contact Teacher
      </h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <h2 className="text-xl font-semibold mb-4">Request a Meeting</h2>

          {children.length === 0 ? (
            <p className="text-sm text-text-secondary-dark">
              No student profiles found.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {children.length > 1 && (
                <div>
                  <label className="block text-sm font-medium text-text-secondary-dark mb-1">
                    For Child
                  </label>
                  <select
                    value={selectedChildId}
                    onChange={handleChildChange}
                    className="w-full bg-white border border-slate-300 rounded-md py-2 px-3"
                  >
                    {children.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-text-secondary-dark mb-1">
                  Teacher
                </label>
                <select
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-md py-2 px-3"
                  disabled={teachers.length === 0}
                >
                  {teachers.length === 0 && <option>No teachers found</option>}
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                type="date"
                label="Date"
                value={meetingDate}
                onChange={(e) => setMeetingDate(e.target.value)}
              />

              <div>
                <label className="block text-sm font-medium text-text-secondary-dark mb-1">
                  Time
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {timeSlots.map((time) => {
                    const isUnavailable = unavailableSlots.some((slot) => {
                      const [start, end] = slot
                        .split(" - ")
                        .map((s) => s.trim());
                      return time >= start && time < end;
                    });
                    return (
                      <button
                        type="button"
                        key={time}
                        onClick={() => setMeetingTime(time)}
                        disabled={isUnavailable}
                        className={`p-2 text-sm rounded-md transition-colors ${
                          meetingTime === time
                            ? "bg-brand-secondary text-white"
                            : isUnavailable
                            ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                            : "bg-slate-100 hover:bg-slate-200"
                        }`}
                      >
                        {new Date(`1970-01-01T${time}`).toLocaleTimeString([], {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary-dark mb-1">
                  Agenda / Reason
                </label>
                <textarea
                  value={agenda}
                  onChange={(e) => setAgenda(e.target.value)}
                  rows={4}
                  className="w-full bg-white border border-slate-300 rounded-md py-2 px-3"
                  required
                />
              </div>

              {statusMessage && (
                <p className="text-green-600 text-sm text-center">
                  {statusMessage}
                </p>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting || !meetingTime || !selectedTeacherId}
              >
                {isSubmitting ? "Sending..." : "Send Request"}
              </Button>
            </form>
          )}
        </Card>

        <Card className="lg:col-span-2">
          <h2 className="text-xl font-semibold mb-4">My Meeting Requests</h2>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto">
            {requests.length === 0 && (
              <p className="text-center text-text-secondary-dark p-8">
                You have no pending or scheduled meetings.
              </p>
            )}
            {requests.map((req) => (
              <div key={req.id} className="bg-slate-50 p-4 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">
                      {req.teacherName} (re: {req.studentName})
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
                    {req.status ? req.status.replace("_", " ") : "Unknown"}
                  </span>
                </div>

                <p className="text-sm mt-2 p-2 bg-white rounded">
                  "{req.agenda}"
                </p>

                {req.status === "rescheduled" && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm font-semibold text-blue-800">
                      Teacher has proposed a new time:
                    </p>
                    <p className="text-sm font-bold text-blue-900">
                      {new Date(req.rescheduledDateTime!).toLocaleString()}
                    </p>
                    {req.teacherNotes && (
                      <p className="text-xs italic mt-1">
                        Note: "{req.teacherNotes}"
                      </p>
                    )}
                    <div className="flex justify-end gap-2 mt-2">
                      <Button
                        className="!px-2 !py-1 text-xs"
                        onClick={() => handleRequestAction(req.id, "approved")}
                      >
                        Accept New Time
                      </Button>
                      <Button
                        variant="danger"
                        className="!px-2 !py-1 text-xs"
                        onClick={() => handleRequestAction(req.id, "denied")}
                      >
                        Decline
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ContactTeacher;
