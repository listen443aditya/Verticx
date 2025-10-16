import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useAuth } from "../../hooks/useAuth";
// Corrected the import to use the service class directly.
import { RegistrarApiService } from "../../services/registrarApiService";
import type {
  Subject,
  SchoolClass,
  Student,
  ClassDetails,
  Teacher,
  FeeTemplate,
  User, // Imported User type for staff management.
} from "../../types";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import AssignFeeTemplateModal from "../../components/modals/AssignFeeTemplateModal";
import ConfirmationModal from "../../components/ui/ConfirmationModal";
import { TimetableIcon } from "../../components/icons/Icons";
import { useDataRefresh } from "../../contexts/DataRefreshContext";

// Create an instance of the service.
const apiService = new RegistrarApiService();



type EnrichedSchoolClass = SchoolClass & {
  studentCount: number;
  mentorName?: string;
  feeTemplateName?: string;
};
// --- MODAL COMPONENTS ---

const CreateSubjectModal: React.FC<{
  teachers: User[];
  onClose: () => void;
  onSave: (data: { name: string; teacherId?: string }) => Promise<void>;
}> = ({ teachers, onClose, onSave }) => {
  const [name, setName] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Subject name cannot be empty.");
      return;
    }
    setIsSaving(true);
    // The teacherId will be an empty string "" if "Unassigned" is selected.
    // We convert it to `undefined` so it doesn't get sent in the request body.
    await onSave({ name, teacherId: teacherId || undefined });
    setIsSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <h2 className="text-xl font-bold text-text-primary-dark mb-4">
          Add New Subject
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Subject Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Physics, History"
            required
          />
          <div>
            <label className="block text-sm font-medium text-text-secondary-dark mb-1">
              Assign Teacher (Optional)
            </label>
            <select
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-md py-2 px-3 text-text-primary-dark"
            >
              <option value="">-- Unassigned --</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.name}
                </option>
              ))}
            </select>
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
              {isSaving ? "Saving..." : "Save Subject"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};


// ... (CreateClassModal, EditClassModal, EditSubjectModal, ManageSubjectsModal are unchanged)
const CreateClassModal: React.FC<{
  onClose: () => void;
  onSave: () => void;
}> = ({ onClose, onSave }) => {
  const [gradeLevel, setGradeLevel] = useState(1);
  const [section, setSection] = useState("A");
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await apiService.createSchoolClass({ gradeLevel, section });
    setIsSaving(false);
    onSave();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <h2 className="text-xl font-bold text-text-primary-dark mb-4">
          Create New Class
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Grade Level"
            type="number"
            value={gradeLevel}
            onChange={(e) => setGradeLevel(Number(e.target.value))}
            min="1"
            required
          />
          <Input
            label="Section"
            value={section}
            onChange={(e) => setSection(e.target.value)}
            placeholder="e.g., A, B, Blue, Gold"
            required
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
              {isSaving ? "Creating..." : "Create Class"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};



const EditClassModal: React.FC<{
  schoolClass: SchoolClass;
  onClose: () => void;
  onSave: () => void;
}> = ({ schoolClass, onClose, onSave }) => {
  const [gradeLevel, setGradeLevel] = useState(schoolClass.gradeLevel);
  const [section, setSection] = useState(schoolClass.section);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await apiService.updateSchoolClass(schoolClass.id, { gradeLevel, section });
    setIsSaving(false);
    onSave();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <h2 className="text-xl font-bold text-text-primary-dark mb-4">
          Edit Class
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Grade Level"
            type="number"
            value={gradeLevel}
            onChange={(e) => setGradeLevel(Number(e.target.value))}
            min="1"
            required
          />
          <Input
            label="Section"
            value={section}
            onChange={(e) => setSection(e.target.value)}
            required
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
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

const EditSubjectModal: React.FC<{
  subject: Subject;
  teachers: User[];
  onClose: () => void;
  onSave: (updates: Partial<Subject>) => void;
}> = ({ subject, teachers, onClose, onSave }) => {
  const [name, setName] = useState(subject.name);
  const [teacherId, setTeacherId] = useState(subject.teacherId || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await onSave({ name, teacherId: teacherId || undefined });
    setIsSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <h2 className="text-xl font-bold text-text-primary-dark mb-4">
          Edit Subject
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Subject Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <div>
            <label className="block text-sm font-medium text-text-secondary-dark mb-1">
              Assign Teacher
            </label>
            <select
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-md py-2 px-3 text-text-primary-dark"
            >
              <option value="">-- Unassigned --</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.name}
                </option>
              ))}
            </select>
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
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

