import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../hooks/useAuth";
import { TeacherApiService } from "../../services";
import type { Assignment, SchoolClass } from "../../types";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import AssignHomeworkModal from "../../components/modals/AssignHomeworkModal";

const apiService = new TeacherApiService();

const HomeworkHistory: React.FC = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(true);

  // State for Editing
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(
    null
  );

  // NEW: State for Creating
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

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
    // Close whichever modal was open
    setEditingAssignment(null);
    setIsCreateModalOpen(false);

    setSaveStatus("Homework saved successfully!");
    fetchData(); // Refresh list
    setTimeout(() => setSaveStatus(""), 4000);
  };

  return (
    <div>
      {/* HEADER SECTION */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-text-primary-dark">
          Homework History
        </h1>
        {/* NEW BUTTON */}
        <Button onClick={() => setIsCreateModalOpen(true)}>
          Assign Homework
        </Button>
      </div>

      <Card>
        {saveStatus && (
          <p className="text-center text-green-600 mb-4 bg-green-50 p-2 rounded border border-green-200">
            {saveStatus}
          </p>
        )}

        {loading ? (
          <p className="text-center py-8 text-slate-500">Loading homework...</p>
        ) : (
          <div className="space-y-4">
            {assignments.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded border border-dashed border-slate-300">
                <p className="text-text-secondary-dark mb-4">
                  You have not assigned any homework yet.
                </p>
                <Button
                  variant="secondary"
                  onClick={() => setIsCreateModalOpen(true)}
                >
                  Create First Assignment
                </Button>
              </div>
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
                    className="bg-slate-50 p-4 rounded-lg border border-slate-100 open:bg-white open:shadow-sm transition-all"
                    open={!isPastDue}
                  >
                    <summary className="cursor-pointer font-semibold text-text-primary-dark flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-brand-primary">
                          {/* Simple icon or bullet */}•
                        </span>
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
                              e.preventDefault();
                              setEditingAssignment(assignment);
                            }}
                          >
                            Edit
                          </Button>
                        )}
                      </div>
                    </summary>
                    <div className="mt-2 pt-2 border-t border-slate-200 pl-4">
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

      {/* MODAL 1: EDIT MODE */}
      {editingAssignment && (
        <AssignHomeworkModal
          isOpen={!!editingAssignment}
          onClose={() => setEditingAssignment(null)}
          onSave={handleSave}
          assignmentToEdit={editingAssignment}
        />
      )}

      {/* MODAL 2: CREATE MODE (NEW) */}
      <AssignHomeworkModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleSave}
        // No assignmentToEdit passed here, so it acts as Create
      />
    </div>
  );
};

export default HomeworkHistory;
