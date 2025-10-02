import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../hooks/useAuth.ts";
import { TeacherApiService } from "../../services";
import type {
  Examination,
  Student,
  ExamMark,
  ExamMarkRectificationRequest,
  HydratedSchedule,
} from "../../types.ts";
import Card from "../../components/ui/Card.tsx";
import Button from "../../components/ui/Button.tsx";
import Input from "../../components/ui/Input.tsx";
import { useDataRefresh } from "../../contexts/DataRefreshContext.tsx";

const apiService = new TeacherApiService();

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

    // FIX: Added 'await' to get the examination details before accessing the name property.
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
    // FIX: Removed the extra branchId argument to match the service method's signature.
    await apiService.submitExamMarkRectificationRequest(requestData);
    setIsSubmitting(false);
    onSubmit();
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
            <Button
              type="submit"
              disabled={isSubmitting || !reason || newScore === currentScore}
            >
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
  const [marks, setMarks] = useState<Record<string, string>>({}); // studentId -> score
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [areMarksSaved, setAreMarksSaved] = useState(false);
  const [requestingChangeFor, setRequestingChangeFor] =
    useState<Student | null>(null);

  // Fetch examinations
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

  // FIX: Rewrote this effect to correctly filter schedules without using await inside .filter()
  useEffect(() => {
    const fetchSchedules = async () => {
      if (!selectedExamId || !user) return;
      setSchedules([]);
      setSelectedScheduleId("");

      const [allSchedules, teacherCourses] = await Promise.all([
        apiService.getHydratedExamSchedules(selectedExamId),
        apiService.getTeacherCourses(user.id),
      ]);

      const teacherSubjectIds = new Set(teacherCourses.map((c) => c.subjectId));
      const teacherSchedules = allSchedules.filter((s) =>
        teacherSubjectIds.has(s.subjectId)
      );

      setSchedules(teacherSchedules);
      if (teacherSchedules.length > 0) {
        setSelectedScheduleId(teacherSchedules[0].id);
      }
    };
    fetchSchedules();
  }, [selectedExamId, user]);

  // Fetch students and marks when a schedule is selected
  const fetchStudentsAndMarks = useCallback(async () => {
    if (!selectedScheduleId) {
      setStudents([]);
      setMarks({});
      setAreMarksSaved(false);
      return;
    }
    setLoading(true);
    const schedule = schedules.find((s) => s.id === selectedScheduleId);
    if (!schedule) {
      setLoading(false);
      return;
    }

    // NOTE: If this line errors, it's a cache issue. Restart your server.
    const studentData = await apiService.getStudentsForClass(schedule.classId);
    setStudents(studentData);

    const existingMarks = await apiService.getExamMarksForSchedule(
      selectedScheduleId
    );
    if (existingMarks.length > 0) {
      const marksMap = existingMarks.reduce((acc, mark) => {
        acc[mark.studentId] = String(mark.score);
        return acc;
      }, {} as Record<string, string>);
      setMarks(marksMap);
      setAreMarksSaved(true);
    } else {
      setMarks({});
      setAreMarksSaved(false);
    }
    setLoading(false);
  }, [selectedScheduleId, schedules, refreshKey]);

  useEffect(() => {
    fetchStudentsAndMarks();
  }, [fetchStudentsAndMarks]);

  const handleMarkChange = (studentId: string, value: string) => {
    setMarks((prev) => ({ ...prev, [studentId]: value }));
  };

  const handleSaveMarks = async () => {
    if (!user || !selectedScheduleId || students.length === 0) return;
    setIsSaving(true);

    const selectedSchedule = schedules.find((s) => s.id === selectedScheduleId);
    if (!selectedSchedule) {
      setIsSaving(false);
      return;
    }

    const marksToSave: Omit<ExamMark, "id" | "enteredAt">[] = students.map(
      (student) => ({
        branchId: user.branchId!,
        examinationId: selectedExamId,
        examScheduleId: selectedScheduleId,
        studentId: student.id,
        teacherId: user.id,
        score: Number(marks[student.id] || 0),
        totalMarks: selectedSchedule.totalMarks,
      })
    );

    await apiService.saveExamMarks(marksToSave);
    setIsSaving(false);
    setStatusMessage("Marks saved successfully!");
    triggerRefresh();
    setTimeout(() => setStatusMessage(""), 3000);
  };

  const handleSubmitRequest = () => {
    setRequestingChangeFor(null);
    setStatusMessage(
      "Your change request has been submitted for registrar approval."
    );
    triggerRefresh();
    setTimeout(() => setStatusMessage(""), 5000);
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
                  {s.className} - {s.subjectName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {statusMessage && (
          <p className="text-center text-green-600 mb-4">{statusMessage}</p>
        )}

        {loading ? (
          <p>Loading...</p>
        ) : !selectedSchedule ? (
          <p>Please select an exam schedule.</p>
        ) : (
          <div>
            {areMarksSaved && (
              <p className="text-center text-blue-600 bg-blue-50 p-2 rounded mb-4">
                Marks for this exam have been saved. To make changes, please
                submit a rectification request.
              </p>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="border-b">
                  <tr>
                    <th className="p-2">Student Name</th>
                    <th className="p-2">
                      Score / {selectedSchedule.totalMarks}
                    </th>
                    {areMarksSaved && <th className="p-2"></th>}
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.id} className="border-b">
                      <td className="p-2 font-medium">{student.name}</td>
                      <td className="p-2">
                        <Input
                          type="number"
                          min="0"
                          max={selectedSchedule.totalMarks}
                          value={marks[student.id] || ""}
                          onChange={(e) =>
                            handleMarkChange(student.id, e.target.value)
                          }
                          disabled={areMarksSaved}
                          className="w-32"
                        />
                      </td>
                      {areMarksSaved && (
                        <td className="p-2 text-right">
                          <Button
                            variant="secondary"
                            className="!px-2 !py-1 text-xs"
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
              <div className="mt-6 text-right">
                <Button onClick={handleSaveMarks} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save All Marks"}
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
