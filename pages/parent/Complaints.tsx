// pages/parent/Complaints.tsx
import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../hooks/useAuth.ts";
import { ParentApiService } from "../../services/parentApiService";
import type { StudentProfile, ComplaintAboutStudent } from "../../types.ts";
import Card from "../../components/ui/Card.tsx";
import { AlertTriangleIcon } from "../../components/icons/Icons.tsx";

const apiService = new ParentApiService();

const Complaints: React.FC = () => {
  const { user } = useAuth();
  const [childrenProfiles, setChildrenProfiles] = useState<StudentProfile[]>(
    []
  );
  const [selectedChildId, setSelectedChildId] = useState<string>("");
  const [complaints, setComplaints] = useState<ComplaintAboutStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [complaintsLoading, setComplaintsLoading] = useState(false);

  useEffect(() => {
    const fetchChildren = async () => {
      if (!user?.childrenIds || user.childrenIds.length === 0) {
        setChildrenProfiles([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // getStudentProfileDetails returns StudentProfile | null
        const promises = user.childrenIds.map((id) =>
          apiService.getStudentProfileDetails(id)
        );
        const results = await Promise.all(promises);
        const profiles = results.filter(
          (p): p is StudentProfile => p !== null && p !== undefined
        );

        setChildrenProfiles(profiles);

        if (profiles.length > 0) {
          // StudentProfile shape uses .student (not studentId)
          setSelectedChildId(profiles[0].student.id);
        }
      } catch (err) {
        console.error("Failed to load child profiles", err);
      } finally {
        setLoading(false);
      }
    };

    fetchChildren();
  }, [user]);

  const fetchComplaints = useCallback(async () => {
    if (!selectedChildId) {
      setComplaints([]);
      return;
    }
    setComplaintsLoading(true);
    try {
      const data = await apiService.getComplaintsAboutStudent(selectedChildId);
      setComplaints(data);
    } catch (err) {
      console.error("Failed to fetch complaints", err);
      setComplaints([]);
    } finally {
      setComplaintsLoading(false);
    }
  }, [selectedChildId]);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  const currentChildName = childrenProfiles.find(
    (p) => p.student.id === selectedChildId
  )?.student.name;

  return (
    <div>
      <h1 className="text-3xl font-bold text-text-primary-dark mb-6">
        Raised Complaints
      </h1>

      <Card>
        {loading ? (
          <p>Loading data...</p>
        ) : (
          <>
            {childrenProfiles.length > 1 && (
              <div className="flex items-center gap-4 mb-6">
                <label htmlFor="child-select" className="font-medium">
                  Viewing complaints for:
                </label>
                <select
                  id="child-select"
                  value={selectedChildId}
                  onChange={(e) => setSelectedChildId(e.target.value)}
                  className="bg-surface-dark border border-slate-300 rounded-md py-2 px-3"
                >
                  {childrenProfiles.map((profile) => (
                    <option key={profile.student.id} value={profile.student.id}>
                      {profile.student.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {complaintsLoading ? (
              <p>Loading complaints...</p>
            ) : complaints.length === 0 ? (
              <div className="text-center p-8">
                <p className="text-text-secondary-dark">
                  No complaints have been raised for{" "}
                  {currentChildName || "this student"}.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {complaints.map((complaint) => (
                  <div
                    key={complaint.id}
                    className="bg-red-50 border border-red-200 p-4 rounded-lg flex items-start gap-4"
                  >
                    <div className="flex-shrink-0 text-red-500 mt-1">
                      <AlertTriangleIcon className="w-6 h-6" />
                    </div>
                    <div className="flex-grow">
                      <div className="flex justify-between items-center">
                        <p className="font-bold text-red-800">
                          Complaint from: {complaint.raisedByName} (
                          {complaint.raisedByRole})
                        </p>
                        <p className="text-xs text-red-600">
                          {new Date(complaint.submittedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <p className="mt-2 text-sm text-red-900 whitespace-pre-wrap">
                        {complaint.complaintText}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
};

export default Complaints;
