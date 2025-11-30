import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useAuth } from "../../hooks/useAuth.ts";
import { PrincipalApiService, SharedApiService } from "../../services";
import type {
  Teacher,
  Subject,
  FacultyApplication,
  User,
  TeacherProfile,
} from "../../types.ts";
import Card from "../../components/ui/Card.tsx";
import Button from "../../components/ui/Button.tsx";
import Input from "../../components/ui/Input.tsx";
import { useDataRefresh } from "../../contexts/DataRefreshContext.tsx";
import ConfirmationModal from "../../components/ui/ConfirmationModal.tsx";
import FacultyDetailModal from "../../components/modals/FacultyDetailModal.tsx";

// API Services
const principalApiService = new PrincipalApiService();
const sharedApiService = new SharedApiService();

// --- MODALS ---

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
        Please securely share the following login credentials with the{" "}
        {userType}:
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
            New Password
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

const ApproveApplicationModal: React.FC<{
  application: FacultyApplication;
  onClose: () => void;
  onConfirm: (salary: number) => void;
  isConfirming: boolean;
}> = ({ application, onClose, onConfirm, isConfirming }) => {
  const [salary, setSalary] = useState("");
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <h2 className="text-xl font-bold mb-2">Approve Faculty Application</h2>
        <p className="text-text-secondary-dark mb-4">
          You are approving <strong>{application.name}</strong>. Please set
          their monthly salary to complete the process.
        </p>
        <Input
          label="Monthly Salary"
          type="number"
          value={salary}
          onChange={(e) => setSalary(e.target.value)}
          placeholder="e.g., 50000"
          required
        />
        <div className="flex justify-end gap-4 pt-6">
          <Button variant="secondary" onClick={onClose} disabled={isConfirming}>
            Cancel
          </Button>
          <Button
            onClick={() => onConfirm(Number(salary))}
            disabled={isConfirming || !salary}
          >
            {isConfirming ? "Approving..." : "Approve & Create Account"}
          </Button>
        </div>
      </Card>
    </div>
  );
};

