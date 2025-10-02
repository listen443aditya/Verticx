import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../hooks/useAuth.ts";
import { TeacherApiService } from "../../services";
import type { Assignment, SchoolClass } from "../../types.ts";
import Card from "../../components/ui/Card.tsx";
import Button from "../../components/ui/Button.tsx";
import AssignHomeworkModal from "../../components/modals/AssignHomeworkModal.tsx";

const apiService = new TeacherApiService();

const HomeworkHistory: React.FC = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(
    null
  );
  const [saveStatus, setSaveStatus] = useState("");

  const fetchData = useCallback(async () => {
    if (!user?.branchId) return;
    setLoading(true);
    try {
      const [assignmentsData, classesData] = await Promise.all([
        apiService.getAssignmentsByTeacher(user.id),
        apiService.getSchoolClassesByBranch(user.branchId),
      ]);
      setAssignments(
        assignmentsData.sort(
          (a, b) =>
            new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()
        )
      );
      setClasses(classesData);
    } catch (error) {
      console.error("Failed to fetch homework data:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = () => {
    setEditingAssignment(null);
    setSaveStatus("Homework saved successfully!");
    fetchData();
    setTimeout(() => setSaveStatus(""), 4000);
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-text-primary-dark mb-6">
        Homework History
      </h1>
      <Card>
        {saveStatus && (
          <p className="text-center text-green-600 mb-4">{saveStatus}</p>
        )}
        {loading ? (
          <p>Loading homework...</p>
        ) : (
          <div className="space-y-4">
            {assignments.length === 0 ? (
              <p className="text-center text-text-secondary-dark p-8">
                You have not assigned any homework yet.
              </p>
            ) : (
              assignments.map((assignment) => {
                const isPastDue = new Date(assignment.dueDate) < new Date();

                let courseName = assignment.courseName;
                if (!courseName) {
                  const schoolClass = classes.find(
                    (c) => c.id === assignment.classId
                  );
                  courseName = schoolClass
                    ? `Class ${schoolClass.gradeLevel}-${schoolClass.section}`
                    : "Unknown Class";
                }

                return (
                  <details
                    key={assignment.id}
                    className="bg-slate-50 p-4 rounded-lg"
                    open={!isPastDue}
                  >
                    <summary className="cursor-pointer font-semibold text-text-primary-dark flex justify-between items-center">
                      <div>
                        {assignment.title}
                        <span className="font-normal text-sm text-text-secondary-dark ml-2">
                          ({courseName})
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span
                          className={`text-sm font-medium ${
                            isPastDue ? "text-slate-500" : "text-red-600"
                          }`}
                        >
                          Due:{" "}
                          {new Date(assignment.dueDate).toLocaleDateString()}
                        </span>
                        {!isPastDue && (
                          <Button
                            variant="secondary"
                            className="!px-2 !py-1 text-xs"
                            onClick={(e) => {
                              e.preventDefault(); // prevent details from closing
                              setEditingAssignment(assignment);
                            }}
                          >
                            Edit
                          </Button>
                        )}
                      </div>
                    </summary>
                    <div className="mt-2 pt-2 border-t border-slate-200">
                      <p className="text-sm text-text-primary-dark whitespace-pre-wrap">
                        {assignment.description || "No description provided."}
                      </p>
                    </div>
                  </details>
                );
              })
            )}
          </div>
        )}
      </Card>
      {/* FIX: This specific modal requires the 'isOpen' prop. It is now provided. */}
      {editingAssignment && (
        <AssignHomeworkModal
          isOpen={!!editingAssignment}
          onClose={() => setEditingAssignment(null)}
          onSave={handleSave}
          assignmentToEdit={editingAssignment}
        />
      )}
    </div>
  );
};

export default HomeworkHistory;
