import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useAuth } from "../../hooks/useAuth";
// FIX: Correctly import the service class and create an instance.
import { RegistrarApiService } from "../../services/registrarApiService";
import type { SchoolDocument, Student, Teacher, User } from "../../types";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";

const apiService = new RegistrarApiService();

const DocumentManagement: React.FC = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<SchoolDocument[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]); // FIX: Using User[] as getAllStaff returns this type.
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"Student" | "Staff">("Student");

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    // FIX: Removed branchId from API calls and updated to use getAllStaff.
    const [docs, studs, allStaff] = await Promise.all([
      apiService.getSchoolDocuments(),
      apiService.getStudentsByBranch(user.branchId as string), 
      apiService.getAllStaff(), 
    ]);
    setDocuments(docs);
    setStudents(studs);
    // FIX: Filter the staff list to only include teachers.
    setTeachers(allStaff.filter((s) => s.role === "Teacher"));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getOwnerName = (ownerId: string, type: "Student" | "Staff") => {
    if (type === "Student") {
      return students.find((s) => s.id === ownerId)?.name || "Unknown Student";
    }
    return teachers.find((t) => t.id === ownerId)?.name || "Unknown Staff";
  };

  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => doc.type === view);
  }, [documents, view]);

  return (
    <div>
      <h1 className="text-3xl font-bold text-text-primary-dark mb-6">
        Document Management
      </h1>
      <Card>
        <div className="flex justify-between items-center mb-4 border-b border-slate-200 pb-4">
          <div className="flex gap-2">
            <Button
              variant={view === "Student" ? "primary" : "secondary"}
              onClick={() => setView("Student")}
            >
              Student Documents
            </Button>
            <Button
              variant={view === "Staff" ? "primary" : "secondary"}
              onClick={() => setView("Staff")}
            >
              Staff Documents
            </Button>
          </div>
          <Button>Upload Document</Button>
        </div>

        {loading ? (
          <p>Loading documents...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-slate-200 text-sm text-text-secondary-dark">
                <tr>
                  <th className="p-4">Document Name</th>
                  <th className="p-4">
                    {view === "Student" ? "Student" : "Staff Member"}
                  </th>
                  <th className="p-4">Uploaded At</th>
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody>
                {filteredDocuments.map((doc) => (
                  <tr
                    key={doc.id}
                    className="border-b border-slate-100 hover:bg-slate-50"
                  >
                    <td className="p-4 font-medium text-text-primary-dark">
                      {doc.name}
                    </td>
                    <td className="p-4">
                      {getOwnerName(doc.ownerId, doc.type)}
                    </td>
                    <td className="p-4">
                      {new Date(doc.uploadedAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="secondary"
                          className="!px-3 !py-1 text-xs"
                        >
                          View
                        </Button>
                        <Button
                          variant="danger"
                          className="!px-3 !py-1 text-xs"
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredDocuments.length === 0 && (
              <p className="text-center p-4 text-text-secondary-dark">
                No documents found for this category.
              </p>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

export default DocumentManagement;
