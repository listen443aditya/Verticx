import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../../hooks/useAuth.ts";
// FIX: Corrected the import to use the class and instantiate it
import { PrincipalApiService } from "../../services";
import type { ComplaintAboutStudent } from "../../types.ts";
import Card from "../../components/ui/Card.tsx";
import Input from "../../components/ui/Input.tsx";
import { AlertTriangleIcon } from "../../components/icons/Icons.tsx";

// Create an instance of the service
const apiService = new PrincipalApiService();

const DisciplineLog: React.FC = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<ComplaintAboutStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchData = useCallback(async () => {
    // The user object is needed, but the branchId is no longer passed as an argument
    if (!user) return;
    setLoading(true);
    try {
      // FIX: Corrected method call to fetch complaints. The backend infers the branch from the user's session.
      const data = await apiService.getComplaintsAboutStudents();
      // FIX: Added explicit types to the sort function parameters to resolve the 'implicit any' error.
      setComplaints(
        data.sort(
          (a: ComplaintAboutStudent, b: ComplaintAboutStudent) =>
            new Date(b.submittedAt).getTime() -
            new Date(a.submittedAt).getTime()
        )
      );
    } catch (error) {
      console.error("Failed to fetch complaints", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredComplaints = useMemo(() => {
    if (!searchTerm) return complaints;
    const lowercasedTerm = searchTerm.toLowerCase();
    return complaints.filter(
      (c) =>
        c.studentName.toLowerCase().includes(lowercasedTerm) ||
        c.raisedByName.toLowerCase().includes(lowercasedTerm) ||
        c.complaintText.toLowerCase().includes(lowercasedTerm)
    );
  }, [complaints, searchTerm]);

  return (
    <div>
      <h1 className="text-3xl font-bold text-text-primary-dark mb-6">
        Student Discipline Log
      </h1>
      <Card>
        <Input
          placeholder="Search by student, teacher, or complaint text..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mb-6"
        />

        {loading ? (
          <p>Loading complaint log...</p>
        ) : filteredComplaints.length === 0 ? (
          <p className="text-center text-text-secondary-dark p-8">
            No complaints found matching your criteria.
          </p>
        ) : (
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            {filteredComplaints.map((complaint) => (
              <div
                key={complaint.id}
                className="bg-red-50 border border-red-200 p-4 rounded-lg flex items-start gap-4"
              >
                <div className="flex-shrink-0 text-red-500 mt-1">
                  <AlertTriangleIcon className="w-6 h-6" />
                </div>
                <div className="flex-grow">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-bold text-red-800">
                        Complaint against:{" "}
                        <span className="text-brand-secondary">
                          {complaint.studentName}
                        </span>
                      </p>
                      <p className="text-xs text-red-700">
                        By: {complaint.raisedByName} ({complaint.raisedByRole})
                      </p>
                    </div>
                    <p className="text-xs text-red-600">
                      {new Date(complaint.submittedAt).toLocaleString()}
                    </p>
                  </div>
                  <p className="mt-2 text-sm text-red-900 whitespace-pre-wrap">
                    {complaint.complaintText}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default DisciplineLog;
