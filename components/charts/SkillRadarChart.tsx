import React from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface SkillRadarChartProps {
  skills: { skill: string; value: number }[];
}

const SkillRadarChart: React.FC<SkillRadarChartProps> = ({ skills }) => {
  // 1. Safety Check: If no data, show a message instead of a blank chart
  if (!skills || skills.length === 0) {
    return (
      <div className="h-[250px] w-full flex items-center justify-center text-slate-400 border border-dashed border-slate-200 rounded-lg">
        <p className="text-sm">No skill assessment data available.</p>
      </div>
    );
  }

  // 2. Data Mapping
  const data = skills.map((s) => ({
    subject: s.skill,
    score: s.value,
    fullMark: 10,
  }));

  return (
    // FIX: Remove the wrapping <div> style and pass height={250} directly
    // to ResponsiveContainer. This matches your working BarChart logic.
    <ResponsiveContainer width="100%" height={250}>
      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
        <PolarGrid stroke="#e2e8f0" />
        <PolarAngleAxis
          dataKey="subject"
          tick={{ fill: "#4b5563", fontSize: 11 }}
        />
        <PolarRadiusAxis
          angle={30}
          domain={[0, 10]}
          tickCount={6}
          tick={{ fill: "#9ca3af", fontSize: 10 }}
        />
        <Radar
          name="My Score"
          dataKey="score"
          stroke="#4F46E5"
          fill="#4F46E5"
          fillOpacity={0.5}
        />
        <Tooltip
          formatter={(value: number) => [`${value} / 10`, "Score"]}
          contentStyle={{
            borderRadius: "8px",
            border: "none",
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
          }}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
};

export default SkillRadarChart;
