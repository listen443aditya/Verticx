import React, { useState } from 'react';
import Card from '../../components/ui/Card.tsx';
import Button from '../../components/ui/Button.tsx';

const reportTypes = [
    { id: 'enrollment', name: 'Enrollment Statistics', description: 'Trends in new admissions, re-enrollments, and student attrition rates by grade level.' },
    { id: 'class_rosters', name: 'Class Rosters', description: 'Generate detailed student lists for each class and section.' },
    { id: 'fee_defaulters', name: 'Fee Defaulters List', description: 'A list of all students with outstanding fee payments.' },
    { id: 'faculty_list', name: 'Faculty & Staff Directory', description: 'A complete directory of all teaching and non-teaching staff.' },
];

const Reports: React.FC = () => {
    const [selectedReport, setSelectedReport] = useState(reportTypes[0].id);
    const [generating, setGenerating] = useState(false);
    const [message, setMessage] = useState('');

    const handleGenerate = () => {
        setGenerating(true);
        setMessage('');
        const reportName = reportTypes.find(r => r.id === selectedReport)?.name;
        setTimeout(() => {
            setGenerating(false);
            setMessage(`Successfully generated the "${reportName}" report. In a real application, this would trigger a download.`);
        }, 1500);
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-text-primary-dark mb-6">Generate Reports</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-1">
                    <h2 className="text-lg font-semibold text-text-primary-dark mb-4">Select Report Type</h2>
                    <div className="space-y-2">
                        {reportTypes.map(report => (
                            <button
                                key={report.id}
                                onClick={() => setSelectedReport(report.id)}
                                className={`w-full text-left p-3 rounded-lg transition-colors ${
                                    selectedReport === report.id ? 'bg-brand-primary text-white' : 'hover:bg-slate-100'
                                }`}
                            >
                                {report.name}
                            </button>
                        ))}
                    </div>
                </Card>
                <Card className="md:col-span-2">
                    <div className="min-h-[250px] flex flex-col">
                         {reportTypes.find(r => r.id === selectedReport) && (
                            <>
                                <h2 className="text-xl font-bold text-text-primary-dark mb-2">{reportTypes.find(r => r.id === selectedReport)?.name}</h2>
                                <p className="text-text-secondary-dark mb-6 flex-grow">{reportTypes.find(r => r.id === selectedReport)?.description}</p>
                            </>
                         )}
                        
                        {message && (
                            <div className="mb-4 p-3 bg-green-100 text-green-800 rounded-lg text-sm">
                                {message}
                            </div>
                        )}

                        <div className="mt-auto text-right">
                             <Button onClick={handleGenerate} disabled={generating}>
                                {generating ? 'Generating...' : 'Generate Report'}
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default Reports;
