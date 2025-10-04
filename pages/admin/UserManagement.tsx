import React, { useEffect, useState, useMemo, useCallback } from "react";
import type { User, UserRole } from "../../types.ts";
import { AdminApiService } from "../../services"; // Only adminApiService is needed
import Card from "../../components/ui/Card.tsx";
import Button from "../../components/ui/Button.tsx";
import Input from "../../components/ui/Input.tsx";
import { useDataRefresh } from "../../contexts/DataRefreshContext.tsx";
import { useAuth } from "../../hooks/useAuth.ts";

const adminApiService = new AdminApiService();

const CredentialsModal: React.FC<{
  title: string;
  credentials: { id: string; password: string };
  userType: string;
  onClose: () => void;
}> = ({ title, credentials, userType, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
    <Card className="w-full max-w-md">
      <h2 className="text-xl font-bold text-brand-accent mb-2">{title}</h2>
      <p className="text-text-secondary-dark mb-4">
        Please securely share the following login credentials with the{" "}
        {userType}:
      </p>
      <div className="space-y-3">
        <div className="bg-slate-100 p-3 rounded-lg">
          <p className="text-sm font-semibold text-text-secondary-dark">
            User ID
          </p>
          <p className="text-lg font-mono tracking-wider text-text-primary-dark">
            {credentials.id}
          </p>
        </div>
        <div className="bg-slate-100 p-3 rounded-lg">
          <p className="text-sm font-semibold text-text-secondary-dark">
            New Password
          </p>
          <p className="text-lg font-mono tracking-wider text-text-primary-dark">
            {credentials.password}
          </p>
        </div>
      </div>
      <div className="mt-6 text-right">
        <Button onClick={onClose}>Close</Button>
      </div>
    </Card>
  </div>
);

const UserManagement: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<UserRole | "all">("all");

  const [resettingUser, setResettingUser] = useState<User | null>(null);
  const [newPasswordInfo, setNewPasswordInfo] = useState<{
    id: string;
    password: string;
  } | null>(null);
  const { refreshKey, triggerRefresh } = useDataRefresh();

  const fetchUsers = useCallback(async () => {
    if (!user) return; // FIX: Add guard clause
    setLoading(true);
    try {
      // FIX: Pass the user's role to the API call
      const allUsers = await adminApiService.getAllUsers(user.role);
      setUsers(allUsers);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  }, [user]); // FIX: Add user to dependency array

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers, refreshKey]);

  const handleResetPassword = async (userToReset: User) => {
    if (!user) return; // FIX: Add guard clause
    setResettingUser(userToReset);
    try {
      // FIX: Call the correct adminApiService and pass the role
      const { newPassword } = await adminApiService.resetUserPassword(
        user.role,
        userToReset.id
      );
      setNewPasswordInfo({ id: userToReset.id, password: newPassword });
      triggerRefresh();
    } catch (error) {
      console.error("Failed to reset password", error);
    }
    setResettingUser(null);
  };

  const filteredUsers = useMemo(() => {
    const usersToShow =
      user?.role === "Admin"
        ? users.filter((u) => u.role !== "SuperAdmin")
        : users;

    return usersToShow.filter((usr) => {
      const matchesRole = filterRole === "all" || usr.role === filterRole;
      const matchesSearch =
        searchTerm === "" ||
        usr.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        usr.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        usr.id.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesRole && matchesSearch;
    });
  }, [users, filterRole, searchTerm, user]);

  const roles: UserRole[] = [
    "Admin",
    "Principal",
    "Registrar",
    "Teacher",
    "Student",
    "Parent",
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold text-text-primary-dark mb-6">
        User Management
      </h1>
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 pb-4 border-b border-slate-200">
          <Input
            placeholder="Search by name, email, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="md:col-span-2"
          />
          <div>
            <label className="text-sm font-medium text-text-secondary-dark">
              Filter by Role
            </label>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value as any)}
              className="w-full bg-white border border-slate-300 rounded-md py-2 px-3 mt-1"
            >
              <option value="all">All Roles</option>
              {roles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <p>Loading users...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-slate-200 text-sm text-text-secondary-dark">
                <tr>
                  <th className="p-4">Name</th>
                  <th className="p-4">Email / User ID</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Branch ID</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(
                  (
                    usr // changed variable to avoid conflict with `user` from useAuth
                  ) => (
                    <tr
                      key={usr.id}
                      className="border-b border-slate-100 hover:bg-slate-50"
                    >
                      <td className="p-4 font-medium">{usr.name}</td>
                      <td className="p-4">
                        <div>{usr.email}</div>
                        <div className="font-mono text-xs text-text-secondary-dark">
                          {usr.id}
                        </div>
                      </td>
                      <td className="p-4">{usr.role}</td>
                      <td className="p-4 font-mono text-xs">
                        {usr.branchId || "N/A"}
                      </td>
                      <td className="p-4 text-right">
                        <Button
                          variant="danger"
                          className="!px-3 !py-1 text-xs"
                          onClick={() => handleResetPassword(usr)}
                          disabled={resettingUser?.id === usr.id}
                        >
                          {resettingUser?.id === usr.id
                            ? "Resetting..."
                            : "Reset Password"}
                        </Button>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      {newPasswordInfo && (
        <CredentialsModal
          title="Password Reset Successful"
          userType={
            users
              .find((u) => u.id === newPasswordInfo.id)
              ?.role.toLowerCase() || "user"
          }
          credentials={newPasswordInfo}
          onClose={() => setNewPasswordInfo(null)}
        />
      )}
    </div>
  );
};

export default UserManagement;
