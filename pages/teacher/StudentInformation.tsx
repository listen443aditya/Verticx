

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth.ts';
// FIX: Corrected import to use the specific teacherApiService
import { TeacherApiService } from "../../services";
const apiService = new TeacherApiService();
import type { Student, StudentProfile } from '../../types.ts';
import Card from '../../components/ui/Card.tsx';
import Button from '../../components/ui/Button.tsx';
import Input from '../../components/ui/Input.tsx';
import StudentDetailModal from '../../components/modals/StudentDetailModal.tsx';
import RaiseComplaintModal from '../../components/modals/RaiseComplaintModal.tsx';

const StudentInformation: React.FC = () => {
    const { user } = useAuth();
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Modals
    const [viewingStudent, setViewingStudent] = useState<StudentProfile | null>(null);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [complainingAbout, setComplainingAbout] = useState<Student | null>(null);
    const [complaintStatus, setComplaintStatus] = useState('');

    const fetchData = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        const studentData = await apiService.getStudentsForTeacher(user.id);
        setStudents(studentData);
        setLoading(false);
    }, [user]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleViewStudent = async (studentId: string) => {
        setDetailsLoading(true);
        const profile = await apiService.getStudentProfileDetails(studentId);
        setViewingStudent(profile);
        setDetailsLoading(false);
    };

    const handleComplaintSubmit = () => {
        setComplainingAbout(null);
        setComplaintStatus('Complaint logged successfully. The student and their parent will be notified.');
        setTimeout(() => setComplaintStatus(''), 5000);
        // No need to refetch data on this page after submitting a complaint
    };
    
    const filteredStudents = students.filter(s => 
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div>
            <h1 className="text-3xl font-bold text-text-primary-dark mb-6">Student Information</h1>
            <Card>
                <Input 
                    placeholder="Search students by name or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="mb-4"
                />
                {complaintStatus && <p className="text-center text-green-600 mb-4">{complaintStatus}</p>}
                {loading ? <p>Loading students...</p> : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="border-b">
                                <tr>
                                    <th className="p-4">Name</th>
                                    <th className="p-4">Student ID</th>
                                    <th className="p-4">Class</th>
                                    <th className="p-4 text-center">School Rank</th>
                                    <th className="p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStudents.map(async student => {
                                    const studentClass = await apiService.getClassById(student.classId!);
                                    return (
                                    <tr key={student.id} className="border-b hover:bg-slate-50">
                                        <td className="p-4 font-medium">{student.name}</td>
                                        <td className="p-4 font-mono text-xs">{student.userId}</td>
                                        <td className="p-4">{studentClass ? `Grade ${studentClass.gradeLevel} - ${studentClass.section}` : 'N/A'}</td>
                                        <td className="p-4 text-center font-semibold">{student.schoolRank || 'N/A'}</td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="secondary" className="!px-2 !py-1 text-xs" onClick={() => handleViewStudent(student.id)}>View Details</Button>
                                                <Button variant="danger" className="!px-2 !py-1 text-xs" onClick={() => setComplainingAbout(student)}>Raise Complaint</Button>
                                            </div>
                                        </td>
                                    </tr>
                                )})}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
            {detailsLoading && <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]"><p className="text-white">Loading student details...</p></div>}
            {viewingStudent && !detailsLoading && (
                <StudentDetailModal 
                    profile={viewingStudent} 
                    onClose={() => setViewingStudent(null)}
                    onDataRefresh={() => handleViewStudent(viewingStudent.student.id)}
                />
            )}
            {complainingAbout && (
                <RaiseComplaintModal 
                    student={complainingAbout}
                    onClose={() => setComplainingAbout(null)}
                    onSubmit={handleComplaintSubmit}
                />
            )}
        </div>
    );
};

export default StudentInformation;