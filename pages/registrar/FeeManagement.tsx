import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth.ts';
import { registrarApiService as apiService } from '../../services';
import type { FeeTemplate, ClassFeeSummary, MonthlyFee, FeeComponent } from '../../types.ts';
import Card from '../../components/ui/Card.tsx';
import Input from '../../components/ui/Input.tsx';
import Button from '../../components/ui/Button.tsx';
import ClassFeeDetailModal from '../../components/modals/ClassFeeDetailModal.tsx';
import { useDataRefresh } from '../../contexts/DataRefreshContext.tsx';

const ACADEMIC_MONTHS = ['April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'January', 'February', 'March'];


const FeeTemplateFormModal: React.FC<{ 
    templateToEdit?: FeeTemplate | null;
    onClose: () => void; 
    onSave: (message: string) => void; 
    branchId: string;
    registrarId: string;
}> = ({ templateToEdit, onClose, onSave, branchId, registrarId }) => {
    const [formData, setFormData] = useState<Partial<FeeTemplate>>(() => {
        const base = { name: '', gradeLevel: 1, ...templateToEdit };
        if (!base.monthlyBreakdown || base.monthlyBreakdown.length !== 12) {
            base.monthlyBreakdown = ACADEMIC_MONTHS.map(m => ({ month: m, total: 0, breakdown: [] }));
        }
        return base;
    });
    const [reason, setReason] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const isEditMode = !!templateToEdit;
    
    const totalAnnualAmount = useMemo(() => {
        return formData.monthlyBreakdown?.reduce((total, month) => {
            const monthTotal = month.breakdown.reduce((sum, comp) => sum + (Number(comp.amount) || 0), 0);
            return total + monthTotal;
        }, 0) || 0;
    }, [formData.monthlyBreakdown]);

    useEffect(() => {
        setFormData(prev => ({ ...prev, amount: totalAnnualAmount }));
    }, [totalAnnualAmount]);

    const handleMainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'gradeLevel' ? Number(value) : value }));
    };

    const handleComponentChange = (monthIndex: number, compIndex: number, field: 'component' | 'amount', value: string) => {
        setFormData(prev => {
            if (!prev || !prev.monthlyBreakdown) return prev;

            const newMonthlyBreakdown = prev.monthlyBreakdown.map((month, mIndex) => {
                if (mIndex !== monthIndex) return month;

                const newBreakdownComponents = month.breakdown.map((comp, cIndex) => {
                    if (cIndex !== compIndex) return comp;
                    return {
                        ...comp,
                        [field]: field === 'amount' ? (Number(value) || 0) : value,
                    };
                });

                return { ...month, breakdown: newBreakdownComponents };
            });

            return { ...prev, monthlyBreakdown: newMonthlyBreakdown };
        });
    };

    const addComponent = (monthIndex: number) => {
        const newBreakdown = [...(formData.monthlyBreakdown || [])];
        newBreakdown[monthIndex].breakdown.push({ component: '', amount: 0 });
        setFormData(prev => ({ ...prev, monthlyBreakdown: newBreakdown }));
    };

    const removeComponent = (monthIndex: number, compIndex: number) => {
        const newBreakdown = [...(formData.monthlyBreakdown || [])];
        newBreakdown[monthIndex].breakdown.splice(compIndex, 1);
        setFormData(prev => ({ ...prev, monthlyBreakdown: newBreakdown }));
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        if (isEditMode) {
            await apiService.requestFeeTemplateUpdate(templateToEdit!.id, formData, reason, registrarId);
            onSave('Update request sent to principal for approval.');
        } else {
            await apiService.createFeeTemplate({
                branchId,
                ...formData
            } as any);
            onSave('New fee template created successfully.');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-3xl max-h-[90vh] flex flex-col">
                <h2 className="text-xl font-bold text-text-primary-dark mb-4">{isEditMode ? 'Request Fee Template Update' : 'Create Fee Template'}</h2>
                <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto pr-2 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sticky top-0 bg-surface-dark py-2">
                        <Input label="Template Name" name="name" value={formData.name} onChange={handleMainChange} placeholder="e.g., Grade 10 Standard Fees" required />
                        <Input label="Grade Level" name="gradeLevel" type="number" value={formData.gradeLevel} onChange={handleMainChange} required />
                    </div>
                    
                    <div className="p-3 bg-slate-100 rounded-lg text-center">
                        <p className="text-sm font-medium text-text-secondary-dark">Total Annual Fee</p>
                        <p className="text-2xl font-bold text-brand-primary">{totalAnnualAmount.toLocaleString()}</p>
                    </div>

                    <h3 className="text-lg font-semibold text-text-secondary-dark border-t pt-4">Monthly Fee Breakdown</h3>
                    
                    <div className="space-y-4">
                        {formData.monthlyBreakdown?.map((monthData, monthIndex) => {
                            const monthTotal = monthData.breakdown.reduce((sum, comp) => sum + (Number(comp.amount) || 0), 0);
                            return (
                                <details key={monthIndex} className="bg-slate-50 p-3 rounded-lg">
                                    <summary className="cursor-pointer font-semibold flex justify-between">
                                        <span>{monthData.month}</span>
                                        <span>Total: {monthTotal.toLocaleString()}</span>
                                    </summary>
                                    <div className="mt-2 pt-2 border-t space-y-2">
                                        {monthData.breakdown.map((comp, compIndex) => (
                                            <div key={compIndex} className="flex items-center gap-2">
                                                <Input placeholder="Component Name" value={comp.component} onChange={e => handleComponentChange(monthIndex, compIndex, 'component', e.target.value)} className="flex-grow"/>
                                                <Input placeholder="Amount" type="number" value={comp.amount || ''} onChange={e => handleComponentChange(monthIndex, compIndex, 'amount', e.target.value)} className="w-28"/>
                                                <Button type="button" variant="danger" className="!p-2" onClick={() => removeComponent(monthIndex, compIndex)}>&times;</Button>
                                            </div>
                                        ))}
                                        <Button type="button" variant="secondary" className="!text-xs !py-1 !px-2" onClick={() => addComponent(monthIndex)}>+ Add Component</Button>
                                    </div>
                                </details>
                            )
                        })}
                    </div>

                    {isEditMode && (
                        <div className="pt-4 border-t">
                            <label className="block text-sm font-medium text-text-secondary-dark mb-1">Reason for Change</label>
                            <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} className="w-full bg-white border border-slate-300 rounded-md py-2 px-3" required />
                        </div>
                    )}
                </form>
                 <div className="flex justify-end gap-4 pt-4 border-t mt-4">
                    <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={isSaving || (isEditMode && !reason)}>
                        {isSaving ? 'Submitting...' : isEditMode ? 'Submit Request' : 'Create Template'}
                    </Button>
                </div>
            </Card>
        </div>
    );
};

