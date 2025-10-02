import React, { useState, useEffect, useCallback } from 'react';
import { AdminApiService } from '../../services';
import type { SchoolFinancialDetails } from '../../types.ts';
import Card from '../ui/Card.tsx';
import Button from '../ui/Button.tsx';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
const adminApiService = new AdminApiService();

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
        <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};


const SchoolFinancialDetailModal: React.FC<{ branchId: string; onClose: () => void }> = ({ branchId, onClose }) => {
    const [details, setDetails] = useState<SchoolFinancialDetails | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        const data = await adminApiService.getSchoolFinancialDetails(branchId);
        setDetails(data);
        setLoading(false);
    }, [branchId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const renderContent = () => {
        if (loading || !details) {
            return <div className="flex items-center justify-center h-full"><p>Loading financial details...</p></div>;
        }
        
        const { summary, revenueBreakdown, expenditureBreakdown } = details;
        
        const revenueData = [
            { name: 'Tuition Fees', value: revenueBreakdown.tuitionFees },
            { name: 'Transport Fees', value: revenueBreakdown.transportFees },
            { name: 'Hostel Fees', value: revenueBreakdown.hostelFees },
        ].filter(item => item.value > 0);
        const REVENUE_COLORS = ['#4F46E5', '#F97316', '#38BDF8'];
        
        const expenditureData = [
            { name: 'Staff Payroll', value: expenditureBreakdown.totalPayroll },
            { name: 'Manual Expenses', value: expenditureBreakdown.manualExpenses },
            { name: 'ERP Bill', value: expenditureBreakdown.erpBill },
        ].filter(item => item.value > 0);
        const EXPENDITURE_COLORS = ['#EF4444', '#F59E0B', '#6B7280'];

        return (
            <div className="space-y-6">
                 {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                    <div className="bg-green-50 p-4 rounded-lg">
                        <p className="text-sm text-green-700">Total Revenue</p>
                        <p className="text-3xl font-bold text-green-600">{summary.totalRevenue.toLocaleString()}</p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg">
                        <p className="text-sm text-red-700">Total Expenditure</p>
                        <p className="text-3xl font-bold text-red-500">{summary.totalExpenditure.toLocaleString()}</p>
                    </div>
                    <div className={`p-4 rounded-lg ${summary.netProfit >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
                        <p className={`text-sm ${summary.netProfit >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>Net Profit / Loss</p>
                        <p className={`text-3xl font-bold ${summary.netProfit >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                            {summary.netProfit.toLocaleString()}
                        </p>
                    </div>
                </div>

                {/* Breakdowns */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <h3 className="text-lg font-semibold mb-4 text-center">Revenue Breakdown</h3>
                         <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie data={revenueData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} fill="#8884d8" paddingAngle={5} labelLine={false} label={renderCustomizedLabel}>
                                    {revenueData.map((entry, index) => (<Cell key={`cell-${index}`} fill={REVENUE_COLORS[index % REVENUE_COLORS.length]} />))}
                                </Pie>
                                <Tooltip formatter={(value: number) => value.toLocaleString()}/>
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </Card>
                     <Card>
                        <h3 className="text-lg font-semibold mb-4 text-center">Expenditure Breakdown</h3>
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie data={expenditureData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} fill="#82ca9d" paddingAngle={5} labelLine={false} label={renderCustomizedLabel}>
                                    {expenditureData.map((entry, index) => (<Cell key={`cell-${index}`} fill={EXPENDITURE_COLORS[index % EXPENDITURE_COLORS.length]} />))}
                                </Pie>
                                <Tooltip formatter={(value: number) => value.toLocaleString()}/>
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </Card>
                </div>
                
                <Card>
                    <h3 className="text-lg font-semibold mb-4">Tuition Fee Collection by Grade</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={revenueBreakdown.tuitionByGrade}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="grade" />
                            <YAxis tickFormatter={(value) => `${value/1000}k`}/>
                            <Tooltip formatter={(value: number) => value.toLocaleString()}/>
                            <Legend />
                            <Bar dataKey="collected" stackId="a" fill="#4ade80" name="Collected" />
                            <Bar dataKey="pending" stackId="a" fill="#f87171" name="Pending" />
                        </BarChart>
                    </ResponsiveContainer>
                </Card>

            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
            <Card className="w-full max-w-6xl h-[95vh] flex flex-col">
                <div className="flex justify-between items-start mb-4">
                    <h2 className="text-3xl font-bold text-text-primary-dark">Financial Details: {details?.branchName || '...'}</h2>
                    <button onClick={onClose} className="text-3xl font-light text-slate-500 hover:text-slate-800 leading-none">&times;</button>
                </div>
                <div className="flex-grow overflow-y-auto pr-2">
                    {renderContent()}
                </div>
                 <div className="mt-4 text-right pt-4 border-t">
                    <Button onClick={onClose}>Close</Button>
                </div>
            </Card>
        </div>
    );
};

export default SchoolFinancialDetailModal;