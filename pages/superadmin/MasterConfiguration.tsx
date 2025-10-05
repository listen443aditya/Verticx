// MasterConfiguration.tsx
import React, { useState, useEffect, useCallback } from "react";
import { AdminApiService } from "../../services/adminApiService";
import type { SystemSettings } from "../../types";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import { useDataRefresh } from "../../contexts/DataRefreshContext";
import { useAuth } from "../../hooks/useAuth.ts"; // The forgotten name, now spoken.

const apiService = new AdminApiService();

const featureConfig = {
  "Principal Portal": {
    principal_students: "Student Management",
    principal_faculty: "Faculty Management",
    principal_classes: "Class View",
    principal_finance: "Financial Overview",
    principal_attendance: "Attendance Overview",
    principal_results: "Examination Results",
    principal_staff_requests: "Staff Requests",
    principal_grievances: "Grievance Log",
    principal_complaints: "Raise Complaint",
    principal_events: "Event Management",
    principal_communication: "Communication",
    principal_reports: "Reports",
    principal_profile: "School Profile",
  },
  "Registrar Portal": {
    registrar_admissions: "Admissions",
    registrar_academic_requests: "Academic Requests",
    registrar_students: "Student Information System",
    registrar_faculty: "Faculty Information System",
    registrar_classes: "Class Management",
    registrar_fees: "Fees & Finance",
    registrar_attendance: "Attendance Monitoring",
    registrar_timetable: "Timetable Management",
    registrar_library: "Library",
    registrar_hostel: "Hostel",
    registrar_transport: "Transport",
    registrar_inventory: "Inventory",
    registrar_documents: "Documents",
    registrar_events: "Events",
    registrar_reports: "Reports",
    registrar_communication: "Communication",
    registrar_bulk_movement: "Bulk Student Movement",
  },
  "Teacher Portal": {
    teacher_attendance: "Attendance Management",
    teacher_gradebook: "Gradebook",
    teacher_quizzes: "Quizzes",
    teacher_syllabus: "Syllabus Planning",
    teacher_content: "Course Content Upload",
  },
  "Student Portal": {
    student_syllabus: "Syllabus View",
    student_content: "Course Content View",
    student_assignments: "Assignments & Homework",
    student_grades: "My Grades",
    student_attendance: "My Attendance",
    student_feedback: "Teacher Feedback",
    student_complaints: "View Raised Complaints",
    student_ask_ai: "Ask AI in Content",
  },
  "Parent Portal": {
    parent_academics: "Child's Academics",
    parent_fees: "Fee Payments",
    parent_complaints: "View Raised Complaints",
    parent_contact_teacher: "Contact Teacher",
  },
  "Financial Features": {
    online_payments_enabled: "Online Fee Payments",
    erp_billing_enabled: "ERP Bill Payments (Principal)",
  },
};

const MasterConfiguration: React.FC = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const { triggerRefresh } = useDataRefresh();

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await apiService.getSystemSettings(user.role);
      setSettings(data);
    } catch (error) {
      console.error("Failed to fetch master config:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSettingChange = (key: keyof SystemSettings, value: any) => {
    if (settings) {
      setSettings({ ...settings, [key]: value });
    }
  };

  const handleFeatureToggle = (featureKey: string, isChecked: boolean) => {
    if (settings) {
      const newToggles = { ...settings.globalFeatureToggles };
      newToggles[featureKey] = isChecked;
      handleSettingChange("globalFeatureToggles", newToggles);
    }
  };

  const handleSave = async () => {
    if (!settings || !user) return;
    setIsSaving(true);
    setSaveStatus("");
    try {
      await apiService.updateSystemSettings(user.role, settings);
      setSaveStatus("Settings updated successfully!");
      triggerRefresh();
    } catch (error) {
      setSaveStatus("Failed to update settings.");
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveStatus(""), 3000);
    }
  };

  if (loading || !settings) {
    return <p>Loading master configuration...</p>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-text-primary-dark mb-6">
        Master Configuration
      </h1>
      <div className="space-y-6">
        <Card>
          <h2 className="text-xl font-semibold text-text-primary-dark mb-4">
            Global ERP Settings
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Default ERP Price per Student"
              type="number"
              value={String(settings.defaultErpPrice)}
              onChange={(e) =>
                handleSettingChange("defaultErpPrice", Number(e.target.value))
              }
            />
            <div>
              <label className="block text-sm font-medium text-text-secondary-dark mb-1">
                Login Page Announcement
              </label>
              <textarea
                value={settings.loginPageAnnouncement || ""}
                onChange={(e) =>
                  handleSettingChange("loginPageAnnouncement", e.target.value)
                }
                rows={3}
                className="w-full bg-white border border-slate-300 rounded-md py-2 px-3"
                placeholder="Optional announcement shown on the login page..."
              />
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-semibold text-text-primary-dark mb-4">
            System-Wide Feature Toggles
          </h2>
          <p className="text-sm text-text-secondary-dark mb-4">
            Enable or disable feature modules across the entire system.
            Disabling a feature here will prevent school-level admins from
            enabling it.
          </p>
          <div className="space-y-4">
            {Object.entries(featureConfig).map(
              ([portalName, portalFeatures]) => (
                <div key={portalName}>
                  <h4 className="text-md font-semibold text-text-secondary-dark border-b pb-2 mb-2">
                    {portalName}
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {Object.entries(portalFeatures).map(([key, label]) => (
                      <label
                        key={key}
                        className="flex items-center space-x-2 p-2 rounded hover:bg-slate-100 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={settings.globalFeatureToggles[key] !== false}
                          onChange={(e) =>
                            handleFeatureToggle(key, e.target.checked)
                          }
                          className="h-4 w-4 rounded border-gray-300 text-brand-secondary focus:ring-brand-accent"
                        />
                        <span className="text-sm">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )
            )}
          </div>
        </Card>

        <div className="flex justify-end items-center gap-4">
          {saveStatus && <p className="text-sm text-green-600">{saveStatus}</p>}
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Master Configuration"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MasterConfiguration;
