import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../hooks/useAuth";
import { TeacherApiService } from "../../services";
import type { AttendanceStatus, Student } from "../../types";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import { useDataRefresh } from "../../contexts/DataRefreshContext";

const apiService = new TeacherApiService();

const RequestChangeModal: React.FC<{
  studentName: string;
  currentStatus: string;
  onClose: () => void;
  onSubmit: (reason: string, newStatus: string) => void;
}> = ({ studentName, currentStatus, onClose, onSubmit }) => {
  const [status, setStatus] = useState(currentStatus);
  const [reason, setReason] = useState("");

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-96">
        <h3 className="font-bold mb-4">Request Change for {studentName}</h3>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full p-2 border rounded mb-4"
        >
          <option>Present</option>
          <option>Absent</option>
          <option>Tardy</option>
        </select>
        <textarea
          placeholder="Reason..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full p-2 border rounded mb-4"
        />
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onSubmit(reason, status)}>Submit</Button>
        </div>
      </Card>
    </div>
  );
};

const AttendanceManagement: React.FC = () => {
  const { user } = useAuth();
  const { triggerRefresh } = useDataRefresh();

  const [mentoredClass, setMentoredClass] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modal State
  const [changeRequestTarget, setChangeRequestTarget] = useState<any>(null);

  // 1. Fetch Mentored Class
  useEffect(() => {
    const loadClass = async () => {
      if (!user?.id) return;
      setLoading(true);
      const cls = await apiService.getMentoredClass(user.id);
      if (cls) {
        setMentoredClass({
          id: cls.id,
          name: `Grade ${cls.gradeLevel} - ${cls.section}`,
        });
      } else {
        setLoading(false); // No class found
      }
    };
    loadClass();
  }, [user]);

  // 2. Fetch Attendance when Class or Date changes
  useEffect(() => {
    const loadAttendance = async () => {
      if (!mentoredClass) return;
      setLoading(true);
      try {
        const { isSaved, attendance } = await apiService.getDailyAttendance(
          mentoredClass.id,
          selectedDate
        );
        setIsSaved(isSaved);
        setAttendanceData(attendance);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    loadAttendance();
  }, [mentoredClass, selectedDate]);

  const handleStatusChange = (studentId: string, status: string) => {
    setAttendanceData((prev) =>
      prev.map((r) => (r.studentId === studentId ? { ...r, status } : r))
    );
  };

  const handleSave = async () => {
    if (!mentoredClass) return;
    setSaving(true);
    try {
      await apiService.saveDailyAttendance(
        mentoredClass.id,
        selectedDate,
        attendanceData
      );
      setIsSaved(true);
      triggerRefresh();
      alert("Attendance saved successfully!");
    } catch (e) {
      alert("Failed to save attendance.");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitChangeRequest = async (
    reason: string,
    newStatus: string
  ) => {
    if (!user || !changeRequestTarget) return;

    const requestData = {
      branchId: user.branchId!,
      teacherId: user.id,
      type: "Attendance",
      details: {
        studentId: changeRequestTarget.studentId,
        studentName: changeRequestTarget.studentName,
        date: selectedDate,
        from: changeRequestTarget.status,
        to: newStatus,
      },
      reason: reason,
    };

    await apiService.submitRectificationRequest(requestData as any);
    setChangeRequestTarget(null);
    alert("Request submitted.");
  };

  if (loading && !mentoredClass)
    return (
      <div className="p-8 text-center text-slate-500">
        Checking mentor status...
      </div>
    );

  if (!mentoredClass)
    return (
      <div className="p-8 text-center bg-slate-50 rounded-lg border border-slate-200">
        <h2 className="text-xl font-bold text-slate-700">Access Denied</h2>
        <p className="text-slate-500 mt-2">
          You are not assigned as a Class Mentor. Only mentors can mark daily
          attendance.
        </p>
      </div>
    );

  return (
    <div>
      <h1 className="text-3xl font-bold text-text-primary-dark mb-6">
        Daily Attendance
      </h1>

      <Card>
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
          <div>
            <p className="text-sm text-slate-500 uppercase font-bold tracking-wider">
              Class
            </p>
            <p className="text-xl font-bold text-brand-primary">
              {mentoredClass.name}
            </p>
          </div>
          <div className="w-48">
            <Input
              type="date"
              label="Date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <p className="text-center py-8">Loading attendance sheet...</p>
        ) : (
          <>
            {isSaved && (
              <div className="bg-blue-50 text-blue-700 p-3 rounded mb-4 text-sm flex justify-between items-center">
                <span>
                  ✓ Attendance for this date has explicitly been saved.
                </span>
                <span className="text-xs font-bold uppercase tracking-wide bg-white px-2 py-1 rounded border border-blue-200">
                  Locked
                </span>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="p-3 font-semibold text-slate-700 w-20">
                      Roll No
                    </th>
                    <th className="p-3 font-semibold text-slate-700">
                      Student Name
                    </th>
                    <th className="p-3 font-semibold text-slate-700 text-center">
                      Status
                    </th>
                    {isSaved && <th className="p-3"></th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {attendanceData.map((record) => (
                    <tr
                      key={record.studentId}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="p-3 font-mono text-sm text-slate-500">
                        {record.rollNumber || "-"}
                      </td>
                      <td className="p-3 font-medium text-slate-900">
                        {record.studentName}
                      </td>
                      <td className="p-3">
                        <div className="flex justify-center gap-4">
                          {["Present", "Absent", "Tardy"].map((status) => (
                            <label
                              key={status}
                              className={`
                                                            flex items-center gap-2 px-3 py-1 rounded cursor-pointer transition-all
                                                            ${
                                                              record.status ===
                                                              status
                                                                ? status ===
                                                                  "Absent"
                                                                  ? "bg-red-100 text-red-700 font-bold"
                                                                  : status ===
                                                                    "Tardy"
                                                                  ? "bg-yellow-100 text-yellow-800"
                                                                  : "bg-green-100 text-green-700 font-bold"
                                                                : "hover:bg-slate-100 text-slate-500"
                                                            }
                                                            ${
                                                              isSaved
                                                                ? "opacity-50 cursor-not-allowed"
                                                                : ""
                                                            }
                                                        `}
                            >
                              <input
                                type="radio"
                                name={`status-${record.studentId}`}
                                checked={record.status === status}
                                onChange={() =>
                                  !isSaved &&
                                  handleStatusChange(record.studentId, status)
                                }
                                disabled={isSaved}
                                className="accent-brand-primary"
                              />
                              <span className="text-sm">{status}</span>
                            </label>
                          ))}
                        </div>
                      </td>
                      {isSaved && (
                        <td className="p-3 text-right">
                          <Button
                            variant="secondary"
                            className="!px-2 !py-1 text-xs"
                            onClick={() => setChangeRequestTarget(record)}
                          >
                            Correction
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {!isSaved && (
              <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full md:w-auto"
                >
                  {saving ? "Saving..." : "Save Attendance Sheet"}
                </Button>
              </div>
            )}
          </>
        )}
      </Card>

      {changeRequestTarget && (
        <RequestChangeModal
          studentName={changeRequestTarget.studentName}
          currentStatus={changeRequestTarget.status}
          onClose={() => setChangeRequestTarget(null)}
          onSubmit={handleSubmitChangeRequest}
        />
      )}
    </div>
  );
};

export default AttendanceManagement;
