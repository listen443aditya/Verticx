import React from 'react';
import { useAuth } from '../../hooks/useAuth.ts';
import LeaveManager from '../../components/shared/LeaveManager.tsx';

const ApplyForLeave: React.FC = () => {
    const { user } = useAuth();

    if (!user) {
        return <div>Loading...</div>;
    }

    return <LeaveManager user={user} />;
};

export default ApplyForLeave;
