import React, { useState, useEffect } from "react";
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

  // State for adding a NEW room
  const [newRoom, setNewRoom] = useState({
    roomNumber: "",
    roomType: "Shared", // Default, but editable via input now
    capacity: 4,
    fee: 0,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);

  // Fetch rooms if editing existing hostel
  useEffect(() => {
    if (hostelToEdit?.id) {
      const fetchRooms = async () => {
        setIsLoadingRooms(true);
        try {
          const fetchedRooms = await apiService.getRooms(hostelToEdit.id);
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
    }
  }, [hostelToEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // --- FIX: Robust Editing of Existing Rooms ---
  const handleRoomChange = (
    index: number,
    field: keyof Room,
    value: string | number
  ) => {
    setFormData((prev) => {
      // Create a deep copy of the rooms array to avoid mutation issues
      const updatedRooms = [...(prev.rooms || [])];
      updatedRooms[index] = { ...updatedRooms[index], [field]: value };
      return { ...prev, rooms: updatedRooms };
    });
  };

  const handleAddNewRoom = () => {
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
      // Reset input
      setNewRoom({ roomNumber: "", roomType: "", capacity: 4, fee: 0 });
    }
  };

  const handleRemoveRoom = (roomId: string | undefined, index: number) => {
    // If it has a real ID, we might need to track deletion (handled by backend logic comparing arrays)
    // For UI, we just remove it from the array.
    setFormData((prev) => ({
      ...prev,
      rooms: prev.rooms?.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const payload = {
      ...formData,
      branchId,
      rooms: formData.rooms?.map((r) => ({
        id: r.id,
        roomNumber: r.roomNumber,
        roomType: r.roomType,
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

  if (isLoadingRooms)
    return <div className="p-8 text-center">Loading rooms...</div>;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            {hostelToEdit ? "Edit Hostel Details" : "Create New Hostel"}
          </h2>
          <button onClick={onClose} className="text-2xl font-light">
            &times;
          </button>
        </div>

        <div className="flex-grow overflow-y-auto pr-2 space-y-6">
          <form id="hostel-form" onSubmit={handleSubmit} className="space-y-4">
            {/* Basic Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
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
                label="Warden Phone"
                name="wardenNumber"
                value={formData.wardenNumber}
                onChange={handleChange}
              />
            </div>

            {/* Existing/Active Rooms List */}
            <div>
              <h3 className="font-semibold text-lg mb-2">Manage Rooms</h3>
              <div className="space-y-3">
                {formData.rooms?.map((room, index) => (
                  <div
                    key={room.id || index}
                    className="grid grid-cols-12 gap-2 items-center p-2 border-b border-slate-100 hover:bg-slate-50 transition-colors"
                  >
                    <div className="col-span-2">
                      <label className="text-[10px] text-slate-500 font-bold">
                        NO.
                      </label>
                      <Input
                        value={room.roomNumber || ""}
                        onChange={(e) =>
                          handleRoomChange(index, "roomNumber", e.target.value)
                        }
                        required
                        className="!py-1 !text-sm"
                      />
                    </div>
                    <div className="col-span-4">
                      <label className="text-[10px] text-slate-500 font-bold">
                        TYPE
                      </label>
                      {/* FIX: Changed from Select to Input as requested */}
                      <Input
                        value={room.roomType || ""}
                        onChange={(e) =>
                          handleRoomChange(index, "roomType", e.target.value)
                        }
                        placeholder="e.g. AC Single"
                        className="!py-1 !text-sm"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-[10px] text-slate-500 font-bold">
                        CAPACITY
                      </label>
                      <Input
                        type="number"
                        value={room.capacity || ""}
                        onChange={(e) =>
                          handleRoomChange(index, "capacity", e.target.value)
                        }
                        required
                        className="!py-1 !text-sm"
                      />
                    </div>
                    <div className="col-span-3">
                      <label className="text-[10px] text-slate-500 font-bold">
                        MONTHLY FEE
                      </label>
                      <Input
                        type="number"
                        value={room.fee || ""}
                        onChange={(e) =>
                          handleRoomChange(index, "fee", e.target.value)
                        }
                        required
                        className="!py-1 !text-sm"
                      />
                    </div>
                    <div className="col-span-1 flex justify-end items-end pb-1">
                      <button
                        type="button"
                        onClick={() => handleRemoveRoom(room.id, index)}
                        className="text-red-500 hover:text-red-700 text-xl font-bold"
                        title="Remove Room"
                      >
                        &times;
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Add New Room Section */}
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 mt-4">
              <h4 className="text-xs font-bold text-blue-800 uppercase mb-2">
                Add New Room
              </h4>
              <div className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-3">
                  <Input
                    label="Room No"
                    value={newRoom.roomNumber}
                    onChange={(e) =>
                      setNewRoom((s) => ({ ...s, roomNumber: e.target.value }))
                    }
                    className="!bg-white"
                  />
                </div>
                <div className="col-span-4">
                  {/* FIX: Changed from Select to Input for new room too */}
                  <Input
                    label="Type"
                    value={newRoom.roomType}
                    onChange={(e) =>
                      setNewRoom((s) => ({ ...s, roomType: e.target.value }))
                    }
                    placeholder="e.g. Non-AC Shared"
                    className="!bg-white"
                  />
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
                    className="!bg-white"
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
                    className="!bg-white"
                  />
                </div>
                <div className="col-span-1">
                  <Button
                    type="button"
                    onClick={handleAddNewRoom}
                    className="w-full !py-2 text-sm"
                  >
                    +
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </div>

        <div className="mt-4 pt-4 border-t flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button form="hostel-form" type="submit" disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default HostelFormModal;
