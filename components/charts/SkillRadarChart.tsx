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
  // 1. Safety Check
  if (!skills || skills.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-400 border border-dashed border-slate-200 rounded-lg">
        <p>No skill assessment data available.</p>
      </div>
    );
  }

  // 2. Data Mapping
  const radarData = skills.map((s) => ({
    subject: s.skill,
    score: s.value,
    fullMark: 10,
  }));

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
          <PolarGrid stroke="#e2e8f0" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: "#475569", fontSize: 11 }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 10]}
            tickCount={6}
            tick={{ fill: "#94a3b8", fontSize: 10 }}
          />
          <Radar
            name="Score"
            dataKey="score"
            stroke="#4F46E5"
            fill="#4F46E5"
            fillOpacity={0.5}
          />
          <Tooltip
            contentStyle={{
              borderRadius: "8px",
              border: "none",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
            }}
            formatter={(value: number) => [`${value}/10`, "Score"]}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SkillRadarChart;
