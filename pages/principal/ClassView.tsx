// pages/principal/ClassView.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth.ts';
import { PrincipalApiService } from "../../services";

import type { SchoolClass, Student, ClassDetails, Teacher, FeeTemplate } from '../../types.ts';
import Card from '../../components/ui/Card.tsx';
import Button from '../../components/ui/Button.tsx';
import Input from '../../components/ui/Input.tsx';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

import { useDataRefresh } from '../../contexts/DataRefreshContext.tsx';
const apiService = new PrincipalApiService();
type AggregatedClass = SchoolClass & {
  students: Student[];
  stats: {
    avgAttendance: number;
    avgPerformance: number;
    syllabusCompletion: number;
  };
  teachers: { name: string; subject: string }[];
};

type StudentPerformance = {
  student: Student;
  performance: {
    courseName: string;
    assessment: string;
    score: number;
    term: string;
  }[];
};

const ProgressBar: React.FC<{ value: number; colorClass: string }> = ({ value, colorClass }) => (
    <div className="w-full bg-slate-200 rounded-full h-2.5">
        <div className={`${colorClass} h-2.5 rounded-full transition-all duration-500`} style={{ width: `${value}%` }}></div>
    </div>
);

const StatDisplay: React.FC<{ label: string; value: string; progress: number; color: 'green' | 'blue' | 'teal' }> = ({ label, value, progress, color }) => {
    const colorClasses = {
        green: 'bg-green-500',
        blue: 'bg-blue-500',
        teal: 'bg-sky-500'
    };
    return (
        <div>
            <div className="flex justify-between items-baseline mb-1">
                <span className="text-sm text-text-secondary-dark">{label}</span>
                <span className="font-semibold text-text-primary-dark">{value}</span>
            </div>
            <ProgressBar value={progress} colorClass={colorClasses[color]} />
        </div>
    );
};

interface ClassDetailModalProps {
    classDetails: ClassDetails;
    allTeachers: Teacher[];
    allStudents: Student[];
    feeTemplates: FeeTemplate[],
    allClasses: SchoolClass[];
    onClose: () => void;
    onCloseAndRefresh: () => void;
}


