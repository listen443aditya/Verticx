import React, { useMemo } from "react";
import type { TimetableSlot, Subject, Teacher } from "../../types";
import Card from "../ui/Card";
import Button from "../ui/Button";

interface TimetableModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  config: any; // We accept any config, but we primarily use the timetable data itself
  timetable: TimetableSlot[];
  subjects: Subject[];
  teachers: Teacher[];
}

const TimetableModal: React.FC<TimetableModalProps> = ({
  isOpen,
  onClose,
  title,
  timetable,
  subjects,
  teachers,
}) => {
  if (!isOpen) return null;

  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  // 1. EXTRACT UNIQUE TIME SLOTS FROM DATABASE DATA
  // Instead of generating them, we look at what is actually saved in the DB.
  const uniqueTimeSlots = useMemo(() => {
    // Create a map to store unique "Start-End" pairs
    const slotMap = new Map<string, { startTime: string; endTime: string }>();

    timetable.forEach((slot) => {
      const key = `${slot.startTime}-${slot.endTime}`;
      if (!slotMap.has(key)) {
        slotMap.set(key, { startTime: slot.startTime, endTime: slot.endTime });
      }
    });

    // Convert map to array and sort chronologically by start time
    return Array.from(slotMap.values()).sort((a, b) =>
      a.startTime.localeCompare(b.startTime)
    );
  }, [timetable]);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      aria-modal="true"
      role="dialog"
    >
      <Card className="w-full max-w-6xl h-[90vh] flex flex-col bg-white shadow-xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-200">
          <h2 className="text-2xl font-bold text-text-primary-dark">{title}</h2>
          <button
            onClick={onClose}
            className="text-3xl font-light text-slate-400 hover:text-slate-800 leading-none transition-colors"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        {uniqueTimeSlots.length === 0 ? (
          <div className="flex-grow flex items-center justify-center text-slate-500">
            <p>No timetable data found for this class.</p>
          </div>
        ) : (
          <div className="overflow-auto flex-grow px-2">
            <table className="w-full border-collapse border border-slate-200">
              <thead className="sticky top-0 z-10">
                <tr>
                  <th className="p-3 border border-slate-300 bg-slate-100 text-left text-sm font-bold text-slate-600 w-32 shadow-sm">
                    Time
                  </th>
                  {days.map((day) => (
                    <th
                      key={day}
                      className="p-3 border border-slate-300 bg-slate-100 text-center text-sm font-bold text-slate-600 shadow-sm"
                    >
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {uniqueTimeSlots.map((timeSlot) => (
                  <tr
                    key={`${timeSlot.startTime}-${timeSlot.endTime}`}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    {/* Time Column */}
                    <td className="p-3 border border-slate-200 bg-slate-50 font-mono text-xs font-semibold text-slate-600 text-center whitespace-nowrap">
                      {timeSlot.startTime} - {timeSlot.endTime}
                    </td>

                    {/* Day Columns */}
                    {days.map((day) => {
                      // Find the specific class for this Day + Time combination
                      const slot = timetable.find(
                        (s) =>
                          s.day === day && s.startTime === timeSlot.startTime
                      );

                      // Resolve Names
                      const subject = slot
                        ? subjects.find((s) => s.id === slot.subjectId)
                        : null;
                      const teacher = slot
                        ? teachers.find((t) => t.id === slot.teacherId)
                        : null;

                      return (
                        <td
                          key={`${day}-${timeSlot.startTime}`}
                          className="p-1 border border-slate-200 h-24 align-top w-[14%]"
                        >
                          {slot && subject ? (
                            <div className="w-full h-full p-2 rounded bg-indigo-50 border-l-4 border-indigo-500 flex flex-col justify-between group hover:shadow-md transition-all">
                              <div>
                                <p className="font-bold text-xs text-indigo-700 leading-tight mb-1">
                                  {subject.name}
                                </p>
                                <p className="text-[10px] text-slate-500">
                                  {teacher ? teacher.name : "No Teacher"}
                                </p>
                              </div>
                              {slot.room && (
                                <div className="mt-1 self-end">
                                  <span className="text-[9px] font-mono text-slate-400 bg-white px-1 rounded border border-slate-100">
                                    Room {slot.room}
                                  </span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="w-full h-full"></div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-slate-200 text-right">
          <Button onClick={onClose} className="px-6">
            Close
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default TimetableModal;
