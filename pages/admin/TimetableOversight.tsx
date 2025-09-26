
import React from 'react';
import Card from '../../components/ui/Card.tsx';
import { TimetableIcon } from '../../components/icons/Icons.tsx';

const TimetableOversight: React.FC = () => {
    return (
        <div>
            <h1 className="text-3xl font-bold text-text-primary-dark mb-6">Timetable & Resource Oversight</h1>
            <Card>
                <div className="text-center p-12">
                    <TimetableIcon className="w-16 h-16 mx-auto text-slate-300" />
                    <h2 className="mt-4 text-xl font-semibold text-text-primary-dark">Global Timetable Insights</h2>
                    <p className="mt-2 text-text-secondary-dark">
                        This section will provide a system-wide view of timetable usage, helping to detect teacher overload and manage resource allocation across all schools.
                    </p>
                    <p className="mt-2 text-sm text-text-secondary-dark">(Feature Coming Soon)</p>
                </div>
            </Card>
        </div>
    );
};
export default TimetableOversight;