const ManageSubjectsModal: React.FC<{
  schoolClass: SchoolClass;
  allSubjects: Subject[];
  onClose: () => void;
  onSave: () => void;
}> = ({ schoolClass, allSubjects, onClose, onSave }) => {
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>(
    schoolClass.subjectIds
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleToggle = (subjectId: string) => {
    setSelectedSubjectIds((prev) =>
      prev.includes(subjectId)
        ? prev.filter((id) => id !== subjectId)
        : [...prev, subjectId]
    );
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await apiService.updateClassSubjects(schoolClass.id, selectedSubjectIds);
    setIsSaving(false);
    onSave();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg">
        <h2 className="text-xl font-bold text-text-primary-dark mb-2">
          Manage Subjects for Grade {schoolClass.gradeLevel} -{" "}
          {schoolClass.section}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="my-4 max-h-60 overflow-y-auto space-y-2 pr-2">
            {allSubjects.map((subject) => (
              <label
                key={subject.id}
                className="flex items-center bg-slate-100 p-3 rounded-lg cursor-pointer hover:bg-slate-200"
              >
                <input
                  type="checkbox"
                  checked={selectedSubjectIds.includes(subject.id)}
                  onChange={() => handleToggle(subject.id)}
                  className="h-4 w-4 rounded border-slate-300 bg-slate-200 text-brand-secondary focus:ring-brand-accent"
                />
                <span className="ml-3 text-text-primary-dark">
                  {subject.name}
                </span>
              </label>
            ))}
          </div>
          <div className="flex justify-end gap-4 pt-4 border-t border-slate-200">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Subjects"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

// Modal for managing students in a class
const ManageStudentsModal: React.FC<{
  schoolClass: SchoolClass;
  onClose: () => void;
  onSave: () => void;
}> = ({ schoolClass, onClose, onSave }) => {
  // FIX: Added useAuth() hook to get the user object.
  const { user } = useAuth();
  const [enrolledStudents, setEnrolledStudents] = useState<Student[]>([]);
  const [unassignedStudents, setUnassignedStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    // FIX: Check for user and user.branchId before fetching
    if (!user?.branchId) return;
    setLoading(true);
    // The user variable is now defined in this scope.
    // NOTE: If you get an error here, it means `getStudentsByBranch` needs to be added to your RegistrarApiService.
    const allBranchStudents = await (apiService as any).getStudentsByBranch(
      user.branchId
    );
    const unassigned = allBranchStudents.filter(
      (s: Student) => !s.classId && s.gradeLevel === schoolClass.gradeLevel
    );
    const enrolled = allBranchStudents.filter((s: Student) =>
      schoolClass.studentIds.includes(s.id)
    );
    setUnassignedStudents(unassigned);
    setEnrolledStudents(enrolled);
    setLoading(false);
  }, [schoolClass, user]); // FIX: Added 'user' to the dependency array.

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddStudent = async (studentId: string) => {
    await apiService.assignStudentsToClass(schoolClass.id, [studentId]);
    fetchData(); // Refresh lists
  };

  const handleRemoveStudent = async (studentId: string) => {
    await apiService.removeStudentFromClass(schoolClass.id, studentId);
    fetchData(); // Refresh lists
  };

  const handleClose = () => {
    onSave(); // This triggers a refresh on the main page
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col">
        <h2 className="text-xl font-bold text-text-primary-dark mb-4">
          Manage Students for Grade {schoolClass.gradeLevel} -{" "}
          {schoolClass.section}
        </h2>
        {loading ? (
          <p>Loading students...</p>
        ) : (
          <div className="grid grid-cols-2 gap-6 flex-grow overflow-hidden">
            {/* Unassigned Students */}
            <div className="bg-slate-50 p-4 rounded-lg flex flex-col">
              <h3 className="font-semibold mb-2">
                Unassigned Students (Grade {schoolClass.gradeLevel})
              </h3>
              <div className="overflow-y-auto flex-grow space-y-2 pr-2">
                {unassignedStudents.length > 0 ? (
                  unassignedStudents.map((s: Student) => (
                    <div
                      key={s.id}
                      className="flex justify-between items-center bg-white p-2 rounded shadow-sm"
                    >
                      <span>{s.name}</span>
                      <Button
                        className="!px-2 !py-1 text-xs"
                        onClick={() => handleAddStudent(s.id)}
                      >
                        Add
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-text-secondary-dark text-center pt-4">
                    No unassigned students in this grade.
                  </p>
                )}
              </div>
            </div>
            {/* Enrolled Students */}
            <div className="bg-slate-50 p-4 rounded-lg flex flex-col">
              <h3 className="font-semibold mb-2">
                Enrolled Students ({enrolledStudents.length})
              </h3>
              <div className="overflow-y-auto flex-grow space-y-2 pr-2">
                {enrolledStudents.map((s: Student) => (
                  <div
                    key={s.id}
                    className="flex justify-between items-center bg-white p-2 rounded shadow-sm"
                  >
                    <span>{s.name}</span>
                    <Button
                      variant="danger"
                      className="!px-2 !py-1 text-xs"
                      onClick={() => handleRemoveStudent(s.id)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        <div className="flex justify-end gap-4 pt-4 mt-4 border-t border-slate-200">
          <Button type="button" variant="primary" onClick={handleClose}>
            Done
          </Button>
        </div>
      </Card>
    </div>
  );
};

const ClassDetailModal: React.FC<{
  classDetails: ClassDetails;
  teachers: User[];
  onClose: () => void;
}> = ({ classDetails, teachers, onClose }) => {
  const { classInfo, students, subjects, performance, fees } = classDetails;
  const [studentSearch, setStudentSearch] = useState("");

  const mentor = useMemo(
    () => teachers.find((t) => t.id === classInfo.mentorTeacherId),
    [teachers, classInfo]
  );

  const performanceData = performance.map((p) => ({
    name: p.subjectName,
    "Average Score": p.averageScore,
  }));

  const filteredStudents = students.filter(
    (s: Student) =>
      s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.id.toLowerCase().includes(studentSearch.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      aria-modal="true"
      role="dialog"
    >
      <Card className="w-full max-w-7xl h-[95vh] flex flex-col">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-3xl font-bold text-text-primary-dark">
              Class Details: Grade {classInfo.gradeLevel} - {classInfo.section}
            </h2>
            {mentor && (
              <p className="text-md text-text-secondary-dark -mt-1">
                Mentor: <span className="font-semibold">{mentor.name}</span>
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-3xl font-light text-slate-500 hover:text-slate-800 leading-none"
          >
            &times;
          </button>
        </div>

        <div className="flex-grow overflow-y-auto pr-2 grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left Column - Stats & Subjects */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <h3 className="text-lg font-semibold mb-3">
                Academic Performance
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={performanceData}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 60, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <YAxis type="category" dataKey="name" width={60} />
                  <Tooltip />
                  <Bar dataKey="Average Score" fill="#4F46E5" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <Card>
              <h3 className="text-lg font-semibold mb-3">
                Subjects & Syllabus
              </h3>
              <div className="space-y-3">
                {subjects.map((s) => (
                  <div key={s.subjectId}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-text-primary-dark">
                        {s.subjectName}{" "}
                        <span className="text-text-secondary-dark font-normal">
                          ({s.teacherName})
                        </span>
                      </span>
                      <span className="font-semibold text-text-primary-dark">
                        {s.syllabusCompletion}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        className="bg-brand-secondary h-2 rounded-full"
                        style={{ width: `${s.syllabusCompletion}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Right Column - Students & Fees */}
          <div className="lg:col-span-3 space-y-6 flex flex-col">
            <Card>
              <h3 className="text-lg font-semibold mb-3">Fee Status</h3>
              <div className="flex items-center gap-6 bg-slate-50 p-4 rounded-lg">
                <div className="text-center">
                  <p className="text-3xl font-bold text-red-500">
                    {fees.totalPending.toLocaleString()}
                  </p>
                  <p className="text-sm text-text-secondary-dark">
                    Total Pending
                  </p>
                </div>
                <div className="flex-grow">
                  {fees.defaulters.length > 0 ? (
                    <details>
                      <summary className="cursor-pointer font-semibold text-brand-secondary">
                        View {fees.defaulters.length} Defaulter(s)
                      </summary>
                      <ul className="mt-2 text-sm text-text-secondary-dark list-disc pl-5 max-h-24 overflow-y-auto">
                        {fees.defaulters.map((d) => (
                          <li key={d.studentId}>
                            {d.studentName}: {d.pendingAmount.toLocaleString()}
                          </li>
                        ))}
                      </ul>
                    </details>
                  ) : (
                    <p className="font-semibold text-green-600">
                      No pending fees for this class.
                    </p>
                  )}
                </div>
              </div>
            </Card>
            <Card className="flex flex-col flex-grow">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold">
                  Student Roster ({students.length})
                </h3>
                <Input
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="Search students by name or ID..."
                  className="w-1/2"
                />
              </div>
              <div className="overflow-y-auto flex-grow -mx-6 px-6">
                <table className="w-full text-left">
                  <thead className="sticky top-0 bg-surface-dark/80 backdrop-blur-sm">
                    <tr className="border-b border-slate-200">
                      <th className="p-2 text-sm font-semibold text-text-secondary-dark">
                        Name
                      </th>
                      <th className="p-2 text-sm font-semibold text-text-secondary-dark">
                        Student ID
                      </th>
                      <th className="p-2 text-sm font-semibold text-text-secondary-dark text-center">
                        Class Rank
                      </th>
                      <th className="p-2 text-sm font-semibold text-text-secondary-dark text-center">
                        School Rank
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((s: any) => (
                      <tr
                        key={s.id}
                        className="border-b border-slate-100 text-sm"
                      >
                        <td className="p-2 font-medium">{s.name}</td>
                        <td className="p-2 font-mono text-xs">{s.id}</td>
                        <td className="p-2 text-center font-medium">
                          {s.classRank}
                        </td>
                        <td className="p-2 text-center font-medium">
                          {s.schoolRank}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>
      </Card>
    </div>
  );
};

const SubjectManager: React.FC = () => {
  const { user } = useAuth();
  // 1. GET `refreshKey` ALONG WITH `triggerRefresh`
  const { refreshKey, triggerRefresh } = useDataRefresh();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // State for the modals
  const [isCreating, setIsCreating] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [deletingSubject, setDeletingSubject] = useState<Subject | null>(null);

  const fetchData = useCallback(async () => {
    if (!user?.branchId) return;
    setLoading(true);
    const [subjectData, allStaff] = await Promise.all([
      apiService.getSubjects(),
      apiService.getAllStaff(),
    ]);
    setSubjects(subjectData);
    setTeachers(allStaff.filter((s: User) => s.role === "Teacher"));
    setLoading(false);
    // 2. USE `refreshKey` IN THE DEPENDENCY ARRAY
  }, [user, refreshKey]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreate = async (data: { name: string; teacherId?: string }) => {
    await apiService.createSubject(data);
    setIsCreating(false);
    triggerRefresh(); // This now correctly triggers the refresh
  };

  const handleSave = async (updates: Partial<Subject>) => {
    if (editingSubject) {
      await apiService.updateSubject(editingSubject.id, updates);
    }
    setEditingSubject(null);
    triggerRefresh();
  };

  const handleDelete = async () => {
    if (!deletingSubject) return;
    await apiService.deleteSubject(deletingSubject.id);
    setDeletingSubject(null);
    triggerRefresh();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-text-primary-dark">
          Subjects
        </h2>
        <Button onClick={() => setIsCreating(true)}>Add New Subject</Button>
      </div>
      {loading ? (
        <p>Loading subjects...</p>
      ) : (
        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-left">
            <thead className="border-b sticky top-0 bg-surface-dark">
              <tr>
                <th className="p-2">Subject Name</th>
                <th className="p-2">Assigned Teacher</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((subject) => (
                <tr key={subject.id} className="border-b hover:bg-slate-50">
                  <td className="p-2 font-medium">{subject.name}</td>
                  <td className="p-2">
                    {teachers.find((t) => t.id === subject.teacherId)?.name || (
                      <span className="text-slate-400">Unassigned</span>
                    )}
                  </td>
                  <td className="p-2 text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="secondary"
                        className="!px-2 !py-1 text-xs"
                        onClick={() => setEditingSubject(subject)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        className="!px-2 !py-1 text-xs"
                        onClick={() => setDeletingSubject(subject)}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isCreating && (
        <CreateSubjectModal
          teachers={teachers}
          onClose={() => setIsCreating(false)}
          onSave={handleCreate}
        />
      )}

      {editingSubject && (
        <EditSubjectModal
          subject={editingSubject}
          teachers={teachers}
          onClose={() => setEditingSubject(null)}
          onSave={handleSave}
        />
      )}
      {deletingSubject && (
        <ConfirmationModal
          isOpen={!!deletingSubject}
          onClose={() => setDeletingSubject(null)}
          onConfirm={handleDelete}
          title="Confirm Subject Deletion"
          message={
            <>
              Are you sure you want to delete{" "}
              <strong>{deletingSubject.name}</strong>? It will be removed from
              all classes.
            </>
          }
        />
      )}
    </div>
  );
};

const ClassManagement: React.FC = () => {
  const { user } = useAuth();
  const { refreshKey, triggerRefresh } = useDataRefresh();
const [classes, setClasses] = useState<EnrichedSchoolClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [feeTemplates, setFeeTemplates] = useState<FeeTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const [modal, setModal] = useState<
    | "create"
    | "edit"
    | "manage_subjects"
    | "manage_students"
    | "assign_fee"
    | "view_details"
    | null
  >(null);
  const [selectedClass, setSelectedClass] = useState<SchoolClass | null>(null);
  const [classDetails, setClassDetails] = useState<ClassDetails | null>(null);
  const [deletingClass, setDeletingClass] = useState<SchoolClass | null>(null);

  const fetchData = useCallback(async () => {
    if (!user?.branchId) return;
    setLoading(true);
    try {
      // FIX 1: Fetch all necessary data in parallel for maximum efficiency.
      const [classesData, subjectsData, allStaff, feeTemplatesData] =
        await Promise.all([
          apiService.getSchoolClasses(),
          apiService.getSubjects(),
          apiService.getAllStaff(), // Assuming this method exists and fetches all staff for the branch
          apiService.getFeeTemplates(),
        ]);

      // FIX 2: Enrich the class data right after fetching.
      const enrichedClasses = classesData.map((sClass: any) => ({
        ...sClass,
        mentorName:
          allStaff.find((t: User) => t.id === sClass.mentorId)?.name || "N/A",
        feeTemplateName:
          feeTemplatesData.find((ft) => ft.id === sClass.feeTemplateId)?.name ||
          "Unassigned",
        studentCount: sClass._count?.students ?? 0, // Safely access the student count provided by the backend
      }));

      setClasses(
        enrichedClasses.sort(
          (a, b) =>
            a.gradeLevel - b.gradeLevel || a.section.localeCompare(b.section)
        )
      );
      setSubjects(subjectsData);
      setTeachers(allStaff.filter((s: User) => s.role === "Teacher"));
      setFeeTemplates(feeTemplatesData);
    } catch (error) {
      console.error("Failed to fetch class management data:", error);
    } finally {
      setLoading(false);
    }
  }, [user, refreshKey]);


  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = () => {
    setModal(null);
    setSelectedClass(null);
    triggerRefresh();
  };
 const handleSaveAndClose = () => {
   setModal(null);
   setSelectedClass(null);
   triggerRefresh(); // Refresh all data from the server
 };

  const handleViewDetails = async (sClass: SchoolClass) => {
    setLoading(true);
    try {
      // FIX 3: Implement the "View Details" feature.
      const details = await apiService.getClassDetails(sClass.id); // Assuming service method exists
      setClassDetails(details);
      setSelectedClass(sClass as EnrichedSchoolClass);
      setModal("view_details");
    } catch (error) {
      console.error("Failed to fetch class details:", error);
      alert("Could not load class details.");
    } finally {
      setLoading(false);
    }
  };

   const handleDelete = async () => {
     if (!deletingClass) return;
     try {
       await apiService.deleteSchoolClass(deletingClass.id);
       handleSaveAndClose(); // Reuse for cleanup and refresh
     } catch (error: any) {
       alert(error.response?.data?.message || "Failed to delete class.");
     } finally {
       setDeletingClass(null);
     }
   };

  const getMentorName = (teacherId?: string) =>
    teachers.find((t) => t.id === teacherId)?.name || (
      <span className="text-slate-400">Unassigned</span>
    );

  const tabButtonClasses = (isActive: boolean) =>
    `px-4 py-2 text-sm font-medium transition-colors focus:outline-none ${
      isActive
        ? "bg-slate-200 rounded-t-lg font-semibold"
        : "text-text-secondary-dark hover:bg-slate-100"
    }`;

  const [activeTab, setActiveTab] = useState<"classes" | "subjects">("classes");

  return (
    <div>
      <h1 className="text-3xl font-bold text-text-primary-dark mb-6">
        Class & Subject Management
      </h1>
      <div className="flex border-b border-slate-200 mb-4">
        <button
          className={tabButtonClasses(activeTab === "classes")}
          onClick={() => setActiveTab("classes")}
        >
          Manage Classes
        </button>
        <button
          className={tabButtonClasses(activeTab === "subjects")}
          onClick={() => setActiveTab("subjects")}
        >
          Manage Subjects
        </button>
      </div>

      {activeTab === "classes" ? (
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-text-primary-dark">
              Classes
            </h2>
            <Button onClick={() => setModal("create")}>Create New Class</Button>
          </div>
          {loading ? (
            <p>Loading classes...</p>
          ) : (
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left">
                <thead className="border-b sticky top-0 bg-surface-dark">
                  <tr>
                    <th className="p-2">Class Name</th>
                    <th className="p-2 text-center">Students</th>
                    <th className="p-2">Mentor Teacher</th>
                    <th className="p-2">Fee Template</th>
                    <th className="p-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {classes.map((sClass) => (
                    <tr key={sClass.id} className="border-b hover:bg-slate-50">
                      <td className="p-2 font-medium">
                        Grade {sClass.gradeLevel} - {sClass.section}
                      </td>
                      <td className="p-2 text-center">{sClass.studentCount}</td>
                      <td className="p-2">
                        {getMentorName(sClass.mentorTeacherId)}
                      </td>
                      <td className="p-2">
                        {feeTemplates.find(
                          (ft) => ft.id === sClass.feeTemplateId
                        )?.name || (
                          <span className="text-slate-400">Unassigned</span>
                        )}
                      </td>
                      <td className="p-2 text-right">
                        <div className="flex gap-1 justify-end">
                          <Button
                            variant="secondary"
                            className="!px-2 !py-1 text-xs"
                            onClick={() => handleViewDetails(sClass)}
                          >
                            View
                          </Button>
                          <Button
                            variant="secondary"
                            className="!px-2 !py-1 text-xs"
                            onClick={() => {
                              setSelectedClass(sClass);
                              setModal("manage_students");
                            }}
                          >
                            Students
                          </Button>
                          <Button
                            variant="secondary"
                            className="!px-2 !py-1 text-xs"
                            onClick={() => {
                              setSelectedClass(sClass);
                              setModal("manage_subjects");
                            }}
                          >
                            Subjects
                          </Button>
                          <Button
                            variant="secondary"
                            className="!px-2 !py-1 text-xs"
                            onClick={() => {
                              setSelectedClass(sClass);
                              setModal("assign_fee");
                            }}
                          >
                            Fees
                          </Button>
                          <Button
                            variant="secondary"
                            className="!px-2 !py-1 text-xs"
                            onClick={() => {
                              setSelectedClass(sClass);
                              setModal("edit");
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="danger"
                            className="!px-2 !py-1 text-xs"
                            onClick={() => setDeletingClass(sClass)}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      ) : (
        <Card>
          <SubjectManager />
        </Card>
      )}

      {modal === "create" && (
        <CreateClassModal onClose={() => setModal(null)} onSave={handleSave} />
      )}
      {modal === "edit" && selectedClass && (
        <EditClassModal
          schoolClass={selectedClass}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
      {modal === "manage_subjects" && selectedClass && (
        <ManageSubjectsModal
          schoolClass={selectedClass}
          allSubjects={subjects}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
      {modal === "manage_students" && selectedClass && (
        <ManageStudentsModal
          schoolClass={selectedClass}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
      {modal === "assign_fee" && selectedClass && (
        <AssignFeeTemplateModal
          schoolClass={selectedClass}
          feeTemplates={feeTemplates}
          onClose={() => setModal(null)}
          onSave={async (cid, fid) => {
            // FIX: Ensure 'fid' is not null before calling the API.
            if (fid) {
              await apiService.assignFeeTemplateToClass(cid, fid);
            }
            handleSave();
          }}
        />
      )}
      {modal === "view_details" && classDetails && (
        <ClassDetailModal
          classDetails={classDetails}
          teachers={teachers}
          onClose={() => setModal(null)}
        />
      )}
      {deletingClass && (
        <ConfirmationModal
          isOpen={!!deletingClass}
          onClose={() => setDeletingClass(null)}
          onConfirm={handleDelete}
          title="Confirm Class Deletion"
          message={
            <>
              Are you sure you want to delete Grade {deletingClass.gradeLevel} -{" "}
              {deletingClass.section}? All student assignments to this class
              will be removed.
            </>
          }
        />
      )}
    </div>
  );
};

export default ClassManagement;
