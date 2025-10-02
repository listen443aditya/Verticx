import React, { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth.ts";
import { StudentApiService, SharedApiService } from "../../services";
import type { TeacherComplaint, Teacher, Subject } from "../../types.ts";
import Card from "../../components/ui/Card.tsx";
import Button from "../../components/ui/Button.tsx";
import StudentComplaintModal from "../../components/modals/StudentComplaintModal.tsx";
import { useDataRefresh } from "../../contexts/DataRefreshContext.tsx";

const apiService = new StudentApiService();
const sharedApiService = new SharedApiService();

const RaisedComplaints: React.FC = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<TeacherComplaint[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [isComplaintModalOpen, setIsComplaintModalOpen] = useState(false);
  const { refreshKey, triggerRefresh } = useDataRefresh();

  const fetchData = async () => {
    if (!user?.branchId) return;
    setLoading(true);
    try {
      const [complaintsData, teachersData, subjectsData] = await Promise.all([
        // FIX: Reverted to 0 arguments to satisfy the compiler error.
        apiService.getComplaintsByStudent(),
        (sharedApiService as any).getTeachersByBranch(user.branchId),
        (sharedApiService as any).getSubjectsByBranch(user.branchId),
      ]);
      setComplaints(complaintsData);
      setTeachers(teachersData);
      setSubjects(subjectsData);
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user, refreshKey]);

  const handleMarkResolved = async (complaintId: string) => {
    await apiService.resolveStudentComplaint(complaintId);
    fetchData(); // Refresh the list
  };

  // FIX: This function handles both closing and post-submit actions.
  const handleModalClose = () => {
    setIsComplaintModalOpen(false);
    triggerRefresh();
  };

  const getStatusChip = (status: "Open" | "Resolved by Student") => {
    return status === "Open"
      ? "bg-yellow-100 text-yellow-800"
      : "bg-green-100 text-green-800";
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-text-primary-dark">
          My Raised Complaints
        </h1>
        <Button onClick={() => setIsComplaintModalOpen(true)}>
          Raise New Complaint
        </Button>
      </div>
      <Card>
        <p className="mb-6 text-text-secondary-dark">
          This section lists the complaints you have submitted. You can mark a
          complaint as resolved if the issue has been addressed to your
          satisfaction.
        </p>

        {loading ? (
          <p>Loading complaints...</p>
        ) : complaints.length === 0 ? (
          <div className="text-center p-8">
            <p className="text-text-secondary-dark">
              You have not raised any complaints.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {complaints.map((complaint) => (
              <details
                key={complaint.id}
                className="bg-slate-50 p-4 rounded-lg"
                open={complaint.status === "Open"}
              >
                <summary className="cursor-pointer font-semibold text-text-primary-dark flex justify-between items-center">
                  <div>
                    {complaint.subject}
                    {complaint.teacherName ? (
                      <span className="font-normal text-text-secondary-dark">
                        {" "}
                        (against {complaint.teacherName})
                      </span>
                    ) : (
                      <span className="font-normal text-text-secondary-dark">
                        {" "}
                        (General Complaint)
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusChip(
                        complaint.status
                      )}`}
                    >
                      {complaint.status}
                    </span>
                    <span className="text-sm font-normal text-text-secondary-dark">
                      {new Date(complaint.submittedAt).toLocaleDateString()}
                    </span>
                  </div>
                </summary>
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <p className="text-sm text-text-primary-dark whitespace-pre-wrap">
                    {complaint.complaintText}
                  </p>
                  {complaint.status === "Open" && (
                    <div className="text-right mt-4">
                      <Button onClick={() => handleMarkResolved(complaint.id)}>
                        Mark as Resolved
                      </Button>
                    </div>
                  )}
                </div>
              </details>
            ))}
          </div>
        )}
      </Card>

      {/* FIX: The modal now receives the simple `handleModalClose` function for onSubmit */}
      {isComplaintModalOpen && (
        <StudentComplaintModal
          teachers={teachers}
          subjects={subjects}
          onSubmit={handleModalClose}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
};

export default RaisedComplaints;
