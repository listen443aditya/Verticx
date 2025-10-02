import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useAuth } from "../../hooks/useAuth";
// FIX: Correctly import the service class and create an instance.
import { RegistrarApiService } from "../../services/registrarApiService";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import type { Student, SchoolClass } from "../../types";
import Input from "../../components/ui/Input";
import { useDataRefresh } from "../../contexts/DataRefreshContext";

const apiService = new RegistrarApiService();

const BulkStudentMovement: React.FC = () => {
  const { user } = useAuth();
  const { triggerRefresh } = useDataRefresh();
  const [activeTab, setActiveTab] = useState<"promote" | "demote">("promote");
  const [allClasses, setAllClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  // Form state for both tabs
  const [fromGrade, setFromGrade] = useState<number | "">("");
  const [studentsInGrade, setStudentsInGrade] = useState<Student[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(
    new Set()
  );
  const [targetClassId, setTargetClassId] = useState("");
  const [academicSession, setAcademicSession] = useState("2024-2025");

  const fetchInitialData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    // FIX: Updated API call to be consistent with previous changes (no branchId).
    const classes = await apiService.getSchoolClasses();
    // FIX: Added explicit types for sort callback parameters.
    setAllClasses(
      classes.sort(
        (a: SchoolClass, b: SchoolClass) => a.gradeLevel - b.gradeLevel
      )
    );
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const availableGrades = useMemo(() => {
    const grades = new Set(allClasses.map((c) => c.gradeLevel));
    return Array.from(grades).sort((a, b) => a - b);
  }, [allClasses]);

  const targetClasses = useMemo(() => {
    if (fromGrade === "") return [];

    let targetGrade: number;
    if (activeTab === "promote") {
      targetGrade = fromGrade + 1;
    } else {
      targetGrade = fromGrade - 1;
    }
    return allClasses.filter((c) => c.gradeLevel === targetGrade);
  }, [fromGrade, activeTab, allClasses]);

  const fetchStudents = useCallback(async () => {
    if (fromGrade === "" || !user) {
      setStudentsInGrade([]);
      return;
    }
    setLoading(true);
    // Assuming getStudentsByGrade exists and no longer needs a branchId.
    const students = await apiService.getStudentsByGrade(fromGrade);
    setStudentsInGrade(students);
    setLoading(false);
  }, [fromGrade, user]);

  useEffect(() => {
    fetchStudents();
    setSelectedStudentIds(new Set());
    setTargetClassId("");
  }, [fetchStudents, activeTab]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedStudentIds(new Set(studentsInGrade.map((s) => s.id)));
    } else {
      setSelectedStudentIds(new Set());
    }
  };

  const handleSelectOne = (studentId: string) => {
    const newSet = new Set(selectedStudentIds);
    if (newSet.has(studentId)) {
      newSet.delete(studentId);
    } else {
      newSet.add(studentId);
    }
    setSelectedStudentIds(newSet);
  };

  const handleSubmit = async () => {
    if (selectedStudentIds.size === 0 || !targetClassId) {
      setStatusMessage(
        "Please select at least one student and a target class."
      );
      return;
    }
    setActionLoading(true);
    setStatusMessage("");
    const studentIds: string[] = Array.from(selectedStudentIds);
    try {
      if (activeTab === "promote") {
        await apiService.promoteStudents(
          studentIds,
          targetClassId,
          academicSession
        );
        setStatusMessage(
          `${studentIds.length} student(s) promoted successfully. Their records for the previous session have been archived.`
        );
      } else {
        await apiService.demoteStudents(studentIds, targetClassId);
        setStatusMessage(
          `${studentIds.length} student(s) demoted successfully.`
        );
      }
      triggerRefresh();
      // Reset form
      setFromGrade("");
      setStudentsInGrade([]);
      setSelectedStudentIds(new Set());
      setTargetClassId("");
    } catch (error: any) {
      setStatusMessage(
        `Error: ${error.message || "An unknown error occurred."}`
      );
    } finally {
      setActionLoading(false);
    }
  };

  const StudentTable = () => (
    <div className="mt-4 overflow-x-auto">
      {loading ? (
        <p>Loading students...</p>
      ) : studentsInGrade.length > 0 ? (
        <table className="w-full text-left">
          <thead className="border-b">
            <tr>
              <th className="p-2">
                <input
                  type="checkbox"
                  onChange={handleSelectAll}
                  checked={
                    selectedStudentIds.size === studentsInGrade.length &&
                    studentsInGrade.length > 0
                  }
                />
              </th>
              <th className="p-2">Name</th>
              <th className="p-2">Student ID</th>
              <th className="p-2">Current Class</th>
            </tr>
          </thead>
          <tbody>
            {studentsInGrade.map((student) => {
              const studentClass = allClasses.find(
                (c) => c.id === student.classId
              );
              return (
                <tr key={student.id} className="border-b">
                  <td className="p-2">
                    <input
                      type="checkbox"
                      checked={selectedStudentIds.has(student.id)}
                      onChange={() => handleSelectOne(student.id)}
                    />
                  </td>
                  <td className="p-2">{student.name}</td>
                  <td className="p-2 font-mono text-xs">{student.id}</td>
                  <td className="p-2 text-sm">
                    {studentClass
                      ? `Grade ${studentClass.gradeLevel} - ${studentClass.section}`
                      : "N/A"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <p className="text-center text-slate-500 p-4">
          No students found in this grade.
        </p>
      )}
    </div>
  );

  const tabButtonClasses = (isActive: boolean) =>
    `px-4 py-2 text-sm font-medium transition-colors focus:outline-none ${
      isActive
        ? "bg-slate-200 rounded-t-lg font-semibold"
        : "text-gray-600 hover:bg-slate-100"
    }`;

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        Bulk Student Movement
      </h1>
      <Card>
        <div className="flex border-b border-slate-200">
          <button
            className={tabButtonClasses(activeTab === "promote")}
            onClick={() => setActiveTab("promote")}
          >
            Promote Students
          </button>
          <button
            className={tabButtonClasses(activeTab === "demote")}
            onClick={() => setActiveTab("demote")}
          >
            Demote Students
          </button>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium mb-1">
                Select Grade to {activeTab}
              </label>
              <select
                value={fromGrade}
                onChange={(e) =>
                  setFromGrade(e.target.value ? Number(e.target.value) : "")
                }
                className="w-full bg-white border border-slate-300 rounded-md py-2 px-3"
              >
                <option value="">-- Select Grade --</option>
                {availableGrades.map((g) => (
                  <option key={g} value={g}>
                    Grade {g}
                  </option>
                ))}
              </select>
            </div>
            {activeTab === "promote" && (
              <div>
                <label className="block text-sm font-medium mb-1">
                  Academic Session Being Archived
                </label>
                <Input
                  value={academicSession}
                  onChange={(e) => setAcademicSession(e.target.value)}
                  placeholder="e.g., 2023-2024"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1">
                Move to Class
              </label>
              <select
                value={targetClassId}
                onChange={(e) => setTargetClassId(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-md py-2 px-3"
                disabled={targetClasses.length === 0}
              >
                <option value="">-- Select Target Class --</option>
                {targetClasses.map((c) => (
                  <option key={c.id} value={c.id}>
                    Grade {c.gradeLevel} - {c.section}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <StudentTable />

          <div className="mt-6 pt-4 border-t text-right">
            {statusMessage && (
              <p className="text-sm text-center mb-4">{statusMessage}</p>
            )}
            <Button
              onClick={handleSubmit}
              disabled={
                actionLoading || selectedStudentIds.size === 0 || !targetClassId
              }
            >
              {actionLoading
                ? "Processing..."
                : `Confirm ${activeTab} for ${selectedStudentIds.size} Student(s)`}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default BulkStudentMovement;
