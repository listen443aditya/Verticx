import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../../hooks/useAuth.ts";
import { PrincipalApiService } from "../../services/principalApiService";
import type { SchoolEvent } from "../../types.ts";
import Card from "../../components/ui/Card.tsx";
import Button from "../../components/ui/Button.tsx";
import { useDataRefresh } from "../../contexts/DataRefreshContext.tsx";
import ConfirmationModal from "../../components/ui/ConfirmationModal.tsx";
import Input from "../../components/ui/Input.tsx";

const apiService = new PrincipalApiService();

// --- MODAL COMPONENTS ---
const EventFormModal: React.FC<{
  eventToEdit?: SchoolEvent | null;
  initialDate?: string | null;
  onClose: () => void;
  onSave: () => void;
}> = ({ eventToEdit, initialDate, onClose, onSave }) => {
  const { user } = useAuth();
  const todayString = new Date().toISOString().split("T")[0];
  const [formData, setFormData] = useState<Partial<SchoolEvent>>({
    name: "",
    date: initialDate || todayString,
    description: "",
    location: "",
    category: "Academic",
    audience: ["All"],
    ...eventToEdit,
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (eventToEdit?.date) {
      setFormData((prev) => ({
        ...prev,
        date: new Date(eventToEdit.date).toISOString().split("T")[0],
      }));
    }
  }, [eventToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.branchId) return;
    setIsSaving(true);

    try {
      if (eventToEdit?.id) {
        await apiService.updateSchoolEvent(eventToEdit.id, {
          name: formData.name!,
          date: formData.date!,
          description: formData.description,
          location: formData.location,
          category: formData.category!,
          audience: formData.audience!,
        });
      } else {
        const eventData = {
          name: formData.name!,
          date: formData.date!,
          description: formData.description,
          location: formData.location,
          category: formData.category!,
          audience: formData.audience!,
          branchId: user.branchId,
          createdBy: user.name,
        };
        await apiService.createSchoolEvent(
          eventData as Omit<SchoolEvent, "id" | "status" | "createdAt">
        );
      }
      setIsSaving(false);
      onSave();
    } catch (error) {
      console.error("Failed to save event:", error);
      setIsSaving(false);
    }
  };

  const handleAudienceChange = (
    audienceMember: "All" | "Staff" | "Students" | "Parents"
  ) => {
    setFormData((prev) => {
      let newAudience = [...(prev.audience || [])];
      if (newAudience.includes(audienceMember)) {
        newAudience = newAudience.filter((a) => a !== audienceMember);
      } else {
        newAudience.push(audienceMember);
      }
      return { ...prev, audience: newAudience };
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg">
        <h2 className="text-xl font-bold mb-4">
          {eventToEdit ? "Edit Event" : "Create New Event"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Event Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Input
            label="Date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />
          <Input
            label="Location"
            value={formData.location}
            onChange={(e) =>
              setFormData({ ...formData, location: e.target.value })
            }
            placeholder="e.g., School Auditorium"
          />
          <Input
            label="Description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
          />
          <div>
            <label className="block text-sm font-medium">Category</label>
            <select
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value as any })
              }
              className="w-full bg-white border border-slate-300 rounded-md py-2 px-3"
            >
              <option>Academic</option>
              <option>Sports</option>
              <option>Cultural</option>
              <option>Holiday</option>
              <option>Meeting</option>
              <option>Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Audience</label>
            <div className="flex gap-4 mt-1">
              {["All", "Staff", "Students", "Parents"].map((aud) => (
                <label key={aud} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.audience?.includes(aud as any)}
                    onChange={() => handleAudienceChange(aud as any)}
                    className="mr-1"
                  />
                  {aud}
                </label>
              ))}
            </div>
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
            <Button type="submit" disabled={isSaving}>
              {isSaving
                ? "Saving..."
                : eventToEdit
                ? "Save Changes"
                : "Create Event"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

const EventDetailModal: React.FC<{
  event: SchoolEvent;
  onClose: () => void;
  onAction: (eventId: string, status: "Approved" | "Rejected") => void;
  onEdit: (event: SchoolEvent) => void;
  onDelete: (event: SchoolEvent) => void;
  isActionLoading: boolean;
}> = ({ event, onClose, onAction, onEdit, onDelete, isActionLoading }) => {
  const getStatusChip = (status: SchoolEvent["status"]) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "Approved":
        return "bg-green-100 text-green-800";
      case "Rejected":
        return "bg-red-100 text-red-800";
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-text-primary-dark">
              {event.name}
            </h2>
            <p className="text-text-secondary-dark">
              {new Date(event.date + "T00:00:00").toDateString()}
            </p>
          </div>
          <span
            className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusChip(
              event.status
            )}`}
          >
            {event.status}
          </span>
        </div>
        <div className="mt-4 space-y-2 text-sm">
          <p>
            <strong>Category:</strong> {event.category}
          </p>
          <p>
            <strong>Location:</strong> {event.location || "N/A"}
          </p>
          <p>
            <strong>Audience:</strong> {event.audience.join(", ")}
          </p>
          <p>
            <strong>Description:</strong> {event.description || "N/A"}
          </p>
          <p>
            <strong>Created by:</strong> {event.createdBy}
          </p>
        </div>
        <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isActionLoading}
          >
            Close
          </Button>
          <Button
            variant="secondary"
            onClick={() => onEdit(event)}
            disabled={isActionLoading}
          >
            Edit
          </Button>
          {event.status === "Pending" && (
            <>
              <Button
                variant="danger"
                onClick={() => onAction(event.id, "Rejected")}
                disabled={isActionLoading}
              >
                Reject
              </Button>
              <Button
                variant="primary"
                onClick={() => onAction(event.id, "Approved")}
                disabled={isActionLoading}
              >
                Approve
              </Button>
            </>
          )}
          <Button
            variant="danger"
            onClick={() => onDelete(event)}
            disabled={isActionLoading}
          >
            Delete
          </Button>
        </div>
      </Card>
    </div>
  );
};

const EventManagement: React.FC = () => {
  const { user } = useAuth();
  const { refreshKey, triggerRefresh } = useDataRefresh();
  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  const [selectedEvent, setSelectedEvent] = useState<SchoolEvent | null>(null);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>(
    {}
  );

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<SchoolEvent | null>(null);
  const [deletingEvent, setDeletingEvent] = useState<SchoolEvent | null>(null);
  const [initialModalDate, setInitialModalDate] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const data = await apiService.getSchoolEvents();
    setEvents(data);
    setLoading(false);
  }, [user, refreshKey]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAction = async (
    eventId: string,
    status: "Approved" | "Rejected"
  ) => {
    setActionLoading((prev) => ({ ...prev, [eventId]: true }));
    await apiService.updateSchoolEventStatus(eventId, status);
    if (selectedEvent?.id === eventId) {
      setSelectedEvent(null);
    }
    triggerRefresh();
    setActionLoading((prev) => ({ ...prev, [eventId]: false }));
  };

  const handleSave = () => {
    setIsFormModalOpen(false);
    setEditingEvent(null);
    setInitialModalDate(null);
    triggerRefresh();
  };

  const handleDelete = async () => {
    if (!deletingEvent) return;
    setActionLoading((prev) => ({ ...prev, [deletingEvent.id]: true }));
    await apiService.deleteSchoolEvent(deletingEvent.id);
    setDeletingEvent(null);
    triggerRefresh();
    setActionLoading((prev) => ({ ...prev, [deletingEvent.id]: false }));
  };

  const pendingEvents = useMemo(() => {
    return events
      .filter((e) => e.status === "Pending")
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [events]);

  const upcomingEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return events
      .filter((e) => {
        const eventDate = new Date(e.date);
        const eventDateOnly = new Date(
          eventDate.getFullYear(),
          eventDate.getMonth(),
          eventDate.getDate()
        );

        return e.status === "Approved" && eventDateOnly >= today;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [events]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  );
  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  ).getDate();
  const startingDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7;

  const eventsByDate = useMemo(() => {
    const map = new Map<string, SchoolEvent[]>();
    events.forEach((event) => {
      const dateKey = new Date(event.date).toISOString().split("T")[0];
      if (!map.has(dateKey)) map.set(dateKey, []);
      map.get(dateKey)!.push(event);
    });
    return map;
  }, [events]);

  const changeMonth = (delta: number) => {
    setCurrentDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1)
    );
  };

  const getStatusColor = (status: SchoolEvent["status"]) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-400";
      case "Approved":
        return "bg-green-500";
      case "Rejected":
        return "bg-red-500";
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-text-primary-dark">
          Event Approval & Calendar
        </h1>
        <Button
          onClick={() => {
            setEditingEvent(null);
            setInitialModalDate(null);
            setIsFormModalOpen(true);
          }}
        >
          Create Event
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <Button onClick={() => changeMonth(-1)}>&larr;</Button>
            <h2 className="text-xl font-bold">
              {currentDate.toLocaleString("default", {
                month: "long",
                year: "numeric",
              })}
            </h2>
            <Button onClick={() => changeMonth(1)}>&rarr;</Button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-text-secondary-dark">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
              <div key={day} className="py-2">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: startingDayOfWeek }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="border rounded-md bg-slate-50 min-h-[100px]"
              ></div>
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
              const date = new Date(
                Date.UTC(currentDate.getFullYear(), currentDate.getMonth(), day)
              );
              const dateString = date.toISOString().split("T")[0];
              const localDate = new Date(
                currentDate.getFullYear(),
                currentDate.getMonth(),
                day
              );
              const isPast = localDate < today;

              const dayEvents = eventsByDate.get(dateString) || [];

              return (
                <div
                  key={day}
                  className={`border rounded-md p-1 min-h-[100px] flex flex-col ${
                    isPast
                      ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                      : "cursor-pointer hover:bg-slate-50"
                  }`}
                  onClick={() => {
                    if (isPast) return;
                    setInitialModalDate(dateString);
                    setEditingEvent(null);
                    setIsFormModalOpen(true);
                  }}
                >
                  <span className="font-semibold text-sm">{day}</span>
                  <div className="flex-grow space-y-1 mt-1">
                    {dayEvents.map((event) => (
                      <div
                        key={event.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEvent(event);
                        }}
                        className="flex items-center gap-1 text-xs p-1 rounded hover:bg-slate-200 cursor-pointer"
                      >
                        <div
                          className={`w-2 h-2 rounded-full ${getStatusColor(
                            event.status
                          )}`}
                        ></div>
                        <span
                          className={`truncate ${
                            isPast ? "" : "text-text-primary-dark"
                          }`}
                        >
                          {event.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <div className="space-y-6">
          {/* Upcoming Events Card */}
          <Card>
            <h2 className="text-xl font-semibold mb-4 text-text-primary-dark">
              Upcoming Events
            </h2>
            <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2">
              {loading ? (
                <p>Loading...</p>
              ) : upcomingEvents.length === 0 ? (
                <p className="text-center text-text-secondary-dark p-4">
                  No upcoming events.
                </p>
              ) : (
                upcomingEvents.map((event) => (
                  <div
                    key={event.id}
                    className="bg-white border border-slate-100 p-3 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-brand-primary">
                          {event.name}
                        </p>
                        <p className="text-xs text-text-secondary-dark">
                          {new Date(
                            event.date + "T00:00:00"
                          ).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                      <span className="text-xs font-medium bg-slate-100 px-2 py-1 rounded">
                        {event.category}
                      </span>
                    </div>
                    {event.location && (
                      <p className="text-xs text-slate-500 mt-1">
                        📍 {event.location}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card>
            <h2 className="text-xl font-semibold mb-4">
              Pending Event Requests
            </h2>
            <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2">
              {loading ? (
                <p>Loading requests...</p>
              ) : pendingEvents.length === 0 ? (
                <p className="text-center text-text-secondary-dark p-8">
                  No events are currently pending approval.
                </p>
              ) : (
                pendingEvents.map((event) => (
                  <div key={event.id} className="bg-slate-50 p-3 rounded-lg">
                    <p className="font-semibold">{event.name}</p>
                    <p className="text-xs text-text-secondary-dark">
                      {new Date(event.date + "T00:00:00").toLocaleDateString()}{" "}
                      | by {event.createdBy}
                    </p>
                    <div className="flex justify-end gap-2 mt-2">
                      <Button
                        variant="danger"
                        className="!px-2 !py-1 text-xs"
                        onClick={() => handleAction(event.id, "Rejected")}
                        disabled={actionLoading[event.id]}
                      >
                        Reject
                      </Button>
                      <Button
                        variant="primary"
                        className="!px-2 !py-1 text-xs"
                        onClick={() => handleAction(event.id, "Approved")}
                        disabled={actionLoading[event.id]}
                      >
                        Approve
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>

      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onAction={handleAction}
          onEdit={(e) => {
            setSelectedEvent(null);
            setEditingEvent(e);
            setIsFormModalOpen(true);
          }}
          onDelete={(e) => {
            setSelectedEvent(null);
            setDeletingEvent(e);
          }}
          isActionLoading={!!actionLoading[selectedEvent.id]}
        />
      )}
      {isFormModalOpen && (
        <EventFormModal
          eventToEdit={editingEvent}
          initialDate={initialModalDate}
          onClose={() => setIsFormModalOpen(false)}
          onSave={handleSave}
        />
      )}
      {deletingEvent && (
        <ConfirmationModal
          isOpen={!!deletingEvent}
          onClose={() => setDeletingEvent(null)}
          onConfirm={handleDelete}
          title="Delete Event"
          message={
            <>
              Are you sure you want to delete the event "
              <strong>{deletingEvent.name}</strong>"? This action cannot be
              undone.
            </>
          }
          isConfirming={!!actionLoading[deletingEvent.id]}
          confirmText="Delete"
          confirmVariant="danger"
        />
      )}
    </div>
  );
};

export default EventManagement;
