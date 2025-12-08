import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "../../hooks/useAuth";
import { TeacherApiService } from "../../services";
import type { MarkingTemplate, Student } from "../../types";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import ConfirmationModal from "../../components/ui/ConfirmationModal";

const apiService = new TeacherApiService();

// Extended type to match the backend response
interface ExtendedTeacherCourse {
  id: string; // Composite "classId|subjectId"
  name: string;
  realCourseId: string | null; // The actual UUID from the database (or null if not initialized)
  classId: string;
  subjectId: string;
}

// --- 1. Define Modal Component Outside Main Component ---
const TemplateFormModal: React.FC<{
  courseId: string;
  onClose: () => void;
  onSave: () => void;
}> = ({ courseId, onClose, onSave }) => {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [totalMarks, setTotalMarks] = useState(100);
  const [weightage, setWeightage] = useState(20);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);
    try {
      await apiService.createMarkingTemplate({
        teacherId: user.id,
        courseId,
        name,
        totalMarks,
        weightage,
      } as Omit<MarkingTemplate, "id">);
      onSave();
    } catch (e) {
      console.error(e);
      alert("Failed to create template");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg">
        <h2 className="text-xl font-bold mb-4">Create Marking Template</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Template Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Midterm Exam"
            required
          />
          <Input
            label="Total Marks"
            type="number"
            value={String(totalMarks)}
            onChange={(e) => setTotalMarks(Number(e.target.value))}
            required
            min="1"
          />
          <Input
            label="Weightage (%)"
            type="number"
            value={String(weightage)}
            onChange={(e) => setWeightage(Number(e.target.value))}
            required
            min="1"
            max="100"
          />
          <div className="flex justify-end gap-4 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Create Template"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

const Gradebook: React.FC = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<ExtendedTeacherCourse[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [activeTab, setActiveTab] = useState<"templates" | "marks">(
    "templates"
  );

  // Templates state
  const [templates, setTemplates] = useState<MarkingTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [deletingTemplate, setDeletingTemplate] =
    useState<MarkingTemplate | null>(null);
  const [initializing, setInitializing] = useState(false);

  // Derived state for the REAL DB ID
  const selectedCourseObj = useMemo(
    () => courses.find((c) => c.id === selectedCourseId),
    [courses, selectedCourseId]
  );
  const realCourseId = selectedCourseObj?.realCourseId;

  // Marks Entry state
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [marks, setMarks] = useState<Record<string, number | undefined>>({});
  const [loadingMarks, setLoadingMarks] = useState(false);
  const [isSavingMarks, setIsSavingMarks] = useState(false);

  // --- 2. Define Fetch Functions ---

  const fetchCourses = useCallback(async () => {
    if (!user) return;
    const data = await apiService.getTeacherCourses(user.id);
    // Cast response to our Extended interface
    setCourses(data as unknown as ExtendedTeacherCourse[]);

    // If we have courses but none selected, select the first one
    if (data.length > 0) {
      // We use a functional update to avoid resetting if user already selected something valid
      setSelectedCourseId((prev) => prev || data[0].id);
    }
  }, [user]);

  const fetchTemplates = useCallback(async () => {
    if (!realCourseId || !user) {
      setTemplates([]);
      return;
    }
    setLoadingTemplates(true);
    try {
      const data = await apiService.getMarkingTemplatesForCourse(realCourseId);
      setTemplates(data);
      // Auto-select first template if none selected or current one is gone
      if (data.length > 0) {
        setSelectedTemplateId((prev) =>
          data.find((t) => t.id === prev) ? prev : data[0].id
        );
      } else {
        setSelectedTemplateId("");
      }
    } catch (e) {
      console.error("Failed to load templates", e);
    } finally {
      setLoadingTemplates(false);
    }
  }, [realCourseId, user]);

  const fetchStudentsAndMarks = useCallback(async () => {
    if (!selectedTemplateId || !selectedCourseId) {
      setStudents([]);
      setMarks({});
      return;
    }
    setLoadingMarks(true);

    try {
      const [classId] = selectedCourseId.split("|");
      const studentData = await apiService.getStudentsForClass(classId);
      setStudents(studentData);

      const marksData = await apiService.getStudentMarksForTemplate(
        selectedTemplateId
      );
      const marksMap = marksData.reduce((acc, mark) => {
        acc[mark.studentId] = mark.marksObtained;
        return acc;
      }, {} as Record<string, number>);
      setMarks(marksMap);
    } catch (error) {
      console.error("Failed to load marks", error);
    } finally {
      setLoadingMarks(false);
    }
  }, [selectedTemplateId, selectedCourseId]);

  // --- 3. Effects ---

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  useEffect(() => {
    // Only fetch students when in Marks tab
    if (activeTab === "marks") {
      fetchStudentsAndMarks();
    }
  }, [fetchStudentsAndMarks, activeTab]);

  // --- 4. Define Helper Functions ---

  const handleMarkChange = (studentId: string, value: string) => {
    const numValue = value === "" ? undefined : Number(value);
    setMarks((prev) => ({ ...prev, [studentId]: numValue }));
  };

  const handleSaveMarks = async () => {
    if (!selectedTemplateId) return;
    setIsSavingMarks(true);
    try {
      const marksToSave = Object.entries(marks)
        .filter(([, value]) => value !== undefined)
        .map(([studentId, marksObtained]) => ({
          studentId,
          marksObtained: marksObtained as number,
        }));

      await apiService.saveStudentMarks(selectedTemplateId, marksToSave);
      await fetchStudentsAndMarks(); // Refresh data
      alert("Marks saved successfully.");
    } catch (error) {
      alert("Failed to save marks.");
    } finally {
      setIsSavingMarks(false);
    }
  };

  const handleDeleteTemplate = async () => {
    if (!deletingTemplate) return;
    try {
      await apiService.deleteMarkingTemplate(deletingTemplate.id);
      setDeletingTemplate(null);
      fetchTemplates();
    } catch (error) {
      alert("Failed to delete template.");
    }
  };

  const handleInitialize = async () => {
    if (!selectedCourseObj) return;
    setInitializing(true);
    try {
      await apiService.initializeCourse(
        selectedCourseObj.classId,
        selectedCourseObj.subjectId
      );
      await fetchCourses(); // Refresh list to get the new realCourseId
      alert("Gradebook initialized! You can now create templates.");
    } catch (e) {
      alert("Failed to initialize gradebook.");
    } finally {
      setInitializing(false);
    }
  };

  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === selectedTemplateId),
    [templates, selectedTemplateId]
  );

  // --- 5. Render ---

  return (
    <div>
      <h1 className="text-3xl font-bold text-text-primary-dark mb-6">
        Gradebook
      </h1>
      <Card>
        <div className="flex justify-between items-center mb-6 pb-4 border-b">
          <div>
            <label className="block text-sm font-medium text-text-secondary-dark mb-1">
              Select Subject
            </label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="bg-surface-dark border border-slate-300 rounded-md py-2 px-3 w-72"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* CHECK IF INITIALIZED */}
        {!realCourseId ? (
          <div className="text-center py-12 bg-slate-50 rounded-lg border border-dashed border-slate-300">
            <p className="text-lg font-semibold text-slate-700 mb-2">
              Gradebook Not Initialized
            </p>
            <p className="text-slate-500 mb-6">
              You need to initialize the gradebook for{" "}
              <strong>{selectedCourseObj?.name}</strong> before creating
              templates.
            </p>
            <Button onClick={handleInitialize} disabled={initializing}>
              {initializing ? "Initializing..." : "Initialize Gradebook Now"}
            </Button>
          </div>
        ) : (
          <>
            <div className="flex border-b mb-4">
              <button
                onClick={() => setActiveTab("templates")}
                className={`px-4 py-2 ${
                  activeTab === "templates"
                    ? "border-b-2 border-brand-primary font-medium"
                    : "text-slate-600"
                }`}
              >
                Manage Templates
              </button>
              <button
                onClick={() => setActiveTab("marks")}
                className={`px-4 py-2 ${
                  activeTab === "marks"
                    ? "border-b-2 border-brand-primary font-medium"
                    : "text-slate-600"
                }`}
              >
                Enter Marks
              </button>
            </div>

            {activeTab === "templates" && (
              <div>
                <Button onClick={() => setShowTemplateModal(true)}>
                  Create New Template
                </Button>
                <div className="mt-4 space-y-2">
                  {loadingTemplates ? (
                    <p className="text-center py-4 text-slate-500">
                      Loading templates...
                    </p>
                  ) : (
                    templates.map((t) => (
                      <div
                        key={t.id}
                        className="bg-slate-50 p-3 rounded flex justify-between items-center border border-slate-100"
                      >
                        <div>
                          <p className="font-semibold text-slate-800">
                            {t.name}
                          </p>
                          <p className="text-sm text-slate-600">
                            Total Marks: {t.totalMarks} | Weightage:{" "}
                            {t.weightage}%
                          </p>
                        </div>
                        <Button
                          variant="danger"
                          className="!px-3 !py-1 text-xs"
                          onClick={() => setDeletingTemplate(t)}
                        >
                          Delete
                        </Button>
                      </div>
                    ))
                  )}
                  {!loadingTemplates && templates.length === 0 && (
                    <p className="text-slate-500 italic text-center py-8">
                      No templates created yet. Click "Create New Template" to
                      start.
                    </p>
                  )}
                </div>
              </div>
            )}

            {activeTab === "marks" && (
              <div>
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary-dark mb-1">
                      Select Template
                    </label>
                    <select
                      value={selectedTemplateId}
                      onChange={(e) => setSelectedTemplateId(e.target.value)}
                      className="bg-surface-dark border border-slate-300 rounded-md py-2 px-3 w-72"
                    >
                      <option value="">-- Select a template --</option>
                      {templates.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button
                    onClick={handleSaveMarks}
                    disabled={isSavingMarks || !selectedTemplateId}
                  >
                    {isSavingMarks ? "Saving..." : "Save Marks"}
                  </Button>
                </div>

                {loadingMarks ? (
                  <p className="text-center py-8 text-slate-500">
                    Loading students...
                  </p>
                ) : (
                  selectedTemplate && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead className="border-b bg-slate-50">
                          <tr>
                            <th className="p-3 font-semibold text-slate-700">
                              Student Name
                            </th>
                            <th className="p-3 font-semibold text-slate-700 w-40">
                              Marks Obtained
                            </th>
                            <th className="p-3 font-semibold text-slate-700">
                              Weighted Score
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {students.map((s) => {
                            const marksObtained = marks[s.id];
                            const weightedScore =
                              marksObtained !== undefined && selectedTemplate
                                ? (marksObtained /
                                    selectedTemplate.totalMarks) *
                                  selectedTemplate.weightage
                                : null;

                            return (
                              <tr
                                key={s.id}
                                className="hover:bg-slate-50 transition-colors"
                              >
                                <td className="p-3 font-medium text-slate-900">
                                  {s.name}
                                </td>
                                <td className="p-3">
                                  <div className="flex items-center gap-2">
                                    <Input
                                      type="number"
                                      value={marksObtained ?? ""}
                                      onChange={(e) =>
                                        handleMarkChange(s.id, e.target.value)
                                      }
                                      className="w-24 text-right"
                                    />
                                    <span className="text-slate-400 text-sm">
                                      / {selectedTemplate.totalMarks}
                                    </span>
                                  </div>
                                </td>
                                <td className="p-3 font-mono text-slate-600">
                                  {weightedScore !== null
                                    ? `${weightedScore.toFixed(2)}`
                                    : "-"}
                                  <span className="text-xs text-slate-400 ml-1">
                                    / {selectedTemplate.weightage}%
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )
                )}
              </div>
            )}
          </>
        )}
      </Card>

      {showTemplateModal && realCourseId && (
        <TemplateFormModal
          courseId={realCourseId}
          onClose={() => setShowTemplateModal(false)}
          onSave={() => {
            setShowTemplateModal(false);
            fetchTemplates();
          }}
        />
      )}

      {deletingTemplate && (
        <ConfirmationModal
          isOpen={!!deletingTemplate}
          onClose={() => setDeletingTemplate(null)}
          onConfirm={handleDeleteTemplate}
          title="Delete Template"
          message={`Are you sure you want to delete "${deletingTemplate.name}"?`}
        />
      )}
    </div>
  );
};

export default Gradebook;
