import React, { useState } from "react";
import Card from "../../components/ui/Card.tsx";
import Button from "../../components/ui/Button.tsx";
import { RegistrarApiService } from "../../services/registrarApiService";

const apiService = new RegistrarApiService();

const reportTypes = [
  {
    id: "enrollment",
    name: "Enrollment Statistics",
    description:
      "Trends in new admissions, re-enrollments, and student attrition rates by grade level.",
  },
  {
    id: "class_rosters",
    name: "Class Rosters",
    description: "Generate detailed student lists for each class and section.",
  },
  {
    id: "fee_defaulters",
    name: "Fee Defaulters List",
    description: "A list of all students with outstanding fee payments.",
  },
  {
    id: "faculty_list",
    name: "Faculty & Staff Directory",
    description: "A complete directory of all teaching and non-teaching staff.",
  },
];

// Helper to convert JSON to CSV and download
const downloadCSV = (data: any[], fileName: string) => {
  if (!data || data.length === 0) {
    alert("No data available for this report.");
    return;
  }
  const header = Object.keys(data[0]).join(",");
  const rows = data.map((obj) =>
    Object.values(obj)
      .map((v) => `"${v}"`)
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

const Reports: React.FC = () => {
  const [selectedReport, setSelectedReport] = useState(reportTypes[0].id);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState("");

  const handleGenerate = async () => {
    setGenerating(true);
    setMessage("");
    try {
      const response = await apiService.generateReport(selectedReport);

      if (response.data && response.data.length > 0) {
        downloadCSV(response.data, response.fileName);
        setMessage(
          `Successfully generated and downloaded "${response.fileName}".`
        );
      } else {
        setMessage("Report generated but no data found.");
      }
    } catch (error) {
      console.error("Report generation failed", error);
      setMessage("Failed to generate report. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-text-primary-dark mb-6">
        Generate Reports
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <h2 className="text-lg font-semibold text-text-primary-dark mb-4">
            Select Report Type
          </h2>
          <div className="space-y-2">
            {reportTypes.map((report) => (
              <button
                key={report.id}
                onClick={() => {
                  setSelectedReport(report.id);
                  setMessage("");
                }}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  selectedReport === report.id
                    ? "bg-brand-primary text-white"
                    : "hover:bg-slate-100"
                }`}
              >
                {report.name}
              </button>
            ))}
          </div>
        </Card>
        <Card className="md:col-span-2">
          <div className="min-h-[250px] flex flex-col">
            {reportTypes.find((r) => r.id === selectedReport) && (
              <>
                <h2 className="text-xl font-bold text-text-primary-dark mb-2">
                  {reportTypes.find((r) => r.id === selectedReport)?.name}
                </h2>
                <p className="text-text-secondary-dark mb-6 flex-grow">
                  {
                    reportTypes.find((r) => r.id === selectedReport)
                      ?.description
                  }
                </p>
              </>
            )}

            {message && (
              <div
                className={`mb-4 p-3 rounded-lg text-sm ${
                  message.includes("Failed")
                    ? "bg-red-100 text-red-800"
                    : "bg-green-100 text-green-800"
                }`}
              >
                {message}
              </div>
            )}

            <div className="mt-auto text-right">
              <Button onClick={handleGenerate} disabled={generating}>
                {generating ? "Downloading..." : "Download CSV Report"}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Reports;
