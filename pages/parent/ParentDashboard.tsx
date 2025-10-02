// pages/parent/ParentDashboard.tsx
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "../../hooks/useAuth";
import { ParentApiService } from "../../services/parentApiService";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import type {
  ParentDashboardData,
  ChildData,
  User,
  Subject,
  Teacher,
} from "../../types";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { useNavigate } from "react-router-dom";
import TimetableModal from "../../components/modals/TimetableModal";
import AttendanceHistoryModal from "../../components/modals/AttendanceHistoryModal";
import SkillRadarChart from "../../components/charts/SkillRadarChart";
import type { SessionUser } from "../../contexts/AuthContext";
import { TransportIcon, HostelIcon } from "../../components/icons/Icons";
import { useDataRefresh } from "../../contexts/DataRefreshContext";
import ContactCard from "../../components/shared/ContactCard";

const apiService = new ParentApiService();

interface ChildDashboardProps {
  user: SessionUser | null;
  childData: ChildData;
  onViewTimetable: () => void;
  onViewAttendance: () => void;
}

const ChildDashboard: React.FC<ChildDashboardProps> = ({
  user,
  childData,
  onViewTimetable,
  onViewAttendance,
}) => {
  const {
    profile,
    performance,
    fees,
    assignments,
    ranks,
    attendance,
    examSchedule,
    overallMarksPercentage,
    skills,
    transportDetails,
    accommodationDetails,
    selfStudyProgress,
  } = childData;
  const navigate = useNavigate();

  const transportFee = transportDetails?.stop?.charges || 0;
  const hostelFee = accommodationDetails?.room?.fee || 0;
  const totalOutstandingWithExtras =
    (fees?.totalOutstanding || 0) + transportFee + hostelFee;

  const performanceChartData = (performance || []).map((p) => ({
    name: p.subject,
    "Child's Score": p.score,
    "Class Average": p.classAverage,
  }));

  const {
    totalLectures = 0,
    studentCompletedLectures = 0,
    teacherCompletedLectures = 0,
  } = selfStudyProgress || {};
  const studentProgressPercent =
    totalLectures > 0 ? (studentCompletedLectures / totalLectures) * 100 : 0;
  const teacherProgressPercent =
    totalLectures > 0 ? (teacherCompletedLectures / totalLectures) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 flex flex-col items-center justify-center text-center">
          <div className="w-24 h-24 rounded-full bg-slate-200 flex items-center justify-center text-4xl font-bold text-brand-primary mb-3">
            {profile.name?.charAt(0) ?? "U"}
          </div>
          <h3 className="text-2xl font-bold text-text-primary-dark">
            {profile.name}
          </h3>
          <p className="text-text-secondary-dark">{profile.class}</p>
          <div className="text-sm text-text-secondary-dark mt-2 w-full border-t pt-2">
            <p className="font-semibold">
              Mentor: {profile.mentor?.name ?? "Not Assigned"}
            </p>
            {profile.mentor?.name &&
              profile.mentor?.name !== "Not Assigned" && (
                <>
                  {profile.mentor?.email && (
                    <p className="text-xs">{profile.mentor.email}</p>
                  )}
                  {profile.mentor?.phone && (
                    <p className="text-xs">{profile.mentor.phone}</p>
                  )}
                </>
              )}
          </div>
        </Card>

        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="text-center flex flex-col justify-center">
            <h4 className="font-semibold text-text-secondary-dark mb-2">
              Academic Ranking
            </h4>
            <div className="flex flex-col sm:flex-row justify-around items-center gap-4">
              <div>
                <p className="text-4xl font-bold text-brand-secondary">
                  {ranks?.class ?? "—"}
                </p>
                <p className="text-sm">Class Rank</p>
              </div>
              <div>
                <p className="text-4xl font-bold text-brand-secondary">
                  {ranks?.school ?? "—"}
                </p>
                <p className="text-sm">School Rank</p>
              </div>
            </div>
          </Card>

          <Card className="text-center flex flex-col justify-center">
            <h4 className="font-semibold text-text-secondary-dark">
              Overall Attendance
            </h4>
            <p className="text-4xl font-bold text-brand-secondary">
              {(attendance?.sessionPercentage ?? 0).toFixed(1)}%
            </p>
            <Button
              variant="secondary"
              className="!text-xs !py-1 mt-2"
              onClick={onViewAttendance}
            >
              View History
            </Button>
          </Card>

          <Card className="text-center flex flex-col justify-center">
            <h4 className="font-semibold text-text-secondary-dark">
              Overall Marks
            </h4>
            <p className="text-4xl font-bold text-brand-secondary">
              {(overallMarksPercentage ?? 0).toFixed(1)}%
            </p>
          </Card>
        </div>
      </div>

      {transportDetails && (
        <Card>
          <h3 className="text-xl font-semibold text-text-primary-dark mb-4 flex items-center gap-2">
            <TransportIcon className="w-5 h-5" />
            Transport Details
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-text-secondary-dark">Route:</span>{" "}
              <span className="font-semibold">
                {transportDetails.route?.routeName}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary-dark">Bus No:</span>{" "}
              <span className="font-semibold">
                {transportDetails.route?.busNumber}
              </span>
            </div>
            <div className="p-2 bg-slate-100 rounded-md mt-2">
              <p>
                <strong>Driver:</strong> {transportDetails.route?.driverName} (
                {transportDetails.route?.driverNumber})
              </p>
              <p>
                <strong>Conductor:</strong>{" "}
                {transportDetails.route?.conductorName} (
                {transportDetails.route?.conductorNumber})
              </p>
            </div>
            <div className="p-2 bg-slate-100 rounded-md mt-2">
              <p>
                <strong>Stop:</strong> {transportDetails.stop?.name}
              </p>
              <p>
                <strong>Pickup:</strong> {transportDetails.stop?.pickupTime}
              </p>
              <p>
                <strong>Drop:</strong> {transportDetails.stop?.dropTime}
              </p>
            </div>
          </div>
        </Card>
      )}

      {accommodationDetails && (
        <Card>
          <h3 className="text-xl font-semibold text-text-primary-dark mb-4 flex items-center gap-2">
            <HostelIcon className="w-5 h-5" />
            Hostel Details
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-text-secondary-dark">Hostel:</span>{" "}
              <span className="font-semibold">
                {accommodationDetails.hostel?.name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary-dark">Room No:</span>{" "}
              <span className="font-semibold">
                {accommodationDetails.room?.roomNumber}
              </span>
            </div>
            <div className="p-2 bg-slate-100 rounded-md mt-2">
              <p>
                <strong>Warden:</strong> {accommodationDetails.hostel?.warden} (
                {accommodationDetails.hostel?.wardenNumber})
              </p>
            </div>
          </div>
        </Card>
      )}

      {user?.enabledFeatures?.parent_academics && (
        <Card>
          <h3 className="text-xl font-semibold text-text-primary-dark mb-4">
            Study Progress
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-text-primary-dark">
                  Child's Progress
                </span>
                <span className="font-semibold text-text-primary-dark">
                  {studentProgressPercent.toFixed(0)}%
                </span>
              </div>
              <div
                className="w-full bg-slate-200 rounded-full h-2.5"
                title={`${studentCompletedLectures} of ${totalLectures} topics completed by child`}
              >
                <div
                  className="bg-brand-secondary h-2.5 rounded-full"
                  style={{ width: `${studentProgressPercent}%` }}
                ></div>
              </div>
              <p className="text-xs text-text-secondary-dark text-right mt-1">
                {studentCompletedLectures} / {totalLectures} topics completed
              </p>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-text-primary-dark">
                  Class Progress (Taught)
                </span>
                <span className="font-semibold text-text-primary-dark">
                  {teacherProgressPercent.toFixed(0)}%
                </span>
              </div>
              <div
                className="w-full bg-slate-200 rounded-full h-2.5"
                title={`${teacherCompletedLectures} of ${totalLectures} topics taught in class`}
              >
                <div
                  className="bg-brand-primary h-2.5 rounded-full"
                  style={{ width: `${teacherProgressPercent}%` }}
                ></div>
              </div>
              <p className="text-xs text-text-secondary-dark text-right mt-1">
                {teacherCompletedLectures} / {totalLectures} topics taught
              </p>
            </div>
          </div>
        </Card>
      )}

      {user?.enabledFeatures?.parent_academics && (
        <Card>
          <h3 className="text-xl font-semibold text-text-primary-dark mb-4">
            Academic Performance
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={performanceChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
              <Tooltip />
              <Legend />
              <Bar dataKey="Child's Score" fill="#4F46E5" />
              <Bar dataKey="Class Average" fill="#A5B4FC" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {user?.enabledFeatures?.parent_academics && (
          <Card>
            <h3 className="text-lg font-semibold mb-3">Skill Assessment</h3>
            <SkillRadarChart skills={skills || []} />
          </Card>
        )}

        <Card>
          <h3 className="text-lg font-semibold mb-3">Upcoming Examinations</h3>
          {examSchedule?.length > 0 ? (
            <div className="space-y-2 max-h-40 overflow-y-auto pr-2 text-sm">
              {examSchedule.map((exam) => (
                <div key={exam.id} className="p-2 bg-slate-100 rounded">
                  <p className="font-bold">{exam.subjectName}</p>
                  <p className="text-xs text-text-secondary-dark">
                    {new Date(exam.date).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-text-secondary-dark">
                    {exam.startTime} - {exam.endTime} (Room: {exam.room})
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-center text-text-secondary-dark p-4">
              No exam schedule published.
            </p>
          )}
        </Card>

        <Card>
          <h3 className="text-lg font-semibold mb-3">Quick Actions</h3>
          <div className="flex flex-col gap-2">
            <Button variant="secondary" onClick={onViewTimetable}>
              View Timetable
            </Button>
            {user?.enabledFeatures?.parent_academics && (
              <Button variant="secondary">Download Report Card</Button>
            )}
            {user?.enabledFeatures?.parent_contact_teacher && (
              <Button
                variant="secondary"
                onClick={() => navigate("/parent/contact")}
              >
                Contact Teacher
              </Button>
            )}
          </div>
        </Card>
      </div>

      {user?.enabledFeatures?.parent_fees && (
        <Card>
          <h3 className="text-lg font-semibold">Fee Status</h3>
          <div className="space-y-2 text-sm p-3 bg-slate-50 rounded-lg mt-3">
            <div className="flex justify-between pt-2 border-t mt-2">
              <span className="font-bold text-text-primary-dark">
                Total Outstanding:
              </span>{" "}
              <span className="font-bold text-lg text-red-500">
                {totalOutstandingWithExtras.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary-dark">Next Due Date:</span>{" "}
              <span className="font-semibold">{fees?.dueDate}</span>
            </div>
          </div>
          <Button
            className="w-full mt-3"
            onClick={() => navigate("/parent/fees")}
          >
            Manage & Pay Fees
          </Button>
        </Card>
      )}

      {user?.enabledFeatures?.parent_academics && (
        <Card>
          <h3 className="text-lg font-semibold mb-3">Pending Assignments</h3>
          {assignments?.length > 0 ? (
            <ul className="text-sm list-disc pl-4 space-y-1">
              {assignments.map((a) => (
                <li key={a.id}>
                  {a.title} (Due: {new Date(a.dueDate).toLocaleDateString()})
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-center text-text-secondary-dark p-4">
              No pending assignments.
            </p>
          )}
        </Card>
      )}
    </div>
  );
};

// FIX: Define an extended type for the dashboard data to satisfy TypeScript.
type EnrichedParentDashboardData = ParentDashboardData & {
  subjects?: Subject[];
  teachers?: Teacher[];
};

const ParentDashboard: React.FC = () => {
  const { user } = useAuth();
  // FIX: Use the new, extended type for the state.
  const [data, setData] = useState<EnrichedParentDashboardData | null>(null);
  const [principalName, setPrincipalName] = useState<string | undefined>(
    undefined
  );
  const [loading, setLoading] = useState(true);
  const [selectedChildIndex, setSelectedChildIndex] = useState(0);
  const [viewingTimetableFor, setViewingTimetableFor] =
    useState<ChildData | null>(null);
  const [viewingAttendanceFor, setViewingAttendanceFor] =
    useState<ChildData | null>(null);
  const { refreshKey } = useDataRefresh();

  const selectedChildData = data?.childrenData[selectedChildIndex];

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const result = await apiService.getParentDashboardData();
    setData(result);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshKey]);

  useEffect(() => {
    const pName = selectedChildData?.branch?.vicePrincipalName ?? undefined;
    setPrincipalName(pName);
  }, [selectedChildData]);

  if (loading) return <div>Loading dashboard...</div>;
  if (!data || data.childrenData.length === 0)
    return <Card>No student data found for your account.</Card>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-text-primary-dark">
          Parent Dashboard
        </h1>
        {data.childrenData.length > 1 && (
          <div>
            <label
              htmlFor="child-select"
              className="text-sm mr-2 text-text-secondary-dark"
            >
              Viewing:
            </label>
            <select
              id="child-select"
              value={selectedChildIndex}
              onChange={(e) =>
                setSelectedChildIndex(parseInt(e.target.value, 10))
              }
              className="bg-surface-dark border border-slate-300 rounded-md py-1 px-2"
            >
              {data.childrenData.map((childData, index) => (
                <option
                  key={childData.profile.id ?? childData.profile.name}
                  value={index}
                >
                  {childData.profile.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {data.childrenData[selectedChildIndex] && (
        <ChildDashboard
          user={user}
          childData={data.childrenData[selectedChildIndex]}
          onViewTimetable={() =>
            setViewingTimetableFor(data.childrenData[selectedChildIndex])
          }
          onViewAttendance={() =>
            setViewingAttendanceFor(data.childrenData[selectedChildIndex])
          }
        />
      )}

      <Card className="mt-6">
        <h2 className="text-xl font-semibold text-text-primary-dark mb-4">
          School Announcements
        </h2>
        <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
          {data.announcements.map((ann) => (
            <div key={ann.id} className="bg-slate-50 p-3 rounded-lg">
              <h3 className="font-bold">{ann.title}</h3>
              <p className="text-xs text-text-secondary-dark">
                {new Date(ann.sentAt).toLocaleString()}
              </p>
              <p className="mt-1 text-sm">{ann.message}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="mt-6">
        <ContactCard
          branch={selectedChildData?.branch}
          principalName={principalName}
        />
      </div>

      {viewingTimetableFor && (
        <TimetableModal
          isOpen={!!viewingTimetableFor}
          onClose={() => setViewingTimetableFor(null)}
          title={`Timetable for ${viewingTimetableFor.profile.name}`}
          config={viewingTimetableFor.timetableConfig}
          timetable={viewingTimetableFor.timetable}
          // FIX: The component now correctly expects and receives these props from the enriched data state.
          subjects={data.subjects || []}
          teachers={data.teachers || []}
        />
      )}

      {viewingAttendanceFor && (
        <AttendanceHistoryModal
          isOpen={!!viewingAttendanceFor}
          onClose={() => setViewingAttendanceFor(null)}
          studentName={viewingAttendanceFor.profile.name}
          records={viewingAttendanceFor.attendance.history}
        />
      )}
    </div>
  );
};

export default ParentDashboard;
