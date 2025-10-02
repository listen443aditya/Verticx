import React, { useEffect, useState, useMemo } from 'react';
import Card from '../../components/ui/Card.tsx';
import Button from '../../components/ui/Button.tsx';
import { AdminApiService } from '../../services';
// FIX: Added 'SystemWideErpFinancials' and 'ErpBillingStatus' to the type import.
import type { SystemWideFinancials, Branch, SystemWideErpFinancials, ErpBillingStatus } from '../../types.ts';
import Input from '../../components/ui/Input.tsx';
import SchoolFinancialDetailModal from '../../components/modals/SchoolFinancialDetailModal.tsx';
import { HelpCircleIcon, BanknoteIcon, FinanceIcon, StudentsIcon, BranchIcon, AlertTriangleIcon } from '../../components/icons/Icons.tsx';
// FIX: Added 'CartesianGrid' to the import from 'recharts'.
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { useAuth } from '../../hooks/useAuth.ts';

const adminApiService = new AdminApiService();

const StudentFeeCollections: React.FC = () => {
    const [financialData, setFinancialData] = useState<SystemWideFinancials | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | Branch['status']>('all');
    const [viewingDetailsOf, setViewingDetailsOf] = useState<string | null>(null);

    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const data = (startDate && endDate)
                ? await adminApiService.getSystemWideFinancials(startDate, endDate)
                : await adminApiService.getSystemWideFinancials();
            setFinancialData(data);
            setLoading(false);
        };
        fetchData();
    }, [startDate, endDate]);

    const handleClearFilters = () => {
        setSearchTerm('');
        setFilterStatus('all');
        setStartDate('');
        setEndDate('');
    };
    
    const filteredData = useMemo(() => {
        if (!financialData) return [];
        const { collectionBySchool } = financialData;
        return collectionBySchool.filter(school => {
            const matchesStatus = filterStatus === 'all' || school.status === filterStatus;
            const matchesSearch = searchTerm === '' || school.name.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesStatus && matchesSearch;
        });
    }, [financialData, searchTerm, filterStatus]);

    const getStatusChip = (status: Branch['status']) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-800';
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'suspended': return 'bg-orange-100 text-orange-800';
        }
    };

    if (loading || !financialData) {
        return <div>Loading financial data...</div>;
    }

    const { summary } = financialData;
    const isFiltered = startDate && endDate;
    const netFlow = isFiltered ? summary.totalCollected - summary.totalExpenditure : 0;
    
    return (
        <div className="space-y-6">
            <Card>
                <h2 className="text-xl font-semibold mb-4">Student Fee Summary {isFiltered && <span className="text-base font-normal text-text-secondary-dark">({startDate} to {endDate})</span>}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-center">
                    {isFiltered ? (
                         <>
                            <div className="bg-green-50 p-4 rounded-lg">
                                <p className="text-sm text-green-700">Fees Collected (Period)</p>
                                <p className="text-3xl font-bold text-green-600">{summary.totalCollected.toLocaleString()}</p>
                            </div>
                             <div className="bg-orange-50 p-4 rounded-lg">
                                <p className="text-sm text-orange-700">Total Expenditure (Period)</p>
                                <p className="text-3xl font-bold text-orange-600">{summary.totalExpenditure.toLocaleString()}</p>
                            </div>
                            <div className={`${netFlow >= 0 ? 'bg-blue-50' : 'bg-red-50'} p-4 rounded-lg`}>
                                <p className={`text-sm ${netFlow >= 0 ? 'text-blue-700' : 'text-red-700'}`}>Net Financial Flow (Period)</p>
                                <p className={`text-3xl font-bold ${netFlow >= 0 ? 'text-blue-600' : 'text-red-600'}`}>{netFlow.toLocaleString()}</p>
                            </div>
                             <div className="bg-red-50 p-4 rounded-lg">
                                <div className="flex items-center justify-center">
                                    <p className="text-sm text-red-700">Total Pending (Current)</p>
                                    <div className="group relative ml-2">
                                        <HelpCircleIcon className="w-4 h-4 text-red-500 cursor-pointer" />
                                        <div className="absolute bottom-full mb-2 w-48 bg-slate-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                            This is the total outstanding amount across all time.
                                        </div>
                                    </div>
                                </div>
                                <p className="text-3xl font-bold text-red-600">{summary.totalPending.toLocaleString()}</p>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="bg-green-50 p-4 rounded-lg">
                                <p className="text-sm text-green-700">Total Fees Collected</p>
                                <p className="text-3xl font-bold text-green-600">{summary.totalCollected.toLocaleString()}</p>
                            </div>
                             <div className="bg-red-50 p-4 rounded-lg">
                                <p className="text-sm text-red-700">Total Pending</p>
                                <p className="text-3xl font-bold text-red-600">{summary.totalPending.toLocaleString()}</p>
                            </div>
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <p className="text-sm text-blue-700">Collection Rate</p>
                                <p className="text-3xl font-bold text-blue-600">{summary.collectionRate.toFixed(2)}%</p>
                            </div>
                             <div className="bg-orange-50 p-4 rounded-lg">
                                <p className="text-sm text-orange-700">Total Expenditure</p>
                                <p className="text-3xl font-bold text-orange-600">{summary.totalExpenditure.toLocaleString()}</p>
                            </div>
                        </>
                    )}
                </div>
            </Card>

            <Card>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 pb-4 border-b border-slate-200">
                    <Input placeholder="Search by school name..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="md:col-span-4" />
                    <Input label="Start Date" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                    <Input label="End Date" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} min={startDate} />
                    <div>
                         <label className="block text-sm font-medium text-text-secondary-dark mb-1">Filter by Status</label>
                        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)} className="w-full bg-white border border-slate-300 rounded-md py-2 px-3">
                            <option value="all">All</option>
                            <option value="active">Active</option>
                            <option value="pending">Pending</option>
                            <option value="suspended">Suspended</option>
                        </select>
                    </div>
                    <div className="flex items-end">
                         <Button onClick={handleClearFilters} variant="secondary" className="w-full">Clear Filters</Button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="border-b border-slate-200 text-sm text-text-secondary-dark">
                            <tr>
                                <th className="p-4">School Name</th>
                                <th className="p-4 text-center">Status</th>
                                <th className="p-4 text-right">{isFiltered ? 'Collected (Period)' : 'Total Collected'}</th>
                                <th className="p-4 text-right">{isFiltered ? 'Pending (Current)' : 'Total Pending'}</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.map(school => (
                                <tr key={school.id} className="border-b border-slate-100 hover:bg-slate-50">
                                    <td className="p-4 font-medium text-text-primary-dark">{school.name}</td>
                                    <td className="p-4 text-center">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusChip(school.status)}`}>
                                            {school.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right font-semibold text-green-600">{school.collected.toLocaleString()}</td>
                                    <td className="p-4 text-right font-semibold text-red-600">{school.pending.toLocaleString()}</td>
                                    <td className="p-4 text-right">
                                        <Button variant="secondary" className="!px-3 !py-1 text-xs" onClick={() => setViewingDetailsOf(school.id)}>
                                            View Details
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredData.length === 0 && !loading && (
                        <p className="text-center text-text-secondary-dark p-8">No schools found matching your criteria.</p>
                    )}
                </div>
            </Card>
            {viewingDetailsOf && (
                <SchoolFinancialDetailModal branchId={viewingDetailsOf} onClose={() => setViewingDetailsOf(null)} />
            )}
        </div>
    );
};

const ErpBillingsDashboard: React.FC = () => {
    const [data, setData] = useState<SystemWideErpFinancials | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const result = await adminApiService.getSystemWideErpFinancials();
            setData(result);
            setLoading(false);
        };
        fetchData();
    }, []);

    const getStatusChip = (status: Branch['status']) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-800';
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'suspended': return 'bg-orange-100 text-orange-800';
        }
    };

    const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode; color: string }> = ({ title, value, icon, color }) => (
        <Card className="flex items-center p-4">
            <div className={`p-3 mr-4 text-white rounded-full ${color}`}>
                {icon}
            </div>
            <div>
                <p className="text-sm font-medium text-text-secondary-dark">{title}</p>
                <p className="text-2xl font-semibold text-text-primary-dark">{value}</p>
            </div>
        </Card>
    );
    
    if (loading || !data) {
        return <div>Loading ERP billing data...</div>
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard title="Total Amount Billed" value={`₹${data.summary.totalBilled.toLocaleString()}`} icon={<BanknoteIcon className="w-6 h-6"/>} color="bg-blue-500" />
                <StatCard title="Total Amount Received" value={`₹${data.summary.totalPaid.toLocaleString()}`} icon={<FinanceIcon className="w-6 h-6"/>} color="bg-green-500" />
                <StatCard title="Total Pending Amount" value={`₹${data.summary.pendingAmount.toLocaleString()}`} icon={<AlertTriangleIcon className="w-6 h-6"/>} color="bg-red-500" />
                <StatCard title="Total Active Schools" value={data.summary.totalSchools.toString()} icon={<BranchIcon className="w-6 h-6"/>} color="bg-indigo-500" />
                <StatCard title="System-wide Students" value={data.summary.totalStudents.toLocaleString()} icon={<StudentsIcon className="w-6 h-6"/>} color="bg-purple-500" />
                <StatCard title="Schools with Dues" value={data.summary.pendingSchoolsCount.toString()} icon={<AlertTriangleIcon className="w-6 h-6"/>} color="bg-orange-500" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1">
                    <h2 className="text-xl font-semibold mb-4">Billing Trend (Last 6 Months)</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={data.billingTrend}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis tickFormatter={(val) => `${val / 1000}k`} />
                            <Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} />
                            <Legend />
                            <Bar dataKey="billed" fill="#4F46E5" name="Billed"/>
                            <Bar dataKey="paid" fill="#4ade80" name="Paid"/>
                        </BarChart>
                    </ResponsiveContainer>
                </Card>
                <Card className="lg:col-span-2">
                     <h2 className="text-xl font-semibold mb-4">School-wise Billing Status</h2>
                     <div className="overflow-auto max-h-[70vh]">
                         <table className="w-full text-left text-sm">
                            <thead className="sticky top-0 bg-surface-dark/90 backdrop-blur-sm">
                                <tr className="border-b"><th className="p-2">School</th><th className="p-2 text-right">Pending</th><th className="p-2 text-center">Next Due Date</th><th className="p-2 text-center">Overdue by</th><th className="p-2 text-center">Status</th></tr>
                            </thead>
                            <tbody>
                                {data.billingStatusBySchool.map(school => (
                                    <tr key={school.branchId} className="border-b hover:bg-slate-50">
                                        <td className="p-2 font-medium">{school.branchName}</td>
                                        <td className="p-2 text-right font-semibold text-red-600">{school.pendingAmount.toLocaleString()}</td>
                                        <td className="p-2 text-center">{school.nextDueDate}</td>
                                        <td className={`p-2 text-center font-bold ${school.daysOverdue > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                            {school.daysOverdue > 0 ? `${school.daysOverdue} days` : 'On Time'}
                                        </td>
                                        <td className="p-2 text-center">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusChip(school.status)}`}>{school.status}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                         </table>
                     </div>
                </Card>
            </div>
        </div>
    );
};

const FinanceManagement: React.FC = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'studentFees' | 'erpBillings'>('studentFees');

    const tabButtonClasses = (isActive: boolean) =>
        `px-4 py-2 text-sm font-medium transition-colors focus:outline-none ${isActive ? 'bg-slate-200 rounded-t-lg font-semibold text-text-primary-dark' : 'text-text-secondary-dark hover:bg-slate-100'}`;

    return (
        <div>
            <h1 className="text-3xl font-bold text-text-primary-dark mb-6">Finance &amp; Fee Management</h1>
            <div className="flex border-b border-slate-200 mb-6">
                <button className={tabButtonClasses(activeTab === 'studentFees')} onClick={() => setActiveTab('studentFees')}>Student Fee Collections</button>
                {user?.role === 'SuperAdmin' && (
                    <button className={tabButtonClasses(activeTab === 'erpBillings')} onClick={() => setActiveTab('erpBillings')}>ERP Billings</button>
                )}
            </div>
            
            {activeTab === 'studentFees' && <StudentFeeCollections />}
            {activeTab === 'erpBillings' && user?.role === 'SuperAdmin' && <ErpBillingsDashboard />}
        </div>
    );
};

export default FinanceManagement;