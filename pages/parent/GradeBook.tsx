// pages/parent/GradeBook.tsx
import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../hooks/useAuth.ts";
import { ParentApiService } from "../../services/parentApiService";
import type { Student, GradeWithCourse, StudentProfile } from "../../types.ts";
import Card from "../../components/ui/Card.tsx";

const apiService = new ParentApiService();

const GradeBook: React.FC = () => {
  const { user } = useAuth();
  const [children, setChildren] = useState<Student[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>("");
  const [grades, setGrades] = useState<GradeWithCourse[]>([]);

  // --- FIX: Initialize loading based on whether we actually have a user yet ---
  const [loading, setLoading] = useState(true);
  const [gradesLoading, setGradesLoading] = useState(false);

  useEffect(() => {
    const fetchChildren = async () => {
      // 1. If no user, wait.
      if (!user) return;

      // 2. If user exists but has no children IDs, stop loading.
      if (!user.childrenIds || user.childrenIds.length === 0) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // 3. Fetch profiles for all children
        const profiles = await Promise.all(
          user.childrenIds.map((id) => apiService.getStudentProfileDetails(id))
        );

        // 4. Filter out any null responses and extract the student object
        const childrenData = profiles
          .filter((p): p is StudentProfile => p !== null)
          .map((p) => p.student);

        setChildren(childrenData);

        // 5. Automatically select the first child
        if (childrenData.length > 0) {
          setSelectedChildId(childrenData[0].id);
        }
      } catch (error) {
        console.error("Failed to fetch children:", error);
      } finally {
        // 6. ALWAYS turn off loading
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
