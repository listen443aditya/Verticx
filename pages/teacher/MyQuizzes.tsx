import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { TeacherApiService } from "../../services";
import type { Quiz } from "../../types";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";

const apiService = new TeacherApiService();

const MyQuizzes: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchQuizzes = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await apiService.getQuizzesForTeacher(user.id);
      setQuizzes(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchQuizzes();
  }, [fetchQuizzes]);

  const handleQuizAction = async (
    quizId: string,
    status: "published" | "paused"
  ) => {
    setActionLoading(true);
    try {
      await apiService.updateQuizStatus(quizId, status);
      await fetchQuizzes();
    } catch (e) {
      alert("Failed to update status.");
    } finally {
      setActionLoading(false);
    }
  };

  // NEW: Handle Delete
  const handleDeleteQuiz = async (quizId: string) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this quiz? This action cannot be undone."
      )
    ) {
      return;
    }

    setActionLoading(true);
    try {
      await apiService.deleteQuiz(quizId);
      // Optimistically remove from list or refetch
      setQuizzes((prev) => prev.filter((q) => q.id !== quizId));
    } catch (e) {
      console.error(e);
      alert("Failed to delete quiz.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-text-primary-dark">
          My Quizzes
        </h1>
        <Button onClick={() => navigate("/teacher/create-test/new")}>
          Create New Quiz
        </Button>
      </div>
      <Card>
        {loading ? (
          <p className="text-center py-8 text-slate-500">Loading quizzes...</p>
        ) : quizzes.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded border border-dashed border-slate-300">
            <p className="text-text-secondary-dark mb-4">
              You haven't created any quizzes yet.
            </p>
            <Button
              variant="secondary"
              onClick={() => navigate("/teacher/create-test/new")}
            >
              Create Your First Quiz
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-slate-200 text-sm text-text-secondary-dark bg-slate-50">
                <tr>
                  <th className="p-4 font-semibold">Title</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold">Created At</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {quizzes.map((quiz) => (
                  <tr
                    key={quiz.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="p-4 font-medium text-slate-900">
                      {quiz.title}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 text-xs font-bold uppercase tracking-wider rounded-full ${
                          quiz.status === "published"
                            ? "bg-green-100 text-green-800"
                            : quiz.status === "paused"
                            ? "bg-orange-100 text-orange-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {quiz.status}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-slate-600">
                      {new Date(quiz.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        {/* Edit Button (Draft Only) */}
                        {quiz.status === "draft" && (
                          <Button
                            variant="secondary"
                            className="!px-3 !py-1 text-xs"
                            onClick={() =>
                              navigate(`/teacher/create-test/${quiz.id}`)
                            }
                            disabled={actionLoading}
                          >
                            Edit
                          </Button>
                        )}

                        {/* View Button (Published/Paused) */}
                        {(quiz.status === "published" ||
                          quiz.status === "paused") && (
                          <Button
                            variant="secondary"
                            className="!px-3 !py-1 text-xs"
                            onClick={() =>
                              navigate(`/teacher/view-test/${quiz.id}`)
                            }
                            disabled={actionLoading}
                          >
                            View
                          </Button>
                        )}

                        {/* Status Toggle Button */}
                        {quiz.status === "published" && (
                          <Button
                            variant="secondary"
                            className="!px-3 !py-1 text-xs border-orange-200 text-orange-700 hover:bg-orange-50"
                            onClick={() => handleQuizAction(quiz.id, "paused")}
                            disabled={actionLoading}
                          >
                            Pause
                          </Button>
                        )}
                        {quiz.status === "paused" && (
                          <Button
                            variant="primary"
                            className="!px-3 !py-1 text-xs"
                            onClick={() =>
                              handleQuizAction(quiz.id, "published")
                            }
                            disabled={actionLoading}
                          >
                            Resume
                          </Button>
                        )}

                        {/* NEW: Delete Button */}
                        <Button
                          variant="danger"
                          className="!px-3 !py-1 text-xs"
                          onClick={() => handleDeleteQuiz(quiz.id)}
                          disabled={actionLoading}
                        >
                          Delete
                        </Button>
                      </div>
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

export default MyQuizzes;
