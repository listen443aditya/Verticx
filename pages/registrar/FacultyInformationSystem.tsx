// // pages/registrar/FacultyInformationSystem.tsx
// import React, { useEffect, useState, useMemo, useCallback } from "react";
// import { useAuth } from "../../hooks/useAuth";
// // FIX: Correctly import the service classes directly from their files.
// import { RegistrarApiService } from "../../services/registrarApiService";
// import { SharedApiService } from "../../services/sharedApiService";
// import type {
//   Teacher,
//   Subject,
//   FacultyApplication,
//   User,
//   UserRole,
// } from "../../types";
// import Card from "../../components/ui/Card";
// import Button from "../../components/ui/Button";
// import Input from "../../components/ui/Input";
// import { useDataRefresh } from "../../contexts/DataRefreshContext";
// import ConfirmationModal from "../../components/ui/ConfirmationModal";

// // Create instances of the services.
// const apiService = new RegistrarApiService();
// const sharedApiService = new SharedApiService();

// const CredentialsModal: React.FC<{
//   title: string;
//   credentials: { id: string; password: string };
//   userType: string;
//   onClose: () => void;
// }> = ({ title, credentials, userType, onClose }) => (
//   <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
//     <Card className="w-full max-w-md">
//       <h2 className="text-xl font-bold text-brand-accent mb-2">{title}</h2>
//       <p className="text-text-secondary-dark mb-4">
//         Please securely share the following login credentials with the{" "}
//         {userType}:
//       </p>
//       <div className="space-y-3">
//         <div className="bg-slate-100 p-3 rounded-lg">
//           <p className="text-sm font-semibold text-text-secondary-dark">
//             User ID
//           </p>
//           <p className="text-lg font-mono tracking-wider text-text-primary-dark">
//             {credentials.id}
//           </p>
//         </div>
//         <div className="bg-slate-100 p-3 rounded-lg">
//           <p className="text-sm font-semibold text-text-secondary-dark">
//             New Password
//           </p>
//           <p className="text-lg font-mono tracking-wider text-text-primary-dark">
//             {credentials.password}
//           </p>
//         </div>
//       </div>
//       <div className="mt-6 text-right">
//         <Button onClick={onClose}>Close</Button>
//       </div>
//     </Card>
//   </div>
// );

// const EditTeacherModal: React.FC<{
//   teacher: Teacher;
//   allSubjects: Subject[];
//   onClose: () => void;
//   onSave: () => void;
// }> = ({ teacher, allSubjects, onClose, onSave }) => {
//   const [formData, setFormData] = useState<Partial<Teacher>>(teacher);
//   const [isSaving, setIsSaving] = useState(false);

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
//   };

//   const handleSubjectToggle = (subjectId: string) => {
//     setFormData((prev) => {
//       const newSubjectIds = prev.subjectIds?.includes(subjectId)
//         ? prev.subjectIds.filter((id) => id !== subjectId)
//         : [...(prev.subjectIds || []), subjectId];
//       return { ...prev, subjectIds: newSubjectIds };
//     });
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setIsSaving(true);
//     await apiService.updateTeacher(teacher.id, formData);
//     setIsSaving(false);
//     onSave();
//   };

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4">
//       <Card className="w-full max-w-2xl">
//         <h2 className="text-xl font-bold mb-4">Edit Teacher: {teacher.name}</h2>
//         <form onSubmit={handleSubmit} className="space-y-4">
//           <div className="grid grid-cols-2 gap-4">
//             <Input
//               label="Full Name"
//               name="name"
//               value={formData.name}
//               onChange={handleChange}
//               required
//             />
//             <Input
//               label="Qualification"
//               name="qualification"
//               value={formData.qualification}
//               onChange={handleChange}
//               required
//             />
//             <Input
//               label="Email"
//               name="email"
//               type="email"
//               value={formData.email}
//               onChange={handleChange}
//               required
//             />
//             <Input
//               label="Phone"
//               name="phone"
//               value={formData.phone}
//               onChange={handleChange}
//             />
//           </div>
//           <div>
//             <label className="block text-sm font-medium text-text-secondary-dark mb-1">
//               Assign Subjects
//             </label>
//             <div className="max-h-32 overflow-y-auto border border-slate-300 rounded-md p-4 grid grid-cols-1 gap-2 bg-slate-50 text-center">
//               <p className="text-sm text-slate-600">
//                 To manage subject assignments for this teacher, please go to the
//                 <br />
//                 <strong>Class Management {">"} Subjects</strong> tab.
//               </p>
//             </div>
//           </div>
//           <div className="flex justify-end gap-4 pt-4">
//             <Button
//               type="button"
//               variant="secondary"
//               onClick={onClose}
//               disabled={isSaving}
//             >
//               Cancel
//             </Button>
//             <Button type="submit" disabled={isSaving}>
//               {isSaving ? "Saving..." : "Save Changes"}
//             </Button>
//           </div>
//         </form>
//       </Card>
//     </div>
//   );
// };

