import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth.ts';
// FIX: Corrected import to use the specific registrarApiService
import { registrarApiService as apiService } from '../../services';
import type { Hostel, Room } from '../../types.ts';
import Card from '../ui/Card.tsx';
import Button from '../ui/Button.tsx';
import Input from '../ui/Input.tsx';

interface HostelFormModalProps {
    hostelToEdit: Partial<Hostel & { rooms?: Partial<Room>[] } > | null;
    onClose: () => void;
    onSave: () => void;
    branchId: string;
}

const HostelFormModal: React.FC<HostelFormModalProps> = ({ hostelToEdit, onClose, onSave, branchId }) => {
    const [formData, setFormData] = useState<Partial<Hostel & { rooms: Partial<Room>[] }>>({
        name: '', warden: '', wardenNumber: '', rooms: [], ...hostelToEdit
    });
    const [newRoom, setNewRoom] = useState({ roomNumber: '', roomType: 'Standard Double', capacity: 2, fee: 300 });
    const [isSaving, setIsSaving] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAddRoom = () => {
        if (newRoom.roomNumber && newRoom.capacity > 0) {
            setFormData(prev => ({
                ...prev,
                rooms: [...(prev.rooms || []), { id: `new-${Date.now()}`, ...newRoom }]
            }));
            setNewRoom({ roomNumber: '', roomType: 'Standard Double', capacity: 2, fee: 300 });
        }
    };

    const handleRemoveRoom = (roomId: string) => {
        setFormData(prev => ({ ...prev, rooms: prev.rooms?.filter(r => r.id !== roomId) }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        if (formData.id) {
            await apiService.updateHostel(formData.id, formData);
        } else {
            await apiService.createHostel(formData as any, branchId);
        }
        setIsSaving(false);
        onSave();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-3xl max-h-[90vh] flex flex-col">
                <h2 className="text-xl font-bold mb-4">{formData.id ? 'Edit Hostel' : 'Create New Hostel'}</h2>
                <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto pr-2 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="Hostel Name" name="name" value={formData.name} onChange={handleChange} required />
                        <Input label="Warden Name" name="warden" value={formData.warden} onChange={handleChange} required />
                        <Input label="Warden Number" name="wardenNumber" value={formData.wardenNumber} onChange={handleChange} placeholder="Optional contact number" />
                    </div>
                    <div className="pt-4 border-t">
                        <h3 className="text-lg font-semibold mb-2">Rooms</h3>
                        <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                            {formData.rooms?.map((room) => (
                                <div key={room.id} className="grid grid-cols-12 items-center gap-2 bg-slate-100 p-2 rounded">
                                    <p className="col-span-3"><strong>{room.roomNumber}</strong></p>
                                    <p className="col-span-4 text-sm">{room.roomType}</p>
                                    <p className="col-span-2 text-sm">Cap: {room.capacity}</p>
                                    <p className="col-span-2 text-sm font-semibold">{room.fee}</p>
                                    <Button type="button" variant="danger" className="!p-1 h-6 w-6 col-span-1" onClick={() => handleRemoveRoom(room.id!)}>&times;</Button>
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-5 items-end gap-2 pt-4 border-t mt-2">
                            <Input label="Room No." value={newRoom.roomNumber} onChange={e => setNewRoom(s => ({ ...s, roomNumber: e.target.value }))} />
                            <Input label="Room Type" value={newRoom.roomType} onChange={e => setNewRoom(s => ({ ...s, roomType: e.target.value }))} />
                            <Input label="Capacity" type="number" value={newRoom.capacity} onChange={e => setNewRoom(s => ({ ...s, capacity: Number(e.target.value) }))} />
                            <Input label="Fee" type="number" value={newRoom.fee} onChange={e => setNewRoom(s => ({ ...s, fee: Number(e.target.value) }))} />
                            <Button type="button" onClick={handleAddRoom}>Add Room</Button>
                        </div>
                    </div>
                </form>
                <div className="flex justify-end gap-4 mt-6 pt-4 border-t">
                    <Button variant="secondary" onClick={onClose} disabled={isSaving}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Hostel'}</Button>
                </div>
            </Card>
        </div>
    );
};

export default HostelFormModal;