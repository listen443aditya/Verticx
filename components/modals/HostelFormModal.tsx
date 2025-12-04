import React, { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { RegistrarApiService } from "../../services/registrarApiService";
import type { Hostel, Room } from "../../types";
import Card from "../ui/Card";
import Button from "../ui/Button";
import Input from "../ui/Input";

const apiService = new RegistrarApiService();

interface HostelFormModalProps {
  hostelToEdit?: Hostel | null;
  onClose: () => void;
  onSave: () => void;
  branchId: string;
}

const HostelFormModal: React.FC<HostelFormModalProps> = ({
  hostelToEdit,
  onClose,
  onSave,
  branchId,
}) => {
  const [formData, setFormData] = useState<
    Partial<Hostel & { rooms: Partial<Room>[] }>
  >({
    name: "",
    warden: "",
    wardenNumber: "",
    rooms: [],
    ...hostelToEdit,
  });

  // State for the "Add Room" inputs
  const [newRoom, setNewRoom] = useState({
    roomNumber: "",
    roomType: "Shared",
    capacity: 4,
    fee: 0,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);

  // --- FIX: Fetch rooms when editing ---
  useEffect(() => {
    if (hostelToEdit?.id) {
      const fetchRooms = async () => {
        setIsLoadingRooms(true);
        try {
          // Fetch the actual rooms for this hostel from the API
          const fetchedRooms = await apiService.getRooms(hostelToEdit.id);

          // Update state with the fetched rooms
          setFormData((prev) => ({
            ...prev,
            rooms: fetchedRooms,
          }));
        } catch (error) {
          console.error("Failed to fetch rooms:", error);
        } finally {
          setIsLoadingRooms(false);
        }
      };

      fetchRooms();
    } else {
      // If creating new, reset rooms to empty (or add a default one)
      setFormData((prev) => ({ ...prev, rooms: [] }));
    }
  }, [hostelToEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddRoom = () => {
    if (newRoom.roomNumber && newRoom.capacity > 0) {
      setFormData((prev) => ({
        ...prev,
        rooms: [
          ...(prev.rooms || []),
          {
            id: `new-${Date.now()}`, // Temp ID for backend recognition
            ...newRoom,
          },
        ],
      }));
      // Reset input fields
      setNewRoom({
        roomNumber: "",
        roomType: "Shared",
        capacity: 4,
        fee: 0,
      });
    }
  };

  const handleRemoveRoom = (roomId: string | undefined) => {
    if (!roomId) return;
    setFormData((prev) => ({
      ...prev,
      rooms: prev.rooms?.filter((r) => r.id !== roomId),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const payload = {
      ...formData,
      branchId, // Ensure branchId is included
      // Ensure numbers are numbers
      rooms: formData.rooms?.map((r) => ({
        ...r,
        capacity: Number(r.capacity),
        fee: Number(r.fee),
      })),
    };

    try {
      if (hostelToEdit?.id) {
        await apiService.updateHostel(hostelToEdit.id, payload);
      } else {
        await apiService.createHostel(payload as any);
      }
      onSave();
      onClose();
    } catch (error) {
      console.error(error);
      alert("Failed to save hostel.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            {hostelToEdit ? "Edit Hostel" : "Create New Hostel"}
          </h2>
          <button onClick={onClose} className="text-2xl font-light">
            &times;
          </button>
        </div>

        <form
          id="hostel-form"
          onSubmit={handleSubmit}
          className="flex-grow overflow-y-auto pr-2 space-y-4"
        >
          {/* Hostel Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Hostel Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <Input
              label="Warden Name"
              name="warden"
              value={formData.warden}
              onChange={handleChange}
              required
            />
            <Input
              label="Warden Number"
              name="wardenNumber"
              value={formData.wardenNumber}
              onChange={handleChange}
              placeholder="Optional contact number"
            />
          </div>

          {/* Rooms Section */}
          <div className="pt-4 border-t">
            <h3 className="text-lg font-semibold mb-2">Rooms</h3>

            {isLoadingRooms ? (
              <p className="text-sm text-gray-500 py-4">
                Loading existing rooms...
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1 mb-4">
                {formData.rooms?.length === 0 && (
                  <p className="text-sm text-slate-400 italic">
                    No rooms added yet.
                  </p>
                )}

                {formData.rooms?.map((room, index) => (
                  <div
                    key={room.id || index}
                    className="grid grid-cols-12 items-center gap-2 bg-slate-50 p-2 rounded border border-slate-200"
                  >
                    <p className="col-span-3 text-sm font-medium">
                      {room.roomNumber}
                    </p>
                    <p className="col-span-4 text-xs text-slate-600">
                      {room.roomType}
                    </p>
                    <p className="col-span-2 text-xs">Cap: {room.capacity}</p>
                    <p className="col-span-2 text-xs font-semibold">
                      ₹{room.fee}
                    </p>
                    <div className="col-span-1 text-right">
                      <button
                        type="button"
                        className="text-red-500 hover:text-red-700 font-bold"
                        onClick={() => handleRemoveRoom(room.id)}
                      >
                        &times;
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add New Room Row */}
            <div className="grid grid-cols-12 items-end gap-2 bg-slate-100 p-3 rounded-lg">
              <div className="col-span-3">
                <Input
                  label="Room No."
                  value={newRoom.roomNumber}
                  onChange={(e) =>
                    setNewRoom((s) => ({ ...s, roomNumber: e.target.value }))
                  }
                  placeholder="e.g. 101"
                />
              </div>
              <div className="col-span-3">
                <label className="block text-sm font-medium text-text-secondary-dark mb-1">
                  Type
                </label>
                <select
                  value={newRoom.roomType}
                  onChange={(e) =>
                    setNewRoom((s) => ({ ...s, roomType: e.target.value }))
                  }
                  className="w-full bg-white border border-slate-300 rounded-md py-2 px-2 text-sm"
                >
                  <option value="Single">Single</option>
                  <option value="Double">Double</option>
                  <option value="Shared">Shared</option>
                </select>
              </div>
              <div className="col-span-2">
                <Input
                  label="Cap."
                  type="number"
                  value={String(newRoom.capacity)}
                  onChange={(e) =>
                    setNewRoom((s) => ({
                      ...s,
                      capacity: Number(e.target.value),
                    }))
                  }
                />
              </div>
              <div className="col-span-2">
                <Input
                  label="Fee"
                  type="number"
                  value={String(newRoom.fee)}
                  onChange={(e) =>
                    setNewRoom((s) => ({ ...s, fee: Number(e.target.value) }))
                  }
                />
              </div>
              <div className="col-span-2">
                <Button
                  type="button"
                  onClick={handleAddRoom}
                  className="w-full !py-2 text-sm"
                >
                  Add
                </Button>
              </div>
            </div>
          </div>
        </form>

        <div className="flex justify-end gap-4 mt-6 pt-4 border-t">
          <Button variant="secondary" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button form="hostel-form" type="submit" disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Hostel"}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default HostelFormModal;
