import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../../hooks/useAuth";
import { SharedApiService } from "../../services";
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

const sharedApiService = new SharedApiService();

// --- Helper Components ---

const EventDetailModal: React.FC<{
  event: SchoolEvent;
  onClose: () => void;
}> = ({ event, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-start border-b border-slate-100 pb-3 mb-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">{event.name}</h2>
            <p className="text-sm text-brand-primary font-medium mt-1">
              {new Date(event.date).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold ${
              event.category === "Academic"
                ? "bg-blue-100 text-blue-700"
                : event.category === "Sports"
                ? "bg-green-100 text-green-700"
                : event.category === "Holiday"
                ? "bg-red-100 text-red-700"
                : "bg-slate-100 text-slate-700"
            }`}
          >
            {event.category}
          </span>
        </div>

        <div className="space-y-4 text-sm text-slate-600">
          <div>
            <span className="font-semibold text-slate-800 block mb-1">
              Description
            </span>
            <p className="leading-relaxed">
              {event.description || "No description provided."}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-3 rounded-lg">
              <span className="font-semibold text-slate-800 block mb-1">
                Location
              </span>
              {event.location || "On Campus"}
            </div>
            <div className="bg-slate-50 p-3 rounded-lg">
              <span className="font-semibold text-slate-800 block mb-1">
                Audience
              </span>
              {event.audience.join(", ")}
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-6 pt-4 border-t border-slate-100">
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

  const categoryColor =
    event.category === "Holiday"
      ? "bg-red-100 text-red-600"
      : event.category === "Sports"
      ? "bg-green-100 text-green-600"
      : "bg-brand-primary/10 text-brand-primary";

  return (
    <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-start gap-4 hover:shadow-md transition-shadow">
      <div className={`flex-shrink-0 rounded-full p-3 ${categoryColor}`}>
        {getIcon()}
      </div>
      <div className="flex-grow">
        <div className="flex justify-between items-start">
          <h4 className="font-bold text-slate-800">{event.name}</h4>
          <span className="text-[10px] uppercase font-bold tracking-wide text-slate-400 bg-slate-50 px-2 py-1 rounded">
            {event.category}
          </span>
        </div>
        <p className="text-sm text-brand-secondary font-medium mt-0.5">
          {new Date(event.date).toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
          })}
        </p>
        <p className="text-xs text-slate-500 mt-2 line-clamp-2">
          {event.description}
        </p>
      </div>
    </div>
  );
};

// --- Main Component ---

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
      const data = await sharedApiService.getSchoolEvents(user.branchId);
      // Filter for approved events relevant to the student
      setEvents(
        data.filter(
          (e: SchoolEvent) =>
            e.status === "Approved" &&
            (e.audience.includes("All") || e.audience.includes("Students"))
        )
      );
    } catch (error) {
      console.error("Failed to fetch events:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Calendar Logic
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = (firstDay.getDay() + 6) % 7; // Adjust to make Monday 0
    return { daysInMonth, startingDayOfWeek };
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, SchoolEvent[]>();
    events.forEach((event) => {
      // FIX: Ensure strict YYYY-MM-DD string comparison to avoid timezone shifts
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

  const renderCalendarCell = (day: number) => {
    // Construct local date string correctly
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, "0");
    const dayStr = String(day).padStart(2, "0");
    const dateKey = `${year}-${month}-${dayStr}`;

    const dayEvents = eventsByDate.get(dateKey) || [];
    const isToday = new Date().toISOString().split("T")[0] === dateKey;

    return (
      <div
        key={day}
        className={`border border-slate-100 rounded-lg p-1 min-h-[100px] flex flex-col transition-all hover:border-brand-primary/30 ${
          isToday
            ? "bg-brand-primary/5 ring-1 ring-brand-primary/20"
            : "bg-white"
        }`}
      >
        <span
          className={`text-xs font-semibold p-1 w-6 h-6 flex items-center justify-center rounded-full mb-1 ${
            isToday ? "bg-brand-primary text-white" : "text-slate-500"
          }`}
        >
          {day}
        </span>

        <div className="flex-grow space-y-1 overflow-y-auto max-h-[80px] scrollbar-hide">
          {dayEvents.map((event) => (
            <div
              key={event.id}
              onClick={() => setSelectedEvent(event)}
              className={`flex items-center gap-1.5 text-[10px] p-1.5 rounded cursor-pointer transition-colors border-l-2 truncate shadow-sm ${
                event.category === "Holiday"
                  ? "bg-red-50 border-red-400 text-red-700 hover:bg-red-100"
                  : event.category === "Academic" 
                  ? "bg-amber-50 border-amber-400 text-amber-700 hover:bg-amber-100"
                  : "bg-blue-50 border-blue-400 text-blue-700 hover:bg-blue-100"
              }`}
              title={event.name}
            >
              <span className="truncate font-medium">{event.name}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Events Calendar</h1>
          <p className="text-slate-500 mt-1">
            Keep track of school activities, exams, and holidays.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Column */}
        <Card className="lg:col-span-2 shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-800">
              {currentDate.toLocaleString("default", {
                month: "long",
                year: "numeric",
              })}
            </h2>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => changeMonth(-1)}
                className="!px-3"
              >
                &larr;
              </Button>
              <Button
                variant="secondary"
                onClick={() => changeMonth(1)}
                className="!px-3"
              >
                &rarr;
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-3 mb-2">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
              <div
                key={day}
                className="text-center text-xs font-bold text-slate-400 uppercase tracking-wider"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: startingDayOfWeek }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="min-h-[100px] bg-slate-50/50 rounded-lg border border-transparent"
              ></div>
            ))}
            {Array.from({ length: daysInMonth }, (_, i) =>
              renderCalendarCell(i + 1)
            )}
          </div>
        </Card>

        {/* Upcoming Events List */}
        <div className="space-y-6">
          <Card className="h-full max-h-[800px] flex flex-col border border-slate-200 shadow-sm">
            <h2 className="text-xl font-bold text-slate-800 mb-4 sticky top-0 bg-white z-10 pb-2 border-b border-slate-100">
              Upcoming Events
            </h2>
            <div className="space-y-3 overflow-y-auto pr-2 flex-grow scrollbar-thin">
              {loading ? (
                <p className="text-center py-8 text-slate-400">
                  Loading events...
                </p>
              ) : upcomingEvents.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                  <p className="text-slate-500">No upcoming events found.</p>
                </div>
              ) : (
                upcomingEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
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
        />
      )}
    </div>
  );
};

export default Events;
