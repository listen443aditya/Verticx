import React, { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth.ts";
// FIX: Corrected import to use named export
import { StudentApiService } from "../../services";
import type { GradeWithCourse } from "../../types.ts";
import Card from "../../components/ui/Card.tsx";

const apiService = new StudentApiService();

const MyGrades: React.FC = () => {
  const { user } = useAuth();
  const [grades, setGrades] = useState<GradeWithCourse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGrades = async () => {
      if (!user) return;
      setLoading(true);
      try {
        // FIX: Removed the user.id argument to match the service method definition.
        const data = await apiService.getStudentGrades();
        setGrades(data);
      } catch (error) {
        console.error("Failed to fetch grades:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchGrades();
  }, [user]);

  return (
    <div>
      <h1 className="text-3xl font-bold text-text-primary-dark mb-6">
        My Grades
      </h1>
      <Card>
        {loading ? (
          <p>Loading grades...</p>
        ) : grades.length === 0 ? (
          <p className="text-center p-8 text-text-secondary-dark">
            No grades have been recorded yet.
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
    </div>
  );
};

export default MyGrades;
