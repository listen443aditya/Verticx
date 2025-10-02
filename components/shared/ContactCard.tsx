import React, { useState, useEffect } from 'react';
import type { Branch, User } from '../../types.ts';
import { SharedApiService } from '../../services';
import Card from '../ui/Card.tsx';
import { MailIcon, PhoneIcon, MapPinIcon } from '../icons/Icons.tsx';

interface ContactCardProps {
    branch?: Branch;
    principalName?: string;
}
const sharedApiService = new SharedApiService();

const ContactCard: React.FC<ContactCardProps> = ({ branch, principalName }) => {
    const [verticxSupport, setVerticxSupport] = useState<User | null>(null);

    useEffect(() => {
        const fetchSupportDetails = async () => {
            const supportUser = await sharedApiService.getSuperAdminContactDetails();
            setVerticxSupport(supportUser);
        };
        fetchSupportDetails();
    }, []);

    return (
        <Card>
            <div className={`grid grid-cols-1 ${branch ? 'md:grid-cols-2' : ''} divide-y md:divide-y-0 md:divide-x divide-slate-200`}>
                {/* School Contact */}
                {branch && (
                    <div className="pb-6 md:pb-0 md:pr-6">
                        <h3 className="text-lg font-semibold text-text-primary-dark mb-3">Your School Contact</h3>
                        <div className="space-y-2 text-sm">
                            {principalName && <p><strong>Principal:</strong> {principalName}</p>}
                            <p className="flex items-center gap-2"><MailIcon className="w-4 h-4 text-text-secondary-dark flex-shrink-0" /> {branch.email || 'N/A'}</p>
                            <p className="flex items-center gap-2"><PhoneIcon className="w-4 h-4 text-text-secondary-dark flex-shrink-0" /> {branch.helplineNumber || 'N/A'}</p>
                            <p className="flex items-center gap-2"><MapPinIcon className="w-4 h-4 text-text-secondary-dark flex-shrink-0" /> {branch.location || 'N/A'}</p>
                        </div>
                    </div>
                )}

                {/* Verticx Support */}
                <div className={`${branch ? 'pt-6 md:pt-0 md:pl-6' : ''}`}>
                     <h3 className="text-lg font-semibold text-text-primary-dark mb-3">Verticx ERP Support</h3>
                     {verticxSupport ? (
                        <div className="space-y-2 text-sm">
                             <p className="flex items-center gap-2"><MailIcon className="w-4 h-4 text-text-secondary-dark flex-shrink-0" /> {verticxSupport.email}</p>
                             <p className="flex items-center gap-2"><PhoneIcon className="w-4 h-4 text-text-secondary-dark flex-shrink-0" /> {verticxSupport.phone || '555-VERTICX'}</p>
                        </div>
                     ) : (
                        <p className="text-sm text-text-secondary-dark">Loading support details...</p>
                     )}
                </div>
            </div>
        </Card>
    );
};

export default ContactCard;