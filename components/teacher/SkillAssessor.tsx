import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth.ts';
import { teacherApiService as apiService } from '../../services';
import type { SkillAssessment } from '../../types.ts';
import Button from '../ui/Button.tsx';

interface SkillAssessorProps {
  studentId: string;
  teacherId: string;
  onSave: () => void;
}

export const SKILL_LIST = ['Problem Solving', 'Creativity', 'Teamwork', 'Leadership', 'Communication'];

export const SkillAssessor: React.FC<SkillAssessorProps> = ({ studentId, teacherId, onSave }) => {
    const [myRatings, setMyRatings] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState('');

    const fetchData = useCallback(async () => {
        setLoading(true);
        // FIX: Corrected method call to fetch skill assessment.
        const existingAssessment = await apiService.getTeacherSkillAssessmentForStudent(teacherId, studentId);
        if (existingAssessment) {
            setMyRatings(existingAssessment.skills);
        } else {
            // Initialize with default values if no prior assessment exists
            const initialRatings: Record<string, number> = {};
            SKILL_LIST.forEach(skill => { initialRatings[skill] = 5; });
            setMyRatings(initialRatings);
        }
        setLoading(false);
    }, [teacherId, studentId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleRatingChange = (skill: string, value: number) => {
        setMyRatings(prev => ({ ...prev, [skill]: value }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        setSaveStatus('');
        try {
            // FIX: Corrected method call to submit skill assessment.
            await apiService.submitSkillAssessment({
                studentId,
                teacherId,
                skills: myRatings,
            });
            setSaveStatus('Assessment saved successfully!');
            onSave(); // Trigger data refresh in parent
        } catch (error) {
            setSaveStatus('Failed to save. Please try again.');
            console.error(error);
        }
        setIsSaving(false);
        setTimeout(() => setSaveStatus(''), 3000);
    };

    if (loading) {
        return <p>Loading assessment data...</p>;
    }

    return (
        <div className="space-y-4">
            {SKILL_LIST.map(skill => (
                <div key={skill}>
                    <div className="flex justify-between items-center mb-1">
                        <label htmlFor={`skill-${skill}`} className="text-sm font-medium text-text-secondary-dark">{skill}</label>
                        <span className="text-sm font-bold text-brand-secondary w-8 text-center">{myRatings[skill] || 0}</span>
                    </div>
                    <input
                        id={`skill-${skill}`}
                        type="range"
                        min="1"
                        max="10"
                        value={myRatings[skill] || 0}
                        onChange={e => handleRatingChange(skill, Number(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                    />
                </div>
            ))}
            <div className="text-right mt-4">
                {saveStatus && <p className="text-sm text-green-600 mb-2">{saveStatus}</p>}
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save Assessment'}
                </Button>
            </div>
        </div>
    );
};
// FIX: Added default export.
export default SkillAssessor;
