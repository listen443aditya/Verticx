import React, { useMemo } from "react";
import type { TimetableSlot, Subject, Teacher } from "../../types";
import Card from "../ui/Card";
import Button from "../ui/Button";

interface TimetableConfig {
  days: string[];
  startTime: string; 
  endTime: string; 
  periodDuration: number; 
  breakDuration: number;
}

interface TimetableModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  config: TimetableConfig | any; 
  timetable: TimetableSlot[];
  subjects: Subject[];
  teachers: Teacher[];
}

const TimetableModal: React.FC<TimetableModalProps> = ({
  isOpen,
  onClose,
  title,
  config,
  timetable,
  subjects,
  teachers,
}) => {
  // 1. Safe Config Processing
  const safeConfig = useMemo(() => {
    const defaults = {
      days: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ],
      startTime: "08:00",
      endTime: "16:00",
      periodDuration: 45,
    };
    return { ...defaults, ...(config || {}) };
  }, [config]);

  // 2. Generate Time Slots Dynamically
 
  const generatedTimeSlots = useMemo(() => {
    const slots = [];

    // Parse times (e.g. "08:00")
    const [startH, startM] = safeConfig.startTime.split(":").map(Number);
    const [endH, endM] = safeConfig.endTime.split(":").map(Number);

    let current = new Date();
    current.setHours(startH, startM, 0, 0);

    const end = new Date();
    end.setHours(endH, endM, 0, 0);

    // Loop until we reach end time
    while (current < end) {
      const startStr = current.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });

      // Add duration to get slot end time
      const slotEnd = new Date(current);
      slotEnd.setMinutes(slotEnd.getMinutes() + safeConfig.periodDuration);

      const endStr = slotEnd.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });

      slots.push({ startTime: startStr, endTime: endStr });
      current = slotEnd;
    }

    return slots;
  }, [safeConfig]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      aria-modal="true"
      role="dialog"
    >
      <Card className="w-full max-w-6xl h-[90vh] flex flex-col bg-white">
        {/* Header */}
        <div className="flex justify-between items-center mb-4 p-4 border-b">
          <h2 className="text-2xl font-bold text-text-primary-dark">{title}</h2>
          <button
            onClick={onClose}
            className="text-3xl font-light text-slate-500 hover:text-slate-800 leading-none"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="overflow-auto flex-grow p-4">
          <table className="w-full border-collapse table-fixed">
            <thead>
              <tr className="bg-slate-100">
                {/* Time Column */}
                <th className="p-3 border border-slate-300 text-left text-sm font-bold w-32 sticky top-0 bg-slate-100 z-10">
                  Time
                </th>
                {/* Days Headers */}
                {safeConfig.days.map((day: string) => (
                  <th
                    key={day}
                    className="p-3 border border-slate-300 text-left text-sm font-bold sticky top-0 bg-slate-100 z-10"
                  >
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Render Rows based on Generated Slots */}
              {generatedTimeSlots.map((timeSlot, index) => (
                <tr key={index}>
                  {/* Time Label */}
                  <td className="p-2 border border-slate-200 font-mono text-xs bg-slate-50 font-medium text-slate-600">
                    {timeSlot.startTime} - {timeSlot.endTime}
                  </td>

                  {/* Subject Cells */}
                  {safeConfig.days.map((day: string) => {
                    // Find the slot in the flat timetable array
                    const slot = timetable.find(
                      (s) => s.day === day && s.startTime === timeSlot.startTime
                    );

                    // Look up names
                    const subject = slot
                      ? subjects.find((s) => s.id === slot.subjectId)
                      : null;
                    const teacher = slot
                      ? teachers.find((t) => t.id === slot.teacherId)
                      : null;

                    return (
                      <td
                        key={`${day}-${timeSlot.startTime}`}
                        className="p-1 border border-slate-200 h-20 align-top"
                      >
                        {slot ? (
                          <div className="w-full h-full p-2 rounded bg-brand-primary/10 border-l-4 border-brand-primary">
                            <p className="font-bold text-brand-primary text-xs leading-tight">
                              {subject?.name || "Subject"}
                            </p>
                            <p className="text-[10px] text-slate-600 mt-1">
                              {teacher?.name || "Teacher"}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {slot.room || ""}
                            </p>
                          </div>
                        ) : (
                          <div className="w-full h-full bg-slate-50/30"></div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-4 border-t text-right bg-slate-50">
          <Button onClick={onClose}>Close</Button>
        </div>
      </Card>
    </div>
  );
};

export default TimetableModal;