// const AddEditSupportStaffModal: React.FC<{
//   staff: User | null;
//   onClose: () => void;
//   onSave: (creds?: { id: string; password: string }) => void;
// }> = ({ staff, onClose, onSave }) => {
//   const { user } = useAuth();
//   const [formData, setFormData] = useState({
//     name: staff?.name || "",
//     email: staff?.email || "",
//     phone: staff?.phone || "",
//     designation: staff?.designation || "",
//     salary: staff?.salary || 0,
//   });
//   const [isSaving, setIsSaving] = useState(false);

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setIsSaving(true);
//     if (staff) {
//       await apiService.updateSupportStaff(staff.id, formData);
//       onSave();
//     } else {
//       const { credentials } = await apiService.createSupportStaff({
//         ...formData,
//         salary: Number(formData.salary),
//       });
//       onSave(credentials);
//     }
//     setIsSaving(false);
//   };

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4">
//       <Card className="w-full max-w-lg">
//         <h2 className="text-xl font-bold mb-4">
//           {staff ? "Edit Staff Member" : "Add New Support Staff"}
//         </h2>
//         <form onSubmit={handleSubmit} className="space-y-4">
//           <Input
//             label="Full Name"
//             name="name"
//             value={formData.name}
//             onChange={handleChange}
//             required
//           />
//           <Input
//             label="Designation"
//             name="designation"
//             value={formData.designation}
//             onChange={handleChange}
//             required
//             placeholder="e.g., Cleaner, Security Guard"
//           />
//           <Input
//             label="Email"
//             name="email"
//             type="email"
//             value={formData.email}
//             onChange={handleChange}
//             required
//           />
//           <Input
//             label="Phone"
//             name="phone"
//             value={formData.phone}
//             onChange={handleChange}
//           />
//           <Input
//             label="Monthly Salary"
//             name="salary"
//             type="number"
//             value={String(formData.salary)}
//             onChange={handleChange}
//             required
//           />
//           <div className="flex justify-end gap-4 pt-4">
//             <Button
//               type="button"
//               variant="secondary"
//               onClick={onClose}
//               disabled={isSaving}
//             >
//               Cancel
//             </Button>
//             <Button type="submit" disabled={isSaving}>
//               {isSaving ? "Saving..." : "Save"}
//             </Button>
//           </div>
//         </form>
//       </Card>
//     </div>
//   );
// };

// const FacultyInformationSystem: React.FC = () => {
//   const { user } = useAuth();
//   const { refreshKey, triggerRefresh } = useDataRefresh();
//   // FIX: Changed state to be a combined type that includes properties from both User and Teacher.
//   //  const [teachers, setTeachers] = useState<(User & Teacher)[]>([]);
//   const [teachers, setTeachers] = useState<User[]>([]);
//   const [supportStaff, setSupportStaff] = useState<User[]>([]);
//   const [applications, setApplications] = useState<FacultyApplication[]>([]);
//   const [subjects, setSubjects] = useState<Subject[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [statusMessage, setStatusMessage] = useState("");
//   const [activeTab, setActiveTab] = useState<
//     "roster" | "support" | "applications"
//   >("roster");

//   // Modal states
//   const [modal, setModal] = useState<
//     "addStaff" | "editStaff" | "editTeacher" | null
//   >(null);
//   const [selectedStaff, setSelectedStaff] = useState<User | null>(null);
//   // const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
//   const [selectedUserForEdit, setSelectedUserForEdit] = useState<User | null>(
//     null
//   );
//   const [deletingStaff, setDeletingStaff] = useState<User | null>(null);
//   const [resettingPasswordFor, setResettingPasswordFor] = useState<User | null>(
//     null
//   );
//   const [newCredentials, setNewCredentials] = useState<{
//     id: string;
//     password: string;
//   } | null>(null);

