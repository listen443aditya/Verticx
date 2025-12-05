import React, { useState, useEffect, useCallback } from "react";
import Card from "../../components/ui/Card.tsx";
import Button from "../../components/ui/Button.tsx";
import { RegistrarApiService } from "../../services/registrarApiService";
import { useAuth } from "../../hooks/useAuth";
import type { SchoolClass } from "../../types"; // Ensure types are imported

const apiService = new RegistrarApiService();

// Configuration Options
const STUDENT_FIELDS = [
  { id: "personal", label: "Personal Info (DOB, Parents, Contact)" },
  { id: "attendance", label: "Attendance Statistics" },
  { id: "fees", label: "Fee Balance & Status" },
  { id: "concessions", label: "Concessions & Adjustments" },
  { id: "marks", label: "Subject-wise Marks (Averages)" },
];

const STAFF_FIELDS = [
  { id: "contact", label: "Contact Info (Email, Phone)" },
  { id: "details", label: "Job Details (Designation, Qualification)" },
  { id: "salary", label: "Salary Information (Confidential)" },
];

const Reports: React.FC = () => {
  const { user } = useAuth();
  const [reportType, setReportType] = useState<
    "class_rosters" | "faculty_list"
  >("class_rosters");
  const [classes, setClasses] = useState<SchoolClass[]>([]);

  // Selection State
  const [selectedClass, setSelectedClass] = useState("all");
  const [selectedStudentFields, setSelectedStudentFields] = useState<string[]>([
    "personal",
  ]);
  const [selectedStaffFields, setSelectedStaffFields] = useState<string[]>([
    "contact",
    "details",
  ]);

  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState("");

  // Fetch Classes for Dropdown
  const fetchClasses = useCallback(async () => {
    if (!user) return;
    try {
      const data = await apiService.getSchoolClasses();
      setClasses(data);
    } catch (e) {
      console.error(e);
    }
  }, [user]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  // Helper: CSV Downloader
  const downloadCSV = (data: any[], fileName: string) => {
    if (!data || data.length === 0) {
      setMessage("Report generated but contains no data.");
      return;
    }
    // Logic to extract headers dynamically from the first row
    // This ensures dynamic columns (like Subject Names) are included automatically
    const header = Object.keys(data[0]).join(",");
    const rows = data.map((obj) =>
      Object.values(obj)
        .map((v) => `"${v ?? ""}"`)
        .join(",")
    );
    const csvContent = [header, ...rows].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setMessage("");

    const fields =
      reportType === "class_rosters"
        ? selectedStudentFields
        : selectedStaffFields;
    const filters = { classId: selectedClass };

    try {
      const response = await apiService.generateReport(
        reportType,
        filters,
        fields
      );

      if (response.data && response.data.length > 0) {
        downloadCSV(response.data, response.fileName);
        setMessage(`Successfully downloaded "${response.fileName}".`);
      } else {
        setMessage("No records match your criteria.");
      }
    } catch (error) {
      console.error("Generation failed", error);
      setMessage("Failed to generate report.");
    } finally {
      setGenerating(false);
    }
  };

  const toggleField = (fieldId: string, type: "student" | "staff") => {
    if (type === "student") {
      setSelectedStudentFields((prev) =>
        prev.includes(fieldId)
          ? prev.filter((f) => f !== fieldId)
          : [...prev, fieldId]
      );
    } else {
      setSelectedStaffFields((prev) =>
        prev.includes(fieldId)
          ? prev.filter((f) => f !== fieldId)
          : [...prev, fieldId]
      );
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-text-primary-dark mb-6">
        Report Generator
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 1. Report Type Selection */}
        <Card className="md:col-span-1 h-fit">
          <h2 className="text-lg font-semibold text-text-primary-dark mb-4">
            Select Report Type
          </h2>
          <div className="space-y-2">
            <button
              onClick={() => {
                setReportType("class_rosters");
                setMessage("");
              }}
              className={`w-full text-left p-3 rounded-lg transition-colors border ${
                reportType === "class_rosters"
                  ? "bg-brand-primary text-white border-brand-primary"
                  : "hover:bg-slate-50 border-transparent"
              }`}
            >
              <div className="font-bold">Class Roster & Performance</div>
              <div
                className={`text-xs mt-1 ${
                  reportType === "class_rosters"
                    ? "text-blue-100"
                    : "text-slate-500"
                }`}
              >
                Students, Fees, Marks, Attendance
              </div>
            </button>
            <button
              onClick={() => {
                setReportType("faculty_list");
                setMessage("");
              }}
              className={`w-full text-left p-3 rounded-lg transition-colors border ${
                reportType === "faculty_list"
                  ? "bg-brand-primary text-white border-brand-primary"
                  : "hover:bg-slate-50 border-transparent"
              }`}
            >
              <div className="font-bold">Faculty & Staff Directory</div>
              <div
                className={`text-xs mt-1 ${
                  reportType === "faculty_list"
                    ? "text-blue-100"
                    : "text-slate-500"
                }`}
              >
                Details, Salary, Contact Info
              </div>
            </button>
          </div>
        </Card>

        {/* 2. Configuration Card */}
        <Card className="md:col-span-2">
          <h2 className="text-xl font-bold text-text-primary-dark mb-4">
            Configure Report
          </h2>

          {/* Configuration for Class Roster */}
          {reportType === "class_rosters" && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Select Target Audience
                </label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full md:w-1/2 bg-white border border-slate-300 rounded-md py-2 px-3"
                >
                  <option value="all">All Classes (Entire School)</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      Grade {c.gradeLevel} - {c.section}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Include Data Columns
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {STUDENT_FIELDS.map((field) => (
                    <label
                      key={field.id}
                      className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-slate-50 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedStudentFields.includes(field.id)}
                        onChange={() => toggleField(field.id, "student")}
                        className="h-4 w-4 text-brand-primary rounded border-gray-300 focus:ring-brand-accent"
                      />
                      <span className="ml-3 text-sm font-medium text-slate-700">
                        {field.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Configuration for Faculty List */}
          {reportType === "faculty_list" && (
            <div className="space-y-6 animate-fade-in">
              <div className="p-4 bg-blue-50 text-blue-800 rounded-lg text-sm mb-4">
                This report generates a complete list of all active staff
                members. Select the columns you wish to include below.
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {STAFF_FIELDS.map((field) => (
                  <label
                    key={field.id}
                    className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-slate-50 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedStaffFields.includes(field.id)}
                      onChange={() => toggleField(field.id, "staff")}
                      className="h-4 w-4 text-brand-primary rounded border-gray-300 focus:ring-brand-accent"
                    />
                    <span className="ml-3 text-sm font-medium text-slate-700">
                      {field.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 pt-6 border-t flex justify-between items-center">
            <div
              className={`text-sm font-medium ${
                message.includes("Failed") || message.includes("No records")
                  ? "text-red-600"
                  : "text-green-600"
              }`}
            >
              {message}
            </div>
            <Button onClick={handleGenerate} disabled={generating}>
              {generating ? "Processing..." : "Download CSV"}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Reports;
