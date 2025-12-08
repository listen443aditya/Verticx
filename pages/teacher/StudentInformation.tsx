import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../hooks/useAuth";
import { TeacherApiService } from "../../services";
import type { Student, StudentProfile } from "../../types";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import StudentDetailModal from "../../components/modals/StudentDetailModal";
import RaiseComplaintModal from "../../components/modals/RaiseComplaintModal";

const apiService = new TeacherApiService();

// --- 1. NEW: Inline Edit Component for Roll Number ---
const RollNumberCell: React.FC<{
  student: any;
  isMentor: boolean;
  onUpdate: (id: string, val: string) => Promise<void>;
}> = ({ student, isMentor, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [val, setVal] = useState(student.classRollNumber || "");
  const [saving, setSaving] = useState(false);

  // Sync local state if prop changes
  useEffect(() => {
    setVal(student.classRollNumber || "");
  }, [student.classRollNumber]);

  const handleSave = async () => {
    if (val === student.classRollNumber) {
      setIsEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onUpdate(student.id, val);
      setIsEditing(false);
    } catch (e) {
      console.error(e);
      // Reset to original on error
      setVal(student.classRollNumber || "");
    } finally {
      setSaving(false);
    }
  };

  if (!isMentor) {
    return (
      <span className="text-slate-500">{student.classRollNumber || "-"}</span>
    );
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <input
          className="w-12 p-1 text-xs border border-blue-400 rounded focus:outline-none"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") setIsEditing(false);
          }}
        />
        <button
          onClick={handleSave}
          disabled={saving}
          className="text-green-600 hover:text-green-800"
          title="Save"
        >
          {saving ? "..." : "✓"}
        </button>
        <button
          onClick={() => {
            setIsEditing(false);
            setVal(student.classRollNumber || "");
          }}
          className="text-red-500 hover:text-red-700 text-xs"
          title="Cancel"
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <div
      className="group flex items-center gap-2 cursor-pointer py-1 px-2 rounded hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all"
      onClick={() => setIsEditing(true)}
      title="Click to edit Roll Number"
    >
      <span
        className={
          val ? "font-mono text-slate-700" : "text-slate-400 text-xs italic"
        }
      >
        {val || "Set"}
      </span>
      <span className="opacity-0 group-hover:opacity-100 text-[10px] text-brand-primary">
        ✎
      </span>
    </div>
  );
};

const StudentInformation: React.FC = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Modals
  const [viewingStudent, setViewingStudent] = useState<StudentProfile | null>(
    null
  );
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [complainingAbout, setComplainingAbout] = useState<Student | null>(
    null
  );
  const [complaintStatus, setComplaintStatus] = useState("");

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const teacherId = user.id;
      if (!teacherId) throw new Error("Teacher ID missing.");
      const studentData = await apiService.getStudentsForTeacher(teacherId);
      setStudents(studentData);
    } catch (err: any) {
      console.error("Failed to fetch students:", err);
      setError("Failed to load student list.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- 2. Logic to Update Roll Number & Refresh Local State ---
  const handleRollNumberUpdate = async (
    studentId: string,
    newRollNo: string
  ) => {
    // Call API
    await apiService.updateStudentRollNumber(studentId, newRollNo);

    // Optimistic Update: Update local state immediately without full reload
    setStudents((prev) =>
      prev.map((s) =>
        s.id === studentId ? { ...s, classRollNumber: newRollNo } : s
      )
    );
  };

  const handleViewStudent = async (studentId: string) => {
    setDetailsLoading(true);
    try {
      const profile = await apiService.getStudentProfileDetails(studentId);
      setViewingStudent(profile);
    } catch (err) {
      alert("Could not load student profile.");
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleComplaintSubmit = () => {
    setComplainingAbout(null);
    setComplaintStatus(
      "Complaint logged successfully. The student and their parent will be notified."
    );
    setTimeout(() => setComplaintStatus(""), 5000);
  };

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.user?.userId || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <h1 className="text-3xl font-bold text-text-primary-dark mb-6">
        Student Information
      </h1>
      <Card>
        <div className="flex justify-between items-center mb-4 gap-4">
          <Input
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-1/2"
          />
          <Button variant="secondary" onClick={fetchData}>
            Refresh
          </Button>
        </div>

        {complaintStatus && (
          <p className="text-center text-green-600 mb-4 bg-green-50 p-2 rounded">
            {complaintStatus}
          </p>
        )}
        {error && <p className="text-center text-red-600 mb-4">{error}</p>}

        {loading ? (
          <div className="text-center py-8 text-slate-500">
            Loading students...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b bg-slate-50">
                <tr>
                  <th className="p-4 font-semibold text-slate-700">Name</th>
                  {/* --- 3. Added Roll No Column Header --- */}
                  <th className="p-4 font-semibold text-slate-700 w-24">
                    Roll No
                  </th>
                  <th className="p-4 font-semibold text-slate-700">
                    Student ID
                  </th>
                  <th className="p-4 font-semibold text-slate-700">Class</th>
                  <th className="p-4 text-center font-semibold text-slate-700">
                    Rank
                  </th>
                  <th className="p-4 text-right font-semibold text-slate-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((student) => {
                  // Determine permissions
                  const isMentor = student.class?.mentorId === user?.id;

                  return (
                    <tr key={student.id} className="hover:bg-slate-50">
                      <td className="p-4 font-medium text-slate-900">
                        {student.name}
                      </td>

                      {/* --- 4. Added Roll No Cell --- */}
                      <td className="p-4">
                        <RollNumberCell
                          student={student}
                          isMentor={isMentor}
                          onUpdate={handleRollNumberUpdate}
                        />
                      </td>

                      <td className="p-4 font-mono text-xs text-slate-500">
                        <span className="bg-slate-100 px-2 py-1 rounded">
                          {student.user?.userId || "N/A"}
                        </span>
                      </td>
                      <td className="p-4 text-slate-600">
                        {student.class
                          ? `Grade ${student.class.gradeLevel}-${student.class.section}`
                          : "N/A"}
                      </td>
                      <td className="p-4 text-center font-semibold text-slate-700">
                        {student.schoolRank || "-"}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="secondary"
                            className="!px-3 !py-1 text-xs border-slate-200"
                            onClick={() => handleViewStudent(student.id)}
                          >
                            View
                          </Button>
                          <Button
                            variant="danger"
                            className="!px-3 !py-1 text-xs"
                            onClick={() => setComplainingAbout(student)}
                          >
                            Complaint
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modals */}
      {viewingStudent && !detailsLoading && (
        <StudentDetailModal
          profile={viewingStudent}
          onClose={() => setViewingStudent(null)}
          onDataRefresh={() => handleViewStudent(viewingStudent.student.id)}
        />
      )}
      {complainingAbout && (
        <RaiseComplaintModal
          student={complainingAbout}
          onClose={() => setComplainingAbout(null)}
          onSubmit={handleComplaintSubmit}
        />
      )}
    </div>
  );
};

export default StudentInformation;
