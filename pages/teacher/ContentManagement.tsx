import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../hooks/useAuth";
import { TeacherApiService } from "../../services";
import type { CourseContent } from "../../types";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";

const apiService = new TeacherApiService();

// Interface for the data returned by getTeacherCourses
interface TeacherCourseOption {
  id: string; // Composite ID (classId|subjectId)
  realCourseId: string | null; // Actual DB ID
  name: string;
}

const ContentManagement: React.FC = () => {
  const { user } = useAuth();

  // State
  const [courses, setCourses] = useState<TeacherCourseOption[]>([]);
  const [contentList, setContentList] = useState<CourseContent[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  // We store the 'realCourseId' here because the backend needs it for foreign keys
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // FIX: Use getTeacherCourses (Source of Truth from Timetable)
      const [teacherCoursesData, uploadedContent] = await Promise.all([
        apiService.getTeacherCourses(user.id),
        apiService.getCourseContentForTeacher(user.id),
      ]);

      // Filter: We can only upload content to courses that have been "Initialized"
      // (i.e., have a real DB record).
      const validCourses = (teacherCoursesData as any[]).filter(
        (c) => c.realCourseId
      );

      setCourses(validCourses);
      setContentList(uploadedContent);

      if (validCourses.length > 0) {
        setSelectedCourseId(validCourses[0].realCourseId);
      }
    } catch (error) {
      console.error("Failed to load data", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];

      // Validation
      if (selectedFile.type.startsWith("video/")) {
        setUploadStatus("Error: Video files are not permitted for upload.");
        setFile(null);
        e.target.value = "";
        return;
      }

      const MAX_SIZE_MB = 10;
      if (selectedFile.size > MAX_SIZE_MB * 1024 * 1024) {
        setUploadStatus(`Error: File size cannot exceed ${MAX_SIZE_MB}MB.`);
        setFile(null);
        e.target.value = "";
        return;
      }

      setUploadStatus("");
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !selectedCourseId || !title || !user?.branchId) {
      setUploadStatus(
        "Error: Please fill all required fields and select a file."
      );
      return;
    }

    setIsUploading(true);
    setUploadStatus("Uploading...");

    try {
      const contentData = {
        courseId: selectedCourseId, // Must be the real DB UUID
        teacherId: user.id,
        branchId: user.branchId,
        title,
        description,
      };

      await apiService.uploadCourseContent(contentData, file);

      setUploadStatus("Success: File uploaded successfully!");
      setTitle("");
      setDescription("");
      setFile(null);

      // Reset file input visually
      const fileInput = document.getElementById(
        "file-input"
      ) as HTMLInputElement;
      if (fileInput) fileInput.value = "";

      fetchData(); // Refresh list
    } catch (error) {
      console.error(error);
      setUploadStatus("Error: Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadStatus(""), 5000);
    }
  };

  // Helper to display course name in the list
  const getCourseName = (courseId: string) => {
    // We look for a match in our valid courses list
    const course = courses.find((c) => c.realCourseId === courseId);
    return course ? course.name : "Unknown Course";
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-text-primary-dark mb-6">
        Content Management
      </h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: UPLOAD FORM */}
        <Card className="lg:col-span-1 h-fit">
          <h2 className="text-xl font-semibold text-text-primary-dark mb-4">
            Upload New Content
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary-dark mb-1">
                Course/Subject
              </label>
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-md py-2 px-3"
                required
                disabled={courses.length === 0}
              >
                {courses.length === 0 ? (
                  <option value="">No active courses found</option>
                ) : (
                  courses.map((c) => (
                    <option key={c.id} value={c.realCourseId!}>
                      {c.name}
                    </option>
                  ))
                )}
              </select>
              {courses.length === 0 && !loading && (
                <p className="text-xs text-red-500 mt-2">
                  Tip: If your subjects are missing, go to{" "}
                  <strong>Gradebook</strong> and initialize them first.
                </p>
              )}
            </div>

            <Input
              label="Content Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Chapter 1 Notes"
              required
            />

            <div>
              <label className="block text-sm font-medium text-text-secondary-dark mb-1">
                Description (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full bg-white border border-slate-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary-dark mb-1">
                File
              </label>
              <input
                id="file-input"
                type="file"
                onChange={handleFileChange}
                className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-secondary/10 file:text-brand-secondary hover:file:bg-brand-secondary/20"
                required
              />
              <p className="text-xs text-text-secondary-dark mt-1">
                Max size: 10MB. No video files.
              </p>
            </div>

            {uploadStatus && (
              <p
                className={`text-sm text-center p-2 rounded-md ${
                  uploadStatus.startsWith("Error:")
                    ? "bg-red-100 text-red-700"
                    : uploadStatus.startsWith("Success:")
                    ? "bg-green-100 text-green-700"
                    : "bg-blue-100 text-blue-700"
                }`}
              >
                {uploadStatus}
              </p>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isUploading || courses.length === 0}
            >
              {isUploading ? "Uploading..." : "Upload Content"}
            </Button>
          </form>
        </Card>

        {/* RIGHT COLUMN: CONTENT LIST */}
        <Card className="lg:col-span-2">
          <h2 className="text-xl font-semibold text-text-primary-dark mb-4">
            My Uploaded Content
          </h2>
          {loading ? (
            <p className="text-center py-8 text-slate-500">
              Loading content...
            </p>
          ) : (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
              {contentList.length > 0 ? (
                contentList.map((content) => (
                  <div
                    key={content.id}
                    className="bg-slate-50 p-4 rounded-lg flex justify-between items-start border border-slate-100 hover:shadow-sm transition-all"
                  >
                    <div>
                      <p className="font-semibold text-text-primary-dark text-lg">
                        {content.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-bold uppercase tracking-wide bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                          {getCourseName(content.courseId)}
                        </span>
                        <span className="text-xs text-slate-500">
                          • {new Date(content.uploadedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 mt-2 italic">
                        {content.description || "No description."}
                      </p>
                      <div className="flex items-center gap-1 mt-2 text-xs text-slate-400">
                        <span>📄</span>
                        <span>{content.fileName}</span>
                      </div>
                    </div>
                    <a
                      href={content.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button
                        variant="secondary"
                        className="!px-3 !py-1 text-xs"
                      >
                        View File
                      </Button>
                    </a>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 border border-dashed border-slate-300 rounded-lg">
                  <p className="text-slate-500">
                    You have not uploaded any content yet.
                  </p>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ContentManagement;
