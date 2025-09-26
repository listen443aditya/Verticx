
import React from 'react';
import Card from '../../components/ui/Card.tsx';

const MyComplaints: React.FC = () => {
    return (
        <div>
            <h1 className="text-3xl font-bold text-text-primary-dark mb-6">My Submitted Complaints</h1>
            <Card>
                <p className="text-center text-text-secondary-dark p-8">
                    This page will show a history of complaints you have submitted.
                </p>
            </Card>
        </div>
    );
};

export default MyComplaints;
