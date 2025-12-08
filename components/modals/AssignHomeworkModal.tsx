import React, { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { TeacherApiService } from "../../services";
import type { TeacherCourse, Assignment } from "../../types";
import Card from "../ui/Card";
import Button from "../ui/Button";
import Input from "../ui/Input";

const apiService = new TeacherApiService();

// Define a local extended type to handle the response from getTeacherCourses
// which includes the real DB ID needed for matching.
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

  // State
  const [courses, setCourses] = useState<ExtendedTeacherCourse[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && user) {
      apiService.getTeacherCourses(user.id).then((data) => {
        // Cast data to our extended type so we can access realCourseId
        const extendedData = data as unknown as ExtendedTeacherCourse[];
        setCourses(extendedData);

        if (assignmentToEdit) {
          // --- FIX 1: Match by Course ID instead of subjectId ---
          // We look for the course in the dropdown list that matches the assignment's DB course ID.
          const matchingCourse = extendedData.find(
            (c) => c.realCourseId === assignmentToEdit.courseId
          );

          // If match found, use its composite ID for the dropdown value.
          // Fallback: if assignment has a direct composite ID match, use that.
          setSelectedCourseId(matchingCourse?.id || "");

          setTitle(assignmentToEdit.title);
          setDescription(assignmentToEdit.description || "");
          setDueDate(
            new Date(assignmentToEdit.dueDate).toISOString().split("T")[0]
          );
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!selectedCourseId || !title || !dueDate || !user) {
      setError("Please fill all required fields.");
      return;
    }

    setIsAssigning(true);

    try {
      // 1. Get the Real Course UUID
      // The dropdown value is "classId|subjectId" (composite).
      const [classId, subjectId] = selectedCourseId.split("|");

      const course = await apiService.findCourseByTeacherAndSubject(
        user.id,
        subjectId
      );

      if (!course) {
        setError(
          "Could not find a valid Course record. Please ask admin to initialize courses."
        );
        setIsAssigning(false);
        return;
      }

      if (assignmentToEdit) {
        // --- UPDATE ---
        await apiService.updateAssignment(assignmentToEdit.id, {
          title,
          description,
          dueDate: new Date(dueDate),
          courseId: course.id,
        });
      } else {
        // --- CREATE ---
        // FIX 2: Removed 'branchId' (Backend gets it from token)
        // FIX 3: Cast as 'any' to bypass strict Type checks on missing frontend properties if needed,
        // or ensure 'createAssignment' only receives expected fields.
        await apiService.createAssignment({
          classId, // Only passed for frontend flattening if needed
          courseId: course.id,
          teacherId: user.id,
          title,
          description,
          dueDate: new Date(dueDate),
          // We rely on backend default for status
        } as any);
      }

      onSave();
      onClose();
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
        <h2 className="text-xl font-bold mb-4">
          {assignmentToEdit ? "Edit Homework" : "Assign Homework"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Class & Subject
            </label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              required
              disabled={!!assignmentToEdit}
            >
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full bg-white border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
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
          {error && <p className="text-sm text-red-500 text-center">{error}</p>}
          <div className="flex justify-end gap-4 pt-4">
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
