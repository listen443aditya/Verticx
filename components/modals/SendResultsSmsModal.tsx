import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../hooks/useAuth";
// FIX: Correctly import the service class from its file and create an instance.
import { PrincipalApiService } from "../../services/principalApiService";
import type { Examination, StudentWithExamMarks } from "../../types";
import Card from "../ui/Card";
import Button from "../ui/Button";

const apiService = new PrincipalApiService();

interface SendResultsSmsModalProps {
  examination: Examination;
  onClose: () => void;
}

const DEFAULT_TEMPLATE = `Dear Parent, the results for {examName} for your ward {studentName} are as follows: {marksList}. Thank you, {schoolName}.`;

const SendResultsSmsModal: React.FC<SendResultsSmsModalProps> = ({
  examination,
  onClose,
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [studentsWithMarks, setStudentsWithMarks] = useState<
    StudentWithExamMarks[]
  >([]);
  const [messageTemplate, setMessageTemplate] = useState(DEFAULT_TEMPLATE);
  const [isSending, setIsSending] = useState(false);
  const [sendStatus, setSendStatus] = useState("");

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const data = await apiService.getStudentResultsForExamination(
      examination.id
    );
    setStudentsWithMarks(data);
    setLoading(false);
  }, [examination.id, user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const renderPreview = () => {
    if (studentsWithMarks.length === 0) {
      return "No students to preview.";
    }
    const previewStudent = studentsWithMarks[0];
    const marksList = previewStudent.marks
      .map((m) => `${m.subjectName}: ${m.score}/${m.totalMarks}`)
      .join(", ");

    let previewMessage = messageTemplate
      .replace("{examName}", examination.name)
      .replace("{studentName}", previewStudent.student.name)
      .replace("{marksList}", marksList)
      .replace("{schoolName}", user?.schoolName || "Your School");

    return previewMessage;
  };

  const handleSend = async () => {
    if (!user || studentsWithMarks.length === 0) return;
    setIsSending(true);
    setSendStatus("");
    try {
      // FIX: The `sendResultsSms` method in the new service expects only two arguments.
      // The branchId is inferred by the backend from the user's session.
      await apiService.sendResultsSms(examination.id, messageTemplate);
      setSendStatus(
        `SMS sent to parents of ${studentsWithMarks.length} students successfully!`
      );
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error(error);
      setSendStatus("Failed to send SMS. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl">
        <h2 className="text-xl font-bold mb-4">
          Send Result SMS for {examination.name}
        </h2>

        {loading ? (
          <p>Loading student results...</p>
        ) : studentsWithMarks.length === 0 ? (
          <p className="text-center text-text-secondary-dark p-8">
            No student results found for this examination.
          </p>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary-dark mb-1">
                Message Template
              </label>
              <textarea
                value={messageTemplate}
                onChange={(e) => setMessageTemplate(e.target.value)}
                rows={5}
                className="w-full bg-white border border-slate-300 rounded-md py-2 px-3"
                disabled={isSending}
              />
              <p className="text-xs text-slate-500 mt-1">
                Use placeholders: {`{studentName}`}, {`{examName}`},{" "}
                {`{marksList}`}, {`{schoolName}`}
              </p>
            </div>
            <div>
              <h3 className="text-md font-semibold text-text-secondary-dark mb-2">
                Message Preview
              </h3>
              <div className="bg-slate-100 p-3 rounded-lg text-sm text-slate-700 italic">
                {renderPreview()}
              </div>
            </div>
            {sendStatus && (
              <p
                className={`text-sm text-center ${
                  sendStatus.includes("Failed")
                    ? "text-red-600"
                    : "text-green-600"
                }`}
              >
                {sendStatus}
              </p>
            )}
          </div>
        )}

        <div className="flex justify-end gap-4 mt-6 pt-4 border-t">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isSending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={loading || isSending || studentsWithMarks.length === 0}
          >
            {isSending
              ? "Sending..."
              : `Send to ${studentsWithMarks.length} Parents`}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default SendResultsSmsModal;
