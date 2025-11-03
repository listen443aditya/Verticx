// pages/registrar/AdmissionsManagement.tsx
import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../hooks/useAuth";
import type {
  Application,
  SchoolClass,
  Student,
  Teacher,
  Subject,
} from "../../types";
// instantiate the registrar service class directly (no broken barrel import)
import { RegistrarApiService } from "../../services/registrarApiService";
const apiService = new RegistrarApiService();

import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import { useDataRefresh } from "../../contexts/DataRefreshContext";

/* -------------------------------------------------------------------------- */
/* Small modal components (Credentials, Admit Student, Admit Teacher)        */
/* Kept small and self-contained so the page compiles cleanly                */
/* -------------------------------------------------------------------------- */

const CredentialsModal: React.FC<{
  credentials: { id: string; password: string };
  userType: "Student" | "Teacher";
  onClose: () => void;
}> = ({ credentials, userType, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <h2 className="text-xl font-bold mb-2">Admission Successful!</h2>
        <p className="text-sm text-text-secondary-dark mb-4">
          The {userType.toLowerCase()} has been created. Share these credentials
          securely.
        </p>
        <div className="space-y-3">
          <div className="bg-slate-100 p-3 rounded">
            <p className="text-xs text-text-secondary-dark">User ID</p>
            <p className="font-mono text-lg">{credentials.id}</p>
          </div>
          <div className="bg-slate-100 p-3 rounded">
            <p className="text-xs text-text-secondary-dark">
              Temporary Password
            </p>
            <p className="font-mono text-lg">{credentials.password}</p>
          </div>
        </div>
        <div className="mt-4 text-right">
          <Button onClick={onClose}>Close</Button>
        </div>
      </Card>
    </div>
  );
};

