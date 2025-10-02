import React, { useState, useEffect, useMemo, useCallback } from "react";
import type { HydratedMeetingRequest } from "../../types";
// FIX: Correctly import the service class directly from its file.
import { TeacherApiService } from "../../services/teacherApiService";
import Card from "../ui/Card";
import Button from "../ui/Button";
import Input from "../ui/Input";
import { useAuth } from "../../hooks/useAuth";

interface RescheduleModalProps {
  request: HydratedMeetingRequest;
  onClose: () => void;
  onSave: (requestId: string, newDateTime: Date, notes: string) => void;
}

// FIX: Create the service instance once.
const apiService = new TeacherApiService();

const RescheduleModal: React.FC<RescheduleModalProps> = ({
  request,
  onClose,
  onSave,
}) => {
  const { user } = useAuth(); // The teacher is the authenticated user.
  const [meetingDate, setMeetingDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [meetingTime, setMeetingTime] = useState("");
  const [notes, setNotes] = useState("");
  const [unavailableSlots, setUnavailableSlots] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchAvailability = async () => {
      if (!user || !meetingDate) return;
      // FIX: The backend infers the teacher from the auth token.
      // The teacherId is no longer needed in the API call.
      const slots = await apiService.getTeacherAvailability(meetingDate);
      setUnavailableSlots(slots);
      setMeetingTime("");
    };
    fetchAvailability();
  }, [user, meetingDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingTime) return;
    setIsSaving(true);
    const newDateTime = new Date(`${meetingDate}T${meetingTime}`);
    onSave(request.id, newDateTime, notes);
  };

  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = 9; hour < 17; hour++) {
      for (let min of ["00", "30"]) {
        slots.push(`${String(hour).padStart(2, "0")}:${min}`);
      }
    }
    return slots;
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg">
        <h2 className="text-xl font-bold text-text-primary-dark mb-4">
          Reschedule Meeting
        </h2>
        <p className="text-sm text-text-secondary-dark mb-4">
          Original request from {request.parentName} for{" "}
          {new Date(request.requestedDateTime).toLocaleString()}
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="date"
            label="New Date"
            value={meetingDate}
            onChange={(e) => setMeetingDate(e.target.value)}
          />
          <div>
            <label className="block text-sm font-medium text-text-secondary-dark mb-1">
              New Time
            </label>
            <div className="grid grid-cols-4 gap-2">
              {timeSlots.map((time) => {
                const isUnavailable = unavailableSlots.some((slot) => {
                  const [start, end] = slot.split(" - ");
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
                        ? "bg-slate-200 text-slate-400 cursor-not-allowed line-through"
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
              Notes for Parent (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full bg-white border border-slate-300 rounded-md py-2 px-3"
            />
          </div>
          <div className="flex justify-end gap-4 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving || !meetingTime}>
              {isSaving ? "Sending..." : "Propose New Time"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default RescheduleModal;
