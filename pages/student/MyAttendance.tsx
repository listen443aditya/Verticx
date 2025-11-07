import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "../../hooks/useAuth.ts";
import { StudentApiService, SharedApiService } from "../../services";
import type {
  AttendanceRecord,
  LeaveApplication,
  Branch,
  GradeWithCourse,
} from "../../types.ts";
import Card from "../../components/ui/Card.tsx";
import Button from "../../components/ui/Button.tsx";

const apiService = new StudentApiService();
const sharedApiService = new SharedApiService();

const StatBox: React.FC<{ label: string; value: string | number; color: string; }> = ({
  label,
  value,
  color,
}) => (
  <div className="bg-slate-50 p-4 rounded-lg text-center">
    <div className={`text-3xl font-bold ${color}`}>{value}</div>
    <div className="text-sm font-medium text-text-secondary-dark mt-1">
      {label}
    </div>
  </div>
);

const DayDetailsModal: React.FC<{
  date: Date;
  records: AttendanceRecord[];
  courses: GradeWithCourse[];
  onClose: () => void;
}> = ({ date, records, courses, onClose }) => {
  const getCourseName = (courseId: string) => {
    return (
      courses.find((c) => c.courseId === courseId)?.courseName ||
      "Unknown Course"
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold">
            Attendance for {date.toLocaleDateString()}
          </h2>
          <button onClick={onClose} className="text-3xl font-light">
            &times;
          </button>
        </div>
        <div className="mt-4 max-h-60 overflow-y-auto">
          {records.length > 0 ? (
            <ul className="space-y-2">
              {records.map((rec, i) => (
                <li
                  key={i}
                  className="flex justify-between items-center p-2 bg-slate-100 rounded"
                >
                  <span className="text-sm">{getCourseName(rec.courseId)}</span>
                  <span
                    className={`text-sm font-semibold ${
                      rec.status === "Present"
                        ? "text-green-600"
                        : rec.status === "Tardy"
                        ? "text-yellow-600"
                        : "text-red-600"
                    }`}
                  >
                    {rec.status}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-slate-500">
              No attendance records for this day.
            </p>
          )}
        </div>
        <div className="mt-6 text-right">
          <Button onClick={onClose}>Close</Button>
        </div>
      </Card>
    </div>
  );
};

const MyAttendance: React.FC = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [leaves, setLeaves] = useState<LeaveApplication[]>([]);
  const [branch, setBranch] = useState<Branch | null>(null);
  const [courses, setCourses] = useState<GradeWithCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayDetails, setSelectedDayDetails] = useState<{
    date: Date;
    records: AttendanceRecord[];
  } | null>(null);

  useEffect(() => {
    const fetchAttendance = async () => {
      if (!user?.branchId) return;
      setLoading(true);
      try {
        const [attendanceData, leaveData, branchData, gradesData] =
          await Promise.all([
            apiService.getStudentAttendance(),
            apiService.getLeaveApplicationsForUser(),
            sharedApiService.getBranchById(user.branchId),
            apiService.getStudentGrades(),
          ]);
        setRecords(attendanceData);
        setLeaves(
          leaveData.filter((l: LeaveApplication) => l.status === "Approved")
        );
        setBranch(branchData);
        setCourses(gradesData);

        if (branchData?.academicSessionStartDate) {
          const sessionStartDate = new Date(
            branchData.academicSessionStartDate
          );
          const today = new Date();
          if (today < sessionStartDate) {
            setCurrentDate(sessionStartDate);
          } else {
            setCurrentDate(today);
          }
        } else {
          setCurrentDate(new Date());
        }
      } catch (error) {
        console.error("Failed to fetch attendance data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
  }, [user, currentDate.getMonth()]);

  const recordsByDate = useMemo(() => {
    const map = new Map<string, AttendanceRecord[]>();
    records.forEach((rec) => {
      const dateKey = new Date(rec.date).toISOString().split("T")[0];
      if (!map.has(dateKey)) map.set(dateKey, []);
      map.get(dateKey)!.push(rec);
    });
    return map;
  }, [records]);

  const getDayStatus = useCallback(
    (date: Date) => { 
      const dateString = new Date(
        Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
      )
        .toISOString()
        .split("T")[0];

      const isLeave = leaves.some((l) => {
        return dateString >= l.fromDate && dateString <= l.toDate;
      });

      if (isLeave) return "Leave";

      // Check attendance records
      const dayRecords = recordsByDate.get(dateString);
      if (!dayRecords || dayRecords.length === 0) return "NoRecord";
      if (dayRecords.some((r) => r.status === "Absent")) return "Absent";
      if (dayRecords.some((r) => r.status === "Tardy")) return "Tardy";
      return "Present";
    },
    [recordsByDate, leaves]
  );
  
  const attendanceSummary = useMemo(() => {
    const summary = {
      totalPresent: 0,
      totalAbsent: 0,
      totalTardy: 0,
      totalLeaves: 0,
      totalMarkedDays: 0,
    };
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      const status = getDayStatus(date); 

      if(status !== 'NoRecord') {
         summary.totalMarkedDays++;
      }
      
      switch (status) {
        case "Present":
          summary.totalPresent++;
          break;
        case "Absent":
          summary.totalAbsent++;
          break;
        case "Tardy":
          summary.totalTardy++;
          break;
        case "Leave":
          summary.totalLeaves++;
          break;
      }
    }

    return summary;
  }, [currentDate, getDayStatus]);

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
    for (let i = 0; i < startOffset; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  }, [currentDate]);

  const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const changeMonth = (delta: number) => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(1);
      newDate.setMonth(newDate.getMonth() + delta);
      return newDate;
    });
  };

  const handleDayClick = (day: Date) => {
    const dateString = new Date(
        Date.UTC(day.getFullYear(), day.getMonth(), day.getDate())
      )
        .toISOString()
        .split("T")[0];
    const dayRecords = recordsByDate.get(dateString) || [];
    setSelectedDayDetails({ date: day, records: dayRecords });
  };

  if (loading)
    return (
      <Card>
        <p>Loading your attendance history...</p>
      </Card>
    );

  return (
    <div>
      <h1 className="text-3xl font-bold text-text-primary-dark mb-6">
        My Attendance
      </h1>
      <Card>
        <div className="flex justify-between items-center mb-4">
          <Button onClick={() => changeMonth(-1)}>&larr;</Button>
          <h2 className="text-xl font-bold">
            {currentDate.toLocaleString("default", {
              month: "long",
              year: "numeric",
            })}
          </h2>
          <Button onClick={() => changeMonth(1)}>&rarr;</Button>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {weekdays.map((day) => (
            <div
              key={day}
              className="text-center font-bold text-text-secondary-dark text-sm py-2"
            >
              {day}
            </div>
          ))}
          {calendarDays.map((day, index) => {
            if (!day)
              return (
                <div
                  key={`blank-${index}`}
                  className="border rounded-md border-slate-100 h-20"
                ></div>
              );
              
            const status = getDayStatus(day);
            const isToday = day.toDateString() === new Date().toDateString();
            
            const statusClasses = {
              Present:
                "bg-green-100 text-green-800 border-green-200 hover:bg-green-200",
              Absent: "bg-red-100 text-red-800 border-red-200 hover:bg-red-200",
              Tardy:
                "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200",
              Leave: "bg-blue-100 text-blue-800 border-blue-200",
              NoRecord: "bg-slate-50 text-slate-400 border-slate-200",
            }[status];
            
            return (
              <div
                key={index}
                className={`p-2 h-20 border rounded-md transition-colors cursor-pointer ${statusClasses} ${isToday ? "ring-2 ring-brand-primary" : ""}`}
                onClick={() => handleDayClick(day)}
              >
                <span className="text-sm font-semibold">{day.getDate()}</span>
              </div>
            );
          })}
        </div>
        <div className="flex justify-center flex-wrap gap-4 mt-6 text-sm">
          <span className="flex items-center">
            <div className="w-4 h-4 bg-green-100 border rounded mr-2"></div>
            Present
          </span>
          <span className="flex items-center">
            <div className="w-4 h-4 bg-yellow-100 border rounded mr-2"></div>
            Tardy
          </span>
          <span className="flex items-center">
            <div className="w-4 h-4 bg-red-100 border rounded mr-2"></div>Absent
          </span>
          <span className="flex items-center">
            <div className="w-4 h-4 bg-blue-100 border rounded mr-2"></div>Leave
          </span>
        </div>
      </Card>
      
      <Card className="mt-6">
        <h3 className="text-xl font-semibold mb-4 text-text-primary-dark">
          Month Summary
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatBox
            label="Total Marked Days"
            value={attendanceSummary.totalMarkedDays}
            color="text-brand-primary"
          />
          <StatBox
            label="Total Present"
            value={attendanceSummary.totalPresent}
            color="text-green-600"
          />
          <StatBox
            label="Total Tardy"
            value={attendanceSummary.totalTardy}
            color="text-yellow-600"
          />
          <StatBox
            label="Total Absent"
            value={attendanceSummary.totalAbsent}
            color="text-red-600"
          />
          <StatBox
            label="Total Leave"
            value={attendanceSummary.totalLeaves}
            color="text-blue-600"
          />
        </div>
      </Card>

      {selectedDayDetails && (
        <DayDetailsModal
          date={selectedDayDetails.date}
          records={selectedDayDetails.records}
          courses={courses} // Pass courses to modal
          onClose={() => setSelectedDayDetails(null)}
        />
      )}
    </div>
  );
};

export default MyAttendance;