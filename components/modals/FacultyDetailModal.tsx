

import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { TeacherProfile } from '../../types.ts';
import Card from '../ui/Card.tsx';
import Button from '../ui/Button.tsx';
import Input from '../ui/Input.tsx';

interface FacultyDetailModalProps {
  profile: TeacherProfile;
  onClose: () => void;
  onResetPassword: (teacherId: string) => void;
  onUpdateSalary?: (teacherId: string, newSalary: number) => Promise<void>;
}

const FacultyDetailModal: React.FC<FacultyDetailModalProps> = ({ profile, onClose, onResetPassword, onUpdateSalary }) => {
    const { teacher, assignedClasses, syllabusProgress, classPerformance, attendance, payrollHistory, assignedSubjects, mentoredClasses } = profile;

    const [isEditingSalary, setIsEditingSalary] = useState(false);
    const [salaryValue, setSalaryValue] = useState(String(profile.teacher.salary || ''));
    const [isSavingSalary, setIsSavingSalary] = useState(false);
    
    useEffect(() => {
        setSalaryValue(String(profile.teacher.salary || ''));
    }, [profile.teacher.salary]);

    const handleSaveSalary = async () => {
        if (onUpdateSalary) {
            setIsSavingSalary(true);
            await onUpdateSalary(teacher.id, Number(salaryValue));
            // Parent component handles profile refresh, which will update the view.
            setIsSavingSalary(false);
            setIsEditingSalary(false);
        }
    };


    const attendancePercentage = attendance.total > 0 ? ((attendance.present / attendance.total) * 100).toFixed(1) : '100';

    const performanceData = classPerformance.map(p => ({
        name: p.className,
        'Avg Score': p.averageStudentScore,
    }));
    
    const subjectNames = assignedSubjects.map(s => s.name).join(', ');

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
            <Card className="w-full max-w-6xl h-[95vh] flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-4">
                        <div className="w-20 h-20 rounded-full bg-slate-200 flex items-center justify-center text-3xl font-bold text-brand-primary">
                            {teacher.name.charAt(0)}
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold text-text-primary-dark">{teacher.name}</h2>
                            <p className="text-text-secondary-dark font-mono">{teacher.userId} | {subjectNames}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-3xl font-light text-slate-500 hover:text-slate-800 leading-none">&times;</button>
                </div>

                {/* Body */}
                <div className="flex-grow overflow-y-auto pr-2">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Column */}
                        <div className="lg:col-span-1 space-y-6">
                            <Card>
                                <h3 className="text-lg font-semibold mb-3">Teacher Details</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between"><span className="font-medium text-text-secondary-dark">Qualification:</span> <span>{teacher.qualification}</span></div>
                                    <div className="flex justify-between"><span className="font-medium text-text-secondary-dark">Date of Joining:</span> <span>{teacher.doj}</span></div>
                                    <div className="flex justify-between"><span className="font-medium text-text-secondary-dark">Gender:</span> <span>{teacher.gender || 'N/A'}</span></div>
                                    <div className="flex justify-between"><span className="font-medium text-text-secondary-dark">Email:</span> <span>{teacher.email || 'N/A'}</span></div>
                                    <div className="flex justify-between"><span className="font-medium text-text-secondary-dark">Phone:</span> <span>{teacher.phone || 'N/A'}</span></div>
                                    <div className="flex justify-between pt-2 border-t mt-2"><span className="font-medium text-text-secondary-dark">Rectification Requests:</span> <span className="font-bold text-brand-secondary">{teacher.rectificationRequestCount || 0}</span></div>
                                    <div className="flex justify-between"><span className="font-medium text-text-secondary-dark">Complaint Count:</span> <span className="font-bold text-red-500">{teacher.complaintCount || 0}</span></div>
                                </div>
                            </Card>
                            {/* <Card>
                                <h3 className="text-lg font-semibold mb-3">Credentials & Security</h3>
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between items-center">
                                        <span className="font-medium text-text-secondary-dark">User ID:</span>
                                        <span className="font-mono bg-slate-100 p-1 rounded">{teacher.id}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="font-medium text-text-secondary-dark">Password:</span>
                                        <Button
                                            variant="danger"
                                            className="!px-3 !py-1 text-xs"
                                            onClick={() => onResetPassword(teacher.id)}
                                        >
                                            Reset Password
                                        </Button>
                                    </div>
                                </div>
                            </Card> */}
                            <div className="grid grid-cols-2 gap-6">
                                <Card>
                                    <h3 className="text-lg font-semibold mb-3">Mentored Class</h3>
                                    {mentoredClasses.length > 0 ? (
                                        <div className="bg-slate-100 p-3 rounded-lg text-center">
                                            <p className="font-bold text-brand-primary">{mentoredClasses[0].name}</p>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-center text-text-secondary-dark">Not a class mentor</p>
                                    )}
                                </Card>
                                <Card>
                                    <h3 className="text-lg font-semibold mb-3">Attendance</h3>
                                    <div className="text-center">
                                        <p className="text-4xl font-bold text-brand-secondary">{attendancePercentage}%</p>
                                        <p className="text-xs text-text-secondary-dark mt-1">({attendance.present}/{attendance.total} days)</p>
                                    </div>
                                </Card>
                            </div>
                             <Card>
                                <h3 className="text-lg font-semibold mb-3">Assigned Classes</h3>
                                <ul className="space-y-2 max-h-40 overflow-y-auto pr-1">
                                    {assignedClasses.map(c => (
                                        <li key={c.id} className="bg-slate-100 p-2 rounded-md text-sm">{c.name}</li>
                                    ))}
                                </ul>
                            </Card>
                        </div>

                        {/* Right Column */}
                        <div className="lg:col-span-2 space-y-6">
                            <Card>
                                <h3 className="text-lg font-semibold mb-3">Student Performance in Classes</h3>
                                <ResponsiveContainer width="100%" height={250}>
                                    <BarChart data={performanceData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis label={{ value: 'Avg Score (%)', angle: -90, position: 'insideLeft' }} />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="Avg Score" fill="#4F46E5" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </Card>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card>
                                    <h3 className="text-lg font-semibold mb-3">Syllabus Completion</h3>
                                    <div className="space-y-4">
                                        {syllabusProgress.map(s => (
                                            <div key={s.className}>
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span className="font-medium">{s.className} ({s.subjectName})</span>
                                                    <span className="font-semibold">{s.completionPercentage}%</span>
                                                </div>
                                                <div className="w-full bg-slate-200 rounded-full h-2.5">
                                                    <div className="bg-brand-accent h-2.5 rounded-full" style={{ width: `${s.completionPercentage}%` }}></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                                <Card>
                                    <h3 className="text-lg font-semibold mb-3">Salary & Payroll</h3>
                                    
                                    <div className="space-y-3 text-sm mb-4 pb-4 border-b border-slate-200">
                                        <div className="flex justify-between items-center">
                                            <span className="font-medium text-text-secondary-dark">Current Monthly Salary:</span>
                                            {!isEditingSalary && (
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-lg">{(teacher.salary || 0).toLocaleString()}</span>
                                                    {onUpdateSalary && (
                                                        <Button variant="secondary" className="!px-2 !py-1 text-xs" onClick={() => setIsEditingSalary(true)}>Edit</Button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        {isEditingSalary && onUpdateSalary && (
                                            <div className="flex items-end gap-2 p-2 bg-slate-100 rounded-lg">
                                                <Input
                                                    label="New Monthly Salary"
                                                    type="number"
                                                    value={salaryValue}
                                                    onChange={(e) => setSalaryValue(e.target.value)}
                                                    className="flex-grow"
                                                />
                                                <Button onClick={handleSaveSalary} disabled={isSavingSalary} className="!py-2">{isSavingSalary ? '...' : 'Save'}</Button>
                                                <Button variant="secondary" onClick={() => { setIsEditingSalary(false); setSalaryValue(String(teacher.salary || '')) }} disabled={isSavingSalary} className="!py-2">Cancel</Button>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm">
                                            <thead>
                                                <tr className="border-b border-slate-200">
                                                    <th className="py-2">Month</th>
                                                    <th className="py-2 text-right">Amount</th>
                                                    <th className="py-2 text-center">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {payrollHistory.map(p => (
                                                     <tr key={p.month} className="border-b border-slate-100">
                                                        <td className="py-2">{p.month}</td>
                                                        <td className="py-2 text-right">{p.amount.toLocaleString()}</td>
                                                        <td className="py-2 text-center">
                                                            <span className={`px-2 py-0.5 text-xs rounded-full ${p.status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{p.status}</span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </Card>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default FacultyDetailModal;