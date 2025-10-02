import React, { useState } from "react";
import type { User } from "../../types";
// FIX: Correctly import the service class from its file.
import { SharedApiService } from "../../services/sharedApiService";
import Card from "../ui/Card";
import Button from "../ui/Button";
import Input from "../ui/Input";

const sharedApiService = new SharedApiService();

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  user: User;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  onSave,
  user,
}) => {
  const [activeTab, setActiveTab] = useState<"profile" | "password">("profile");

  // Profile state
  const [profileData, setProfileData] = useState({
    name: user.name || "",
    email: user.email || "",
    phone: user.phone || "",
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileStatus, setProfileStatus] = useState("");
  const isStudent = user.role === "Student";

  // Password state
  const [passwordData, setPasswordData] = useState({
    current: "",
    newPass: "",
    confirmPass: "",
  });
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState("");

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isStudent) return;
    setIsSavingProfile(true);
    setProfileStatus("");
    try {
      // FIX: The `updateUserProfile` method expects only one argument (the updates object).
      // The user is identified by the backend via the auth token.
      await sharedApiService.updateUserProfile(profileData);
      setProfileStatus("Profile updated successfully!");
      onSave();
      setTimeout(onClose, 1500);
    } catch (err: any) {
      setProfileStatus(err.message || "Failed to update profile.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordStatus("");
    if (passwordData.newPass !== passwordData.confirmPass) {
      setPasswordStatus("New passwords do not match.");
      return;
    }
    if (passwordData.newPass.length < 6) {
      setPasswordStatus("New password must be at least 6 characters long.");
      return;
    }
    setIsSavingPassword(true);
    try {
      // FIX: The `changePassword` method expects two arguments (current and new password).
      // The user is identified by the backend via the auth token.
      await sharedApiService.changePassword(
        passwordData.current,
        passwordData.newPass
      );
      setPasswordStatus("Password changed successfully!");
      setPasswordData({ current: "", newPass: "", confirmPass: "" });
      onSave();
      setTimeout(onClose, 1500);
    } catch (err: any) {
      setPasswordStatus(err.message || "Failed to change password.");
    } finally {
      setIsSavingPassword(false);
    }
  };

  if (!isOpen) return null;

  const tabButtonClasses = (isActive: boolean) =>
    `px-4 py-2 text-sm font-medium transition-colors focus:outline-none ${
      isActive
        ? "border-b-2 border-brand-primary text-brand-primary"
        : "text-slate-500 hover:text-slate-700"
    }`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold">My Profile & Security</h2>
          <button
            onClick={onClose}
            className="text-3xl font-light text-slate-500 hover:text-slate-800 leading-none"
          >
            &times;
          </button>
        </div>

        <div className="flex border-b mb-4">
          <button
            onClick={() => setActiveTab("profile")}
            className={tabButtonClasses(activeTab === "profile")}
          >
            Profile Details
          </button>
          <button
            onClick={() => setActiveTab("password")}
            className={tabButtonClasses(activeTab === "password")}
          >
            Change Password
          </button>
        </div>

        {activeTab === "profile" && (
          <form onSubmit={handleProfileSave} className="space-y-4">
            <Input
              label="Full Name"
              name="name"
              value={profileData.name}
              onChange={handleProfileChange}
              disabled={isStudent || isSavingProfile}
            />
            <Input
              label="Email Address"
              name="email"
              type="email"
              value={profileData.email}
              onChange={handleProfileChange}
              disabled={isStudent || isSavingProfile}
            />
            <Input
              label="Phone Number"
              name="phone"
              type="tel"
              value={profileData.phone}
              onChange={handleProfileChange}
              disabled={isStudent || isSavingProfile}
            />
            {isStudent && (
              <p className="text-sm text-yellow-600 bg-yellow-50 p-2 rounded-md">
                Student profile details can only be changed by the school
                registrar.
              </p>
            )}

            {profileStatus && (
              <p
                className={`text-sm text-center ${
                  profileStatus.includes("successfully")
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {profileStatus}
              </p>
            )}

            <div className="flex justify-end gap-4 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={isSavingProfile}
              >
                Cancel
              </Button>
              {!isStudent && (
                <Button type="submit" disabled={isSavingProfile}>
                  {isSavingProfile ? "Saving..." : "Save Changes"}
                </Button>
              )}
            </div>
          </form>
        )}

        {activeTab === "password" && (
          <form onSubmit={handlePasswordSave} className="space-y-4">
            <Input
              label="Current Password"
              name="current"
              type="password"
              value={passwordData.current}
              onChange={handlePasswordChange}
              required
              disabled={isSavingPassword}
            />
            <Input
              label="New Password"
              name="newPass"
              type="password"
              value={passwordData.newPass}
              onChange={handlePasswordChange}
              required
              disabled={isSavingPassword}
            />
            <Input
              label="Confirm New Password"
              name="confirmPass"
              type="password"
              value={passwordData.confirmPass}
              onChange={handlePasswordChange}
              required
              disabled={isSavingPassword}
            />

            {passwordStatus && (
              <p
                className={`text-sm text-center ${
                  passwordStatus.includes("successfully")
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {passwordStatus}
              </p>
            )}

            <div className="flex justify-end gap-4 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={isSavingPassword}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSavingPassword}>
                {isSavingPassword ? "Saving..." : "Change Password"}
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
};

export default UserProfileModal;
