import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth.ts';
import { registrarApiService as apiService } from '../../services';
import type { Hostel, Room, Student } from '../../types.ts';
import Card from '../../components/ui/Card.tsx';
import Button from '../../components/ui/Button.tsx';
import ConfirmationModal from '../../components/ui/ConfirmationModal.tsx';
import HostelFormModal from '../../components/modals/HostelFormModal.tsx';
import ManageHostelOccupantsModal from '../../components/modals/ManageHostelOccupantsModal.tsx';
import { useDataRefresh } from '../../contexts/DataRefreshContext.tsx';

const HostelManagement: React.FC = () => {
    const { user } = useAuth();
    const { refreshKey, triggerRefresh } = useDataRefresh();
    const [hostels, setHostels] = useState<Hostel[]>([]);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState(true);
    
    const [modal, setModal] = useState<'create' | 'edit' | 'manage_occupants' | null>(null);
    const [selectedHostel, setSelectedHostel] = useState<Hostel | null>(null);
    const [deletingHostel, setDeletingHostel] = useState<Hostel | null>(null);
    const [isActionLoading, setIsActionLoading] = useState(false);

    const fetchData = useCallback(async () => {
        if (!user?.branchId) return;
        setLoading(true);
        const [hostelData, roomData] = await Promise.all([
            apiService.getHostels(user.branchId),
            apiService.getAllRoomsByBranch(user.branchId)
        ]);
        setHostels(hostelData);
        setRooms(roomData);
        setLoading(false);
    }, [user, refreshKey]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSave = () => {
        setModal(null);
        setSelectedHostel(null);
        triggerRefresh();
    };

    const handleDelete = async () => {
        if (!deletingHostel) return;
        setIsActionLoading(true);
        try {
            await apiService.deleteHostel(deletingHostel.id);
        } catch (error: any) {
            alert(error.message);
        }
        setIsActionLoading(false);
        setDeletingHostel(null);
        triggerRefresh();
    };
    
    const calculateOccupancy = (hostelId: string) => {
        const hostelRooms = rooms.filter(r => r.hostelId === hostelId);
        const totalCapacity = hostelRooms.reduce((acc, room) => acc + room.capacity, 0);
        const totalOccupants = hostelRooms.reduce((acc, room) => acc + room.occupantIds.length, 0);
        return { totalCapacity, totalOccupants };
    };

    if (loading) return <p>Loading hostel data...</p>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-text-primary-dark">Hostel Management</h1>
                <Button onClick={() => { setSelectedHostel(null); setModal('create'); }}>Create New Hostel</Button>
            </div>
            
            {hostels.length === 0 ? (
                <Card><p className="text-center text-text-secondary-dark p-8">No hostels have been created yet.</p></Card>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {hostels.map(hostel => {
                        const { totalCapacity, totalOccupants } = calculateOccupancy(hostel.id);
                        return (
                            <Card key={hostel.id}>
                                <div className="flex justify-between items-start mb-3">
                                    <h2 className="text-xl font-bold">{hostel.name}</h2>
                                    <p className="text-sm text-text-secondary-dark">Warden: {hostel.warden}</p>
                                </div>
                                
                                <div className="mb-4">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <span className="text-sm font-medium text-text-secondary-dark">Occupancy</span>
                                        <span className="font-semibold">{totalOccupants} / {totalCapacity}</span>
                                    </div>
                                    <div className="w-full bg-slate-200 rounded-full h-2.5">
                                        <div className="bg-brand-secondary h-2.5 rounded-full" style={{ width: `${(totalOccupants / (totalCapacity || 1)) * 100}%` }}></div>
                                    </div>
                                </div>
                                
                                <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                                    <Button variant="primary" onClick={() => { setSelectedHostel(hostel); setModal('manage_occupants'); }}>Manage Occupants</Button>
                                    <Button variant="secondary" onClick={() => { setSelectedHostel(hostel); setModal('edit'); }}>Edit</Button>
                                    <Button variant="danger" onClick={() => setDeletingHostel(hostel)}>Delete</Button>
                                </div>
                            </Card>
                        )
                    })}
                </div>
            )}

            {(modal === 'create' || (modal === 'edit' && selectedHostel)) && user?.branchId && (
                <HostelFormModal 
                    hostelToEdit={selectedHostel}
                    onClose={() => { setModal(null); setSelectedHostel(null); }}
                    onSave={handleSave}
                    branchId={user.branchId}
                />
            )}
            
            {modal === 'manage_occupants' && selectedHostel && user?.branchId && (
                <ManageHostelOccupantsModal
                    hostel={selectedHostel}
                    branchId={user.branchId}
                    onClose={() => setModal(null)}
                />
            )}

            {deletingHostel && (
                <ConfirmationModal
                    isOpen={!!deletingHostel}
                    onClose={() => setDeletingHostel(null)}
                    onConfirm={handleDelete}
                    title="Confirm Hostel Deletion"
                    message={<>Are you sure you want to delete the hostel "<strong>{deletingHostel.name}</strong>"? All rooms will be deleted and students unassigned.</>}
                    isConfirming={isActionLoading}
                />
            )}
        </div>
    );
};

export default HostelManagement;