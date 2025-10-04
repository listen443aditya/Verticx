import React, { useEffect, useState, useCallback, useMemo } from "react";
import type { Branch } from "../../types.ts";
import { AdminApiService } from "../../services";
import Card from "../../components/ui/Card.tsx";
import Button from "../../components/ui/Button.tsx";
import ConfirmationModal from "../../components/ui/ConfirmationModal.tsx";
import SchoolDetailModal from "./SchoolDetailModal.tsx";
import { useDataRefresh } from "../../contexts/DataRefreshContext.tsx";
import Input from "../../components/ui/Input.tsx";
import { useAuth } from "../../hooks/useAuth.ts"; // FIX: Import the useAuth hook

const adminApiService = new AdminApiService();

const SchoolManagement: React.FC = () => {
  const { user } = useAuth(); // FIX: Get the authenticated user
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const { refreshKey, triggerRefresh } = useDataRefresh();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | Branch["status"]>(
    "all"
  );

  const [viewingBranch, setViewingBranch] = useState<Branch | null>(null);
  const [deletingBranch, setDeletingBranch] = useState<Branch | null>(null);
  const [suspendingBranch, setSuspendingBranch] = useState<Branch | null>(null);
  const [isActionLoading, setIsActionLoading] = useState<
    Record<string, boolean>
  >({});

  const fetchBranches = useCallback(async () => {
    if (!user) return; // FIX: Add guard clause
    setLoading(true);
    try {
      // FIX: Pass the user's role to the API call
      const allBranches = await adminApiService.getBranches(user.role);
      setBranches(allBranches);
    } catch (error) {
      console.error("Failed to fetch branches:", error);
    } finally {
      setLoading(false);
    }
  }, [user]); // FIX: Add user to dependency array

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches, refreshKey]);

  const filteredBranches = useMemo(() => {
    return branches.filter((branch) => {
      const matchesStatus =
        filterStatus === "all" || branch.status === filterStatus;

      const matchesSearch =
        searchTerm === "" ||
        branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        branch.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (branch.registrationId &&
          branch.registrationId
            .toLowerCase()
            .includes(searchTerm.toLowerCase()));

      return matchesStatus && matchesSearch;
    });
  }, [branches, searchTerm, filterStatus]);

  const handleSuspendConfirm = async () => {
    if (!suspendingBranch || !user) return; // FIX: Add guard clause
    setIsActionLoading((prev) => ({ ...prev, [suspendingBranch.id]: true }));
    const newStatus =
      suspendingBranch.status === "active" ? "suspended" : "active";
    // FIX: Pass the user's role to the API call
    await adminApiService.updateBranchStatus(
      user.role,
      suspendingBranch.id,
      newStatus
    );
    setSuspendingBranch(null);
    triggerRefresh();
    setIsActionLoading((prev) => ({ ...prev, [suspendingBranch.id]: false }));
  };

  const confirmDelete = async () => {
    if (!deletingBranch || !user) return; // FIX: Add guard clause
    setIsActionLoading((prev) => ({ ...prev, [deletingBranch.id]: true }));
    // FIX: Pass the user's role to the API call
    await adminApiService.deleteBranch(user.role, deletingBranch.id);
    setDeletingBranch(null);
    triggerRefresh();
  };

  const getStatusChip = (status: Branch["status"]) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "suspended":
        return "bg-orange-100 text-orange-800";
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-text-primary-dark mb-6">
        School Management
      </h1>
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 pb-4 border-b border-slate-200">
          <Input
            placeholder="Search by name, location, ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="md:col-span-2"
          />
          <div>
            <label
              htmlFor="status-filter"
              className="block text-sm font-medium text-text-secondary-dark mb-1"
            >
              Filter by Status
            </label>
            <select
              id="status-filter"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="w-full bg-white border border-slate-300 rounded-md py-2 px-3 text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

        {loading ? (
          <p>Loading schools...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-slate-200 text-sm text-text-secondary-dark">
                <tr>
                  <th className="p-4">School</th>
                  <th className="p-4">Location</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-center">Students</th>
                  <th className="p-4 text-center">Teachers</th>
                  <th className="p-4 text-center">Health Score</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBranches.map((branch) => (
                  <tr
                    key={branch.id}
                    className={`border-b border-slate-100 hover:bg-slate-50 transition-opacity ${
                      branch.status === "suspended" ? "opacity-60" : ""
                    }`}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            branch.logoUrl || "https://via.placeholder.com/32"
                          }
                          alt="logo"
                          className="w-8 h-8 rounded-full bg-slate-200 object-cover"
                        />
                        <div>
                          <div className="font-mono text-xs text-text-secondary-dark">
                            {branch.registrationId || "N/A"}
                          </div>
                          <div className="font-semibold text-text-primary-dark">
                            {branch.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">{branch.location}</td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusChip(
                          branch.status
                        )}`}
                      >
                        {branch.status.charAt(0).toUpperCase() +
                          branch.status.slice(1)}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      {branch.stats?.students?.toLocaleString() ?? 0}
                    </td>
                    <td className="p-4 text-center">
                      {branch.stats?.teachers?.toLocaleString() ?? 0}
                    </td>
                    <td className="p-4 text-center font-semibold text-brand-accent">
                      {branch.stats?.healthScore ?? "N/A"}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="secondary"
                          className="!px-3 !py-1 text-xs"
                          onClick={() => setViewingBranch(branch)}
                        >
                          View
                        </Button>
                        {branch.status !== "pending" && (
                          <Button
                            variant={
                              branch.status === "active"
                                ? "secondary"
                                : "primary"
                            }
                            className="!px-3 !py-1 text-xs"
                            onClick={() => setSuspendingBranch(branch)}
                            disabled={isActionLoading[branch.id]}
                          >
                            {branch.status === "active"
                              ? "Suspend"
                              : "Reinstate"}
                          </Button>
                        )}
                        <Button
                          variant="danger"
                          className="!px-3 !py-1 text-xs"
                          onClick={() => setDeletingBranch(branch)}
                          disabled={isActionLoading[branch.id]}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredBranches.length === 0 && !loading && (
              <p className="text-center text-text-secondary-dark p-8">
                No schools found matching your criteria.
              </p>
            )}
          </div>
        )}
      </Card>

      {viewingBranch && (
        <SchoolDetailModal
          branch={viewingBranch}
          onClose={() => setViewingBranch(null)}
        />
      )}

      <ConfirmationModal
        isOpen={!!deletingBranch}
        onClose={() => setDeletingBranch(null)}
        onConfirm={confirmDelete}
        title="Confirm School Deletion"
        message={
          <>
            Are you sure you want to permanently delete{" "}
            <strong>{deletingBranch?.name}</strong> and all of its associated
            data (students, staff, records, etc.)? This action cannot be undone.
          </>
        }
        confirmText="Delete"
        isConfirming={isActionLoading[deletingBranch?.id || ""]}
      />
      <ConfirmationModal
        isOpen={!!suspendingBranch}
        onClose={() => setSuspendingBranch(null)}
        onConfirm={handleSuspendConfirm}
        title={`Confirm School ${
          suspendingBranch?.status === "active" ? "Suspension" : "Reinstatement"
        }`}
        message={
          <>
            Are you sure you want to{" "}
            <strong>
              {suspendingBranch?.status === "active" ? "suspend" : "reinstate"}
            </strong>{" "}
            the school <strong>{suspendingBranch?.name}</strong>?
          </>
        }
        confirmText={
          suspendingBranch?.status === "active" ? "Suspend" : "Reinstate"
        }
        confirmVariant={
          suspendingBranch?.status === "active" ? "danger" : "primary"
        }
        isConfirming={isActionLoading[suspendingBranch?.id || ""]}
      />
    </div>
  );
};

export default SchoolManagement;
