import React, { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { TeacherApiService } from "../../services";
import type { TeacherCourse, Assignment } from "../../types";
import Card from "../ui/Card";
import Button from "../ui/Button";
import Input from "../ui/Input";

const apiService = new TeacherApiService();

// Extended interface to handle the 'realCourseId' sent by backend
interface ExtendedTeacherCourse extends TeacherCourse {
  realCourseId?: string | null;
}

interface AssignHomeworkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  assignmentToEdit?: Assignment | null;
}

const AssignHomeworkModal: React.FC<AssignHomeworkModalProps> = ({
  isOpen,
  onClose,
  onSave,
  assignmentToEdit,
}) => {
  const { user } = useAuth();

  // Data State
  const [courses, setCourses] = useState<ExtendedTeacherCourse[]>([]);

  // Form State
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");

  // UI State
  const [isAssigning, setIsAssigning] = useState(false);
  const [error, setError] = useState("");

  // 1. Load Data & Initialize Form
  useEffect(() => {
    if (isOpen && user) {
      apiService.getTeacherCourses(user.id).then((data) => {
        const extendedData = data as unknown as ExtendedTeacherCourse[];
        setCourses(extendedData);

        if (assignmentToEdit) {
          // --- EDIT MODE ---
          setTitle(assignmentToEdit.title);
          setDescription(assignmentToEdit.description || "");
          setDueDate(
            new Date(assignmentToEdit.dueDate).toISOString().split("T")[0]
          );

          // MATCHING LOGIC: Find the correct dropdown option
          let matchedCourse = extendedData.find(
            (c) => c.realCourseId === assignmentToEdit.courseId
          );

          // Fallback: If no match by courseId, try matching by classId (legacy/fallback)
          if (!matchedCourse && assignmentToEdit.classId) {
            matchedCourse = extendedData.find(
              (c) => c.classId === assignmentToEdit.classId
            );
          }

          // Set the state. If still no match, default to "" (user must select manually)
          if (matchedCourse) {
            setSelectedCourseId(matchedCourse.id);
          } else {
            // OPTIONAL: Default to first item if we really can't match?
            // Better to leave empty so user is forced to correct it.
            setSelectedCourseId("");
          }
        } else {
          // --- CREATE MODE ---
          if (extendedData.length > 0) setSelectedCourseId(extendedData[0].id);
          else setSelectedCourseId("");

          setTitle("");
          setDescription("");
          setDueDate("");
        }
      });
    }
  }, [isOpen, user, assignmentToEdit]);

  // 2. Handle Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // DEBUGGING: Check what is actually empty in the console
    if (!selectedCourseId || !title || !dueDate || !user) {
      console.error("Validation Failed:", {
        selectedCourseId,
        title,
        dueDate,
        user: !!user,
      });

      let missing = [];
      if (!selectedCourseId) missing.push("Class & Subject");
      if (!title) missing.push("Title");
      if (!dueDate) missing.push("Due Date");

      setError(`Please fill required fields: ${missing.join(", ")}`);
      return;
    }

    setIsAssigning(true);

    try {
      // The dropdown value is "classId|subjectId" (composite).
      const [classId, subjectId] = selectedCourseId.split("|");

      // Get the Real Course UUID needed for database linking
      const course = await apiService.findCourseByTeacherAndSubject(
        user.id,
        subjectId
      );

      if (!course) {
        setError(
          "Database Error: Course record not found for this subject. Contact admin."
        );
        setIsAssigning(false);
        return;
      }

      const payload = {
        title,
        description,
        dueDate: new Date(dueDate),
        courseId: course.id,
      };

      if (assignmentToEdit) {
        // --- UPDATE ---
        await apiService.updateAssignment(assignmentToEdit.id, payload);
      } else {
        // --- CREATE ---
        // Add create-only fields
        await apiService.createAssignment({
          ...payload,
          teacherId: user.id,
          // Note: We don't send 'classId' or 'branchId' explicitly if the backend handles them via relations/token
          // But to satisfy types if needed, you might cast or add them.
          // Based on previous fixes, we removed explicit 'branchId' from frontend payload.
        } as any);
      }

      onSave(); // Refresh parent
      onClose(); // Close modal
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to save homework.");
    } finally {
      setIsAssigning(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg">
        <h2 className="text-xl font-bold text-text-primary-dark mb-4">
          {assignmentToEdit ? "Edit Homework" : "Assign Homework"}
        </h2>

        {error && (
          <div className="mb-4 p-2 bg-red-50 text-red-600 text-sm rounded border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary-dark mb-1">
              Class & Subject <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
              required
              // Enable dropdown even in edit mode so user can fix a "lost" selection
              disabled={false}
            >
              <option value="">-- Select Class & Subject --</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Homework Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <div>
            <label className="block text-sm font-medium text-text-secondary-dark mb-1">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full bg-white border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
            />
          </div>

          <Input
            label="Due Date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            required
            min={new Date().toISOString().split("T")[0]}
          />

          <div className="flex justify-end gap-4 pt-4 border-t border-slate-100 mt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isAssigning}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isAssigning}>
              {isAssigning ? "Saving..." : "Save Homework"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default AssignHomeworkModal;
