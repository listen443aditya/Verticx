import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';

interface SkillRadarChartProps {
  skills: { skill: string; value: number }[];
}

const SkillRadarChart: React.FC<SkillRadarChartProps> = ({ skills }) => {
  if (!skills || skills.length === 0) {
    return <p className="text-center text-sm text-text-secondary-dark p-4">No skill assessment data available yet.</p>;
  }

  const radarData = skills.map(s => ({
    subject: s.skill,
    A: s.value,
    fullMark: 10,
  }));

  return (
    <div style={{ height: '250px', width: '100%' }}>
      <ResponsiveContainer>
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
            <PolarRadiusAxis angle={30} domain={[0, 10]} tickCount={6}/>
            <Radar name="Score" dataKey="A" stroke="#4F46E5" fill="#4F46E5" fillOpacity={0.6} />
            <Tooltip formatter={(value: number) => `${value.toFixed(1)} / 10`} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SkillRadarChart;
