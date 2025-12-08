import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../../hooks/useAuth";
import { TeacherApiService } from "../../services";
import type { SchoolEvent } from "../../types";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import {
  SportsIcon,
  DramaIcon,
  AcademicsIcon,
  EventsIcon,
  AlertTriangleIcon,
} from "../../components/icons/Icons";

const apiService = new TeacherApiService();

const EventDetailModal: React.FC<{
  event: SchoolEvent;
  onClose: () => void;
}> = ({ event, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg">
        <h2 className="text-2xl font-bold text-text-primary-dark">
          {event.name}
        </h2>
        <p className="text-text-secondary-dark">
          {new Date(event.date).toDateString()}
        </p>
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
        </div>
        <div className="flex justify-end mt-6 pt-4 border-t">
          <Button variant="secondary" onClick={onClose}>
            Close
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
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
        <p className="text-xs text-text-secondary-dark mt-1 line-clamp-2">
          {event.description}
        </p>
      </div>
    </div>
  );
};

const Events: React.FC = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<SchoolEvent | null>(null);

  const fetchData = useCallback(async () => {
    if (!user?.branchId) return;
    setLoading(true);
    try {
      const data = await apiService.getSchoolEvents(user.branchId);
      setEvents(
        data.filter(
          (e) =>
            e.status === "Approved" &&
            (e.audience.includes("All") || e.audience.includes("Staff"))
        )
      );
    } catch (error) {
      console.error("Failed to fetch events", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
  const startingDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7; // Adjust if your week starts on Sunday

  const eventsByDate = useMemo(() => {
    const map = new Map<string, SchoolEvent[]>();
    events.forEach((event) => {
      // Normalize backend date to YYYY-MM-DD string
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

  const upcomingEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return events
      .filter((e) => new Date(e.date) >= today)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [events]);

  return (
    <div>
      <h1 className="text-3xl font-bold text-text-primary-dark mb-6">
        School Events Calendar
      </h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* CALENDAR COLUMN */}
        <Card className="lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <Button variant="secondary" onClick={() => changeMonth(-1)}>
              &larr; Prev
            </Button>
            <h2 className="text-xl font-bold text-brand-primary">
              {currentDate.toLocaleString("default", {
                month: "long",
                year: "numeric",
              })}
            </h2>
            <Button variant="secondary" onClick={() => changeMonth(1)}>
              Next &rarr;
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
              <div key={day} className="py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {/* Empty cells for previous month */}
            {Array.from({ length: startingDayOfWeek }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="bg-slate-50/50 min-h-[100px] rounded-lg"
              ></div>
            ))}

            {/* Days of current month */}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
              // FIX: Create Local Date String correctly (YYYY-MM-DD)
              // This ensures the calendar matches the 'eventsByDate' map keys
              const year = currentDate.getFullYear();
              const month = String(currentDate.getMonth() + 1).padStart(2, "0");
              const dayStr = String(day).padStart(2, "0");
              const dateString = `${year}-${month}-${dayStr}`;

              const dayEvents = eventsByDate.get(dateString) || [];
              const isToday =
                new Date().toISOString().split("T")[0] === dateString;

              return (
                <div
                  key={day}
                  className={`border ${
                    isToday
                      ? "border-brand-primary bg-brand-primary/5"
                      : "border-slate-200"
                  } rounded-lg p-2 min-h-[100px] flex flex-col transition-all hover:shadow-md bg-white`}
                >
                  <span
                    className={`font-bold text-sm mb-1 ${
                      isToday ? "text-brand-primary" : "text-slate-700"
                    }`}
                  >
                    {day}
                  </span>

                  <div className="flex-grow space-y-1 overflow-y-auto max-h-[80px]">
                    {dayEvents.map((event) => (
                      <div
                        key={event.id}
                        onClick={() => setSelectedEvent(event)}
                        className="group flex items-center gap-1.5 p-1 rounded bg-slate-100 hover:bg-brand-secondary hover:text-white cursor-pointer transition-colors"
                        title={event.name}
                      >
                        <div
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            event.category === "Holiday"
                              ? "bg-red-500"
                              : "bg-green-500"
                          } group-hover:bg-white`}
                        ></div>
                        <span className="truncate text-[10px] font-medium leading-tight">
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

        {/* UPCOMING EVENTS LIST */}
        <Card>
          <h2 className="text-xl font-semibold mb-4 text-text-primary-dark">
            Upcoming Events
          </h2>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            {loading ? (
              <p className="text-center py-4 text-slate-500">
                Loading events...
              </p>
            ) : upcomingEvents.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                <p className="text-text-secondary-dark">
                  No upcoming events scheduled.
                </p>
              </div>
            ) : (
              upcomingEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))
            )}
          </div>
        </Card>
      </div>

      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  );
};

export default Events;
