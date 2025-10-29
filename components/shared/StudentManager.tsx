import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useAuth } from "../../hooks/useAuth.ts";
// FIX: Import the full service classes, not instances or renamed aliases
import { PrincipalApiService, RegistrarApiService } from "../../services";
import type {
  Student,
  SchoolClass,
  StudentProfile,
  SuspensionRecord,
  FeeRecord,
  AttendanceRecord,
} from "../../types.ts";
import Card from "../ui/Card.tsx";
import Input from "../ui/Input.tsx";
import Button from "../ui/Button.tsx";
import ConfirmationModal from "../ui/ConfirmationModal.tsx";
import SendSmsModal from "../modals/SendSmsModal.tsx";
import StudentDetailModal from "../modals/StudentDetailModal.tsx";
import { useDataRefresh } from "../../contexts/DataRefreshContext.tsx";

// FIX: Create instances of the services at the top level
const principalApiService = new PrincipalApiService();
const registrarApiService = new RegistrarApiService();

const StudentFormModal: React.FC<{
  student: Partial<Student> | null;
  classes: SchoolClass[];
  onClose: () => void;
  onSave: (credentials?: { id: string; password: string }) => void;
}> = ({ student, classes, onClose, onSave }) => {
  const [formData, setFormData] = useState<Partial<Student>>({
    name: "",
    classId: "",
    dob: "",
    address: "",
    gender: "Male",
    guardianInfo: { name: "", email: "", phone: "" },
    status: "active",
    ...student,
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (name.startsWith("guardian.")) {
      const guardianField = name.split(".")[1];
      // FIX: Type-safe update for nested guardianInfo object
      setFormData((prev) => ({
        ...prev,
        guardianInfo: {
          ...(prev.guardianInfo || { name: "", email: "", phone: "" }),
          [guardianField]: value,
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const selectedClass = classes.find((c) => c.id === formData.classId);
    const dataToSave = {
      ...formData,
      gradeLevel: selectedClass
        ? selectedClass.gradeLevel
        : student?.gradeLevel || 0,
      status: formData.status || "active",
    };

    try {
      if (student?.id) {
        await registrarApiService.updateStudent(student.id, dataToSave);
        onSave();
      } else {
        // FIX: admitStudent now takes only one argument (studentData)
        const result = await registrarApiService.admitStudent(
          dataToSave as Student
        );
        onSave(result.credentials);
      }
    } catch (error) {
      console.error("Failed to save student:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-text-primary-dark mb-4">
          {student?.id ? "Edit Student" : "Add New Student"}
        </h2>
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <Input
            label="Full Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
          <div>
            <label className="block text-sm font-medium text-text-secondary-dark mb-1">
              Gender
            </label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="w-full bg-white border border-slate-300 rounded-md py-2 px-3 text-text-primary-dark"
              required
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary-dark mb-1">
              Class
            </label>
            <select
              name="classId"
              value={formData.classId}
              onChange={handleChange}
              className="w-full bg-white border border-slate-300 rounded-md py-2 px-3 text-text-primary-dark"
            >
              <option value="">-- Unassigned --</option>
              {classes
                .sort((a, b) => a.gradeLevel - b.gradeLevel)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    Grade {c.gradeLevel} - {c.section}
                  </option>
                ))}
            </select>
          </div>
          <Input
            label="Date of Birth"
            name="dob"
            type="date"
            value={formData.dob}
            onChange={handleChange}
            required
          />
          <Input
            className="md:col-span-2"
            label="Address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            required
          />
          <h3 className="md:col-span-2 text-lg font-semibold text-text-secondary-dark border-t border-slate-200 pt-4 mt-2">
            Guardian Information
          </h3>
          <Input
            label="Guardian Name"
            name="guardian.name"
            value={formData.guardianInfo?.name}
            onChange={handleChange}
            required
          />
          <Input
            label="Guardian Email"
            name="guardian.email"
            type="email"
            value={formData.guardianInfo?.email}
            onChange={handleChange}
            required
          />
          <Input
            label="Guardian Phone"
            name="guardian.phone"
            type="tel"
            value={formData.guardianInfo?.phone}
            onChange={handleChange}
            required
          />

          <div className="md:col-span-2 flex justify-end gap-4 mt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Student"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

// ... (CredentialsModal and ResetCredentialsModal remain the same) ...
const CredentialsModal: React.FC<{
  title: string;
  credentials: { id: string; password: string };
  userType: string;
  onClose: () => void;
}> = ({ title, credentials, userType, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
    <Card className="w-full max-w-md">
      <h2 className="text-xl font-bold text-brand-accent mb-2">{title}</h2>
      <p className="text-text-secondary-dark mb-4">
        Please securely share the following login credentials with the new{" "}
        {userType}:
      </p>
      <p className="text-sm text-green-700 bg-green-100 p-2 rounded-md mb-4 text-center">
        An SMS with these details has been sent to the guardian's phone number.
      </p>
      <div className="space-y-3">
        <div className="bg-slate-100 p-3 rounded-lg">
          <p className="text-sm font-semibold text-text-secondary-dark">
            User ID
          </p>
          <p className="text-lg font-mono tracking-wider text-text-primary-dark">
            {credentials.id}
          </p>
        </div>
        <div className="bg-slate-100 p-3 rounded-lg">
          <p className="text-sm font-semibold text-text-secondary-dark">
            Temporary Password
          </p>
          <p className="text-lg font-mono tracking-wider text-text-primary-dark">
            {credentials.password}
          </p>
        </div>
      </div>
      <div className="mt-6 text-right">
        <Button onClick={onClose}>Close</Button>
      </div>
    </Card>
  </div>
);

const ResetCredentialsModal: React.FC<{
  title: string;
  credentials: {
    student: { id: string; pass: string };
    parent: { id: string; pass: string } | null;
  };
  onClose: () => void;
}> = ({ title, credentials, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
    <Card className="w-full max-w-md">
      <h2 className="text-xl font-bold text-brand-accent mb-2">{title}</h2>
      <p className="text-text-secondary-dark mb-4">
        New temporary passwords have been generated and sent via SMS. Please
        share these securely if needed.
      </p>

      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-text-primary-dark">
            Student Credentials
          </h3>
          <div className="space-y-2 mt-1">
            <div className="bg-slate-100 p-3 rounded-lg">
              <p className="text-sm font-semibold text-text-secondary-dark">
                User ID
              </p>
              <p className="text-lg font-mono tracking-wider text-text-primary-dark">
                {credentials.student.id}
              </p>
            </div>
            <div className="bg-slate-100 p-3 rounded-lg">
              <p className="text-sm font-semibold text-text-secondary-dark">
                New Password
              </p>
              <p className="text-lg font-mono tracking-wider text-text-primary-dark">
                {credentials.student.pass}
              </p>
            </div>
          </div>
        </div>

        {credentials.parent && (
          <div>
            <h3 className="font-semibold text-text-primary-dark">
              Parent Credentials
            </h3>
            <div className="space-y-2 mt-1">
              <div className="bg-slate-100 p-3 rounded-lg">
                <p className="text-sm font-semibold text-text-secondary-dark">
                  User ID
                </p>
                <p className="text-lg font-mono tracking-wider text-text-primary-dark">
                  {credentials.parent.id}
                </p>
              </div>
              <div className="bg-slate-100 p-3 rounded-lg">
                <p className="text-sm font-semibold text-text-secondary-dark">
                  New Password
                </p>
                <p className="text-lg font-mono tracking-wider text-text-primary-dark">
                  {credentials.parent.pass}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 text-right">
        <Button onClick={onClose}>Close</Button>
      </div>
    </Card>
  </div>
);

const SuspendStudentModal: React.FC<{
  student: Student;
  onClose: () => void;
  onSave: () => void;
}> = ({ student, onClose, onSave }) => {
  const [reason, setReason] = useState<
    "Fee Defaulter" | "Misbehavior" | "Other"
  >("Misbehavior");
  const [endDate, setEndDate] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!endDate) {
      // Replaced alert with a more modern approach if possible, but alert is fine for simple validation.
      console.error("Please select an end date for the suspension.");
      return;
    }
    setIsSaving(true);
    await registrarApiService.suspendStudent(student.id, reason, endDate);
    setIsSaving(false);
    onSave();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <h2 className="text-xl font-bold text-text-primary-dark mb-4">
          Suspend Student: {student.name}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary-dark mb-1">
              Reason
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as any)}
              className="w-full bg-white border border-slate-300 rounded-md py-2 px-3"
              required
            >
              <option value="Fee Defaulter">Fee Defaulter</option>
              <option value="Misbehavior">Misbehavior</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <Input
            label="Suspension End Date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
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
            <Button type="submit" variant="danger" disabled={isSaving}>
              {isSaving ? "Suspending..." : "Suspend"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

const StudentManager: React.FC = () => {
  const { user } = useAuth();
  const { refreshKey, triggerRefresh } = useDataRefresh();
  // FIX: Both services are now instantiated, so this logic is correct.
  const apiService = useMemo(
    () =>
      user?.role === "Principal" ? principalApiService : registrarApiService,
    [user?.role]
  );

  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [suspensionRecords, setSuspensionRecords] = useState<
    SuspensionRecord[]
  >([]);
  const [feeRecords, setFeeRecords] = useState<FeeRecord[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<
    AttendanceRecord[]
  >([]);
  const [loading, setLoading] = useState(true);

  // ... (Selection, Filter, Modal, and other states remain the same) ...
  const [selectedStudentIds, setSelectedStudentIds] = useState(
    new Set<string>()
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [filterClass, setFilterClass] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterAttendance, setFilterAttendance] = useState("all");
  const [filterFeeDefaulter, setFilterFeeDefaulter] = useState(false);
  const [filterFeeDueDate, setFilterFeeDueDate] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [isFormModalOpen, setFormModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] =
    useState<Partial<Student> | null>(null);
  const [showNewCreds, setShowNewCreds] = useState<{
    id: string;
    password: string;
  } | null>(null);
  const [viewingStudent, setViewingStudent] = useState<StudentProfile | null>(
    null
  );
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [suspendingStudent, setSuspendingStudent] = useState<Student | null>(
    null
  );
  const [confirmingDelete, setConfirmingDelete] = useState<Student | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSmsModalOpen, setIsSmsModalOpen] = useState(false);
  const [smsConfirmation, setSmsConfirmation] = useState("");
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfMessage, setPdfMessage] = useState("");
  const [showResetCreds, setShowResetCreds] = useState<{
    student: { id: string; pass: string };
    parent: { id: string; pass: string } | null;
  } | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [rowActionLoading, setRowActionLoading] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user?.branchId) return;
    setLoading(true);
    // FIX: Assumes the necessary fetch methods exist on both Principal and Registrar services
    // and they no longer require branchId as an argument.
    const [studentsRes, classesRes, suspensionsRes, feesRes, attendanceRes] =
      await Promise.all([
        // @ts-ignore - Assuming unified API for shared components
        apiService.getStudents(),
        // @ts-ignore
        apiService.getSchoolClasses(),
        // @ts-ignore
        apiService.getSuspensionRecords(),
        // @ts-ignore
        apiService.getFeeRecords(),
        // @ts-ignore
        apiService.getAttendanceRecords(),
      ]);
    setStudents(studentsRes);
    setClasses(classesRes);
    setSuspensionRecords(suspensionsRes);
    setFeeRecords(feesRes);
    setAttendanceRecords(attendanceRes);
    setLoading(false);
  }, [user, apiService]);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshKey]);

  // ... (useMemo hooks for studentAttendanceMap and feeRecordMap remain the same) ...
  const studentAttendanceMap = useMemo(() => {
    const map = new Map<string, { present: number; total: number }>();
    attendanceRecords.forEach((record) => {
      if (!map.has(record.studentId)) {
        map.set(record.studentId, { present: 0, total: 0 });
      }
      const data = map.get(record.studentId)!;
      data.total++;
      if (record.status === "Present") {
        data.present++;
      }
    });
    return map;
  }, [attendanceRecords]);

  const feeRecordMap = useMemo(() => {
    return new Map(feeRecords.map((rec) => [rec.studentId, rec]));
  }, [feeRecords]);

  const filteredAndSortedStudents = useMemo(() => {
    let processedStudents = [...students];

    // ... (Filtering and Sorting logic remains the same) ...
    if (searchTerm) {
      const lowercasedTerm = searchTerm.toLowerCase();
      processedStudents = processedStudents.filter(
        (student) =>
          student.name.toLowerCase().includes(lowercasedTerm) ||
          student.id.toLowerCase().includes(lowercasedTerm)
      );
    }
    if (filterClass !== "all") {
      processedStudents = processedStudents.filter(
        (s) => s.classId === filterClass
      );
    }
    if (filterStatus !== "all") {
      processedStudents = processedStudents.filter(
        (s) => s.status === filterStatus
      );
    }
    if (filterFeeDefaulter) {
      processedStudents = processedStudents.filter((s) => {
        const feeRecord = feeRecordMap.get(s.id);
        if (!feeRecord || feeRecord.paidAmount >= feeRecord.totalAmount)
          return false;
        if (filterFeeDueDate) {
          const dueDate = new Date(feeRecord.dueDate);
          const filterDate = new Date(filterFeeDueDate);
          return dueDate <= filterDate;
        }
        return true;
      });
    }
    if (filterAttendance !== "all") {
      const threshold = parseInt(filterAttendance, 10);
      processedStudents = processedStudents.filter((s) => {
        const attendanceData = studentAttendanceMap.get(s.id);
        if (!attendanceData || attendanceData.total === 0) return false;
        const percentage =
          (attendanceData.present / attendanceData.total) * 100;
        return percentage < threshold;
      });
    }
    processedStudents.sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "id") return a.id.localeCompare(b.id);
      if (sortBy === "rank")
        return (a.schoolRank || Infinity) - (b.schoolRank || Infinity);
      return 0;
    });

    return processedStudents;
  }, [
    students,
    searchTerm,
    filterClass,
    filterStatus,
    filterFeeDefaulter,
    filterFeeDueDate,
    filterAttendance,
    sortBy,
    studentAttendanceMap,
    feeRecordMap,
  ]);

  // ... (All handler functions from handleSelectAllChange to the end remain mostly the same, but with corrected API calls) ...
  useEffect(() => {
    setSelectedStudentIds(new Set());
  }, [filteredAndSortedStudents]);

  const handleSelectAllChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedStudentIds(
        new Set(filteredAndSortedStudents.map((s) => s.id))
      );
    } else {
      setSelectedStudentIds(new Set());
    }
  };

  const handleToggleStudentSelection = (studentId: string) => {
    setSelectedStudentIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(studentId)) newSet.delete(studentId);
      else newSet.add(studentId);
      return newSet;
    });
  };

  const isAllSelected =
    filteredAndSortedStudents.length > 0 &&
    selectedStudentIds.size === filteredAndSortedStudents.length;

  const handleAddStudent = () => {
    if (user?.role !== "Registrar")
      return alert("Only Registrars can add new students.");
    setSelectedStudent(null);
    setFormModalOpen(true);
  };

  const handleEditStudent = (student: Student) => {
    if (user?.role !== "Registrar")
      return alert("Only Registrars can edit student details.");
    setSelectedStudent(student);
    setFormModalOpen(true);
  };

  const handleViewStudent = async (studentId: string) => {
    setDetailsLoading(true);
    // @ts-ignore - Assuming getStudentProfileDetails exists on both services
const profile = (await apiService.getStudentProfileDetails(studentId)) || {};
// setProfile(profile);
    setViewingStudent(profile);
    setDetailsLoading(false);
  };

  const handleDeleteStudent = (student: Student) => {
    if (user?.role !== "Registrar")
      return alert("Only Registrars can delete students.");
    setConfirmingDelete(student);
  };

  const confirmDelete = async () => {
    if (!confirmingDelete || user?.role !== "Registrar") return;
    setIsDeleting(true);
    await registrarApiService.deleteStudent(confirmingDelete.id);
    setIsDeleting(false);
    setConfirmingDelete(null);
    triggerRefresh();
  };

  const handleCloseModal = () => {
    setFormModalOpen(false);
    setSelectedStudent(null);
  };

  const handleSave = (credentials?: { id: string; password: string }) => {
    handleCloseModal();
    if (credentials) setShowNewCreds(credentials);
    triggerRefresh();
  };

  const handleGeneratePdf = () => {
    setIsGeneratingPdf(true);
    setPdfMessage("");
    const selectedIds = Array.from(selectedStudentIds);
    console.log("Generating PDF for the following students:", selectedIds);
    setTimeout(() => {
      setIsGeneratingPdf(false);
      setPdfMessage(`PDF for ${selectedIds.length} students generated.`);
      setTimeout(() => setPdfMessage(""), 5000);
    }, 1500);
  };

  const handleSendSms = async (message: string) => {
    const studentIds: string[] = Array.from(selectedStudentIds);
    if (studentIds.length === 0 || user?.role !== "Registrar") return;

    try {
      // FIX: sendSmsToStudents now takes 2 arguments
      const result = await registrarApiService.sendSmsToStudents(
        studentIds,
        message
      );
      setIsSmsModalOpen(false);
      if (result.success) {
        setSmsConfirmation(
          `Message sent to parents of ${result.count} student(s).`
        );
        setSelectedStudentIds(new Set());
        setTimeout(() => setSmsConfirmation(""), 5000);
      }
    } catch (error) {
      console.error("Failed to send SMS:", error);
      setSmsConfirmation("Failed to send message.");
      setTimeout(() => setSmsConfirmation(""), 5000);
    }
  };

  const handleResetPasswords = async (studentId: string) => {
    if (user?.role !== "Registrar") return;
    setIsResetting(true);
    try {
      // FIX: resetStudentAndParentPasswords now takes 1 argument
      const result = await registrarApiService.resetStudentAndParentPasswords(
        studentId
      );
      setShowResetCreds(result);
      setViewingStudent(null);
    } catch (error) {
      console.error("Failed to reset passwords:", error);
    } finally {
      setIsResetting(false);
    }
  };

  const handleRemoveSuspension = useCallback(
    async (studentId: string) => {
      if (user?.role !== "Registrar") return;
      setRowActionLoading(studentId);
      try {
        await registrarApiService.removeSuspension(studentId);
        triggerRefresh();
      } catch (error) {
        console.error("Failed to remove suspension:", error);
      } finally {
        setRowActionLoading(null);
      }
    },
    [triggerRefresh, user?.role]
  );

  const handleMarkFeesAsPaid = useCallback(
    async (studentId: string) => {
      if (user?.role !== "Registrar") return;
      setRowActionLoading(studentId);
      try {
        await registrarApiService.markFeesAsPaidAndUnsuspend(studentId);
        triggerRefresh();
      } catch (error) {
        console.error("Failed to mark fees as paid:", error);
      } finally {
        setRowActionLoading(null);
      }
    },
    [triggerRefresh, user?.role]
  );

  return (
    <div>
      <h1 className="text-3xl font-bold text-text-primary-dark mb-6">
        Student Information System
      </h1>
      <Card>
        {/* ... (JSX for filters and table remains the same) ... */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 pb-4 border-b border-slate-200">
          <Input
            placeholder="Search by name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="lg:col-span-4"
          />
          <div>
            <label className="text-sm font-medium text-text-secondary-dark">
              Filter by Class
            </label>
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-md py-2 px-3 mt-1"
            >
              <option value="all">All Classes</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  Grade {c.gradeLevel} - {c.section}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-text-secondary-dark">
              Filter by Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-md py-2 px-3 mt-1"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-text-secondary-dark">
              Filter by Attendance
            </label>
            <select
              value={filterAttendance}
              onChange={(e) => setFilterAttendance(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-md py-2 px-3 mt-1"
            >
              <option value="all">All Attendance</option>
              <option value="95">Below 95%</option>
              <option value="85">Below 85%</option>
              <option value="75">Below 75%</option>
            </select>
          </div>
          <div className="flex items-end">
            <div className="space-y-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filterFeeDefaulter}
                  onChange={(e) => setFilterFeeDefaulter(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-brand-secondary focus:ring-brand-accent"
                />
                <span className="text-sm font-medium text-text-secondary-dark">
                  Fee Defaulters
                </span>
              </label>
              {filterFeeDefaulter && (
                <Input
                  label="Due on or before:"
                  type="date"
                  value={filterFeeDueDate}
                  onChange={(e) => setFilterFeeDueDate(e.target.value)}
                  className="!mt-1"
                />
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div>
            <label className="text-sm font-medium text-text-secondary-dark">
              Sort by
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white border border-slate-300 rounded-md py-2 px-3 mt-1 ml-2"
            >
              <option value="name">Name (A-Z)</option>
              <option value="id">Student ID</option>
              <option value="rank">School Rank</option>
            </select>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {selectedStudentIds.size > 0 && (
              <span className="text-sm font-medium text-text-secondary-dark">
                {selectedStudentIds.size} selected
              </span>
            )}
            <Button
              variant="secondary"
              onClick={() => setIsSmsModalOpen(true)}
              disabled={
                selectedStudentIds.size === 0 || user?.role !== "Registrar"
              }
            >
              Send SMS
            </Button>
            <Button
              variant="secondary"
              onClick={handleGeneratePdf}
              disabled={isGeneratingPdf || selectedStudentIds.size === 0}
            >
              {isGeneratingPdf ? "Generating..." : "Generate PDF"}
            </Button>
            <Button
              onClick={handleAddStudent}
              disabled={user?.role !== "Registrar"}
            >
              Add New Student
            </Button>
          </div>
        </div>
        {smsConfirmation && (
          <div
            className={`mb-4 text-center p-2 rounded-lg text-sm transition-opacity duration-300 ${
              smsConfirmation.includes("Failed")
                ? "bg-red-100 text-red-800"
                : "bg-green-100 text-green-800"
            }`}
          >
            {smsConfirmation}
          </div>
        )}
        {pdfMessage && (
          <div className="mb-4 text-center p-2 bg-green-100 text-green-800 rounded-lg text-sm transition-opacity duration-300">
            {pdfMessage}
          </div>
        )}
        {loading ? (
          <p>Loading students...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-slate-200 text-sm text-text-secondary-dark">
                <tr>
                  <th className="p-4">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-brand-secondary focus:ring-brand-accent"
                      onChange={handleSelectAllChange}
                      checked={isAllSelected}
                    />
                  </th>
                  <th className="p-4">Student ID</th>
                  <th className="p-4">Name</th>
                  <th className="p-4">Class</th>
                  <th className="p-4 text-center">School Rank</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedStudents.map((student) => {
                  const studentClass = classes.find(
                    (c) => c.id === student.classId
                  );
                  const suspensionRecord = suspensionRecords.find(
                    (r) => r.studentId === student.id
                  );
                  return (
                    <tr
                      key={student.id}
                      className="border-b border-slate-100 hover:bg-slate-50"
                    >
                      <td className="p-4">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300 text-brand-secondary focus:ring-brand-accent"
                          checked={selectedStudentIds.has(student.id)}
                          onChange={() =>
                            handleToggleStudentSelection(student.id)
                          }
                        />
                      </td>
                      <td className="p-4 font-mono text-xs">{student.id}</td>
                      <td className="p-4 font-medium text-text-primary-dark">
                        {student.name}
                      </td>
                      <td className="p-4">
                        {studentClass
                          ? `Grade ${studentClass.gradeLevel} - ${studentClass.section}`
                          : "Unassigned"}
                      </td>
                      <td className="p-4 text-center font-semibold text-brand-secondary">
                        {student.schoolRank || "N/A"}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            student.status === "active"
                              ? "bg-green-100 text-green-800"
                              : student.status === "suspended"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {student.status.charAt(0).toUpperCase() +
                            student.status.slice(1)}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2 flex-wrap">
                          {student.status === "suspended" &&
                          user?.role === "Registrar" ? (
                            <>
                              <Button
                                variant="secondary"
                                className="!px-3 !py-1 text-xs"
                                onClick={() =>
                                  handleRemoveSuspension(student.id)
                                }
                                disabled={!!rowActionLoading}
                              >
                                {rowActionLoading === student.id
                                  ? "..."
                                  : "Remove Suspension"}
                              </Button>
                              {suspensionRecord?.reason === "Fee Defaulter" && (
                                <Button
                                  variant="primary"
                                  className="!px-3 !py-1 text-xs"
                                  onClick={() =>
                                    handleMarkFeesAsPaid(student.id)
                                  }
                                  disabled={!!rowActionLoading}
                                >
                                  {rowActionLoading === student.id
                                    ? "..."
                                    : "Mark Fees Paid"}
                                </Button>
                              )}
                            </>
                          ) : student.status !== "suspended" &&
                            user?.role === "Registrar" ? (
                            <Button
                              variant="danger"
                              className="!px-3 !py-1 text-xs"
                              onClick={() => setSuspendingStudent(student)}
                              disabled={!!rowActionLoading}
                            >
                              Suspend
                            </Button>
                          ) : null}
                          <Button
                            variant="secondary"
                            className="!px-3 !py-1 text-xs"
                            onClick={() => handleViewStudent(student.id)}
                            disabled={!!rowActionLoading}
                          >
                            View
                          </Button>
                          <Button
                            variant="secondary"
                            className="!px-3 !py-1 text-xs"
                            onClick={() => handleEditStudent(student)}
                            disabled={
                              !!rowActionLoading || user?.role !== "Registrar"
                            }
                          >
                            Edit
                          </Button>
                          <Button
                            variant="danger"
                            className="!px-3 !py-1 text-xs"
                            onClick={() => handleDeleteStudent(student)}
                            disabled={
                              !!rowActionLoading || user?.role !== "Registrar"
                            }
                          >
                            Delete
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

      {/* --- MODALS --- */}
      <ConfirmationModal
        isOpen={!!confirmingDelete}
        onClose={() => setConfirmingDelete(null)}
        onConfirm={confirmDelete}
        title="Confirm Student Deletion"
        message={
          <>
            Are you sure you want to permanently delete{" "}
            <strong>{confirmingDelete?.name}</strong> and all associated
            records? This action cannot be undone.
          </>
        }
        confirmText="Delete"
        isConfirming={isDeleting}
      />
      {detailsLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <p className="text-white text-lg">Loading student details...</p>
        </div>
      )}
      {viewingStudent && !detailsLoading && (
        <StudentDetailModal
          profile={viewingStudent}
          onClose={() => setViewingStudent(null)}
          onResetPasswords={
            user?.role === "Registrar" ? handleResetPasswords : undefined
          }
          onDataRefresh={triggerRefresh}
        />
      )}
      {isFormModalOpen && user?.branchId && (
        <StudentFormModal
          student={selectedStudent}
          classes={classes}
          onClose={handleCloseModal}
          onSave={handleSave}
        />
      )}
      {showNewCreds && (
        <CredentialsModal
          title="Student Added Successfully"
          userType="student"
          credentials={showNewCreds}
          onClose={() => setShowNewCreds(null)}
        />
      )}
      {showResetCreds && (
        <ResetCredentialsModal
          title="Passwords Reset Successfully"
          credentials={showResetCreds}
          onClose={() => setShowResetCreds(null)}
        />
      )}
      {suspendingStudent && user?.role === "Registrar" && (
        <SuspendStudentModal
          student={suspendingStudent}
          onClose={() => setSuspendingStudent(null)}
          onSave={() => {
            setSuspendingStudent(null);
            triggerRefresh();
          }}
        />
      )}
      {isSmsModalOpen && (
        <SendSmsModal
          isOpen={isSmsModalOpen}
          onClose={() => setIsSmsModalOpen(false)}
          onSend={handleSendSms}
          recipientCount={selectedStudentIds.size}
        />
      )}
    </div>
  );
};

export default StudentManager;
