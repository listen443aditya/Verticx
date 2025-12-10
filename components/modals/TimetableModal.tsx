import React, { useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas"; // Import html2canvas
import type { TimetableSlot, Subject, Teacher } from "../../types";
import Card from "../ui/Card";
import Button from "../ui/Button";

interface TimetableModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  config: any;
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
  const timetableRef = useRef<HTMLDivElement>(null); // Ref for capturing the table
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen) return null;

  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  const uniqueTimeSlots = useMemo(() => {
    const slotMap = new Map<string, { startTime: string; endTime: string }>();
    timetable.forEach((slot) => {
      const key = `${slot.startTime}-${slot.endTime}`;
      if (!slotMap.has(key)) {
        slotMap.set(key, { startTime: slot.startTime, endTime: slot.endTime });
      }
    });
    return Array.from(slotMap.values()).sort((a, b) =>
      a.startTime.localeCompare(b.startTime)
    );
  }, [timetable]);

  // --- DOWNLOAD FUNCTION ---
  const handleDownload = async () => {
    if (!timetableRef.current) return;
    setIsDownloading(true);

    try {
      // Capture the specific div referenced by timetableRef
      const canvas = await html2canvas(timetableRef.current, {
        scale: 2, // Higher scale for better print quality (sharp text)
        backgroundColor: "#ffffff", // Ensure white background
      });

      // Convert canvas to image URL
      const image = canvas.toDataURL("image/png");

      // Create a fake link to trigger download
      const link = document.createElement("a");
      link.href = image;
      link.download = `My_Timetable_${
        new Date().toISOString().split("T")[0]
      }.png`;
      link.click();
    } catch (error) {
      console.error("Failed to download timetable:", error);
      alert("Failed to download timetable.");
    } finally {
      setIsDownloading(false);
    }
  };

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
          <div className="flex gap-2">
            {/* Download Button */}
            <Button
              onClick={handleDownload}
              disabled={isDownloading || uniqueTimeSlots.length === 0}
              className="bg-brand-secondary hover:bg-brand-secondary/90 text-white"
            >
              {isDownloading ? "Generating..." : "Download as Image"}
            </Button>
            <button
              onClick={onClose}
              className="text-3xl font-light text-slate-400 hover:text-slate-800 leading-none transition-colors ml-4"
            >
              &times;
            </button>
          </div>
        </div>

        {/* Content Container (Wrapped in ref for screenshot) */}
        <div className="flex-grow overflow-auto bg-white">
          {/* We attach the ref here. We add padding to ensure the screenshot looks good. */}
          <div ref={timetableRef} className="p-4 min-w-[800px] bg-white">
            {/* Title for the Printed Image (Only visible in screenshot effectively) */}
            <div className="mb-4 text-center hidden print:block">
              <h1 className="text-2xl font-bold text-slate-800">
                Class Timetable
              </h1>
            </div>

            {uniqueTimeSlots.length === 0 ? (
              <div className="flex items-center justify-center text-slate-500 h-64 border border-dashed border-slate-300 rounded-lg">
                <p>No timetable data found for this class.</p>
              </div>
            ) : (
              <table className="w-full border-collapse border border-slate-300 shadow-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="p-3 border border-slate-300 text-left text-sm font-bold text-slate-700 w-32">
                      Time
                    </th>
                    {days.map((day) => (
                      <th
                        key={day}
                        className="p-3 border border-slate-300 text-center text-sm font-bold text-slate-700"
                      >
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {uniqueTimeSlots.map((timeSlot) => (
                    <tr key={`${timeSlot.startTime}-${timeSlot.endTime}`}>
                      {/* Time Column */}
                      <td className="p-3 border border-slate-300 bg-slate-50 font-mono text-xs font-semibold text-slate-600 text-center whitespace-nowrap">
                        {timeSlot.startTime} - {timeSlot.endTime}
                      </td>

                      {/* Day Columns */}
                      {days.map((day) => {
                        const slot = timetable.find(
                          (s) =>
                            s.day === day && s.startTime === timeSlot.startTime
                        );

                        const subject = slot
                          ? subjects.find((s) => s.id === slot.subjectId)
                          : null;
                        const teacher = slot
                          ? teachers.find((t) => t.id === slot.teacherId)
                          : null;

                        return (
                          <td
                            key={`${day}-${timeSlot.startTime}`}
                            className="p-1 border border-slate-300 h-24 align-top w-[14%] bg-white"
                          >
                            {slot && subject ? (
                              <div className="w-full h-full p-2 rounded bg-indigo-50 border-l-4 border-indigo-500 flex flex-col justify-between">
                                <div>
                                  <p className="font-bold text-xs text-indigo-700 leading-tight mb-1">
                                    {subject.name}
                                  </p>
                                  <p className="text-[10px] text-slate-600">
                                    {teacher ? teacher.name : "No Teacher"}
                                  </p>
                                </div>
                                {slot.room && (
                                  <div className="mt-1 self-end">
                                    <span className="text-[9px] font-mono text-slate-500 bg-white px-1.5 py-0.5 rounded border border-indigo-200">
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
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 text-right">
          <Button onClick={onClose} className="px-6">
            Close
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default TimetableModal;
