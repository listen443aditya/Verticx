import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../hooks/useAuth";
import { TeacherApiService } from "../../services"; // Ensure this path is correct
import type { Student, StudentProfile } from "../../types";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import StudentDetailModal from "../../components/modals/StudentDetailModal";
import RaiseComplaintModal from "../../components/modals/RaiseComplaintModal";

const apiService = new TeacherApiService();

const StudentInformation: React.FC = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); // New error state
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
      setError("Failed to load student list. Please try again.");
    } finally {
      setLoading(false); // Ensure this always runs
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleViewStudent = async (studentId: string) => {
    setDetailsLoading(true);
    try {
      const profile = await apiService.getStudentProfileDetails(studentId);
      setViewingStudent(profile);
    } catch (err) {
      console.error("Failed to load details:", err);
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
      s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.userId && s.userId.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div>
      <h1 className="text-3xl font-bold text-text-primary-dark mb-6">
        Student Information
      </h1>
      <Card>
        <div className="flex justify-between items-center mb-4 gap-4">
          <Input
            placeholder="Search students by name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-1/2"
          />
          <Button variant="secondary" onClick={fetchData} title="Refresh List">
            Refresh
          </Button>
        </div>

        {complaintStatus && (
          <p className="text-center text-green-600 mb-4 bg-green-50 p-2 rounded">
            {complaintStatus}
          </p>
        )}
        {error && (
          <p className="text-center text-red-600 mb-4 bg-red-50 p-2 rounded">
            {error}
          </p>
        )}

        {loading ? (
          <div className="text-center py-8 text-slate-500">
            Loading students...
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            No students found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b bg-slate-50">
                <tr>
                  <th className="p-4 font-semibold text-slate-700">Name</th>
                  <th className="p-4 font-semibold text-slate-700">
                    Student ID
                  </th>
                  <th className="p-4 font-semibold text-slate-700">Class</th>
                  <th className="p-4 text-center font-semibold text-slate-700">
                    School Rank
                  </th>
                  <th className="p-4 text-right font-semibold text-slate-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((student) => (
                  <tr
                    key={student.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="p-4 font-medium text-slate-900">
                      {student.name}
                    </td>
                    <td className="p-4 font-mono text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded w-fit inline-block">
                      {student.userId}
                    </td>
                    {/* Note: Ideally 'student' object should already contain class details to avoid N+1 API calls inside map */}
                    <td className="p-4 text-slate-600">
                      {student.classId ? `Class ID: ${student.classId}` : "N/A"}
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
                          View Details
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {detailsLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white p-4 rounded-lg shadow-lg">
            <p className="text-slate-800 font-medium animate-pulse">
              Loading student profile...
            </p>
          </div>
        </div>
      )}

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