const AddEditStaffModal: React.FC<{
  staff?: User | null;
  onClose: () => void;
  onSave: (creds?: { id: string; password: string }) => void;
}> = ({ staff, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: staff?.name || "",
    email: staff?.email || "",
    phone: staff?.phone || "",
    role: (staff?.role as string) || "Registrar",
    designation: staff?.designation || "",
    salary: staff?.salary || 0,
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (staff) {
        // Edit Mode
        // FIX 1: Cast formData to 'any' to resolve the 'role' string vs UserRole type mismatch
        await principalApiService.updateUser(staff.id, formData as any);
        onSave();
      } else {
        // Create Mode
        const result = await principalApiService.createStaffMember({
          ...formData,
          salary: Number(formData.salary),
          role: formData.role as any,
        });

        // FIX 2: Map backend's 'username' to the expected 'id' prop
        onSave({
          id: result.credentials.username,
          password: result.credentials.password,
        });
      }
    } catch (error) {
      console.error(error);
      alert("Operation failed.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4">
      <Card className="w-full max-w-lg">
        <h2 className="text-xl font-bold mb-4">
          {staff ? "Edit Staff Member" : "Add New Staff Member"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
          <Input
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <Input
            label="Phone"
            name="phone"
            value={formData.phone || ""}
            onChange={handleChange}
            required
          />

          <div>
            <label className="block text-sm font-medium text-text-secondary-dark mb-1">
              Role
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              disabled={!!staff} // Prevent changing role on edit
              className="w-full bg-white border border-slate-300 rounded-md py-2 px-3"
            >
              <option value="Registrar">Registrar</option>
              <option value="Librarian">Librarian</option>
              <option value="SupportStaff">Support Staff</option>
            </select>
          </div>

          {formData.role === "SupportStaff" && (
            <Input
              label="Designation"
              name="designation"
              value={formData.designation}
              onChange={handleChange}
              placeholder="e.g. Security Guard"
            />
          )}

          <Input
            label="Monthly Salary"
            name="salary"
            type="number"
            value={String(formData.salary)}
            onChange={handleChange}
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
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};


const EditTeacherModal: React.FC<{
  teacher: Teacher;
  allSubjects: Subject[];
  onClose: () => void;
  onSave: () => void;
}> = ({ teacher, allSubjects, onClose, onSave }) => {
  // Initialize form with existing teacher data
  const [formData, setFormData] = useState<Partial<Teacher>>({
    name: teacher.name,
    qualification: teacher.qualification,
    email: teacher.email,
    phone: teacher.phone,
    // Add other fields if necessary
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      // Use principalApiService to update the teacher
      // Ensure you have: const principalApiService = new PrincipalApiService(); at top of file
      await principalApiService.updateTeacher(teacher.id, formData);
      onSave();
    } catch (error) {
      console.error("Failed to update teacher:", error);
      alert("Failed to update teacher profile.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4">
      <Card className="w-full max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Edit Teacher: {teacher.name}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              name="name"
              value={formData.name || ""}
              onChange={handleChange}
              required
            />
            <Input
              label="Qualification"
              name="qualification"
              value={formData.qualification || ""}
              onChange={handleChange}
              required
            />
            <Input
              label="Email"
              name="email"
              type="email"
              value={formData.email || ""}
              onChange={handleChange}
              required
            />
            <Input
              label="Phone"
              name="phone"
              value={formData.phone || ""}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary-dark mb-1">
              Subject Assignments
            </label>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded text-sm text-slate-600 text-center">
              To modify subject assignments, please use the{" "}
              <strong>Class Management</strong> section.
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t mt-4">
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

const FacultyManagement: React.FC = () => {
  const { user } = useAuth();
  const { refreshKey, triggerRefresh } = useDataRefresh();

  // State
  const [teachers, setTeachers] = useState<User[]>([]);
  const [supportStaff, setSupportStaff] = useState<User[]>([]);
  const [applications, setApplications] = useState<FacultyApplication[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "roster" | "support" | "applications"
  >("roster");
  const [statusMessage, setStatusMessage] = useState("");

  // Modals & Actions State
  const [modal, setModal] = useState<"addStaff" | "editStaff" | null>(null);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<User | null>(
    null
  );

  const [approvingApp, setApprovingApp] = useState<FacultyApplication | null>(
    null
  );
  const [suspendingStaff, setSuspendingStaff] = useState<User | null>(null);
  const [deletingStaff, setDeletingStaff] = useState<User | null>(null);
  const [resettingPasswordFor, setResettingPasswordFor] = useState<User | null>(
    null
  );

  const [viewingProfile, setViewingProfile] = useState<TeacherProfile | null>(
    null
  );
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [newCredentials, setNewCredentials] = useState<{
    id: string;
    password: string;
  } | null>(null);

  const [isActionLoading, setIsActionLoading] = useState(false);

  // Data Fetching
  const fetchData = useCallback(async () => {
    if (!user?.branchId) return;
    setLoading(true);
    try {
      const [allStaff, applicationData, subjectData] = await Promise.all([
        principalApiService.getStaff(),
        principalApiService.getFacultyApplications(),
        // Assuming getSubjects exists on shared. If not, remove or use empty array
        // sharedApiService.getSubjectsByBranch(user.branchId).catch(() => [])
        Promise.resolve([] as Subject[]),
      ]);

      // Split staff into Teachers and Others
      setTeachers(allStaff.filter((u) => u.role === "Teacher"));
      setSupportStaff(
        allStaff.filter((u) => u.role !== "Teacher" && u.role !== "Principal")
      );

      setApplications(
        applicationData.sort(
          (a, b) =>
            new Date(b.submittedAt).getTime() -
            new Date(a.submittedAt).getTime()
        )
      );
      setSubjects(subjectData);
    } catch (err) {
      console.error("Failed to load data", err);
    } finally {
      setLoading(false);
    }
  }, [user, refreshKey]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- HANDLERS ---

  const handleApproveApplication = async (salary: number) => {
    if (!approvingApp) return;
    setIsActionLoading(true);
    try {
      const result = await principalApiService.approveFacultyApplication(
        approvingApp.id,
        salary
      );
      setNewCredentials({
        id: result.credentials.username,
        password: result.credentials.password,
      });
      setApprovingApp(null);
      triggerRefresh();
    } catch (error) {
      console.error("Failed to approve:", error);
      alert("Failed to approve application");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRejectApplication = async (id: string) => {
    setIsActionLoading(true);
    try {
      await principalApiService.rejectFacultyApplication(id);
      triggerRefresh();
    } catch (e) {
      alert("Failed to reject");
    }
    setIsActionLoading(false);
  };

  const handleStaffSave = (credentials?: { id: string; password: string }) => {
    setModal(null);
    setSelectedUserForEdit(null);
    if (credentials) {
      setNewCredentials(credentials);
    }
    setStatusMessage("Operation successful!");
    setTimeout(() => setStatusMessage(""), 3000);
    triggerRefresh();
  };

  // FIX: Flexible handler that accepts either a User object or a string ID
  const handleResetPassword = async (teacherOrId: User | string) => {
    const teacherId =
      typeof teacherOrId === "string" ? teacherOrId : teacherOrId.id;

    // If passed an object, use it for loading state UI
    if (typeof teacherOrId !== "string") {
      setResettingPasswordFor(teacherOrId);
    }

    try {
      const { userId, newPassword } =
        await principalApiService.resetUserPassword(teacherId);
      setNewCredentials({ id: userId, password: newPassword });

      // If we were viewing a profile modal, close it
      setViewingProfile(null);
    } catch (error) {
      console.error("Failed to reset password", error);
      alert("Failed to reset password. Please try again.");
    }
    setResettingPasswordFor(null);
  };

  const handleDelete = async () => {
    if (!deletingStaff) return;
    setIsActionLoading(true);
    try {
      await principalApiService.deleteStaff(deletingStaff.id);
      setDeletingStaff(null);
      triggerRefresh();
    } catch (e) {
      alert("Failed to delete");
    }
    setIsActionLoading(false);
  };

  const handleToggleSuspension = async () => {
    if (!suspendingStaff) return;
    setIsActionLoading(true);
    try {
      if (suspendingStaff.status === "active") {
        await principalApiService.suspendStaff(suspendingStaff.id);
      } else {
        await principalApiService.reinstateStaff(suspendingStaff.id);
      }
      setSuspendingStaff(null);
      triggerRefresh();
    } catch (e) {
      alert("Action failed");
    }
    setIsActionLoading(false);
  };

  const handleViewProfile = async (teacherId: string) => {
    setDetailsLoading(true);
    try {
      // Important: teacherId here refers to the User ID from the staff table
      const profile = await principalApiService.getTeacherProfileDetails(
        teacherId
      );
      setViewingProfile(profile);
    } catch (e) {
      console.error(e);
      alert("Failed to load profile");
    }
    setDetailsLoading(false);
  };

  const handleUpdateSalary = async (teacherId: string, newSalary: number) => {
    // teacherId here is the internal Teacher UUID
    await principalApiService.updateTeacher(teacherId, { salary: newSalary });
    triggerRefresh();
    // Close modal or refresh it? For now close it.
    setViewingProfile(null);
  };

  // Helpers
  const getStatusChip = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
      case "active":
        return "bg-green-100 text-green-800";
      case "rejected":
      case "suspended":
        return "bg-red-100 text-red-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  const tabButtonClasses = (isActive: boolean) =>
    `px-4 py-2 text-sm font-medium transition-colors focus:outline-none ${
      isActive
        ? "bg-slate-200 rounded-t-lg font-semibold"
        : "text-text-secondary-dark hover:bg-slate-100"
    }`;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-text-primary-dark">
          Faculty & Staff Management
        </h1>
      </div>

      {/* PENDING APPLICATIONS CARD */}
      <Card className="mb-6">
        <h2 className="text-xl font-semibold text-text-primary-dark mb-4">
          Pending Faculty Applications
        </h2>
        {loading ? (
          <p>Loading...</p>
        ) : applications.filter((a) => a.status === "Pending").length === 0 ? (
          <p className="text-center text-text-secondary-dark p-4">
            No pending applications.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b">
                <tr>
                  <th className="p-2">Name</th>
                  <th className="p-2">Qualification</th>
                  <th className="p-2">Submitted By</th>
                  <th className="p-2"></th>
                </tr>
              </thead>
              <tbody>
                {applications
                  .filter((a) => a.status === "Pending")
                  .map((app) => (
                    <tr key={app.id} className="border-b">
                      <td className="p-2 font-medium">{app.name}</td>
                      <td className="p-2">{app.qualification}</td>
                      <td className="p-2">{app.submittedBy}</td>
                      <td className="p-2 text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            onClick={() => setApprovingApp(app)}
                            disabled={isActionLoading}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="danger"
                            onClick={() => handleRejectApplication(app.id)}
                            disabled={isActionLoading}
                          >
                            Reject
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

      {/* STAFF TABS CARD */}
      <Card>
        <div className="flex justify-between items-center mb-4 pb-4 border-b">
          <div className="flex border-b">
            <button
              className={tabButtonClasses(activeTab === "roster")}
              onClick={() => setActiveTab("roster")}
            >
              Faculty Roster
            </button>
            <button
              className={tabButtonClasses(activeTab === "support")}
              onClick={() => setActiveTab("support")}
            >
              Support Staff
            </button>
          </div>
          <Button
            onClick={() => {
              setSelectedUserForEdit(null);
              setModal("addStaff");
            }}
          >
            Add New Staff
          </Button>
        </div>

        {statusMessage && (
          <p className="text-center text-green-600 mb-4">{statusMessage}</p>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b">
              <tr>
                <th className="p-4">Name</th>
                <th className="p-4">ID</th>
                {activeTab === "roster" && (
                  <th className="p-4">Qualification</th>
                )}
                {activeTab === "support" && (
                  <th className="p-4">Designation</th>
                )}
                <th className="p-4">Contact</th>
                <th className="p-4">Status</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody>
              {(activeTab === "roster" ? teachers : supportStaff).map((t) => (
                <tr key={t.id} className="border-b">
                  <td className="p-4 font-medium">{t.name}</td>
                  <td className="p-4 font-mono text-xs">{t.userId}</td>

                  {activeTab === "roster" && (
                    <td className="p-4 text-sm">
                      {t.teacher?.qualification || "N/A"}
                    </td>
                  )}
                  {activeTab === "support" && (
                    <td className="p-4 text-sm">{t.designation || "N/A"}</td>
                  )}

                  <td className="p-4 text-xs">
                    {t.email}
                    <br />
                    {t.phone}
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusChip(
                        t.status
                      )}`}
                    >
                      {t.status || "Active"}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex gap-2 justify-end">
                      {activeTab === "roster" && (
                        <Button
                          variant="secondary"
                          className="!px-2 !py-1 text-xs"
                          onClick={() => handleViewProfile(t.id)}
                        >
                          View
                        </Button>
                      )}
                      <Button
                        variant="secondary"
                        className="!px-2 !py-1 text-xs"
                        onClick={() => {
                          setSelectedUserForEdit(t);
                          setModal("editStaff");
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="secondary"
                        className="!px-2 !py-1 text-xs"
                        onClick={() => setSuspendingStaff(t)}
                      >
                        {t.status === "suspended" ? "Reinstate" : "Suspend"}
                      </Button>
                      <Button
                        variant="danger"
                        className="!px-2 !py-1 text-xs"
                        onClick={() => setDeletingStaff(t)}
                      >
                        Delete
                      </Button>
                      <Button
                        variant="danger"
                        className="!px-2 !py-1 text-xs"
                        onClick={() => handleResetPassword(t)}
                        disabled={!!resettingPasswordFor}
                      >
                        Reset PW
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* MODALS */}
      {(modal === "addStaff" || modal === "editStaff") && (
        <AddEditStaffModal
          staff={selectedUserForEdit}
          onClose={() => setModal(null)}
          onSave={handleStaffSave}
        />
      )}

      {approvingApp && (
        <ApproveApplicationModal
          application={approvingApp}
          onClose={() => setApprovingApp(null)}
          onConfirm={handleApproveApplication}
          isConfirming={isActionLoading}
        />
      )}

      {suspendingStaff && (
        <ConfirmationModal
          isOpen={true}
          onClose={() => setSuspendingStaff(null)}
          onConfirm={handleToggleSuspension}
          title={`Confirm ${
            suspendingStaff.status === "active" || !suspendingStaff.status
              ? "Suspension"
              : "Reinstatement"
          }`}
          message={`Are you sure you want to ${
            suspendingStaff.status === "active" || !suspendingStaff.status
              ? "suspend"
              : "reinstate"
          } ${suspendingStaff.name}?`}
          isConfirming={isActionLoading}
        />
      )}

      {deletingStaff && (
        <ConfirmationModal
          isOpen={true}
          onClose={() => setDeletingStaff(null)}
          onConfirm={handleDelete}
          title="Confirm Deletion"
          message={`Are you sure you want to delete ${deletingStaff.name}? This cannot be undone.`}
          isConfirming={isActionLoading}
          confirmVariant="danger"
        />
      )}

      {newCredentials && (
        <CredentialsModal
          title="Credentials Generated"
          credentials={newCredentials}
          userType="Staff Member"
          onClose={() => setNewCredentials(null)}
        />
      )}

      {viewingProfile && !detailsLoading && (
        <FacultyDetailModal
          profile={viewingProfile}
          onClose={() => setViewingProfile(null)}
          // FIX: Pass the flexible handler here
          onResetPassword={(teacherId) => handleResetPassword(teacherId)}
          onUpdateSalary={handleUpdateSalary}
        />
      )}

      {detailsLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <p className="text-white text-lg">Loading Profile...</p>
        </div>
      )}
    </div>
  );
};

export default FacultyManagement;
