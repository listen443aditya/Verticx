import React, { useState, useEffect, useCallback } from "react";
import Card from "../../components/ui/Card.tsx";
import { AdminApiService } from "../../services";
import type { AuditLog } from "../../types.ts";
import { useDataRefresh } from "../../contexts/DataRefreshContext.tsx";
import { useAuth } from "../../hooks/useAuth.ts"; // FIX: The herald of identity arrives.

const adminApiService = new AdminApiService();

const SystemManagement: React.FC = () => {
  const { user } = useAuth(); // FIX: The user is summoned.
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const { refreshKey } = useDataRefresh();

  const fetchLogs = useCallback(async () => {
    if (!user) return; // The call must wait for its master.
    setLoading(true);
    try {
      // FIX: The signet of 'role' is now passed, giving the call its authority.
      const data = await adminApiService.getAuditLogs(user.role);
      setLogs(data);
    } catch (error) {
      console.error("Failed to fetch audit logs:", error);
    } finally {
      setLoading(false);
    }
  }, [user]); // FIX: The user's presence is now a dependency of the action.

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs, refreshKey]);

  return (
    <div>
      <h1 className="text-3xl font-bold text-text-primary-dark mb-6">
        System & Security Management
      </h1>
      <Card>
        <h2 className="text-xl font-semibold text-text-primary-dark mb-4">
          System Audit Log
        </h2>
        {loading ? (
          <p>Loading logs...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-slate-200 text-sm text-text-secondary-dark">
                <tr>
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">User</th>
                  <th className="p-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-slate-100 hover:bg-slate-50"
                  >
                    <td className="p-4 text-sm text-text-secondary-dark">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="p-4 font-medium">
                      {log.userName} ({log.userId})
                    </td>
                    <td className="p-4 font-mono text-xs">{log.action}</td>
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

export default SystemManagement;
