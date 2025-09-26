import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth.ts';
import { parentApiService as apiService } from '../../services';
import type { Student, GradeWithCourse } from '../../types.ts';
import Card from '../../components/ui/Card.tsx';

const GradeBook: React.FC = () => {
    const { user } = useAuth();
    const [children, setChildren] = useState<Student[]>([]);
    const [selectedChildId, setSelectedChildId] = useState<string>('');
    const [grades, setGrades] = useState<GradeWithCourse[]>([]);
    const [loading, setLoading] = useState(true);
    const [gradesLoading, setGradesLoading] = useState(false);

    useEffect(() => {
        const fetchChildren = async () => {
            if (!user?.childrenIds) return;
            setLoading(true);
            const childrenPromises = user.childrenIds.map(id => apiService.getStudentProfileDetails(id).then(p => p?.student));
            const childrenData = (await Promise.all(childrenPromises)).filter((s): s is Student => !!s);
            setChildren(childrenData);
            if (childrenData.length > 0) {
                setSelectedChildId(childrenData[0].id);
            }
            setLoading(false);
        };
        fetchChildren();
    }, [user]);

    const fetchGrades = useCallback(async () => {
        if (!selectedChildId) return;
        setGradesLoading(true);
        try {
            const data = await apiService.getStudentGrades(selectedChildId);
            setGrades(data);
        } catch (error) {
            console.error("Failed to fetch grades", error);
        } finally {
            setGradesLoading(false);
        }
    }, [selectedChildId]);

    useEffect(() => {
        if (selectedChildId) {
            fetchGrades();
        }
    }, [selectedChildId, fetchGrades]);

    if (loading) return <p>Loading data...</p>;

    return (
        <div>
            <h1 className="text-3xl font-bold text-text-primary-dark mb-6">Grade Book</h1>
            <Card>
                {children.length > 1 && (
                     <div className="flex items-center gap-4 mb-6 pb-4 border-b">
                        <label htmlFor="child-select" className="font-medium">Viewing grades for:</label>
                        <select
                            id="child-select"
                            value={selectedChildId}
                            onChange={(e) => setSelectedChildId(e.target.value)}
                            className="bg-surface-dark border border-slate-300 rounded-md py-2 px-3"
                        >
                            {children.map(child => (
                                <option key={child.id} value={child.id}>{child.name}</option>
                            ))}
                        </select>
                     </div>
                )}
                {gradesLoading ? <p>Loading grades...</p> : grades.length === 0 ? (
                    <p className="text-center p-8 text-text-secondary-dark">No grades have been recorded for {children.find(c => c.id === selectedChildId)?.name}.</p>
                ) : (
                     <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="border-b border-slate-200 text-sm text-text-secondary-dark">
                                <tr>
                                    <th className="p-4">Course</th>
                                    <th className="p-4">Assessment</th>
                                    <th className="p-4 text-center">Score</th>
                                </tr>
                            </thead>
                            <tbody>
                                {grades.map((grade, index) => (
                                    <tr key={`${grade.studentId}-${grade.courseId}-${grade.assessment}-${index}`} className="border-b border-slate-100 hover:bg-slate-50">
                                        <td className="p-4 font-medium">{grade.courseName}</td>
                                        <td className="p-4">{grade.assessment}</td>
                                        <td className="p-4 text-center">
                                            <span className={`font-bold ${grade.score >= 80 ? 'text-green-600' : grade.score >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                                                {grade.score}%
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default GradeBook;