//   const fetchData = useCallback(async () => {
//     if (!user) return;
//     setLoading(true);
//     const [allStaff, staffData, applicationData, subjectData] =
//       await Promise.all([
//         apiService.getAllStaff(), // FIX: Provided branchId argument.
//         apiService.getSupportStaff(),
//         apiService.getFacultyApplications(),
//         apiService.getSubjects(),
//       ]);
//     // FIX: Filter for teachers and cast to the combined (User & Teacher) type.
//     // setTeachers(
//     // allStaff.filter((t: User) => t.role === "Teacher") as (User & Teacher)[]
//     // );
//     setTeachers(allStaff.filter((u: User) => u.role === "Teacher"));
//     setSupportStaff(staffData);
//     // FIX: Added explicit types to sort parameters.
//     setApplications(
//       applicationData.sort(
//         (a: FacultyApplication, b: FacultyApplication) =>
//           new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
//       )
//     );
//     setSubjects(subjectData);
//     setLoading(false);
//   }, [user, refreshKey]);

//   useEffect(() => {
//     fetchData();
//   }, [fetchData]);

//   const handleSave = (credentials?: { id: string; password: string }) => {
//     setModal(null);
//     setSelectedStaff(null);
//     setSelectedUserForEdit(null);
//     if (credentials) {
//       setNewCredentials(credentials);
//     }
//     setStatusMessage("Operation successful!");
//     setTimeout(() => setStatusMessage(""), 3000);
//     triggerRefresh();
//   };

//   const handleResetPassword = async (staff: User) => {
//     setResettingPasswordFor(staff);
//     try {
//       const { userId, newPassword } = await sharedApiService.resetUserPassword(
//         staff.id
//       );

//       // Set the credentials for the modal
//       setNewCredentials({ id: userId, password: newPassword });
//     } catch (error) {
//       console.error("Failed to reset password", error);
//       alert("Failed to reset password. Please try again.");
//     }
//     setResettingPasswordFor(null);
//   };

//   const handleDeleteStaff = async () => {
//     if (!deletingStaff) return;
//     await apiService.deleteSupportStaff(deletingStaff.id);
//     setDeletingStaff(null);
//     triggerRefresh();
//   };

//   const getStatusChip = (
//     status?: "pending" | "approved" | "rejected" | "active" | "suspended"
//   ) => {
//     switch (status) {
//       case "pending":
//         return "bg-yellow-100 text-yellow-800";
//       case "approved":
//       case "active":
//         return "bg-green-100 text-green-800";
//       case "rejected":
//       case "suspended":
//         return "bg-red-100 text-red-800";
//       default:
//         return "bg-slate-100 text-slate-800";
//     }
//   };

//   const tabButtonClasses = (isActive: boolean) =>
//     `px-4 py-2 text-sm font-medium transition-colors focus:outline-none ${
//       isActive
//         ? "bg-slate-200 rounded-t-lg font-semibold"
//         : "text-text-secondary-dark hover:bg-slate-100"
//     }`;

//   return (
//     <div>
//       <h1 className="text-3xl font-bold text-text-primary-dark mb-6">
//         Faculty & Staff Information System
//       </h1>
//       <Card>
//         <div className="flex justify-between items-center mb-4 pb-4 border-b">
//           <div className="flex border-b">
//             <button
//               className={tabButtonClasses(activeTab === "roster")}
//               onClick={() => setActiveTab("roster")}
//             >
//               Faculty Roster
//             </button>
//             <button
//               className={tabButtonClasses(activeTab === "support")}
//               onClick={() => setActiveTab("support")}
//             >
//               Support Staff
//             </button>
//             <button
//               className={tabButtonClasses(activeTab === "applications")}
//               onClick={() => setActiveTab("applications")}
//             >
//               Submitted Applications
//             </button>
//           </div>
//           {activeTab === "support" && (
//             <Button onClick={() => setModal("addStaff")}>Add New Staff</Button>
//           )}
//           {activeTab === "applications" && (
//             <Button
//               onClick={() =>
//                 alert("This button should be on the Admissions page.")
//               }
//             >
//               Admit New Teacher
//             </Button>
//           )}
//         </div>

