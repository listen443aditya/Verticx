import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../hooks/useAuth";
// FIX: Correctly import the service class from its file and create an instance.
import { SharedApiService } from "../../services/sharedApiService";
import { RegistrarApiService } from "../../services/registrarApiService";

import type {
  LeaveApplication,
  LeaveType,
  User,
  LeaveSetting,
} from "../../types";
import Card from "../ui/Card";
import Button from "../ui/Button";
import Input from "../ui/Input";
import { useDataRefresh } from "../../contexts/DataRefreshContext";

const apiService = new SharedApiService();
const registrarApiService = new RegistrarApiService();

const LeaveBalanceCard: React.FC<{
  type: string;
  remaining: number;
  total: number;
}> = ({ type, remaining, total }) => {
  const percentage = total > 0 ? (remaining / total) * 100 : 0;
  const color =
    percentage > 50
      ? "bg-green-500"
      : percentage > 20
      ? "bg-yellow-500"
      : "bg-red-500";

  return (
    <Card className="text-center">
      <h3 className="text-lg font-semibold text-text-primary-dark">{type}</h3>
      <p className="text-4xl font-bold my-2 text-brand-secondary">
        {remaining}
        <span className="text-xl text-text-secondary-dark">/{total}</span>
      </p>
      <div className="w-full bg-slate-200 rounded-full h-2.5">
        <div
          className={`${color} h-2.5 rounded-full`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      <p className="text-xs text-text-secondary-dark mt-1">Days Remaining</p>
    </Card>
  );
};

interface LeaveManagerProps {
  user: User;
}

const LeaveManager: React.FC<LeaveManagerProps> = ({ user }) => {
  const { refreshKey, triggerRefresh } = useDataRefresh();
  const [applications, setApplications] = useState<LeaveApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  // Form state
  const [leaveType, setLeaveType] = useState<LeaveType>("Sick");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [reason, setReason] = useState("");

  // Dynamic leave balance states
  const [leaveBalances, setLeaveBalances] = useState<Record<string, number>>(
    {}
  ); // Remaining
  const [totalLeaves, setTotalLeaves] = useState<Record<string, number>>({}); // Total from config
  const [availableLeaveTypes, setAvailableLeaveTypes] = useState<LeaveType[]>(
    []
  );

  const fetchLeaveData = useCallback(async () => {
    if (!user?.branchId || !user.role) return;
    setLoading(true);

    try {
      // Add a try/catch block for safety
      const [appData, branchSettings, freshUser] = await Promise.all([
        apiService.getLeaveApplicationsForUser(),
        apiService.getLeaveSettingsForBranch(),
        registrarApiService.getUserById(user.id),
      ]);

      // FIX 1: Ensure appData is an array. If it's undefined, use [].
      setApplications(appData || []);

      // FIX 2: Ensure branchSettings is an array before calling .find()
      const userRoleSetting = (branchSettings || []).find(
        (s: LeaveSetting) => s.role === user.role
      );

      if (userRoleSetting?.settings) {
        const totals = userRoleSetting.settings as Record<string, number>;
        const types = Object.keys(totals).filter(
          (k) => totals[k] > 0
        ) as LeaveType[];

        const normalizedTotals: Record<string, number> = {};
        types.forEach((t) => {
          normalizedTotals[t.toLowerCase()] = totals[t];
        });
        setTotalLeaves(normalizedTotals);
        setAvailableLeaveTypes(types);
        if (types.length > 0 && !types.includes(leaveType)) {
          setLeaveType(types[0]);
        }
      } else {
        setTotalLeaves({});
        setAvailableLeaveTypes([]);
      }

      // This check is already safe, which is good
      if (freshUser?.leaveBalances) {
        setLeaveBalances(freshUser.leaveBalances);
      }
    } catch (error) {
      console.error("Failed to fetch leave data:", error);
      // On error, set lists to empty arrays to prevent crashes
      setApplications([]);
      setAvailableLeaveTypes([]);
    } finally {
      setLoading(false);
    }
  }, [user, leaveType]); // leaveType dependency is correct

  useEffect(() => {
    fetchLeaveData();
  }, [fetchLeaveData, refreshKey]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason || !user.branchId) {
      setStatusMessage("Please fill all fields.");
      return;
    }
    setIsSubmitting(true);
    await apiService.createLeaveApplication({
      branchId: user.branchId,
      applicantId: user.id,
      applicantName: user.name,
      applicantRole: user.role,
      leaveType,
      startDate,
      endDate,
      isHalfDay,
      reason,
    });
    setStatusMessage("Leave application submitted successfully.");
    setReason("");
    setStartDate("");
    setEndDate("");
    setIsHalfDay(false);
    triggerRefresh();
    setIsSubmitting(false);
    setTimeout(() => setStatusMessage(""), 4000);
  };

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-xl font-semibold mb-4">My Leave Balances</h2>
        {loading ? (
          <p>Loading balances...</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {availableLeaveTypes.map((type) => (
              <LeaveBalanceCard
                key={type}
                type={type}
                remaining={leaveBalances[type.toLowerCase()] || 0}
                total={totalLeaves[type.toLowerCase()] || 0}
              />
            ))}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-xl font-semibold mb-4">Apply for Leave</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium">Leave Type</label>
              <select
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value as LeaveType)}
                className="w-full bg-white border border-slate-300 rounded-md py-2 px-3 mt-1"
              >
                {availableLeaveTypes.map((lt) => (
                  <option key={lt} value={lt}>
                    {lt}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Start Date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
              <Input
                label="End Date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                min={startDate}
              />
            </div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={isHalfDay}
                onChange={(e) => setIsHalfDay(e.target.checked)}
                className="h-4 w-4 rounded"
              />
              <span>This is a half-day leave</span>
            </label>
            <div>
              <label className="block text-sm font-medium">Reason</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                className="w-full bg-white border border-slate-300 rounded-md py-2 px-3 mt-1"
                required
              />
            </div>
            {statusMessage && (
              <p className="text-sm text-center text-green-600">
                {statusMessage}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Application"}
            </Button>
          </form>
        </Card>
        <Card>
          <h2 className="text-xl font-semibold mb-4">Application History</h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {applications.map((app) => (
              <div key={app.id} className="bg-slate-50 p-3 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">{app.leaveType} Leave</p>
                    <p className="text-xs text-text-secondary-dark">
                      {app.startDate} to {app.endDate}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      app.status === "Approved"
                        ? "bg-green-100 text-green-800"
                        : app.status === "Pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {app.status}
                  </span>
                </div>
                <p className="text-sm italic mt-2">"{app.reason}"</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default LeaveManager;