const AdmitStudentModal: React.FC<{
  classes: SchoolClass[];
  onClose: () => void;
  onSave: (credentials: { id: string; password: string }) => void;
}> = ({ classes, onClose, onSave }) => {
  // use Partial<any> for form data to avoid overly strict type complaints
  const [formData, setFormData] = useState<any>({
    name: "",
    classId: "",
    dob: "",
    address: "",
    gender: "Male",
    guardianInfo: { name: "", email: "", phone: "" },
    status: "active",
    admissionNumber: "",
    dateOfAdmission: new Date().toISOString().split("T")[0], // Default to today
    classRollNumber: "",
    bloodGroup: "",
    guardianRelation: "",
    isDisabled: false,
    religion: "",
    category: "General",
    fatherName: "",
    motherName: "",
    governmentDocNumber: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (name.startsWith("guardian.")) {
      const key = name.split(".")[1];
      setFormData((prev: any) => ({
        ...prev,
        guardianInfo: { ...(prev.guardianInfo || {}), [key]: value },
      }));
    } else {
      setFormData((prev: any) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      // registrarApiService in the new backend-driven design typically expects just the payload;
      // the backend infers branch/user via JWT. We pass the form payload.
      const payload = {
        ...formData,
        gradeLevel:
          classes.find((c) => c.id === formData.classId)?.gradeLevel ??
          undefined,
      };
      const { credentials } = await apiService.admitStudent(payload);
      onSave(credentials); 
    } catch (err) {
      console.error("Failed to admit student:", err);
      alert("Failed to admit student.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Admit New Student</h2>
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
            <label className="block text-sm mb-1">Gender</label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm mb-1">Class</label>
            <select
              name="classId"
              value={formData.classId}
              onChange={handleChange}
              className="w-full p-2 border rounded"
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
          <h3 className="md:col-span-2 text-lg font-semibold mt-2 border-t pt-4">
            Admission Details
          </h3>
          <Input
            label="Admission Number"
            name="admissionNumber"
            value={formData.admissionNumber}
            onChange={handleChange}
          />
          <Input
            label="Date of Admission"
            name="dateOfAdmission"
            type="date"
            value={formData.dateOfAdmission}
            onChange={handleChange}
          />
          <Input
            label="Class Roll Number"
            name="classRollNumber"
            value={formData.classRollNumber}
            onChange={handleChange}
          />
          <Input
            label="Blood Group"
            name="bloodGroup"
            value={formData.bloodGroup}
            onChange={handleChange}
          />

          <h3 className="md:col-span-2 text-lg font-semibold mt-2 border-t pt-4">
            Personal Details
          </h3>
          <Input
            label="Religion"
            name="religion"
            value={formData.religion}
            onChange={handleChange}
          />
          <div>
            <label className="block text-sm mb-1">Category</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            >
              <option value="General">General</option>
              <option value="OBC">OBC</option>
              <option value="SC">SC</option>
              <option value="ST">ST</option>
              <option value="PreferNotToSay">Prefer not to say</option>
            </select>
          </div>
          <Input
            label="Government Doc Number (Aadhar)"
            name="governmentDocNumber"
            value={formData.governmentDocNumber}
            onChange={handleChange}
            placeholder="e.g. Aadhar Number"
          />
          <div className="md:col-span-2 flex items-center gap-4">
            <label htmlFor="isDisabled" className="text-sm font-medium">
              Is Student Disabled?
            </label>
            <input
              id="isDisabled"
              name="isDisabled"
              type="checkbox"
              checked={formData.isDisabled}
              onChange={(e) =>
                setFormData((prev: any) => ({
                  ...prev,
                  isDisabled: e.target.checked,
                }))
              }
              className="h-5 w-5 rounded"
            />
          </div>

          <h3 className="md:col-span-2 text-lg font-semibold mt-2 border-t pt-4">
            Family Details
          </h3>
          <Input
            label="Father's Name"
            name="fatherName"
            value={formData.fatherName}
            onChange={handleChange}
          />
          <Input
            label="Mother's Name"
            name="motherName"
            value={formData.motherName}
            onChange={handleChange}
          />
          <h3 className="md:col-span-2 text-lg font-semibold mt-2 border-t pt-4">
            Guardian Information
          </h3>
          <Input
            label="Guardian Name"
            name="guardian.name"
            value={formData.guardianInfo?.name}
            onChange={handleChange}
          />
          <Input
            label="Guardian Email"
            name="guardian.email"
            type="email"
            value={formData.guardianInfo?.email}
            onChange={handleChange}
          />
          <Input
            label="Guardian Phone"
            name="guardian.phone"
            type="tel"
            value={formData.guardianInfo?.phone}
            onChange={handleChange}
          />
          <Input
            label="Relation with Guardian"
            name="guardianRelation"
            value={formData.guardianRelation}
            onChange={handleChange}
            placeholder="e.g., Father, Mother"
          />

          <div className="md:col-span-2 flex justify-end gap-3 mt-4">
            <Button
              variant="secondary"
              type="button"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Admitting..." : "Admit Student"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

const AdmitTeacherModal: React.FC<{
  subjects: Subject[];
  onClose: () => void;
  onSave: () => void;
}> = ({ subjects, onClose, onSave }) => {
  const [formData, setFormData] = useState<any>({
    name: "",
    subjectIds: [] as string[],
    qualification: "",
    doj: new Date().toISOString().split("T")[0],
    gender: "Male",
    email: "",
    phone: "",
    bloodGroup: "",
    alternatePhone: "",
    address: "",
    governmentDocNumber: "",
    fatherName: "",
    motherName: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSubjectToggle = (subjectId: string) => {
    setFormData((prev: any) => {
      const list: string[] = prev.subjectIds || [];
      return {
        ...prev,
        subjectIds: list.includes(subjectId)
          ? list.filter((id) => id !== subjectId)
          : [...list, subjectId],
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      // backend handles approval workflow; frontend just submits application
      await apiService.submitFacultyApplication(formData);
      onSave();
    } catch (err) {
      console.error("Failed to submit teacher application:", err);
      alert("Failed to submit teacher application.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-3xl">
        <h2 className="text-xl font-bold mb-4">Submit Teacher for Approval</h2>
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4"
        >
          <Input
            label="Full Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="md:col-span-2"
          />
          <div>
            <label className="block text-sm mb-1">Gender</label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <Input
            label="Date of Joining"
            name="doj"
            type="date"
            value={formData.doj}
            onChange={handleChange}
            required
          />
          <Input
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
          />
          <Input
            label="Phone"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
          />
          <Input
            label="Qualification"
            name="qualification"
            value={formData.qualification}
            onChange={handleChange}
            className="md:col-span-2"
          />

          <Input
            label="Address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            className="md:col-span-2"
          />
          <Input
            label="Blood Group"
            name="bloodGroup"
            value={formData.bloodGroup}
            onChange={handleChange}
          />
          <Input
            label="Alternate Phone"
            name="alternatePhone"
            value={formData.alternatePhone}
            onChange={handleChange}
          />
          <Input
            label="Father's Name"
            name="fatherName"
            value={formData.fatherName}
            onChange={handleChange}
          />
          <Input
            label="Mother's Name"
            name="motherName"
            value={formData.motherName}
            onChange={handleChange}
          />
          <Input
            label="Government Doc Number (Aadhar)"
            name="governmentDocNumber"
            value={formData.governmentDocNumber}
            onChange={handleChange}
            className="md:col-span-2"
          />

          <div className="md:col-span-2">
            <label className="block text-sm mb-1">Assign Subjects</label>
            <div className="max-h-40 overflow-y-auto border rounded p-2 grid grid-cols-2 gap-2">
              {subjects.map((subject) => (
                <label
                  key={subject.id}
                  className="flex items-center gap-2 cursor-pointer p-1 rounded hover:bg-slate-50"
                >
                  <input
                    type="checkbox"
                    checked={(formData.subjectIds || []).includes(subject.id)}
                    onChange={() => handleSubjectToggle(subject.id)}
                  />
                  <span className="text-sm">{subject.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="md:col-span-2 flex justify-end gap-3 mt-4">
            <Button
              variant="secondary"
              type="button"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Submitting..." : "Submit for Approval"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Main page                                   */
/* -------------------------------------------------------------------------- */

const AdmissionsManagement: React.FC = () => {
  const { user } = useAuth();
  const { refreshKey, triggerRefresh } = useDataRefresh();
  const [applications, setApplications] = useState<Application[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>(
    {}
  );
  const [submissionStatus, setSubmissionStatus] = useState("");

  const [modal, setModal] = useState<"student" | "teacher" | null>(null);
  const [newCredentials, setNewCredentials] = useState<{
    id: string;
    password: string;
  } | null>(null);
  const [admittedUserType] = useState<"Student" | "Teacher">("Student");

  // fetch all data. New backend pattern: service methods derive branch from token,
  // therefore we call them without branchId where service expects it.
  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const [appsRes, classesRes, subjectsRes] = await Promise.all([
        apiService.getApplications(), // expects backend to filter by branch via token
        apiService.getSchoolClasses(), // FIX: This method now exists in the service
        apiService.getSubjects(), // FIX: This method now exists in the service
      ]);
      // safeguard: if service returned undefined, fallback to empty arrays
      setApplications(
        (appsRes || []).filter((a: Application) => a.status === "pending")
      );
      setClasses(classesRes || []);
      setSubjects(subjectsRes || []);
    } catch (err) {
      console.error("Failed to fetch admissions data:", err);
      setApplications([]);
      setClasses([]);
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  }, [refreshKey]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications, refreshKey]);

  const handleAction = async (appId: string, status: "approved" | "denied") => {
    setActionLoading((p) => ({ ...p, [appId]: true }));
    try {
      // attempt to use the service method that the new service likely exposes
      // (updateApplicationStatus with appId and status)
      await apiService.updateApplicationStatus(appId, status);
      triggerRefresh();
      fetchApplications();
    } catch (err) {
      console.error(`Failed to ${status} application:`, err);
      alert("Operation failed. See console for details.");
    } finally {
      setActionLoading((p) => ({ ...p, [appId]: false }));
    }
  };

  const handleStudentAdmissionSave = (credentials: {
    id: string;
    password: string;
  }) => {
    setNewCredentials(credentials);
    setModal(null);
    triggerRefresh();
    fetchApplications();
  };

  const handleTeacherAdmissionSave = () => {
    setModal(null);
    setSubmissionStatus(
      "Teacher application submitted for Principal approval."
    );
    setTimeout(() => setSubmissionStatus(""), 5000);
    triggerRefresh();
    fetchApplications();
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Admissions Management</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <h2 className="text-xl font-semibold mb-4">Pending Applications</h2>

          {loading ? (
            <p>Loading applications...</p>
          ) : applications.length === 0 ? (
            <p className="text-center text-text-secondary-dark p-8">
              No pending applications to review.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="border-b">
                  <tr>
                    <th className="p-2">Name</th>
                    <th className="p-2">Type</th>
                    <th className="p-2">Details</th>
                    <th className="p-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => (
                    <tr key={app.id} className="border-b">
                      <td className="p-2 font-medium">{app.applicantName}</td>
                      <td className="p-2">{app.type}</td>
                      <td className="p-2">
                        {app.type === "Student"
                          ? `Grade ${app.grade}`
                          : app.subject}
                      </td>
                      <td className="p-2 text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            onClick={() => handleAction(app.id, "approved")}
                            disabled={actionLoading[app.id]}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="danger"
                            onClick={() => handleAction(app.id, "denied")}
                            disabled={actionLoading[app.id]}
                          >
                            Deny
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

        <Card>
          <h2 className="text-xl font-semibold mb-4">Direct Admission</h2>
          <p className="text-sm text-text-secondary-dark mb-4">
            For walk-in admissions, directly add students or submit teacher
            applications here.
          </p>

          <div className="space-y-3">
            <Button className="w-full" onClick={() => setModal("student")}>
              Admit Student
            </Button>
            <Button className="w-full" onClick={() => setModal("teacher")}>
              Add Teacher
            </Button>
          </div>

          {submissionStatus && (
            <p className="text-center text-green-600 mt-4 text-sm">
              {submissionStatus}
            </p>
          )}
        </Card>
      </div>

      {/* Modals */}
      {modal === "student" && (
        <AdmitStudentModal
          classes={classes}
          onClose={() => setModal(null)}
          onSave={handleStudentAdmissionSave}
        />
      )}
      {modal === "teacher" && (
        <AdmitTeacherModal
          subjects={subjects}
          onClose={() => setModal(null)}
          onSave={handleTeacherAdmissionSave}
        />
      )}

      {newCredentials && (
        <CredentialsModal
          credentials={newCredentials}
          userType={admittedUserType}
          onClose={() => setNewCredentials(null)}
        />
      )}
    </div>
  );
};

export default AdmissionsManagement;
