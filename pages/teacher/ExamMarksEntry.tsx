import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../hooks/useAuth";
import { TeacherApiService } from "../../services";
import type {
  Examination,
  Student,
  ExamMark,
  ExamMarkRectificationRequest,
  HydratedSchedule,
} from "../../types";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import { useDataRefresh } from "../../contexts/DataRefreshContext";

const apiService = new TeacherApiService();

// --- Modal for Rectification Requests ---
const RequestChangeModal: React.FC<{
  student: Student;
  schedule: HydratedSchedule;
  currentScore: string | undefined;
  onClose: () => void;
  onSubmit: () => void;
}> = ({ student, schedule, currentScore, onClose, onSubmit }) => {
  const { user } = useAuth();
  const [newScore, setNewScore] = useState(currentScore || "");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason || newScore === currentScore || !user) return;
    setIsSubmitting(true);

    try {
      const exam = await apiService.getExaminationById(schedule.examinationId);

      const requestData: Omit<
        ExamMarkRectificationRequest,
        "id" | "status" | "requestedAt" | "teacherName" | "branchId"
      > = {
        teacherId: user.id,
        details: {
          studentId: student.id,
          studentName: student.name,
          examScheduleId: schedule.id,
          examinationName: exam?.name || "Exam",
          subjectName: schedule.subjectName,
          fromScore: currentScore || "N/A",
          toScore: newScore,
        },
        reason,
      };

      await apiService.submitExamMarkRectificationRequest(requestData);
      onSubmit();
    } catch (error) {
      alert("Failed to submit request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg">
        <h2 className="text-xl font-bold text-text-primary-dark mb-4">
          Request Mark Change
        </h2>
        <p className="text-sm text-text-secondary-dark mb-4">
          For: <strong>{student.name}</strong> | Exam:{" "}
          <strong>{schedule.subjectName}</strong>
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Current Score"
              value={currentScore || "N/A"}
              readOnly
              disabled
              className="bg-slate-100"
            />
            <Input
              label="New Score"
              type="number"
              min="0"
              max={schedule.totalMarks}
              value={newScore}
              onChange={(e) => setNewScore(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary-dark mb-1">
              Reason for Change
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="w-full bg-white border border-slate-300 rounded-md py-2 px-3"
              required
            />
          </div>
          <div className="flex justify-end gap-4 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !reason}>
              {isSubmitting ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

const ExamMarksEntry: React.FC = () => {
  const { user } = useAuth();
  const { refreshKey, triggerRefresh } = useDataRefresh();

  const [examinations, setExaminations] = useState<Examination[]>([]);
  const [selectedExamId, setSelectedExamId] = useState("");

  const [schedules, setSchedules] = useState<HydratedSchedule[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState("");

  const [students, setStudents] = useState<Student[]>([]);
  const [marks, setMarks] = useState<Record<string, string>>({});

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const [areMarksSaved, setAreMarksSaved] = useState(false);

  const [requestingChangeFor, setRequestingChangeFor] =
    useState<Student | null>(null);

  // 1. Fetch Examinations
  useEffect(() => {
    const fetchExams = async () => {
      if (!user?.branchId) return;
      setLoading(true);
      const exams = await apiService.getExaminations(user.branchId);
      setExaminations(exams);
      if (exams.length > 0) setSelectedExamId(exams[0].id);
      setLoading(false);
    };
    fetchExams();
  }, [user]);

  // 2. Fetch Schedules (FIXED: Added data flattening logic)
  useEffect(() => {
    const fetchSchedules = async () => {
      if (!selectedExamId || !user) return;
      setSchedules([]);
      setSelectedScheduleId("");

      try {
        const [allSchedules, teacherCourses] = await Promise.all([
          apiService.getHydratedExamSchedules(selectedExamId),
          apiService.getTeacherCourses(user.id),
        ]);

        // Filter: Only show schedules for subjects this teacher actually teaches
        const teacherSubjectIds = new Set(
          teacherCourses.map((c) => c.subjectId)
        );

        const teacherSchedules = allSchedules
          .filter((s) => teacherSubjectIds.has(s.subjectId))
          // FIX: Map nested objects (s.class, s.subject) to flat strings (s.className, s.subjectName)
          .map((s: any) => ({
            ...s,
            className:
              s.className ||
              (s.class
                ? `Grade ${s.class.gradeLevel}-${s.class.section}`
                : "Class"),
            subjectName:
              s.subjectName || (s.subject ? s.subject.name : "Subject"),
          }));

        setSchedules(teacherSchedules);
      } catch (e) {
        console.error("Failed to load schedules");
      }
    };
    fetchSchedules();
  }, [selectedExamId, user]);

  // 3. Fetch Students & Existing Marks
  const fetchStudentsAndMarks = useCallback(async () => {
    setStudents([]);
    setMarks({});
    setAreMarksSaved(false);

    if (!selectedScheduleId) return;

    setLoading(true);
    const schedule = schedules.find((s) => s.id === selectedScheduleId);
    if (!schedule) {
      setLoading(false);
      return;
    }

    try {
      const studentData = await apiService.getStudentsForClass(
        schedule.classId
      );
      setStudents(studentData);

      const existingMarks = await apiService.getExamMarksForSchedule(
        selectedScheduleId
      );

      if (existingMarks.length > 0) {
        setAreMarksSaved(true);
        const marksMap = existingMarks.reduce((acc, mark) => {
          acc[mark.studentId] = String(mark.score);
          return acc;
        }, {} as Record<string, string>);
        setMarks(marksMap);
      } else {
        setAreMarksSaved(false);
        setMarks({});
      }
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setLoading(false);
    }
  }, [selectedScheduleId, schedules, refreshKey]);

  useEffect(() => {
    fetchStudentsAndMarks();
  }, [fetchStudentsAndMarks]);

  const handleMarkChange = (studentId: string, value: string) => {
    setMarks((prev) => ({ ...prev, [studentId]: value }));
  };

  const handleSaveMarks = async () => {
    if (!user || !selectedScheduleId || students.length === 0) return;

    const hasEntries = Object.values(marks).some(
      (val) => val !== "" && val !== undefined
    );
    if (!hasEntries) {
      setStatusMessage("Please enter marks before saving.");
      setTimeout(() => setStatusMessage(""), 3000);
      return;
    }

    if (!window.confirm("Are you sure? Once saved, marks will be LOCKED.")) {
      return;
    }

    setIsSaving(true);
    const selectedSchedule = schedules.find((s) => s.id === selectedScheduleId);
    if (!selectedSchedule) return;

    const marksToSave: Omit<ExamMark, "id" | "enteredAt">[] = students
      .filter(
        (student) => marks[student.id] !== undefined && marks[student.id] !== ""
      )
      .map((student) => ({
        branchId: user.branchId!,
        examinationId: selectedExamId,
        examScheduleId: selectedScheduleId,
        studentId: student.id,
        teacherId: user.id,
        score: Number(marks[student.id]),
        totalMarks: selectedSchedule.totalMarks,
      }));

    try {
      await apiService.saveExamMarks(marksToSave);
      setStatusMessage("Marks saved successfully!");
      triggerRefresh();
      fetchStudentsAndMarks();
    } catch (error) {
      setStatusMessage("Failed to save marks.");
    } finally {
      setIsSaving(false);
      setTimeout(() => setStatusMessage(""), 3000);
    }
  };

  const handleSubmitRequest = () => {
    setRequestingChangeFor(null);
    setStatusMessage("Change request submitted for approval.");
    setTimeout(() => setStatusMessage(""), 3000);
  };

  const selectedSchedule = schedules.find((s) => s.id === selectedScheduleId);

  return (
    <div>
      <h1 className="text-3xl font-bold text-text-primary-dark mb-6">
        Exam Marks Entry
      </h1>
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 border-b pb-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary-dark mb-1">
              Examination
            </label>
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-md py-2 px-3"
            >
              {examinations.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary-dark mb-1">
              Exam Schedule (Class - Subject)
            </label>
            <select
              value={selectedScheduleId}
              onChange={(e) => setSelectedScheduleId(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-md py-2 px-3"
            >
              <option value="">-- Select a Schedule --</option>
              {schedules.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.className} - {s.subjectName} (Max: {s.totalMarks})
                </option>
              ))}
            </select>
          </div>
        </div>

        {statusMessage && (
          <p
            className={`text-center mb-4 p-2 rounded ${
              statusMessage.includes("Failed")
                ? "bg-red-50 text-red-600"
                : "bg-green-50 text-green-600"
            }`}
          >
            {statusMessage}
          </p>
        )}

        {loading ? (
          <p className="text-center py-8 text-slate-500">Loading...</p>
        ) : !selectedSchedule ? (
          <div className="text-center py-8 bg-slate-50 rounded border border-dashed border-slate-300 text-slate-500">
            Please select an exam schedule above to start entering marks.
          </div>
        ) : (
          <div>
            {areMarksSaved && (
              <div className="flex items-center gap-2 justify-center bg-blue-50 border border-blue-100 text-blue-700 p-3 rounded mb-4">
                <span className="font-bold">🔒 LOCKED:</span>
                <span>
                  Marks for this exam have been saved. To make changes, click
                  "Request Change" next to a student.
                </span>
              </div>
            )}

            <div className="overflow-x-auto max-h-[60vh]">
              <table className="w-full text-left">
                <thead className="border-b bg-slate-50 sticky top-0">
                  <tr>
                    <th className="p-3 font-semibold text-slate-700">
                      Student Name
                    </th>
                    <th className="p-3 font-semibold text-slate-700 w-40">
                      Score{" "}
                      <span className="text-xs font-normal text-slate-500">
                        / {selectedSchedule.totalMarks}
                      </span>
                    </th>
                    {areMarksSaved && (
                      <th className="p-3 text-right">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map((student) => (
                    <tr
                      key={student.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="p-3 font-medium text-slate-900">
                        {student.name}
                      </td>
                      <td className="p-3">
                        <Input
                          type="number"
                          min="0"
                          max={selectedSchedule.totalMarks}
                          value={marks[student.id] || ""}
                          onChange={(e) =>
                            handleMarkChange(student.id, e.target.value)
                          }
                          disabled={areMarksSaved}
                          className={`w-32 ${
                            areMarksSaved
                              ? "bg-slate-100 cursor-not-allowed"
                              : "bg-white"
                          }`}
                          placeholder="0"
                        />
                      </td>
                      {areMarksSaved && (
                        <td className="p-3 text-right">
                          <Button
                            variant="secondary"
                            className="!px-3 !py-1 text-xs"
                            onClick={() => setRequestingChangeFor(student)}
                          >
                            Request Change
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {!areMarksSaved && (
              <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
                <Button
                  onClick={handleSaveMarks}
                  disabled={isSaving}
                  className="w-full md:w-auto"
                >
                  {isSaving ? "Saving..." : "Save & Lock Marks"}
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>

      {requestingChangeFor && selectedSchedule && (
        <RequestChangeModal
          student={requestingChangeFor}
          schedule={selectedSchedule}
          currentScore={marks[requestingChangeFor.id]}
          onClose={() => setRequestingChangeFor(null)}
          onSubmit={handleSubmitRequest}
        />
      )}
    </div>
  );
};

export default ExamMarksEntry;
