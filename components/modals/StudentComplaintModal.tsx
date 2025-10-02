import React, { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
// Correctly import the service class from its file and create an instance.
import { StudentApiService } from "../../services/studentApiService";
import type { Student, Teacher, Subject } from "../../types";
import Card from "../ui/Card";
import Button from "../ui/Button";

const apiService = new StudentApiService();

interface StudentComplaintModalProps {
  teachers: Teacher[];
  subjects: Subject[];
  onClose: () => void;
  onSubmit: () => void;
}

const StudentComplaintModal: React.FC<StudentComplaintModalProps> = ({
  teachers,
  subjects,
  onClose,
  onSubmit,
}) => {
  const { user } = useAuth();
  const [complaintText, setComplaintText] = useState("");
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (teachers.length > 0) {
      setSelectedTeacherId(teachers[0].id);
    }
    if (subjects.length > 0) {
      setSelectedSubject(subjects[0].name);
    }
  }, [teachers, subjects]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !complaintText.trim() ||
      !user ||
      !selectedTeacherId ||
      !selectedSubject
    )
      return;

    setIsSubmitting(true);
    try {
      // FIX: The status of a newly created complaint must be 'Open' to match the type definition.
      await apiService.submitTeacherComplaint({
        studentId: user.id,
        teacherId: selectedTeacherId,
        subject: selectedSubject,
        complaintText: complaintText,
        status: "Open",
      });
      onSubmit();
    } catch (error) {
      console.error("Failed to submit complaint:", error);
      alert("An error occurred while submitting the complaint.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg">
        <h2 className="text-xl font-bold mb-2">Raise a Complaint</h2>
        <p className="text-sm text-text-secondary-dark mb-4">
          Your complaint will be sent directly to the school administration for
          review. Please be as detailed as possible.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary-dark mb-1">
                Select Teacher
              </label>
              <select
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-md py-2 px-3"
                required
              >
                <option value="" disabled>
                  -- Choose a teacher --
                </option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary-dark mb-1">
                Regarding Subject
              </label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-md py-2 px-3"
                required
              >
                <option value="" disabled>
                  -- Choose a subject --
                </option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.name}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary-dark mb-1">
              Complaint Details
            </label>
            <textarea
              value={complaintText}
              onChange={(e) => setComplaintText(e.target.value)}
              rows={5}
              className="w-full bg-white border border-slate-300 rounded-md py-2 px-3"
              required
              placeholder="Describe your issue here..."
            />
          </div>
          <div className="flex justify-end gap-4 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              disabled={
                isSubmitting ||
                !complaintText.trim() ||
                !selectedTeacherId ||
                !selectedSubject
              }
            >
              {isSubmitting ? "Submitting..." : "Submit Complaint"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default StudentComplaintModal;
