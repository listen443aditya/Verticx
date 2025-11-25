// pages/parent/GradeBook.tsx
import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../hooks/useAuth.ts";
import { ParentApiService } from "../../services/parentApiService";
import type { Student, GradeWithCourse } from "../../types.ts";
import Card from "../../components/ui/Card.tsx";

const apiService = new ParentApiService();

const GradeBook: React.FC = () => {
  const { user } = useAuth();
  const [children, setChildren] = useState<Student[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>("");
  const [grades, setGrades] = useState<GradeWithCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [gradesLoading, setGradesLoading] = useState(false);

  // --- FIX: Fetch children list from backend, don't rely on session user.childrenIds ---
  useEffect(() => {
    const fetchChildren = async () => {
      if (!user) return;
      setLoading(true);
      try {
        // We use getParentDashboardData because it returns the full list of children
        // associated with the parent, guaranteed.
        const dashboardData = await apiService.getParentDashboardData();

        if (dashboardData && dashboardData.childrenData) {
          const students = dashboardData.childrenData.map(
            (child) => child.student
          );
          setChildren(students);

          // Automatically select the first child
          if (students.length > 0) {
            setSelectedChildId(students[0].id);
          }
        }
      } catch (error) {
        console.error("Failed to fetch children:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchChildren();
  }, [user]);

  const fetchGrades = useCallback(async () => {
    if (!selectedChildId) return;
    setGradesLoading(true);
    try {
      const data = await apiService.getStudentGrades(selectedChildId);
      setGrades(data);
    } catch (error) {
      console.error("Failed to fetch grades", error);
    } finally {
      setGradesLoading(false);
    }
  }, [selectedChildId]);

  useEffect(() => {
    if (selectedChildId) {
      fetchGrades();
    }
  }, [selectedChildId, fetchGrades]);

  if (loading)
    return <div className="p-8 text-center">Loading student data...</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold text-text-primary-dark mb-6">
        Grade Book
      </h1>

      {children.length === 0 ? (
        <Card>
          <p className="text-center p-4">
            No student profiles found linked to your account.
          </p>
        </Card>
      ) : (
        <Card>
          {children.length > 1 && (
            <div className="flex items-center gap-4 mb-6 pb-4 border-b">
              <label htmlFor="child-select" className="font-medium">
                Viewing grades for:
              </label>
              <select
                id="child-select"
                value={selectedChildId}
                onChange={(e) => setSelectedChildId(e.target.value)}
                className="bg-white border border-slate-300 rounded-md py-2 px-3"
              >
                {children.map((child) => (
                  <option key={child.id} value={child.id}>
                    {child.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {gradesLoading ? (
            <p className="text-center py-8">Loading grades...</p>
          ) : grades.length === 0 ? (
            <p className="text-center p-8 text-text-secondary-dark">
              No grades have been recorded for{" "}
              {children.find((c) => c.id === selectedChildId)?.name}.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="border-b border-slate-200 text-sm text-text-secondary-dark">
                  <tr>
                    <th className="p-4">Course</th>
                    <th className="p-4">Assessment</th>
                    <th className="p-4 text-center">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {grades.map((grade, index) => (
                    <tr
                      key={`${grade.studentId}-${grade.courseId}-${grade.assessment}-${index}`}
                      className="border-b border-slate-100 hover:bg-slate-50"
                    >
                      <td className="p-4 font-medium">{grade.courseName}</td>
                      <td className="p-4">{grade.assessment}</td>
                      <td className="p-4 text-center">
                        <span
                          className={`font-bold ${
                            grade.score >= 80
                              ? "text-green-600"
                              : grade.score >= 60
                              ? "text-yellow-600"
                              : "text-red-600"
                          }`}
                        >
                          {grade.score}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default GradeBook;
