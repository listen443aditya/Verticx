import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../../hooks/useAuth";
import { RegistrarApiService } from "../../services/registrarApiService";
import type {
  Examination,
  ExamSchedule,
  SchoolClass,
  Subject,
} from "../../types";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import ConfirmationModal from "../../components/ui/ConfirmationModal";

const apiService = new RegistrarApiService();

const CreateExaminationModal: React.FC<{
  onClose: () => void;
  onSave: () => void;
}> = ({ onClose, onSave }) => {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name || !startDate || !endDate) return;
    setIsSaving(true);
    await apiService.createExamination({ name, startDate, endDate });
    setIsSaving(false);
    onSave();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg">
        <h2 className="text-xl font-bold mb-4">Create New Examination</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Examination Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="e.g., Mid-Term Exams 2024"
          />
          <Input
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
          <Input
            label="End Date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
            min={startDate}
          />
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
              {isSaving ? "Creating..." : "Create Examination"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

const ScheduleExamModal: React.FC<{
  examination: Examination;
  scheduleToEdit?: ExamSchedule | null;
  classes: SchoolClass[];
  subjects: Subject[];
  onClose: () => void;
  onSave: () => void;
}> = ({ examination, scheduleToEdit, classes, subjects, onClose, onSave }) => {
  const { user } = useAuth();
  const [classId, setClassId] = useState(scheduleToEdit?.classId || "");
  const [subjectId, setSubjectId] = useState(scheduleToEdit?.subjectId || "");
  const [date, setDate] = useState(
    scheduleToEdit
      ? new Date(scheduleToEdit.date).toISOString().split("T")[0]
      : ""
  );
  const [startTime, setStartTime] = useState(scheduleToEdit?.startTime || "");
  const [endTime, setEndTime] = useState(scheduleToEdit?.endTime || "");
  const [room, setRoom] = useState(scheduleToEdit?.room || "");
  const [totalMarks, setTotalMarks] = useState(
    String(scheduleToEdit?.totalMarks || "100")
  );
  const [isSaving, setIsSaving] = useState(false);

  const availableSubjects = useMemo(() => {
    if (!classId) return [];
    const selectedClass = classes.find((c) => c.id === classId) as any;
    if (!selectedClass || !selectedClass.subjects) return [];
    const classSubjectIds = selectedClass.subjects.map((sub: any) => sub.id);
    return subjects.filter((s) => classSubjectIds.includes(s.id));
  }, [classId, classes, subjects]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.branchId) return;
    setIsSaving(true);

    const payload = {
      examinationId: examination.id,
      branchId: user.branchId,
      classId,
      subjectId,
      date,
      startTime,
      endTime,
      room,
      totalMarks: Number(totalMarks),
    };

    if (scheduleToEdit) {
      // TODO: Add updateExamSchedule to your API Service and Controller if needed
      // await apiService.updateExamSchedule(scheduleToEdit.id, payload);
      alert(
        "Update feature requires backend implementation. Create new for now."
      );
    } else {
      await apiService.createExamSchedule(payload);
    }

    setIsSaving(false);
    onSave();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg">
        <h2 className="text-xl font-bold mb-4">
          {scheduleToEdit ? "Edit Schedule" : "Schedule an Exam"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary-dark mb-1">
                Class
              </label>
              <select
                value={classId}
                onChange={(e) => {
                  setClassId(e.target.value);
                  setSubjectId("");
                }}
                className="w-full bg-white border border-slate-300 rounded-md py-2 px-3"
                required
                disabled={!!scheduleToEdit}
              >
                <option value="">-- Select Class --</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    Grade {c.gradeLevel} - {c.section}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary-dark mb-1">
                Subject
              </label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-md py-2 px-3"
                required
                disabled={!classId || !!scheduleToEdit}
              >
                <option value="">-- Select Subject --</option>
                {availableSubjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <Input
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            min={new Date(examination.startDate).toISOString().split("T")[0]}
            max={new Date(examination.endDate).toISOString().split("T")[0]}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Time"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />
            <Input
              label="End Time"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Room / Hall"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              required
            />
            <Input
              label="Total Marks"
              type="number"
              value={totalMarks}
              onChange={(e) => setTotalMarks(e.target.value)}
              required
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
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Schedule"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

const ExaminationManagement: React.FC = () => {
  const { user } = useAuth();
  const [examinations, setExaminations] = useState<Examination[]>([]);
  const [schedules, setSchedules] = useState<ExamSchedule[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedExam, setSelectedExam] = useState<Examination | null>(null);
  const [editingSchedule, setEditingSchedule] = useState<ExamSchedule | null>(
    null
  );

  // Modal states
  const [modal, setModal] = useState<"create_exam" | "schedule_exam" | null>(
    null
  );
  const [confirmDeleteExam, setConfirmDeleteExam] =
    useState<Examination | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [examData, classData, subjectData] = await Promise.all([
      apiService.getExaminations(),
      apiService.getSchoolClasses(),
      apiService.getSubjects(),
    ]);
    setExaminations(examData);
    setClasses(classData);
    setSubjects(subjectData);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const fetchSchedules = useCallback(async () => {
    if (selectedExam) {
      const response = await apiService.getExamSchedules(selectedExam.id);
      setSchedules((response as any).data.schedules);
    } else {
      setSchedules([]);
    }
  }, [selectedExam]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const handleSave = () => {
    setModal(null);
    setEditingSchedule(null);
    fetchData();
    if (selectedExam) fetchSchedules();
  };

  const handleDeleteExam = async () => {
    if (!confirmDeleteExam) return;
    try {
      // Note: Ensure you implement deleteExamination in your API service and backend
      await apiService.deleteExamination(confirmDeleteExam.id);
      setConfirmDeleteExam(null);
      if (selectedExam?.id === confirmDeleteExam.id) setSelectedExam(null);
      fetchData();
    } catch (error) {
      alert("Failed to delete examination. Ensure it has no schedules.");
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Examination Management</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: EXAM LIST */}
        <Card className="lg:col-span-1">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Examinations</h2>
            <Button onClick={() => setModal("create_exam")}>New Exam</Button>
          </div>
          <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
            {examinations.map((exam) => (
              <div
                key={exam.id}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedExam?.id === exam.id
                    ? "bg-brand-primary text-white border-brand-primary shadow-md"
                    : "bg-white border-slate-200 hover:bg-slate-50"
                }`}
                onClick={() => setSelectedExam(exam)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">{exam.name}</p>
                    <p
                      className={`text-xs mt-1 ${
                        selectedExam?.id === exam.id
                          ? "text-blue-100"
                          : "text-slate-500"
                      }`}
                    >
                      {new Date(exam.startDate).toLocaleDateString()} -{" "}
                      {new Date(exam.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  {/* Delete Button (stops propagation to prevent selecting row) */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmDeleteExam(exam);
                    }}
                    className={`text-xs p-1 rounded ${
                      selectedExam?.id === exam.id
                        ? "text-white hover:bg-white/20"
                        : "text-red-500 hover:bg-red-50"
                    }`}
                  >
                    🗑
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* RIGHT COLUMN: SCHEDULE */}
        <Card className="lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              {selectedExam ? `${selectedExam.name} Schedule` : "Exam Schedule"}
            </h2>
            {selectedExam && (
              <Button
                onClick={() => {
                  setEditingSchedule(null);
                  setModal("schedule_exam");
                }}
              >
                Add to Schedule
              </Button>
            )}
          </div>
          {selectedExam ? (
            <div className="overflow-x-auto max-h-[70vh]">
              <table className="w-full text-left">
                <thead className="border-b bg-slate-50 sticky top-0">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Time</th>
                    <th className="p-3">Class</th>
                    <th className="p-3">Subject</th>
                    <th className="p-3">Room</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {schedules.map((s) => {
                    // Find Class Name
                    const cls = classes.find((c) => c.id === s.classId);
                    const className = cls
                      ? `Grade ${cls.gradeLevel}-${cls.section}`
                      : "N/A";
                    const subjectName =
                      subjects.find((sub) => sub.id === s.subjectId)?.name ||
                      "N/A";

                    return (
                      <tr key={s.id} className="border-b hover:bg-slate-50">
                        <td className="p-3 text-sm">
                          {new Date(s.date).toLocaleDateString()}
                        </td>
                        <td className="p-3 text-sm">
                          {s.startTime} - {s.endTime}
                        </td>
                        <td className="p-3 font-medium">{className}</td>
                        <td className="p-3">{subjectName}</td>
                        <td className="p-3 text-sm">{s.room}</td>
                        <td className="p-3 text-right">
                          <button
                            className="text-brand-secondary text-xs font-medium hover:underline mr-3"
                            onClick={() => {
                              setEditingSchedule(s);
                              setModal("schedule_exam");
                            }}
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {schedules.length === 0 && (
                <p className="text-center text-slate-500 p-8">
                  No schedules added yet.
                </p>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
              <p>
                Select an examination from the list to view or manage its
                schedule.
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* MODALS */}
      {modal === "create_exam" && (
        <CreateExaminationModal
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
      {modal === "schedule_exam" && selectedExam && (
        <ScheduleExamModal
          examination={selectedExam}
          scheduleToEdit={editingSchedule}
          classes={classes}
          subjects={subjects}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
      {confirmDeleteExam && (
        <ConfirmationModal
          isOpen={true}
          title="Delete Examination"
          message={`Are you sure you want to delete "${confirmDeleteExam.name}"? This will delete all associated schedules.`}
          confirmVariant="danger"
          confirmText="Delete"
          onClose={() => setConfirmDeleteExam(null)}
          onConfirm={handleDeleteExam}
        />
      )}
    </div>
  );
};

export default ExaminationManagement;
