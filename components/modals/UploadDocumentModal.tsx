import React, { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { RegistrarApiService } from "../../services/registrarApiService";
import type { Student, User } from "../../types";
import { upload } from "@vercel/blob/client"; // Import the client-side upload function
import Card from "../ui/Card";
import Button from "../ui/Button";
import Input from "../ui/Input";

const apiService = new RegistrarApiService();

interface UploadDocumentModalProps {
  view: "Student" | "Staff";
  students: Student[];
  staff: User[]; // Your 'teachers' array is actually User[]
  onClose: () => void;
  onSave: () => void;
}

const UploadDocumentModal: React.FC<UploadDocumentModalProps> = ({
  view,
  students,
  staff,
  onClose,
  onSave,
}) => {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !name || !ownerId) {
      setError("All fields are required.");
      return;
    }
    setError("");
    setIsUploading(true);

    try {
      // 1. Upload the file directly to Vercel Blob from the browser
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/registrar/documents/upload", // We need a simple backend route for this
      });

      // 2. Get the URL and save the metadata to our database
      await apiService.createSchoolDocument({
        name: name,
        type: view,
        ownerId: ownerId,
        fileUrl: blob.url,
      });

      onSave(); // Refresh the main list
      onClose(); // Close the modal
    } catch (err) {
      console.error("Upload failed:", err);
      setError("File upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const list = view === "Student" ? students : staff;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg">
        <h2 className="text-xl font-bold mb-4">Upload {view} Document</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Document Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Birth Certificate, ID Card"
            required
          />
          <div>
            <label className="block text-sm font-medium text-text-secondary-dark mb-1">
              Select {view}
            </label>
            <select
              value={ownerId}
              onChange={(e) => setOwnerId(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-md py-2 px-3"
              required
            >
              <option value="">-- Select a {view.toLowerCase()} --</option>
              {list.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="File"
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            required
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex justify-end gap-4 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isUploading}>
              {isUploading ? "Uploading..." : "Upload and Save"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default UploadDocumentModal;