//         {statusMessage && (
//           <p className="text-center text-green-600 mb-4">{statusMessage}</p>
//         )}

//         {loading ? (
//           <p>Loading...</p>
//         ) : (
//           <div className="overflow-x-auto">
//             {activeTab === "roster" && (
//               <table className="w-full text-left">
//                 <thead className="border-b">
//                   <tr>
//                     <th className="p-4">Name</th>
//                     <th className="p-4">ID</th>
//                     <th className="p-4">Qualification</th>
//                     <th className="p-4">Subjects</th>
//                     <th className="p-4">Status</th>
//                     <th className="p-4"></th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {teachers.map((t) => (
//                     <tr key={t.id} className="border-b">
//                       <td className="p-4 font-medium">{t.name}</td>
//                       <td className="p-4 font-mono text-xs">{t.userId}</td>
//                       <td className="p-4">{t.teacher?.qualification}</td>
//                       <td className="p-4 text-sm">
//                         {t.teacher?.subjectIds
//                           .map((id) => subjects.find((s) => s.id === id)?.name)
//                           .join(", ")}
//                       </td>
//                       <td className="p-4">
//                         <span
//                           className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusChip(
//                             t.status
//                           )}`}
//                         >
//                           {t.teacher?.status}
//                         </span>
//                       </td>
//                       <td className="p-4 text-right">
//                         <div className="flex gap-2 justify-end">
//                           <Button
//                             variant="secondary"
//                             className="!px-2 !py-1 text-xs"
//                             onClick={() => {
//                               setSelectedUserForEdit(t);
//                               setModal("editTeacher");
//                             }}
//                           >
//                             Edit
//                           </Button>
//                           {/* FIX: No cast needed as 't' now conforms to the User type */}
//                           <Button
//                             variant="danger"
//                             className="!px-2 !py-1 text-xs"
//                             onClick={() => handleResetPassword(t)}
//                             disabled={!!resettingPasswordFor}
//                           >
//                             Reset Password
//                           </Button>
//                         </div>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             )}
//             {activeTab === "support" && (
//               <table className="w-full text-left">
//                 <thead className="border-b">
//                   <tr>
//                     <th className="p-4">Name</th>
//                     <th className="p-4">ID</th>
//                     <th className="p-4">Designation</th>
//                     <th className="p-4">Contact</th>
//                     <th className="p-4 text-right">Salary</th>
//                     <th className="p-4">Status</th>
//                     <th className="p-4"></th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {supportStaff.map((s) => (
//                     <tr key={s.id} className="border-b">
//                       <td className="p-4 font-medium">{s.name}</td>
//                       <td className="p-4 font-mono text-xs">{s.userId}</td>
//                       <td className="p-4">{s.designation}</td>
//                       <td className="p-4 text-xs">
//                         {s.email}
//                         <br />
//                         {s.phone}
//                       </td>
//                       <td className="p-4 text-right font-semibold">
//                         {s.salary?.toLocaleString()}
//                       </td>
//                       <td className="p-4">
//                         {/* Check if status exists before trying to display it */}
//                         {s.status ? (
//                           <span
//                             className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusChip(
//                               // Use lowercase and assert the type for the chip function
//                               s.status.toLowerCase() as
//                                 | "active"
//                                 | "suspended"
//                                 | "pending"
//                                 | "approved"
//                                 | "rejected"
//                             )}`}
//                           >
//                             {/* Display status nicely (e.g., "Active" instead of "active") */}
//                             {s.status.charAt(0).toUpperCase() +
//                               s.status.slice(1)}
//                           </span>
//                         ) : (
//                           // Provide a fallback if status is null or undefined
//                           <span className="px-2 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-800">
//                             Unknown
//                           </span>
//                         )}
//                       </td>
//                       <td className="p-4 text-right">
//                         <div className="flex gap-2 justify-end">
//                           <Button
//                             variant="secondary"
//                             className="!px-2 !py-1 text-xs"
//                             onClick={() => {
//                               setSelectedStaff(s);
//                               setModal("editStaff");
//                             }}
//                           >
//                             Edit
//                           </Button>
//                           <Button
//                             variant="danger"
//                             className="!px-2 !py-1 text-xs"
//                             onClick={() => setDeletingStaff(s)}
//                           >
//                             Delete
//                           </Button>
//                         </div>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             )}
//             {activeTab === "applications" && (
//               <table className="w-full text-left">
//                 <thead className="border-b">
//                   <tr>
//                     <th className="p-4">Name</th>
//                     <th className="p-4">Qualification</th>
//                     <th className="p-4">Submitted At</th>
//                     <th className="p-4">Status</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {applications.map((app) => (
//                     <tr key={app.id} className="border-b">
//                       <td className="p-4 font-medium">{app.name}</td>
//                       <td className="p-4">{app.qualification}</td>
//                       <td className="p-4">
//                         {new Date(app.submittedAt).toLocaleDateString()}
//                       </td>
//                       <td className="p-4">
//                         <span
//                           className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusChip(
//                             app.status.toLowerCase() as
//                               | "active"
//                               | "suspended"
//                               | "pending"
//                               | "approved"
//                               | "rejected"
//                           )}`}
//                         >
//                           {app.status}
//                         </span>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             )}
//           </div>
//         )}
//       </Card>