const ClassDetailModal: React.FC<ClassDetailModalProps> = ({ classDetails, allTeachers, allStudents, feeTemplates, allClasses, onClose, onCloseAndRefresh }) => {
    const { classInfo, students, subjects, performance, fees } = classDetails;
    const [studentSearch, setStudentSearch] = useState('');
    const [reportMessage, setReportMessage] = useState('');
    const [isReportMenuOpen, setIsReportMenuOpen] = useState(false);
    const reportMenuRef = React.useRef<HTMLDivElement>(null);
    
    const [selectedMentor, setSelectedMentor] = useState<string>(classDetails.classInfo.mentorTeacherId || '');
    const [isUpdatingMentor, setIsUpdatingMentor] = useState(false);
    
    const [selectedFeeTemplateId, setSelectedFeeTemplateId] = useState<string>(classDetails.classInfo.feeTemplateId || '');
    const [isSavingFee, setIsSavingFee] = useState(false);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (reportMenuRef.current && !reportMenuRef.current.contains(event.target as Node)) {
                setIsReportMenuOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [reportMenuRef]);

    const performanceData = performance.map(p => ({
        name: p.subjectName,
        'Performance': p.averageScore,
    }));

    const filteredStudents = students.filter(s => 
        s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
        s.id.toLowerCase().includes(studentSearch.toLowerCase())
    );

    const handleGenerateReport = (reportName: string) => {
        setReportMessage(`Generating '${reportName}' report...`);
        setTimeout(() => {
            setReportMessage(`'${reportName}' report generated successfully.`);
            setTimeout(() => setReportMessage(''), 3000);
        }, 1500);
    };
    
    const availableMentors = useMemo(() => {
        const existingMentorIds = new Set(
            allClasses
                .filter(c => c.mentorTeacherId)
                .map(c => c.mentorTeacherId)
        );
        const currentMentorId = classDetails.classInfo.mentorTeacherId;
        return allTeachers.filter(teacher => {
            const isNotAMentor = !existingMentorIds.has(teacher.id);
            const isCurrentMentor = teacher.id === currentMentorId;
            return teacher.status === 'active' && (isNotAMentor || isCurrentMentor);
        });
    }, [allTeachers, allClasses, classDetails.classInfo]);

    const handleUpdateMentor = async () => {
        setIsUpdatingMentor(true);
        try {
            await apiService.assignClassMentor(classDetails.classInfo.id, selectedMentor || null);
            onCloseAndRefresh();
        } catch (error) {
            console.error(error);
            alert("Failed to update mentor.");
        } finally {
            setIsUpdatingMentor(false);
        }
    };
    
    const relevantTemplates = feeTemplates.filter(ft => ft.gradeLevel === classDetails.classInfo.gradeLevel);

    const handleSaveFeeTemplate = async () => {
        setIsSavingFee(true);
        await apiService.assignFeeTemplateToClass(classDetails.classInfo.id, selectedFeeTemplateId || null);
        setIsSavingFee(false);
        onCloseAndRefresh();
    };


    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
            <Card className="w-full max-w-7xl h-[95vh] flex flex-col">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h2 className="text-3xl font-bold text-text-primary-dark">Class Details: Grade {classInfo.gradeLevel} - {classInfo.section}</h2>
                        {reportMessage && <p className="text-sm text-green-600 mt-1">{reportMessage}</p>}
                    </div>
                     <div className="flex items-center gap-4">
                        <div className="relative" ref={reportMenuRef}>
                            <Button onClick={() => setIsReportMenuOpen(prev => !prev)}>Generate Report</Button>
                            {isReportMenuOpen && (
                                <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg z-10">
                                    <div className="py-1">
                                        <button onClick={() => { handleGenerateReport('Fee Defaulters List'); setIsReportMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Fee Defaulters (PDF)</button>
                                        <button onClick={() => { handleGenerateReport('Full Class Report'); setIsReportMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Full Class Report (PDF)</button>
                                        <button onClick={() => { handleGenerateReport('Student List'); setIsReportMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Student List (PDF)</button>
                                    </div>
                                </div>
                            )}
                        </div>
                        <button onClick={onClose} className="text-3xl font-light text-slate-500 hover:text-slate-800 leading-none">&times;</button>
                    </div>
                </div>
                
                <div className="flex-grow overflow-y-auto pr-2 grid grid-cols-1 lg:grid-cols-5 gap-6">
                    {/* Left Column - Stats & Subjects */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <h3 className="text-lg font-semibold mb-3">Class Mentor</h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary-dark mb-1">Assign Mentor Teacher</label>
                                    <select
                                        value={selectedMentor}
                                        onChange={e => setSelectedMentor(e.target.value)}
                                        className="w-full bg-white border border-slate-300 rounded-md py-2 px-3"
                                    >
                                        <option value="">-- Unassigned --</option>
                                        {availableMentors.map(teacher => (
                                            <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <Button onClick={handleUpdateMentor} disabled={isUpdatingMentor} className="w-full">
                                    {isUpdatingMentor ? 'Updating...' : 'Update Mentor'}
                                </Button>
                            </div>
                        </Card>
                        <Card>
                            <h3 className="text-lg font-semibold mb-3">Monthly Fee Assignment</h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary-dark mb-1">Fee Template</label>
                                    <select
                                        value={selectedFeeTemplateId}
                                        onChange={e => setSelectedFeeTemplateId(e.target.value)}
                                        className="w-full bg-white border border-slate-300 rounded-md py-2 px-3"
                                    >
                                        <option value="">-- Unassigned --</option>
                                        {relevantTemplates.map(ft => (
                                            <option key={ft.id} value={ft.id}>{ft.name} ({ft.amount.toLocaleString()})</option>
                                        ))}
                                    </select>
                                </div>
                                <Button onClick={handleSaveFeeTemplate} disabled={isSavingFee} className="w-full">
                                    {isSavingFee ? 'Saving...' : 'Update Fee Assignment'}
                                </Button>
                            </div>
                        </Card>
                        <Card>
                            <h3 className="text-lg font-semibold mb-3">Academic Performance</h3>
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={performanceData} layout="vertical" margin={{ top: 5, right: 20, left: 60, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                                    <YAxis type="category" dataKey="name" width={60} />
                                    <Tooltip />
                                    <Bar dataKey="Performance" fill="#4F46E5" />
                                </BarChart>
                            </ResponsiveContainer>
                        </Card>
                         <Card>
                            <h3 className="text-lg font-semibold mb-3">Subjects & Syllabus</h3>
                            <div className="space-y-3">
                                {subjects.map(s => (
                                    <div key={s.subjectId}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="font-medium text-text-primary-dark">{s.subjectName} <span className="text-text-secondary-dark font-normal">({s.teacherName})</span></span>
                                            <span className="font-semibold text-text-primary-dark">{s.syllabusCompletion}%</span>
                                        </div>
                                        <div className="w-full bg-slate-200 rounded-full h-2"><div className="bg-brand-secondary h-2 rounded-full" style={{ width: `${s.syllabusCompletion}%` }}></div></div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>

                    {/* Right Column - Students & Fees */}
                    <div className="lg:col-span-3 space-y-6 flex flex-col">
                        <Card>
                            <h3 className="text-lg font-semibold mb-3">Fee Status</h3>
                            <div className="flex items-center gap-6 bg-slate-50 p-4 rounded-lg">
                                <div className="text-center">
                                    <p className="text-3xl font-bold text-red-500">{fees.totalPending.toLocaleString()}</p>
                                    <p className="text-sm text-text-secondary-dark">Total Pending</p>
                                </div>
                                <div className="flex-grow">
                                    {fees.defaulters.length > 0 ? (
                                        <details>
                                            <summary className="cursor-pointer font-semibold text-brand-secondary">
                                                View {fees.defaulters.length} Defaulter(s)
                                            </summary>
                                            <ul className="mt-2 text-sm text-text-secondary-dark list-disc pl-5 max-h-24 overflow-y-auto">
                                                {fees.defaulters.map(d => (
                                                    <li key={d.studentId}>{d.studentName}: {d.pendingAmount.toLocaleString()}</li>
                                                ))}
                                            </ul>
                                        </details>
                                    ) : (
                                        <p className="font-semibold text-green-600">No pending fees for this class.</p>
                                    )}
                                </div>
                            </div>
                        </Card>
                        <Card className="flex flex-col flex-grow">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="text-lg font-semibold">Student Roster ({students.length})</h3>
                                <Input value={studentSearch} onChange={e => setStudentSearch(e.target.value)} placeholder="Search students by name or ID..." className="w-1/2"/>
                            </div>
                            <div className="overflow-y-auto flex-grow -mx-6 px-6">
                                <table className="w-full text-left">
                                    <thead className="sticky top-0 bg-surface-dark/80 backdrop-blur-sm">
                                        <tr className="border-b border-slate-200">
                                            <th className="p-2 text-sm font-semibold text-text-secondary-dark">Name</th>
                                            <th className="p-2 text-sm font-semibold text-text-secondary-dark">Student ID</th>
                                            <th className="p-2 text-sm font-semibold text-text-secondary-dark text-center">Class Rank</th>
                                            <th className="p-2 text-sm font-semibold text-text-secondary-dark text-center">School Rank</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredStudents.map(s => (
                                            <tr key={s.id} className="border-b border-slate-100 text-sm">
                                                <td className="p-2 font-medium">{s.name}</td>
                                                <td className="p-2 font-mono text-xs">{s.id}</td>
                                                <td className="p-2 text-center font-medium">{s.classRank}</td>
                                                <td className="p-2 text-center font-medium">{s.schoolRank}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </div>
                </div>
            </Card>
        </div>
    );
};

const ClassView: React.FC = () => {
    const { user } = useAuth();
    const { refreshKey, triggerRefresh } = useDataRefresh();
    const [classesData, setClassesData] = useState<AggregatedClass[]>([]);
    const [allTeachers, setAllTeachers] = useState<Teacher[]>([]);
    const [allStudents, setAllStudents] = useState<Student[]>([]);
    const [feeTemplates, setFeeTemplates] = useState<FeeTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    const [viewingDetailsFor, setViewingDetailsFor] = useState<AggregatedClass | null>(null);
    const [classDetails, setClassDetails] = useState<ClassDetails | null>(null);
    const [detailsLoading, setDetailsLoading] = useState(false);

    const fetchData = useCallback(async () => {
        if (!user?.branchId) return;
        setLoading(true);
        const [data, teachers, students, templates] = await Promise.all([
            apiService.getPrincipalClassView(user.branchId) as Promise<AggregatedClass[]>,
            apiService.getTeachersByBranch(user.branchId),
            apiService.getStudentsByBranch(user.branchId),
            apiService.getFeeTemplates(user.branchId)
        ]);
        setClassesData(data.sort((a,b) => a.gradeLevel - b.gradeLevel || a.section.localeCompare(b.section)));
        setAllTeachers(teachers);
        setAllStudents(students);
        setFeeTemplates(templates);
        setLoading(false);
    }, [user]);

    useEffect(() => {
        fetchData();
    }, [fetchData, refreshKey]);

    const handleViewDetails = async (schoolClass: AggregatedClass) => {
        setDetailsLoading(true);
        setViewingDetailsFor(schoolClass);
        const details = await apiService.getClassDetails(schoolClass.id);
        setClassDetails(details);
        setDetailsLoading(false);
    };
    
    const handleCloseAndRefresh = () => {
        setViewingDetailsFor(null);
        setClassDetails(null);
        triggerRefresh();
    };

    const filteredClasses = useMemo(() => {
        const term = searchTerm.toLowerCase();
        if (!term) return classesData;
        return classesData.filter(c => 
            `grade ${c.gradeLevel} ${c.section}`.toLowerCase().includes(term) ||
            `grade ${c.gradeLevel}-${c.section}`.toLowerCase().includes(term) ||
            c.id.toLowerCase().includes(term) ||
            c.teachers.some(t => t.name.toLowerCase().includes(term))
        );
    }, [classesData, searchTerm]);

    return (
        <div>
             <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-text-primary-dark">Class Overview</h1>
                <div className="w-1/3">
                    <Input 
                        placeholder="Search by grade, section, teacher, or ID..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>
            
            {loading ? <p>Loading classes...</p> : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredClasses.map(c => (
                        <Card key={c.id} className="flex flex-col">
                            <h2 className="text-xl font-bold text-text-primary-dark mb-4">Grade {c.gradeLevel} - {c.section}</h2>
                            <div className="space-y-4 mb-4 flex-grow">
                                <StatDisplay label="Avg. Performance" value={`${c.stats.avgPerformance.toFixed(1)}%`} progress={c.stats.avgPerformance} color="green" />
                                <StatDisplay label="Avg. Attendance" value={`${c.stats.avgAttendance.toFixed(1)}%`} progress={c.stats.avgAttendance} color="blue" />
                                <StatDisplay label="Syllabus Completion" value={`${c.stats.syllabusCompletion.toFixed(1)}%`} progress={c.stats.syllabusCompletion} color="teal" />
                            </div>
                            <div className="text-xs text-text-secondary-dark border-t border-slate-200 pt-3">
                                <p><strong>Students:</strong> {c.studentIds.length}</p>
                                <p><strong>Teachers:</strong> {c.teachers.map(t => t.name).join(', ')}</p>
                            </div>
                            <div className="mt-4 text-right">
                                <Button onClick={() => handleViewDetails(c)}>View Details</Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
            
            {detailsLoading && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
                    <p className="text-white text-lg">Loading class details...</p>
                </div>
            )}
            {viewingDetailsFor && classDetails && !detailsLoading && (
                <ClassDetailModal
                    classDetails={classDetails}
                    allTeachers={allTeachers}
                    allStudents={allStudents}
                    feeTemplates={feeTemplates}
                    allClasses={classesData}
                    onClose={() => { setViewingDetailsFor(null); setClassDetails(null); }}
                    onCloseAndRefresh={handleCloseAndRefresh}
                />
            )}
        </div>
    );
};

export default ClassView;