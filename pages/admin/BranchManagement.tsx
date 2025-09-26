import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const BranchManagement: React.FC = () => {
    const navigate = useNavigate();
    useEffect(() => {
        // This functionality is handled under School Management. Redirecting...
        navigate('/admin/schools', { replace: true });
    }, [navigate]);

    return (
        <div>
            <p>Redirecting to School Management...</p>
        </div>
    );
};

export default BranchManagement;