//       {modal === "editTeacher" && selectedUserForEdit?.teacher && (
//         <EditTeacherModal
//           teacher={selectedUserForEdit.teacher}
//           allSubjects={subjects}
//           onClose={() => setModal(null)}
//           onSave={handleSave}
//         />
//       )}
//       {(modal === "addStaff" || modal === "editStaff") && (
//         <AddEditSupportStaffModal
//           staff={selectedStaff}
//           onClose={() => setModal(null)}
//           onSave={handleSave}
//         />
//       )}
//       {deletingStaff && (
//         <ConfirmationModal
//           isOpen={!!deletingStaff}
//           onClose={() => setDeletingStaff(null)}
//           onConfirm={handleDeleteStaff}
//           title="Delete Staff Member"
//           message={
//             <>
//               Are you sure you want to delete{" "}
//               <strong>{deletingStaff.name}</strong>? This action cannot be
//               undone.
//             </>
//           }
//         />
//       )}
//       {newCredentials && (
//         <CredentialsModal
//           title="Credentials Generated"
//           credentials={newCredentials}
//           userType="staff member"
//           onClose={() => setNewCredentials(null)}
//         />
//       )}
//     </div>
//   );
// };

// export default FacultyInformationSystem;




import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useAuth } from "../../hooks/useAuth.ts";
import { RegistrarApiService } from "../../services/registrarApiService";
import { SharedApiService } from "../../services/sharedApiService";
import type {
  Teacher,
  Subject,
  FacultyApplication,
  User,
} from "../../types.ts";
import Card from "../../components/ui/Card.tsx";
import Button from "../../components/ui/Button.tsx";
import Input from "../../components/ui/Input.tsx";
import { useDataRefresh } from "../../contexts/DataRefreshContext.tsx";
import ConfirmationModal from "../../components/ui/ConfirmationModal.tsx";

const apiService = new RegistrarApiService();
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

