import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth.ts';
import { teacherApiService as apiService } from '../../services';
import type { TeacherCourse, Assignment } from '../../types.ts';
import Card from '../ui/Card.tsx';
import Button from '../ui/Button.tsx';
import Input from '../ui/Input.tsx';

interface AssignHomeworkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  assignmentToEdit?: Assignment | null;
}

const AssignHomeworkModal: React.FC<AssignHomeworkModalProps> = ({ isOpen, onClose, onSave, assignmentToEdit }) => {
    const { user } = useAuth();
    const [courses, setCourses] = useState<TeacherCourse[]>([]);
    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [isAssigning, setIsAssigning] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen && user) {
            // FIX: Corrected method call to get teacher courses.
            apiService.getTeacherCourses(user.id).then(data => {
                setCourses(data);
                if (assignmentToEdit) {
                    const courseFromDb = apiService.getCourseById(assignmentToEdit.courseId);
                    const course = data.find(c => c.classId === assignmentToEdit.classId && c.subjectId === courseFromDb?.subjectId);
                    setSelectedCourseId(course?.id || '');
                    setTitle(assignmentToEdit.title);
                    setDescription(assignmentToEdit.description || '');
                    setDueDate(new Date(assignmentToEdit.dueDate).toISOString().split('T')[0]);
                } else if (data.length > 0) {
                    setSelectedCourseId(data[0].id);
                    setTitle('');
                    setDescription('');
                    setDueDate('');
                }
            });
        }
    }, [isOpen, user, assignmentToEdit]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!selectedCourseId || !title || !dueDate || !user) {
            setError('Please fill all required fields.');
            return;
        }
        setIsAssigning(true);
        
        const [classId, subjectId] = selectedCourseId.split('|');

        try {
            if (assignmentToEdit) {
                // FIX: Corrected method call to update an assignment.
                await apiService.updateAssignment(assignmentToEdit.id, {
                    title,
                    description,
                    dueDate: new Date(dueDate),
                });
            } else {
                // FIX: Corrected method call to find a course.
                const course = await apiService.findCourseByTeacherAndSubject(user.id, subjectId);
                if (!course) {
                    setError(`Could not find a course for this subject. Please contact administration.`);
                    setIsAssigning(false);
                    return;
                }
                // FIX: Corrected method call to create an assignment.
                await apiService.createAssignment({
                    classId,
                    courseId: course.id,
                    teacherId: user.id,
                    title,
                    description,
                    dueDate: new Date(dueDate),
                } as Omit<Assignment, 'id'>);
            }
            onSave();
        } catch (err: any) {
            setError(err.message || 'Failed to save homework.');
        } finally {
            setIsAssigning(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-lg">
                <h2 className="text-xl font-bold mb-4">{assignmentToEdit ? 'Edit Homework' : 'Assign Homework'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-text-secondary-dark mb-1">Class & Subject</label>
                        <select
                            value={selectedCourseId}
                            onChange={e => setSelectedCourseId(e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-md py-2 px-3"
                            required
                            disabled={!!assignmentToEdit}
                        >
                            {courses.map(course => (
                                <option key={course.id} value={course.id}>{course.name}</option>
                            ))}
                        </select>
                    </div>
                    <Input
                        label="Homework Title"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        required
                    />
                     <div>
                        <label className="block text-sm font-medium text-text-secondary-dark mb-1">Description (Optional)</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={4}
                            className="w-full bg-white border border-slate-300 rounded-md py-2 px-3"
                        />
                    </div>
                    <Input
                        label="Due Date"
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        required
                    />
                    {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                    <div className="flex justify-end gap-4 pt-4">
                        <Button type="button" variant="secondary" onClick={onClose} disabled={isAssigning}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isAssigning}>
                            {isAssigning ? 'Saving...' : 'Save Homework'}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default AssignHomeworkModal;
