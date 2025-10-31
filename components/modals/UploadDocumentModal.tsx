import React, { useState, useMemo } from "react";
import type { Student, User } from "../../types";
import { upload } from "@vercel/blob/client";
import Card from "../ui/Card";
import Button from "../ui/Button";
import Input from "../ui/Input";
import { RegistrarApiService } from "../../services/registrarApiService";

// We can instantiate the service here or pass it as a prop if preferred
const apiService = new RegistrarApiService();

interface UploadDocumentModalProps {
  view: "Student" | "Staff";
  students: Student[];
  staff: User[];
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
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  // --- New State for Search ---
  // This holds the ID of the selected member
  const [ownerId, setOwnerId] = useState("");
  // This holds the text in the search bar
  const [searchTerm, setSearchTerm] = useState("");
  // This controls the visibility of the results dropdown
  const [showDropdown, setShowDropdown] = useState(false);
  // --- End New State ---

  const list = view === "Student" ? students : staff;

  const searchResults = useMemo(() => {
    // Don't show results until the user types at least 2 characters
    if (searchTerm.length < 2) {
      return [];
    }
    const lowerSearch = searchTerm.toLowerCase();

    return list
      .filter(
        (item) =>
          item.name.toLowerCase().includes(lowerSearch) ||
          (item.userId && item.userId.toLowerCase().includes(lowerSearch))
      )
      .slice(0, 50); // Show a max of 50 results
  }, [searchTerm, list]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !name || !ownerId) {
      setError("File, document name, and a selected user are all required.");
      return;
    }
    setError("");
    setIsUploading(true);

    try {
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/registrar/documents/upload",
      });

      await apiService.createSchoolDocument({
        name: name,
        type: view,
        ownerId: ownerId, // ownerId is now set by handleSelectMember
        fileUrl: blob.url,
      });

      onSave();
      onClose();
    } catch (err) {
      console.error("Upload failed:", err);
      setError("File upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setShowDropdown(true);
    setOwnerId(""); // Clear the selected ID if the user types again
  };

  const handleSelectMember = (item: Student | User) => {
    setSearchTerm(`${item.name} (${item.userId || item.id})`); // Put the name in the bar
    setOwnerId(item.id); // Set the actual database ID for saving
    setShowDropdown(false); // Hide the dropdown
  };

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
              Select {view} (Search by Name or ID)
            </label>
            <div className="relative">
              <Input
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                onFocus={() => setShowDropdown(true)}
                // Hide dropdown on blur, with a small delay to allow for clicks
                onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                placeholder="Type to search for a user..."
                required
                autoComplete="off"
              />
              {showDropdown && searchResults.length > 0 && (
                <ul className="absolute z-10 w-full bg-white border border-slate-300 rounded-md mt-1 shadow-lg max-h-60 overflow-y-auto">
                  {searchResults.map((item) => (
                    <li
                      key={item.id}
                      // Use onMouseDown instead of onClick to beat the onBlur
                      onMouseDown={() => handleSelectMember(item)}
                      className="px-4 py-2 hover:bg-slate-100 cursor-pointer text-sm"
                    >
                      {item.name} ({item.userId || item.id})
                    </li>
                  ))}
                </ul>
              )}
            </div>
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
