import React from "react";
// FIX: The Teacher type is needed for the new 'teachers' prop.
import type {
  TimetableSlot,
  TimetableConfig,
  Subject,
  Teacher,
} from "../../types";
import Card from "../ui/Card";
import Button from "../ui/Button";

// FIX: The apiService is removed as this component should not fetch its own data.
// It will receive all necessary data via props.

interface TimetableModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  config: TimetableConfig | null;
  timetable: TimetableSlot[];
  // FIX: Added subjects and teachers as required props.
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
  if (!isOpen) return null;

  const days: ("Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday")[] = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
  ];

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      aria-modal="true"
      role="dialog"
    >
      <Card className="w-full max-w-5xl h-[90vh] flex flex-col">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-2xl font-bold text-text-primary-dark">{title}</h2>
          <button
            onClick={onClose}
            className="text-3xl font-light text-slate-500 hover:text-slate-800 leading-none"
          >
            &times;
          </button>
        </div>

        {!config || config.timeSlots.length === 0 ? (
          <div className="flex-grow flex items-center justify-center">
            <p className="text-text-secondary-dark">
              Timetable has not been configured for this class yet.
            </p>
          </div>
        ) : (
          <div className="overflow-auto flex-grow">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-100">
                  <th className="p-2 border text-left text-sm font-semibold w-32 sticky top-0 bg-slate-100">
                    Time
                  </th>
                  {days.map((day) => (
                    <th
                      key={day}
                      className="p-2 border text-left text-sm font-semibold sticky top-0 bg-slate-100"
                    >
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {config.timeSlots.map((timeSlot) => (
                  <tr key={`${timeSlot.startTime}-${timeSlot.endTime}`}>
                    <td className="p-2 border font-mono text-xs bg-slate-50">
                      {timeSlot.startTime} - {timeSlot.endTime}
                    </td>
                    {days.map((day) => {
                      const slot = timetable.find(
                        (s) =>
                          s.day === day && s.startTime === timeSlot.startTime
                      );
                      // FIX: Look up subject and teacher names from the arrays passed in via props.
                      const subject = slot
                        ? subjects.find((s) => s.id === slot.subjectId)
                        : null;
                      const teacher = slot
                        ? teachers.find((t) => t.id === slot.teacherId)
                        : null;
                      return (
                        <td
                          key={`${day}-${timeSlot.startTime}`}
                          className="p-1 border h-20 align-top"
                        >
                          {slot && subject && teacher ? (
                            <div className="w-full h-full p-2 rounded-lg text-xs bg-brand-primary/10">
                              <p className="font-bold text-brand-primary leading-tight">
                                {subject.name}
                              </p>
                              <p className="text-text-secondary-dark">
                                {teacher.name}
                              </p>
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

        <div className="mt-4 text-right">
          <Button onClick={onClose}>Close</Button>
        </div>
      </Card>
    </div>
  );
};

export default TimetableModal;
