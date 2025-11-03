import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../../hooks/useAuth";
import { RegistrarApiService } from "../../services/registrarApiService";
import { useDataRefresh } from "../../contexts/DataRefreshContext"; // <-- 1. IMPORT
import type {
  SchoolClass,
  Student,
  Teacher,
  User,
  LeaveSetting,
  LeaveType,
  LeaveApplication,
  TeacherAttendanceStatus,
  AttendanceStatus,
  TeacherAttendanceRecord,
  AttendanceListItem,
} from "../../types";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import LeaveManager from "../../components/shared/LeaveManager";
import StaffAttendanceCalendar from "../../components/shared/StaffAttendanceCalendar";

const apiService = new RegistrarApiService();

// --- SUB-COMPONENTS FOR TABS ---

const StudentAttendanceView: React.FC = () => {
  // ... (This component is fine, no changes needed) ...
  const { user } = useAuth();
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [attendanceList, setAttendanceList] = useState<AttendanceListItem[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const fetchClasses = async () => {
      if (!user) return;
      const cls = await apiService.getSchoolClasses();
      const sortedClasses = cls.sort(
        (a: SchoolClass, b: SchoolClass) =>
          a.gradeLevel - b.gradeLevel || a.section.localeCompare(b.section)
      );
      setClasses(sortedClasses);
      if (sortedClasses.length > 0) {
        setSelectedClassId(sortedClasses[0].id);
      }
    };
    fetchClasses();
  }, [user]);

  const fetchAttendance = useCallback(async () => {
    if (!selectedClassId || !selectedDate) return;
    setLoading(true);

    try {
      const response = await apiService.getDailyAttendanceForClass(
        selectedClassId,
        selectedDate
      );
      const saved = response?.isSaved || false;
      const attendance = response?.attendance || [];
      setAttendanceList(attendance);
      setIsSaved(saved);
    } catch (error) {
      console.error("Failed to fetch student attendance:", error);
      setAttendanceList([]);
      setIsSaved(false);
    } finally {
      setLoading(false);
    }
  }, [selectedClassId, selectedDate]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const getStatusColor = (status: AttendanceStatus) => {
    switch (status) {
      case "Present":
        return "bg-green-100 text-green-800";
      case "Absent":
        return "bg-red-100 text-red-800";
      case "Tardy":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-4 mb-6 border-b border-slate-200 pb-4 items-center">
        <div>
          <label className="block text-sm font-medium">Class</label>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="bg-white border border-slate-300 rounded-md py-2 px-3 w-64"
          >
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                Grade {c.gradeLevel} - {c.section}
              </option>
            ))}
          </select>
        </div>
        <Input
          label="Date"
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
        {isSaved ? (
          <div className="p-2 bg-blue-100 text-blue-800 rounded-md text-sm self-end">
            Attendance marked by class mentor.
          </div>
        ) : (
          <div className="p-2 bg-yellow-100 text-yellow-800 rounded-md text-sm self-end">
            Attendance not yet marked.
          </div>
        )}
      </div>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="w-full text-left">
          <thead className="border-b">
            <tr>
              <th className="p-2">Student Name</th>
              <th className="p-2 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {attendanceList.map((item) => (
              <tr key={item.studentId} className="border-b">
                <td className="p-2 font-medium">{item.studentName}</td>
                <td className="p-2 text-center">
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                      item.status
                    )}`}
                  >
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

const StaffAttendanceView: React.FC<{ onAttendanceSaved: () => void }> = ({
  onAttendanceSaved,
}) => {
  const { user } = useAuth();
  const [staff, setStaff] = useState<
    (User & { attendancePercentage?: number })[]
  >([]);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [attendance, setAttendance] = useState<
    Record<string, TeacherAttendanceStatus>
  >({});
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // --- THIS IS THE FIX (Part 1) ---
  // The keys (left side) MUST match your Prisma schema enum (e.g., "HalfDay")
  // The values (right side) are what the user sees (e.g., "Half Day")
  const statusKeyToLabel: Record<TeacherAttendanceStatus, string> = {
    Present: "Present",
    Absent: "Absent",
    "On Leave": "On Leave",
    "Half Day": "Half Day",
  };

  // This array must use the backend enum keys (no spaces)
  const attendanceOptions: TeacherAttendanceStatus[] = [
    "Present",
    "Absent",
    "On Leave",
    "Half Day",
  ];
  // --- END OF FIX ---

  const fetchData = useCallback(async () => {
    if (!user || !selectedDate) return;
    setLoading(true);

    try {
      // Add cache-busting
      const cacheBustConfig = { params: { _cacheBust: Date.now() } };
      const staffData = await apiService.getAllStaff(cacheBustConfig);
      setStaff(staffData);

      const { isSaved: saved, attendance: savedAttendance } =
        await apiService.getTeacherAttendance(selectedDate);
      setIsSaved(saved);

      const attendanceMap: Record<string, TeacherAttendanceStatus> = {};
      staffData.forEach((s: User) => {
        const record = (savedAttendance as any[]).find(
          (a: any) => a.userId === s.id
        );
        // The record.status from the DB is "HalfDay", which is a valid key
        attendanceMap[s.id] = record ? record.status : "Present";
      });
      setAttendance(attendanceMap);
    } catch (error) {
      console.error("Failed to fetch staff attendance:", error);
      setIsSaved(false);
      setAttendance({});
    } finally {
      setLoading(false);
    }
  }, [selectedDate, user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStatusChange = (
    staffId: string,
    status: TeacherAttendanceStatus // Status is "HalfDay", "OnLeave", etc.
  ) => {
    setAttendance((prev) => ({ ...prev, [staffId]: status }));
  };

  const handleSave = async () => {
    if (!selectedDate || !user?.branchId) return;
    setIsSaving(true);

    // The 'attendance' state now holds the correct enum keys (e.g., "HalfDay")
    const records = staff.map((s) => ({
      branchId: user.branchId!,
      userId: s.id,
      date: selectedDate,
      status: attendance[s.id] || "Present",
    }));

    await apiService.saveTeacherAttendance(records as any);
    setIsSaving(false);
    await fetchData();
    onAttendanceSaved();
  };

  return (
    <div>
      <div className="flex flex-wrap gap-4 mb-6 border-b border-slate-200 pb-4 items-center">
        <Input
          label="Date"
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
        <div className="p-2 bg-slate-100 text-slate-600 rounded-md text-sm self-end">
          Note: Biometric data may override manual entries.
        </div>
      </div>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <table className="w-full text-left">
            <thead className="border-b">
              <tr>
                <th className="p-2">Name</th>
                <th className="p-2">Role</th>
                <th className="p-2 text-center">Overall Attendance</th>
                <th className="p-2 text-center" colSpan={4}>
                  Mark Status
                </th>
              </tr>
            </thead>
            <tbody>
              {staff.map((s) => (
                <tr key={s.id} className="border-b">
                  <td className="p-2 font-medium">{s.name}</td>
                  <td className="p-2 text-sm">{s.role}</td>
                  <td className="p-2 text-center text-sm font-semibold">
                    {s.attendancePercentage?.toFixed(1) ?? "N/A"}%
                  </td>

                  {/* --- THIS IS THE FIX (Part 2) --- */}
                  {/* Loop over the new options array */}
                  {attendanceOptions.map((statusKey) => (
                    <td key={statusKey} className="p-2 text-center">
                      <label className="flex items-center justify-center text-xs">
                        <input
                          type="radio"
                          name={`att-${s.id}`}
                          // Check against the key (e.g., "HalfDay")
                          checked={attendance[s.id] === statusKey}
                          // Save the key (e.g., "HalfDay")
                          onChange={() => handleStatusChange(s.id, statusKey)}
                          disabled={isSaved}
                        />
                        {/* Display the label (e.g., "Half Day") */}
                        <span className="ml-2">
                          {statusKeyToLabel[statusKey]}
                        </span>
                      </label>
                    </td>
                  ))}
                  {/* --- END OF FIX --- */}
                </tr>
              ))}
            </tbody>
          </table>
          {!isSaved && (
            <div className="mt-4 text-right">
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Staff Attendance"}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const MyAttendanceAndLeaveView: React.FC = () => {
  const { user } = useAuth();
  if (!user) return null;
  return <LeaveManager user={user} />;
};

const LeaveConfigurationView: React.FC = () => {
  // ... (This component is fine, no changes needed) ...
  const { user } = useAuth();
  const [settings, setSettings] = useState<LeaveSetting | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await apiService.getLeaveSettings();
      setSettings(data);
    } catch (error) {
      console.error("Failed to load leave settings:", error);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleChange = (field: keyof LeaveSetting, value: string) => {
    const numValue = Number(value);
    if (isNaN(numValue) || numValue < 0) return;

    setSettings((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        [field]: numValue,
      };
    });
  };

  const handleSave = async () => {
    if (!settings) return;
    setIsSaving(true);
    await apiService.updateLeaveSettings(settings);
    setStatusMessage("Settings saved successfully!");
    setIsSaving(false);
    setTimeout(() => setStatusMessage(""), 3000);
  };

  const fields: { label: string; key: keyof LeaveSetting }[] = [
    { label: "Student Sick", key: "defaultStudentSick" },
    { label: "Student Casual", key: "defaultStudentCasual" },
    { label: "Teacher Sick", key: "defaultTeacherSick" },
    { label: "Teacher Casual", key: "defaultTeacherCasual" },
    { label: "Staff Sick", key: "defaultStaffSick" },
    { label: "Staff Casual", key: "defaultStaffCasual" },
  ];

  return (
    <div>
      <p className="text-sm text-gray-600 mb-4">
        Set the total number of leave days allocated per academic session for
        each role.
      </p>
      {loading ? (
        <p>Loading...</p>
      ) : !settings ? (
        <p>Could not load settings.</p>
      ) : (
        <div className="space-y-4">
          <table className="w-full text-left border">
            <thead className="bg-slate-50">
              <tr className="border-b">
                <th className="p-2">Leave Type</th>
                <th className="p-2 text-center">Days Allocated</th>
              </tr>
            </thead>
            <tbody>
              {fields.map((field) => (
                <tr key={field.key} className="border-b">
                  <td className="p-2 font-semibold">{field.label}</td>
                  <td className="p-2 text-center">
                    <Input
                      type="number"
                      className="!w-20 text-center mx-auto"
                      value={String(
                        settings[field.key as keyof LeaveSetting] || ""
                      )}
                      onChange={(e) => handleChange(field.key, e.target.value)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="text-right">
            {statusMessage && (
              <p className="text-sm text-green-600 mb-2">{statusMessage}</p>
            )}
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Configuration"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

// --- MAIN COMPONENT ---

const AttendanceMonitoring: React.FC = () => {
  const { user } = useAuth();
  // 3. GET THE REFRESH TOOLS
  const { refreshKey, triggerRefresh } = useDataRefresh();
  const [activeTab, setActiveTab] = useState<
    "student" | "staff" | "staff_calendar" | "my_attendance" | "leave_config"
  >("student");

  const tabButtonClasses = (isActive: boolean) =>
    `px-4 py-2 text-sm font-medium transition-colors focus:outline-none ${
      isActive
        ? "bg-slate-200 rounded-t-lg font-semibold"
        : "text-gray-600 hover:bg-slate-100"
    }`;

  const renderContent = () => {
    if (!user || !user.branchId) return <p>Loading user data...</p>;
    switch (activeTab) {
      case "student":
        return <StudentAttendanceView />;
      case "staff":
        // 4. PASS triggerRefresh TO THE COMPONENT
        return <StaffAttendanceView onAttendanceSaved={triggerRefresh} />;
      case "staff_calendar":
        // 5. PASS THE key PROP TO THE CALENDAR
        return (
          <StaffAttendanceCalendar key={refreshKey} apiService={apiService} />
        );
      case "my_attendance":
        return <LeaveManager user={user} />;
      case "leave_config":
        return <LeaveConfigurationView />;
      default:
        return null;
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        Attendance & Leave
      </h1>
      <Card>
        <div className="flex border-b border-slate-200">
          <button
            className={tabButtonClasses(activeTab === "student")}
            onClick={() => setActiveTab("student")}
          >
            Student Attendance
          </button>
          <button
            className={tabButtonClasses(activeTab === "staff")}
            onClick={() => setActiveTab("staff")}
          >
            Staff Attendance
          </button>
          <button
            className={tabButtonClasses(activeTab === "staff_calendar")}
            onClick={() => setActiveTab("staff_calendar")}
          >
            Staff Calendar
          </button>
          <button
            className={tabButtonClasses(activeTab === "my_attendance")}
            onClick={() => setActiveTab("my_attendance")}
          >
            My Attendance & Leave
          </button>
          <button
            className={tabButtonClasses(activeTab === "leave_config")}
            onClick={() => setActiveTab("leave_config")}
          >
            Leave Configuration
          </button>
        </div>
        <div className="pt-6">{renderContent()}</div>
      </Card>
    </div>
  );
};

export default AttendanceMonitoring;