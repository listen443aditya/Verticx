import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useAuth } from "../../hooks/useAuth";
import { RegistrarApiService } from "../../services/registrarApiService";
import type {
  TimetableSlot,
  TimetableConfig,
  SchoolClass,
  Subject,
  Teacher,
  User,
} from "../../types";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import { TimetableIcon } from "../../components/icons/Icons";

const apiService = new RegistrarApiService();

// --- MODAL COMPONENTS ---
// (Your TimetableSetupModal and ScheduleSlotModal components are fine - they go here)
// ...
const TimetableSetupModal: React.FC<{
  classId: string;
  currentSlots: { startTime: string; endTime: string }[];
  onClose: () => void;
  onSave: (slots: { startTime: string; endTime: string }[]) => Promise<void>;
}> = ({ classId, currentSlots, onClose, onSave }) => {
  const [timeSlots, setTimeSlots] = useState(currentSlots);
  const [newSlot, setNewSlot] = useState({ startTime: "", endTime: "" });

  const handleAddSlot = () => {
    if (
      newSlot.startTime &&
      newSlot.endTime &&
      newSlot.startTime < newSlot.endTime
    ) {
      setTimeSlots((prev) =>
        [...prev, newSlot].sort((a, b) =>
          a.startTime.localeCompare(b.startTime)
        )
      );
      setNewSlot({ startTime: "", endTime: "" });
    }
  };

  const handleRemoveSlot = (index: number) => {
    setTimeSlots((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    await onSave(timeSlots);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg">
        <h2 className="text-xl font-bold mb-4">Setup Timetable Structure</h2>
        <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
          {timeSlots.map((slot, index) => (
            <div
              key={index}
              className="flex items-center gap-2 bg-slate-100 p-2 rounded"
            >
              <span className="font-mono">
                {slot.startTime} - {slot.endTime}
              </span>
              <button
                onClick={() => handleRemoveSlot(index)}
                className="ml-auto text-red-500"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
        <div className="flex items-end gap-2 border-t pt-4">
          <Input
            label="Start Time"
            type="time"
            value={newSlot.startTime}
            onChange={(e) =>
              setNewSlot((s) => ({ ...s, startTime: e.target.value }))
            }
          />
          <Input
            label="End Time"
            type="time"
            value={newSlot.endTime}
            onChange={(e) =>
              setNewSlot((s) => ({ ...s, endTime: e.target.value }))
            }
          />
          <Button type="button" onClick={handleAddSlot}>
            Add
          </Button>
        </div>
        <div className="flex justify-end gap-4 mt-6">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Structure</Button>
        </div>
      </Card>
    </div>
  );
};

const ScheduleSlotModal: React.FC<{
  classId: string;
  day: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday";
  startTime: string;
  endTime: string;
  existingSlot?: TimetableSlot | null;
  subjects: Subject[];
  allTeachers: User[];
  onClose: () => void;
  onSave: () => void;
}> = ({
  classId,
  day,
  startTime,
  endTime,
  existingSlot,
  subjects,
  allTeachers,
  onClose,
  onSave,
}) => {
  const [subjectId, setSubjectId] = useState(existingSlot?.subjectId || "");
  const [teacherId, setTeacherId] = useState(existingSlot?.teacherId || "");
  const [room, setRoom] = useState(existingSlot?.room || "");
  const [availableTeachers, setAvailableTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTeachers = async () => {
      setLoading(true);
      const teachers = await apiService.getAvailableTeachersForSlot(
        day,
        startTime
      );
      setAvailableTeachers(teachers);
      setLoading(false);
    };
    fetchTeachers();
  }, [day, startTime]);

  const handleSave = async () => {
    if (!subjectId || !teacherId) {
      setError("Please select a subject and a teacher.");
      return;
    }
    setError("");
    try {
      await apiService.setTimetableSlot({
        classId,
        day,
        startTime,
        endTime,
        subjectId,
        teacherId,
        room,
      });
      onSave();
    } catch (err: any) {
      setError(err.message || "An unknown error occurred.");
    }
  };

  const handleDelete = async () => {
    if (existingSlot) {
      await apiService.deleteTimetableSlot(existingSlot.id);
      onSave();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <h2 className="text-xl font-bold mb-1">Schedule Period</h2>
        <p className="text-text-secondary-dark mb-4">
          {day}, {startTime} - {endTime}
        </p>
        {error && (
          <p className="text-red-500 bg-red-100 p-2 rounded mb-4">{error}</p>
        )}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Subject</label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-md py-2 px-3"
            >
              <option value="">-- Select Subject --</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Teacher</label>
            <select
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-md py-2 px-3"
            >
              <option value="">-- Select Teacher --</option>
              {existingSlot?.teacherId &&
                !availableTeachers.some(
                  (t) => t.id === existingSlot.teacherId
                ) && (
                  <option value={existingSlot.teacherId}>
                    {
                      allTeachers.find((t) => t.id === existingSlot.teacherId)
                        ?.name
                    }
                  </option>
                )}
              {availableTeachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Room / Location (Optional)"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
          />
        </div>
        <div className="flex justify-between items-center mt-6">
          {existingSlot && (
            <Button variant="danger" onClick={handleDelete}>
              Clear Slot
            </Button>
          )}
          <div className="flex gap-4 ml-auto">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
// ...

// --- MAIN COMPONENT ---
const TimetableManagement: React.FC = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [allTeachers, setAllTeachers] = useState<User[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [config, setConfig] = useState<TimetableConfig | null>(null);
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"setup" | "schedule" | null>(null);
  const [modalData, setModalData] = useState<any>(null);

  // --- THIS IS THE FIXED SECTION ---

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      const [cls, sub, staff] = await Promise.all([
        apiService.getSchoolClasses(),
        apiService.getSubjects(),
        apiService.getAllStaff(),
      ]);

      const enrichedClasses = cls.map((sClass: any) => {
        const subjectIds = sClass.subjects
          ? sClass.subjects.map((s: Subject) => s.id)
          : [];

        return {
          ...sClass,
          subjectIds: subjectIds,
        };
      });

      setClasses(
        enrichedClasses.sort(
          (a: SchoolClass, b: SchoolClass) =>
            a.gradeLevel - b.gradeLevel || a.section.localeCompare(b.section)
        )
      );
      setSubjects(sub);
      setAllTeachers(staff.filter((s) => s.role === "Teacher"));

      if (enrichedClasses.length > 0) {
        setSelectedClassId(enrichedClasses[0].id);
      }
    } catch (error) {
      console.error("Failed to fetch timetable data:", error);
      setClasses([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // THIS HOOK WAS MISSING
  useEffect(() => {
    fetchData();
  }, [fetchData]);

 const fetchTimetableData = useCallback(async () => {
   if (!selectedClassId) {
     setConfig(null);
     setSlots([]);
     setLoading(false);
     return;
   }
   setLoading(true);

   const cacheBustConfig = {
     params: { _cacheBust: Date.now() },
   };

   try {
     const [conf, slts] = await Promise.all([
       // Pass the config to both API calls
       apiService.getTimetableConfig(selectedClassId, cacheBustConfig),
       apiService.getTimetableForClass(selectedClassId, cacheBustConfig),
     ]);
     setConfig(conf);
     setSlots(slts);
   } catch (error) {
     console.error("Failed to fetch timetable config/slots:", error);
     setConfig(null);
     setSlots([]);
   } finally {
     setLoading(false);
   }
 }, [selectedClassId]);

  // This hook was correct
  useEffect(() => {
    fetchTimetableData();
  }, [fetchTimetableData]);

  // --- END OF FIXED SECTION ---

  const handleSaveSetup = async (
    timeSlots: { startTime: string; endTime: string }[]
  ) => {
    await apiService.createTimetableConfig(selectedClassId, timeSlots);
    setModal(null);
    await fetchTimetableData();
  };

  const handleSaveSlot = async () => {
    setModal(null);
    setModalData(null);
    await fetchTimetableData();
  };

  const openScheduleModal = (
    day: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday",
    timeSlot: { startTime: string; endTime: string }
  ) => {
    const existingSlot = slots.find(
      (s) => s.day === day && s.startTime === timeSlot.startTime
    );
    setModalData({ ...timeSlot, day, existingSlot });
    setModal("schedule");
  };

  const days: ("Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday")[] = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
  ];
  const selectedClassSubjects = useMemo(() => {
    const sClass = classes.find((c) => c.id === selectedClassId);
    if (!sClass) return [];
    return subjects.filter((sub) => sClass.subjectIds.includes(sub.id));
  }, [selectedClassId, classes, subjects]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-text-primary-dark">
          Timetable Management
        </h1>
        {classes.length > 0 && (
          <div>
            <label className="text-sm mr-2 text-text-secondary-dark">
              Select Class:
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="bg-surface-dark border border-slate-300 rounded-md py-2 px-3"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  Grade {c.gradeLevel} - {c.section}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      <Card>
        {loading && <p>Loading timetable...</p>}

        {!loading && classes.length === 0 && (
          <div className="text-center p-12">
            <TimetableIcon className="w-16 h-16 mx-auto text-slate-300" />
            <h2 className="mt-4 text-xl font-semibold">No Classes Found</h2>
            <p className="mt-2 text-text-secondary-dark">
              Please go to "Class Management" and create a class before setting
              up a timetable.
            </p>
          </div>
        )}

        {!loading && classes.length > 0 && !config && (
          <div className="text-center p-12">
            <TimetableIcon className="w-16 h-16 mx-auto text-slate-300" />
            <h2 className="mt-4 text-xl font-semibold">
              Timetable Not Configured
            </h2>
            <p className="mt-2 text-text-secondary-dark">
              Set up the daily time slots for this class to begin creating the
              timetable.
            </p>
            <Button className="mt-4" onClick={() => setModal("setup")}>
              Set up Timetable
            </Button>
          </div>
        )}
        {!loading && config && (
          <>
            <div className="flex justify-end mb-4">
              <Button variant="secondary" onClick={() => setModal("setup")}>
                Edit Time Slots
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="p-2 border text-left text-sm font-semibold w-32">
                      Time
                    </th>
                    {days.map((day) => (
                      <th
                        key={day}
                        className="p-2 border text-left text-sm font-semibold"
                      >
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {config.timeSlots.map((timeSlot) => (
                    <tr key={`${timeSlot.startTime}-${timeSlot.endTime}`}>
                      <td className="p-2 border font-mono text-xs">
                        {timeSlot.startTime} - {timeSlot.endTime}
                      </td>
                      {days.map((day) => {
                        const slot = slots.find(
                          (s) =>
                            s.day === day && s.startTime === timeSlot.startTime
                        );
                        const subject = slot
                          ? subjects.find((s) => s.id === slot.subjectId)
                          : null;
                        const teacher = slot
                          ? allTeachers.find((t) => t.id === slot.teacherId)
                          : null;
                        return (
                          <td
                            key={`${day}-${timeSlot.startTime}`}
                            className="p-1 border h-28 align-top"
                          >
                            <div
                              onClick={() => openScheduleModal(day, timeSlot)}
                              className="w-full h-full p-2 rounded-lg text-xs cursor-pointer flex flex-col justify-between hover:bg-slate-200 transition-colors bg-slate-50"
                            >
                              {slot && subject && teacher ? (
                                <>
                                  <div>
                                    <p className="font-bold text-brand-primary leading-tight">
                                      {subject.name}
                                    </p>
                                    <p className="text-text-secondary-dark">
                                      {teacher.name}
                                    </p>
                                  </div>
                                  {slot.room && (
                                    <p className="text-brand-secondary font-semibold mt-1 self-end">
                                      Room: {slot.room}
                                    </p>
                                  )}
                                </>
                              ) : (
                                <span className="m-auto text-2xl text-slate-400">
                                  +
                                </span>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>
      {modal === "setup" && selectedClassId && (
        <TimetableSetupModal
          classId={selectedClassId}
          currentSlots={config?.timeSlots || []}
          onClose={() => setModal(null)}
          onSave={handleSaveSetup}
        />
      )}
      {modal === "schedule" && user && selectedClassId && (
        <ScheduleSlotModal
          classId={selectedClassId}
          day={modalData.day}
          startTime={modalData.startTime}
          endTime={modalData.endTime}
          existingSlot={modalData.existingSlot}
          subjects={selectedClassSubjects}
          allTeachers={allTeachers}
          onClose={() => setModal(null)}
          onSave={handleSaveSlot}
        />
      )}
    </div>
  );
};

export default TimetableManagement;