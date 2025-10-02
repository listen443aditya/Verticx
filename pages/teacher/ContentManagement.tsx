import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../hooks/useAuth.ts";
import { TeacherApiService } from "../../services";
import type { Course, CourseContent } from "../../types.ts";
import Card from "../../components/ui/Card.tsx";
import Button from "../../components/ui/Button.tsx";
import Input from "../../components/ui/Input.tsx";

const apiService = new TeacherApiService();

const ContentManagement: React.FC = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [contentList, setContentList] = useState<CourseContent[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [selectedCourse, setSelectedCourse] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [branchCourses, uploadedContent] = await Promise.all([
      apiService.getCoursesByBranch(user.branchId!),
      apiService.getCourseContentForTeacher(user.id),
    ]);
    const teacherCourses = branchCourses.filter((c) => c.teacherId === user.id);
    setCourses(teacherCourses);
    setContentList(uploadedContent);
    if (teacherCourses.length > 0) {
      setSelectedCourse(teacherCourses[0].id);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];

      if (selectedFile.type.startsWith("video/")) {
        setUploadStatus("Error: Video files are not permitted for upload.");
        setFile(null);
        e.target.value = "";
        setTimeout(() => setUploadStatus(""), 5000);
        return;
      }

      const MAX_SIZE_MB = 10;
      const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
      if (selectedFile.size > MAX_SIZE_BYTES) {
        setUploadStatus(`Error: File size cannot exceed ${MAX_SIZE_MB}MB.`);
        setFile(null);
        e.target.value = "";
        setTimeout(() => setUploadStatus(""), 5000);
        return;
      }

      setUploadStatus("");
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !selectedCourse || !title || !user?.branchId) {
      setUploadStatus(
        "Error: Please fill all required fields and select a file."
      );
      setTimeout(() => setUploadStatus(""), 5000);
      return;
    }
    setIsUploading(true);
    setUploadStatus("Uploading...");
    try {
      // FIX: Add branchId to the data object
      const contentData = {
        courseId: selectedCourse,
        teacherId: user.id,
        branchId: user.branchId,
        title,
        description,
      };
      // FIX: Call with the correct 2 arguments
      await apiService.uploadCourseContent(contentData, file);
      setUploadStatus("Success: File uploaded successfully!");
      setTitle("");
      setDescription("");
      setFile(null);
      (document.getElementById("file-input") as HTMLInputElement).value = "";
      fetchData();
    } catch (error) {
      console.error(error);
      setUploadStatus("Error: Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadStatus(""), 5000);
    }
  };

  const getCourseName = (courseId: string) =>
    courses.find((c) => c.id === courseId)?.name || "Unknown Course";

  return (
    <div>
      <h1 className="text-3xl font-bold text-text-primary-dark mb-6">
        Content Management
      </h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <h2 className="text-xl font-semibold text-text-primary-dark mb-4">
            Upload New Content
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary-dark mb-1">
                Course/Subject
              </label>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-md py-2 px-3"
                required
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Content Title"
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
                rows={3}
                className="w-full bg-white border border-slate-300 rounded-md py-2 px-3"
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
                Max file size: 10MB. Video files are not allowed.
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
            <Button type="submit" className="w-full" disabled={isUploading}>
              {isUploading ? "Uploading..." : "Upload Content"}
            </Button>
          </form>
        </Card>
        <Card className="lg:col-span-2">
          <h2 className="text-xl font-semibold text-text-primary-dark mb-4">
            My Uploaded Content
          </h2>
          {loading ? (
            <p>Loading content...</p>
          ) : (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
              {contentList.length > 0 ? (
                contentList.map((content) => (
                  <div
                    key={content.id}
                    className="bg-slate-50 p-3 rounded-lg flex justify-between items-center"
                  >
                    <div>
                      <p className="font-semibold text-text-primary-dark">
                        {content.title}
                      </p>
                      <p className="text-xs text-text-secondary-dark">
                        {getCourseName(content.courseId)} |{" "}
                        {new Date(content.uploadedAt).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-text-secondary-dark mt-1">
                        {content.fileName}
                      </p>
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
                        View
                      </Button>
                    </a>
                  </div>
                ))
              ) : (
                <p className="text-center text-text-secondary-dark p-8">
                  You have not uploaded any content yet.
                </p>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ContentManagement;
