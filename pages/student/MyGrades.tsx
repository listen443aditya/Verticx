import React, { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { StudentApiService } from "../../services";
import type { GradeWithCourse } from "../../types";
import Card from "../../components/ui/Card";

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
          <p className="p-4 text-slate-500">Loading grades...</p>
        ) : grades.length === 0 ? (
          <p className="text-center p-8 text-text-secondary-dark">
            No grades have been recorded yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="border-b border-slate-200 text-sm text-text-secondary-dark bg-slate-50">
                <tr>
                  <th className="p-4 font-semibold">Type</th>
                  <th className="p-4 font-semibold">Course</th>
                  <th className="p-4 font-semibold">Assessment</th>
                  <th className="p-4 font-semibold text-center">Score</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {grades.map((grade, index) => (
                  <tr
                    key={`${grade.studentId}-${grade.courseId || "nocourse"}-${
                      grade.assessment
                    }-${index}`}
                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                  >
                    <td className="p-4">
                      {/* FIX: Added specific style for 'Assignment' */}
                      <span
                        className={`text-xs font-bold px-2 py-1 rounded border ${
                          grade.type === "Quiz"
                            ? "bg-purple-50 text-purple-700 border-purple-200"
                            : grade.type === "Exam"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : grade.type === "Assignment"
                            ? "bg-orange-50 text-orange-700 border-orange-200"
                            : "bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        {grade.type || "Grade"}
                      </span>
                    </td>
                    <td className="p-4 font-medium text-slate-700">
                      {grade.courseName}
                    </td>
                    <td className="p-4 text-slate-600">{grade.assessment}</td>
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
