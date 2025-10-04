import React, { useEffect, useState, useMemo, useCallback } from "react";
import Card from "../../components/ui/Card.tsx";
import { AdminApiService } from "../../services";
import type { SystemWideAnalytics, Branch } from "../../types.ts";
import Input from "../../components/ui/Input.tsx";
import { useAuth } from "../../hooks/useAuth.ts"; // FIX: Import the useAuth hook

const adminApiService = new AdminApiService();

// NEW component for displaying top/bottom lists
const PerformanceList: React.FC<{
  title: string;
  data: any[];
  valueKey: string;
  unit?: string;
  ascending?: boolean;
}> = ({ title, data, valueKey, unit = "", ascending = false }) => (
  <Card>
    <h3 className="text-lg font-semibold text-text-primary-dark mb-4">
      {title}
    </h3>
    <div className="space-y-3">
      {data.length > 0 ? (
        data.map((item, index) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-2 bg-slate-50 rounded-lg text-sm"
          >
            <div className="flex items-center gap-3">
              <span
                className={`font-bold w-6 text-center ${
                  ascending ? "text-green-600" : "text-brand-secondary"
                }`}
              >
                #{index + 1}
              </span>
              <p className="font-medium text-text-primary-dark">{item.name}</p>
            </div>
            <p className="font-semibold text-brand-primary">
              {item[valueKey].toFixed(1)}
              {unit}
            </p>
          </div>
        ))
      ) : (
        <p className="text-sm text-center text-text-secondary-dark p-4">
          Not enough data to display.
        </p>
      )}
    </div>
  </Card>
);

const Analytics: React.FC = () => {
  const { user } = useAuth(); // FIX: Get the authenticated user
  const [analyticsData, setAnalyticsData] =
    useState<SystemWideAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | Branch["status"]>(
    "all"
  );

  const fetchData = useCallback(async () => {
    if (!user) return; // FIX: Add a guard clause to wait for the user object
    setLoading(true);
    try {
      // FIX: Pass the user's role to the API call
      const data = await adminApiService.getSystemWideAnalytics(user.role);
      setAnalyticsData(data);
    } catch (error) {
      console.error("Failed to fetch analytics data:", error);
    } finally {
      setLoading(false);
    }
  }, [user]); // FIX: Add user to the dependency array

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredAnalytics = useMemo(() => {
    if (!analyticsData)
      return {
        passPercentage: [],
        teacherStudentRatio: [],
        attendanceBySchool: [],
      };

    const { passPercentage, teacherStudentRatio, attendanceBySchool } =
      analyticsData;

    const filteredSchools = passPercentage.filter((school) => {
      const matchesStatus =
        filterStatus === "all" || school.status === filterStatus;
      const matchesSearch =
        searchTerm === "" ||
        school.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStatus && matchesSearch;
    });

    const filteredIds = new Set(filteredSchools.map((s) => s.id));

    return {
      passPercentage: filteredSchools,
      teacherStudentRatio: teacherStudentRatio.filter((s) =>
        filteredIds.has(s.id)
      ),
      attendanceBySchool: attendanceBySchool.filter((s) =>
        filteredIds.has(s.id)
      ),
    };
  }, [analyticsData, searchTerm, filterStatus]);

  // Note: The data structure from the API might not have 'Pass %' as a key. This might need adjustment.
  const top5Performance = useMemo(
    () =>
      [...filteredAnalytics.passPercentage]
        .sort((a, b) => b["Pass %"] - a["Pass %"])
        .slice(0, 5),
    [filteredAnalytics.passPercentage]
  );
  const bottom5Performance = useMemo(
    () =>
      [...filteredAnalytics.passPercentage]
        .sort((a, b) => a["Pass %"] - b["Pass %"])
        .slice(0, 5),
    [filteredAnalytics.passPercentage]
  );
  const lowestRatio = useMemo(
    () =>
      [...filteredAnalytics.teacherStudentRatio]
        .sort((a, b) => a.ratio - b.ratio)
        .slice(0, 5),
    [filteredAnalytics.teacherStudentRatio]
  );
  const highestRatio = useMemo(
    () =>
      [...filteredAnalytics.teacherStudentRatio]
        .sort((a, b) => b.ratio - a.ratio)
        .slice(0, 5),
    [filteredAnalytics.teacherStudentRatio]
  );
  const top5Attendance = useMemo(
    () =>
      [...filteredAnalytics.attendanceBySchool]
        .sort((a, b) => b.attendance - a.attendance)
        .slice(0, 5),
    [filteredAnalytics.attendanceBySchool]
  );
  const bottom5Attendance = useMemo(
    () =>
      [...filteredAnalytics.attendanceBySchool]
        .sort((a, b) => a.attendance - b.attendance)
        .slice(0, 5),
    [filteredAnalytics.attendanceBySchool]
  );

  if (loading) {
    return (
      <Card>
        <p className="p-8 text-center">Loading analytics data...</p>
      </Card>
    );
  }

  if (!analyticsData) {
    return (
      <Card>
        <p className="p-8 text-center text-red-500">
          Failed to load analytics data.
        </p>
      </Card>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-text-primary-dark mb-6">
        Analytics & Reporting
      </h1>
      <div className="space-y-6">
        <Card className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Search by school name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="md:col-span-2"
            />
            <div>
              <label className="block text-sm font-medium text-text-secondary-dark mb-1">
                Filter by Status
              </label>
              <select
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
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <PerformanceList
            title="Top 5 by Academic Performance"
            data={top5Performance}
            valueKey="Pass %"
            unit="%"
          />
          <PerformanceList
            title="Bottom 5 by Academic Performance"
            data={bottom5Performance}
            valueKey="Pass %"
            unit="%"
            ascending
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <PerformanceList
            title="Top 5 Schools by Attendance"
            data={top5Attendance}
            valueKey="attendance"
            unit="%"
          />
          <PerformanceList
            title="Bottom 5 Schools by Attendance"
            data={bottom5Attendance}
            valueKey="attendance"
            unit="%"
            ascending
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <PerformanceList
            title="Lowest Teacher-Student Ratios"
            data={lowestRatio}
            valueKey="ratio"
            unit=":1"
            ascending
          />
          <PerformanceList
            title="Highest Teacher-Student Ratios"
            data={highestRatio}
            valueKey="ratio"
            unit=":1"
          />
        </div>
      </div>
    </div>
  );
};
export default Analytics;
