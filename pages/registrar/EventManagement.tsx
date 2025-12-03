// src/pages/registrar/EventManagement.tsx

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../../hooks/useAuth";
import { RegistrarApiService } from "../../services/registrarApiService";
import type { SchoolEvent } from "../../types";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import ConfirmationModal from "../../components/ui/ConfirmationModal";
import { useDataRefresh } from "../../contexts/DataRefreshContext";
import {
  SportsIcon,
  DramaIcon,
  AcademicsIcon,
  EventsIcon,
  AlertTriangleIcon,
} from "../../components/icons/Icons";

const apiService = new RegistrarApiService();

// --- MODAL COMPONENTS ---

const EventFormModal: React.FC<{
  eventToEdit?: SchoolEvent | null;
  initialDate?: string;
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
    sendNotification: true,
    ...eventToEdit,
  });
  const [isSaving, setIsSaving] = useState(false);

  // If editing, ensure the date is formatted correctly for the input
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
    if (!user) return;
    setIsSaving(true);

    // Prepare payload
    const eventData = {
      name: formData.name!,
      date: formData.date!, // String YYYY-MM-DD
      description: formData.description,
      location: formData.location,
      category: formData.category!,
      audience: formData.audience!,
      branchId: user.branchId!,
      createdBy: user.name,
      sendNotification: formData.sendNotification ?? true,
    };

   try {
     if (eventToEdit?.id) {
       await apiService.updateSchoolEvent(eventToEdit.id, eventData);
     } else {
       await apiService.createSchoolEvent(
         eventData as Omit<SchoolEvent, "id" | "status" | "createdAt">
       );
     }
     onSave();
     onClose();
   } catch (error) {
     console.error("Failed to save event", error);
     alert("Failed to save event");
   } finally {
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
              {isSaving ? "Saving..." : "Submit"}
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
  onEdit: (event: SchoolEvent) => void;
  onDelete: (event: SchoolEvent) => void;
}> = ({ event, onClose, onEdit, onDelete }) => {
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
              {new Date(event.date).toDateString()}
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
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button variant="secondary" onClick={() => onEdit(event)}>
            Edit
          </Button>
          <Button variant="danger" onClick={() => onDelete(event)}>
            Delete
          </Button>
        </div>
      </Card>
    </div>
  );
};

const EventCard: React.FC<{ event: SchoolEvent }> = ({ event }) => {
  const getIcon = () => {
    switch (event.category) {
      case "Sports":
        return <SportsIcon className="w-5 h-5" />;
      case "Cultural":
        return <DramaIcon className="w-5 h-5" />;
      case "Academic":
        return <AcademicsIcon className="w-5 h-5" />;
      case "Meeting":
        return <EventsIcon className="w-5 h-5" />;
      case "Holiday":
        return <EventsIcon className="w-5 h-5" />;
      default:
        return <AlertTriangleIcon className="w-5 h-5" />;
    }
  };

  return (
    <div className="bg-slate-100 p-3 rounded-lg flex items-start gap-3">
      <div className="flex-shrink-0 bg-brand-primary/10 text-brand-primary rounded-full p-2 mt-1">
        {getIcon()}
      </div>
      <div className="flex-grow">
        <p className="font-bold text-text-primary-dark">{event.name}</p>
        <p className="text-sm text-text-secondary-dark">
          {new Date(event.date).toLocaleDateString("en-US", {
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </p>
        <p className="text-xs text-text-secondary-dark mt-1">
          {event.description}
        </p>
      </div>
    </div>
  );
};

const EventManagement: React.FC = () => {
  const { user } = useAuth();
  const { refreshKey, triggerRefresh } = useDataRefresh();
  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Modal states
  const [modal, setModal] = useState<"create" | "edit" | "detail" | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<SchoolEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | undefined>(
    undefined
  );
  const [deletingEvent, setDeletingEvent] = useState<SchoolEvent | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await apiService.getSchoolEvents();
      setEvents(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [user, refreshKey]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = () => {
    setModal(null);
    setSelectedEvent(null);
    setSelectedDate(undefined);
    triggerRefresh();
  };

  const handleDelete = async () => {
    if (!deletingEvent) return;
    await apiService.deleteSchoolEvent(deletingEvent.id);
    setDeletingEvent(null);
    setModal(null);
    triggerRefresh();
  };

  // --- Calendar Logic ---
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

  // FIX: Normalize API event dates to YYYY-MM-DD for easier map lookups
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

  // FIX: Upcoming events filter logic
  const upcomingEvents = useMemo(() => {
    return events
      .filter((e) => {
        const eventDate = new Date(e.date);
        const eventDateOnly = new Date(
          eventDate.getFullYear(),
          eventDate.getMonth(),
          eventDate.getDate()
        );
        // Show all upcoming events (Pending or Approved)
        return eventDateOnly >= today;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [events]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Event Management</h1>
        <Button
          onClick={() => {
            setSelectedDate(undefined);
            setModal("create");
          }}
        >
          Create Event
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Column */}
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
              // FIX: Use Date.UTC to ensure the generated date string matches the backend ISO format exactly
              const date = new Date(
                Date.UTC(currentDate.getFullYear(), currentDate.getMonth(), day)
              );
              const dateString = date.toISOString().split("T")[0];

              // Local date for "isPast" check
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
                    setSelectedDate(dateString);
                    setModal("create");
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
                          setModal("detail");
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

        {/* Sidebar Column */}
        <div className="space-y-6">
          {/* Upcoming Events List */}
          <Card>
            <h2 className="text-xl font-semibold mb-4 text-text-primary-dark">
              Upcoming Events
            </h2>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
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
                    onClick={() => {
                      setSelectedEvent(event);
                      setModal("detail");
                    }}
                  >
                    <EventCard event={event} />
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>

      {(modal === "create" || modal === "edit") && (
        <EventFormModal
          eventToEdit={selectedEvent}
          initialDate={selectedDate}
          onClose={() => {
            setModal(null);
            setSelectedEvent(null);
          }}
          onSave={handleSave}
        />
      )}
      {modal === "detail" && selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          onClose={() => {
            setModal(null);
            setSelectedEvent(null);
          }}
          onEdit={(e) => {
            setSelectedEvent(e);
            setModal("edit");
          }}
          onDelete={(e) => {
            setDeletingEvent(e);
            setModal(null);
          }}
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
              <strong>{deletingEvent.name}</strong>"?
            </>
          }
        />
      )}
    </div>
  );
};

export default EventManagement;