const DeleteRequestModal: React.FC<{
    template: FeeTemplate;
    onClose: () => void;
    onSave: (message: string) => void;
    registrarId: string;
}> = ({ template, onClose, onSave, registrarId }) => {
    const [reason, setReason] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        await apiService.requestFeeTemplateDeletion(template.id, reason, registrarId);
        onSave('Deletion request sent to principal for approval.');
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
                <h2 className="text-xl font-bold text-red-600 mb-2">Request Template Deletion</h2>
                <p className="text-text-secondary-dark mb-4">You are requesting to delete the template: <strong>{template.name}</strong>.</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-text-secondary-dark mb-1">Reason for Deletion</label>
                        <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} className="w-full bg-white border border-slate-300 rounded-md py-2 px-3" required />
                    </div>
                    <div className="flex justify-end gap-4 pt-4">
                        <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving}>Cancel</Button>
                        <Button type="submit" variant="danger" disabled={isSaving || !reason}>
                            {isSaving ? 'Submitting...' : 'Request Deletion'}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

const ClassFeeStatus: React.FC = () => {
    const { user } = useAuth();
    const { refreshKey } = useDataRefresh();
    const [summaries, setSummaries] = useState<ClassFeeSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewingClass, setViewingClass] = useState<ClassFeeSummary | null>(null);

    const fetchData = useCallback(async () => {
        if (!user?.branchId) return;
        setLoading(true);
        const data = await apiService.getClassFeeSummaries(user.branchId);
        setSummaries(data.sort((a,b) => a.className.localeCompare(b.className)));
        setLoading(false);
    }, [user, refreshKey]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return (
        <div>
            {loading ? <p>Loading class fee status...</p> : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="border-b border-slate-200 text-sm text-text-secondary-dark">
                            <tr>
                                <th className="p-4">Class Name</th>
                                <th className="p-4 text-center">Total Students</th>
                                <th className="p-4 text-center">Defaulters</th>
                                <th className="p-4 text-right">Total Pending</th>
                            </tr>
                        </thead>
                        <tbody>
                            {summaries.map(summary => (
                                <tr key={summary.classId} className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer" onClick={() => setViewingClass(summary)}>
                                    <td className="p-4 font-medium text-text-primary-dark">{summary.className}</td>
                                    <td className="p-4 text-center">{summary.studentCount}</td>
                                    <td className="p-4 text-center font-semibold text-orange-600">{summary.defaulterCount}</td>
                                    <td className="p-4 text-right font-semibold text-red-600">{summary.pendingAmount.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            {viewingClass && (
                <ClassFeeDetailModal 
                    isOpen={!!viewingClass} 
                    onClose={() => setViewingClass(null)} 
                    classId={viewingClass.classId} 
                    className={viewingClass.className} 
                />
            )}
        </div>
    );
}

const FeeTemplates: React.FC<{ onSave: (message: string) => void }> = ({ onSave }) => {
    const { user } = useAuth();
    const { refreshKey, triggerRefresh } = useDataRefresh();
    const [templates, setTemplates] = useState<FeeTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState<'create' | 'edit' | 'delete' | null>(null);
    const [selectedTemplate, setSelectedTemplate] = useState<FeeTemplate | null>(null);

    const fetchTemplates = useCallback(async () => {
        if (!user?.branchId) return;
        setLoading(true);
        const data = await apiService.getFeeTemplates(user.branchId);
        setTemplates(data);
        setLoading(false);
    }, [user, refreshKey]);

    useEffect(() => {
        fetchTemplates();
    }, [fetchTemplates]);

    const handleSaveAndRefresh = (message: string) => {
        setModal(null);
        setSelectedTemplate(null);
        triggerRefresh();
        onSave(message);
    };

    return (
        <div>
             <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-text-primary-dark">Fee Templates</h2>
                <Button onClick={() => setModal('create')}>Create New Template</Button>
            </div>
            {loading ? <p>Loading templates...</p> : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="border-b border-slate-200 text-sm text-text-secondary-dark">
                            <tr>
                                <th className="p-4">Template Name</th>
                                <th className="p-4">Grade Level</th>
                                <th className="p-4 text-right">Amount</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {templates.map(template => (
                                <tr key={template.id} className="border-b border-slate-100 hover:bg-slate-50">
                                    <td className="p-4 font-medium text-text-primary-dark">{template.name}</td>
                                    <td className="p-4">{template.gradeLevel}</td>
                                    <td className="p-4 text-right font-semibold">{template.amount.toLocaleString()}</td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="secondary" className="!px-3 !py-1 text-xs" onClick={() => { setSelectedTemplate(template); setModal('edit'); }}>Edit</Button>
                                            <Button variant="danger" className="!px-3 !py-1 text-xs" onClick={() => { setSelectedTemplate(template); setModal('delete'); }}>Delete</Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
             {user && (modal === 'create' || modal === 'edit') && (
                <FeeTemplateFormModal 
                    templateToEdit={modal === 'edit' ? selectedTemplate : null} 
                    onClose={() => setModal(null)} 
                    onSave={handleSaveAndRefresh} 
                    branchId={user.branchId!}
                    registrarId={user.id}
                />
            )}
            {user && modal === 'delete' && selectedTemplate && (
                <DeleteRequestModal
                    template={selectedTemplate}
                    onClose={() => setModal(null)}
                    onSave={handleSaveAndRefresh}
                    registrarId={user.id}
                />
            )}
        </div>
    );
}

const FeeManagement: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'templates' | 'status'>('templates');
    const [statusMessage, setStatusMessage] = useState('');

    const handleSave = (message: string) => {
        setStatusMessage(message);
        setTimeout(() => setStatusMessage(''), 5000);
    };

    const tabButtonClasses = (isActive: boolean) =>
        `px-4 py-2 text-sm font-medium transition-colors focus:outline-none ${isActive ? 'bg-slate-200 rounded-t-lg font-semibold' : 'text-text-secondary-dark hover:bg-slate-100'}`;

    return (
        <div>
            <h1 className="text-3xl font-bold text-text-primary-dark mb-6">Fees & Finance</h1>
             <div className="mb-4">
                <div className="flex border-b">
                    <button className={tabButtonClasses(activeTab === 'templates')} onClick={() => setActiveTab('templates')}>Fee Templates</button>
                    <button className={tabButtonClasses(activeTab === 'status')} onClick={() => setActiveTab('status')}>Class Fee Status</button>
                </div>
            </div>

            <Card>
                {statusMessage && (
                    <div className="mb-4 text-center p-2 bg-green-100 text-green-800 rounded-lg text-sm transition-opacity duration-300">
                        {statusMessage}
                    </div>
                )}
                {activeTab === 'templates' ? (
                    <FeeTemplates onSave={handleSave} />
                ) : (
                    <ClassFeeStatus />
                )}
            </Card>
        </div>
    );
};

export default FeeManagement;