const EditTeacherModal: React.FC<{
  teacher: Teacher;
  allSubjects: Subject[];
  onClose: () => void;
  onSave: () => void;
}> = ({ teacher, allSubjects, onClose, onSave }) => {
  const [formData, setFormData] = useState<Partial<Teacher>>(teacher);
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await apiService.updateTeacher(teacher.id, formData);
    setIsSaving(false);
    onSave();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4">
      <Card className="w-full max-w-2xl">
        <h2 className="text-xl font-bold mb-4">Edit Teacher: {teacher.name}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
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
              Assign Subjects
            </label>
            <div className="max-h-32 overflow-y-auto border border-slate-300 rounded-md p-4 grid grid-cols-1 gap-2 bg-slate-50 text-center">
              <p className="text-sm text-slate-600">
                To manage subject assignments for this teacher, please go to the
                <br />
                <strong>Class Management {">"} Subjects</strong> tab.
              </p>
            </div>
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

const AddEditSupportStaffModal: React.FC<{
  staff: User | null;
  onClose: () => void;
  onSave: (creds?: { id: string; password: string }) => void;
}> = ({ staff, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: staff?.name || "",
    email: staff?.email || "",
    phone: staff?.phone || "",
    designation: staff?.designation || "",
    salary: staff?.salary || 0,
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    if (staff) {
      await apiService.updateSupportStaff(staff.id, formData);
      onSave();
    } else {
      const result: any = await apiService.createSupportStaff({
        ...formData,
        salary: Number(formData.salary),
      });
      onSave(result.credentials);
    }
    setIsSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4">
      <Card className="w-full max-w-lg">
        <h2 className="text-xl font-bold mb-4">
          {staff ? "Edit Staff Member" : "Add New Support Staff"}
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
            label="Designation"
            name="designation"
            value={formData.designation}
            onChange={handleChange}
            required
            placeholder="e.g., Cleaner, Security Guard"
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
            value={formData.phone}
            onChange={handleChange}
          />
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

const FacultyInformationSystem: React.FC = () => {
  const { user } = useAuth();
  const { refreshKey, triggerRefresh } = useDataRefresh();
  const [teachers, setTeachers] = useState<User[]>([]);
  const [supportStaff, setSupportStaff] = useState<User[]>([]);
  const [applications, setApplications] = useState<FacultyApplication[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState("");
  const [activeTab, setActiveTab] = useState<
    "roster" | "support" | "applications"
  >("roster");

  const [modal, setModal] = useState<
    "addStaff" | "editStaff" | "editTeacher" | null
  >(null);
  const [selectedStaff, setSelectedStaff] = useState<User | null>(null);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<User | null>(
    null
  );
  const [deletingStaff, setDeletingStaff] = useState<User | null>(null);
  const [resettingPasswordFor, setResettingPasswordFor] = useState<User | null>(
    null
  );
  const [newCredentials, setNewCredentials] = useState<{
    id: string;
    password: string;
  } | null>(null);

  const fetchData = useCallback(async () => {
    if (!user?.branchId) return; // Guard clause
    setLoading(true);
    try {
      const [allStaff, staffData, applicationData, subjectData] =
        await Promise.all([
          apiService.getAllStaff(user.branchId),
          apiService.getSupportStaff(),
          apiService.getFacultyApplications(),
          apiService.getSubjects(),
        ]);

      setTeachers(allStaff.filter((u: User) => u.role === "Teacher"));
      setSupportStaff(staffData);
      setApplications(
        applicationData.sort(
          (a: FacultyApplication, b: FacultyApplication) =>
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

  const handleSave = (credentials?: { id: string; password: string }) => {
    setModal(null);
    setSelectedStaff(null);
    setSelectedUserForEdit(null);
    if (credentials) {
      setNewCredentials(credentials);
    }
    setStatusMessage("Operation successful!");
    setTimeout(() => setStatusMessage(""), 3000);
    triggerRefresh();
  };

  const handleResetPassword = async (staff: User) => {
    setResettingPasswordFor(staff);
    try {
      const { userId, newPassword } = await sharedApiService.resetUserPassword(
        staff.id
      );
      setNewCredentials({ id: userId, password: newPassword });
    } catch (error) {
      console.error("Failed to reset password", error);
      alert("Failed to reset password. Please try again.");
    }
    setResettingPasswordFor(null);
  };

  const handleDeleteStaff = async () => {
    if (!deletingStaff) return;
    await apiService.deleteSupportStaff(deletingStaff.id);
    setDeletingStaff(null);
    triggerRefresh();
  };

  const getStatusChip = (
    status?: "pending" | "approved" | "rejected" | "active" | "suspended"
  ) => {
    switch (status) {
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
      <h1 className="text-3xl font-bold text-text-primary-dark mb-6">
        Faculty & Staff Information System
      </h1>
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
            <button
              className={tabButtonClasses(activeTab === "applications")}
              onClick={() => setActiveTab("applications")}
            >
              Submitted Applications
            </button>
          </div>
          {activeTab === "support" && (
            <Button onClick={() => setModal("addStaff")}>Add New Staff</Button>
          )}
        </div>

        {statusMessage && (
          <p className="text-center text-green-600 mb-4">{statusMessage}</p>
        )}

        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="overflow-x-auto">
            {activeTab === "roster" && (
              <table className="w-full text-left">
                <thead className="border-b">
                  <tr>
                    <th className="p-4">Name</th>
                    <th className="p-4">ID</th>
                    <th className="p-4">Qualification</th>
                    <th className="p-4">Subjects</th>
                    <th className="p-4">Status</th>
                    <th className="p-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {teachers.map((t) => (
                    <tr key={t.id} className="border-b">
                      <td className="p-4 font-medium">{t.name}</td>
                      <td className="p-4 font-mono text-xs">{t.userId}</td>
                      <td className="p-4">
                        {t.teacher?.qualification || "N/A"}
                      </td>
                      <td className="p-4 text-sm">
                        {/* FIX: Add optional chaining to subjectIds */}
                        {t.teacher?.subjectIds
                          ? t.teacher.subjectIds
                              .map(
                                (id) =>
                                  subjects.find((s) => s.id === id)?.name || id
                              )
                              .join(", ")
                          : "None"}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusChip(
                            t.status
                          )}`}
                        >
                          {t.teacher?.status || "Active"}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="secondary"
                            className="!px-2 !py-1 text-xs"
                            onClick={() => {
                              setSelectedUserForEdit(t);
                              setModal("editTeacher");
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="danger"
                            className="!px-2 !py-1 text-xs"
                            onClick={() => handleResetPassword(t)}
                            disabled={!!resettingPasswordFor}
                          >
                            Reset Password
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {activeTab === "support" && (
              <table className="w-full text-left">
                <thead className="border-b">
                  <tr>
                    <th className="p-4">Name</th>
                    <th className="p-4">ID</th>
                    <th className="p-4">Designation</th>
                    <th className="p-4">Contact</th>
                    <th className="p-4 text-right">Salary</th>
                    <th className="p-4">Status</th>
                    <th className="p-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {supportStaff.map((s) => (
                    <tr key={s.id} className="border-b">
                      <td className="p-4 font-medium">{s.name}</td>
                      <td className="p-4 font-mono text-xs">{s.userId}</td>
                      <td className="p-4">{s.designation}</td>
                      <td className="p-4 text-xs">
                        {s.email}
                        <br />
                        {s.phone}
                      </td>
                      <td className="p-4 text-right font-semibold">
                        {s.salary?.toLocaleString()}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusChip(
                            s.status?.toLowerCase() as any
                          )}`}
                        >
                          {s.status
                            ? s.status.charAt(0).toUpperCase() +
                              s.status.slice(1)
                            : "Unknown"}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="secondary"
                            className="!px-2 !py-1 text-xs"
                            onClick={() => {
                              setSelectedStaff(s);
                              setModal("editStaff");
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="danger"
                            className="!px-2 !py-1 text-xs"
                            onClick={() => setDeletingStaff(s)}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {activeTab === "applications" && (
              <table className="w-full text-left">
                <thead className="border-b">
                  <tr>
                    <th className="p-4">Name</th>
                    <th className="p-4">Qualification</th>
                    <th className="p-4">Submitted At</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => (
                    <tr key={app.id} className="border-b">
                      <td className="p-4 font-medium">{app.name}</td>
                      <td className="p-4">{app.qualification}</td>
                      <td className="p-4">
                        {new Date(app.submittedAt).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusChip(
                            app.status.toLowerCase() as any
                          )}`}
                        >
                          {app.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </Card>

      {modal === "editTeacher" && selectedUserForEdit?.teacher && (
        <EditTeacherModal
          teacher={selectedUserForEdit.teacher}
          allSubjects={subjects}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
      {(modal === "addStaff" || modal === "editStaff") && (
        <AddEditSupportStaffModal
          staff={selectedStaff}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
      {deletingStaff && (
        <ConfirmationModal
          isOpen={!!deletingStaff}
          onClose={() => setDeletingStaff(null)}
          onConfirm={handleDeleteStaff}
          title="Delete Staff Member"
          message={
            <>
              Are you sure you want to delete{" "}
              <strong>{deletingStaff.name}</strong>? This action cannot be
              undone.
            </>
          }
        />
      )}
      {newCredentials && (
        <CredentialsModal
          title="Credentials Generated"
          credentials={newCredentials}
          userType="staff member"
          onClose={() => setNewCredentials(null)}
        />
      )}
    </div>
  );
};

export default FacultyInformationSystem;