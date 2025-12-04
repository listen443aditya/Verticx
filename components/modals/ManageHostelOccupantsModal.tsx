import React, { useState, useEffect } from "react";
import { RegistrarApiService } from "../../services/registrarApiService";
import type { Hostel, Student } from "../../types";
import Card from "../ui/Card";
import Button from "../ui/Button";

const apiService = new RegistrarApiService();

interface ManageHostelOccupantsModalProps {
  hostel: Hostel;
  branchId: string;
  onClose: () => void;
}

const ManageHostelOccupantsModal: React.FC<ManageHostelOccupantsModalProps> = ({
  hostel,
  branchId,
  onClose,
}) => {
  const [rooms, setRooms] = useState<any[]>([]); // Use appropriate Room type
  const [unassignedStudents, setUnassignedStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Get Rooms for this Hostel
      const roomsData = await apiService.getRooms(hostel.id);

      // 2. Get Unassigned Students
      // We can reuse getStudentsByBranch and filter client-side,
      // or create a specific endpoint 'getUnassignedStudents' if list is huge.
      // For now, client-side filtering:
      const allStudents = await apiService.getStudents(); // or getStudentsForBranch
      const unassigned = allStudents.filter((s: Student) => !s.roomId);

      setRooms(roomsData);
      setUnassignedStudents(unassigned);
    } catch (error) {
      console.error("Failed to load hostel data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [hostel.id]);

  const handleAssign = async (roomId: string, studentId: string) => {
    if (!studentId) return;
    setAssigning(studentId);
    try {
      await apiService.assignStudentToRoom(roomId, studentId);
      // Refresh data to show updated occupancy
      await fetchData();
    } catch (error) {
      console.error("Assign failed:", error);
      alert("Failed to assign student. Room might be full.");
    } finally {
      setAssigning(null);
    }
  };

  const handleRemove = async (roomId: string, studentId: string) => {
    setAssigning(studentId); // Reusing state for loading indicator
    try {
      await apiService.removeStudentFromRoom(studentId); // Assuming API takes studentId
      await fetchData();
    } catch (error) {
      console.error("Remove failed:", error);
    } finally {
      setAssigning(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-5xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Manage Occupants: {hostel.name}</h2>
          <button onClick={onClose} className="text-2xl font-light">
            &times;
          </button>
        </div>

        {loading ? (
          <p className="text-center py-8">Loading...</p>
        ) : (
          <div className="flex-grow overflow-hidden grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* LEFT: List of Rooms */}
            <div className="md:col-span-2 overflow-y-auto pr-2 space-y-4">
              {rooms.map((room) => {
                const isFull = room.occupantIds.length >= room.capacity;
                return (
                  <div
                    key={room.id}
                    className="border border-slate-200 rounded-lg p-3"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-bold text-text-primary-dark">
                        Room {room.roomNumber}{" "}
                        <span className="text-xs font-normal text-slate-500">
                          ({room.roomType})
                        </span>
                      </h3>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          isFull
                            ? "bg-red-100 text-red-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {room.occupantIds.length} / {room.capacity}
                      </span>
                    </div>

                    {/* Occupants List */}
                    <div className="space-y-2 mb-3">
                      {room.occupantIds.length === 0 && (
                        <p className="text-xs text-slate-400 italic">Empty</p>
                      )}
                      {room.occupantIds.map((occId: string) => {
                        // Find student name from our cache or fetch?
                        // API getRooms should ideally return occupant objects {id, name}, not just IDs.
                        // Assuming we fix getRooms controller to return objects, or we filter from allStudents list if feasible.
                        // For this UI demo, we assume we might need to fetch names or the IDs are okay.
                        // Better approach: Let's assume getRooms returns { id, name } objects in occupantIds
                        return (
                          <div
                            key={occId}
                            className="flex justify-between items-center bg-slate-50 p-2 rounded text-sm"
                          >
                            <span>Student {occId.slice(0, 6)}...</span>
                            <button
                              onClick={() => handleRemove(room.id, occId)}
                              className="text-red-500 hover:text-red-700 text-xs"
                              disabled={!!assigning}
                            >
                              Remove
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    {/* Assign Action */}
                    {!isFull && (
                      <div className="flex gap-2">
                        <select
                          id={`select-${room.id}`}
                          className="w-full text-sm border-slate-300 rounded-md"
                          defaultValue=""
                        >
                          <option value="" disabled>
                            Select Student...
                          </option>
                          {unassignedStudents.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name} ({s.userId})
                            </option>
                          ))}
                        </select>
                        <Button
                          className="!py-1 !px-3 text-xs"
                          onClick={() => {
                            const select = document.getElementById(
                              `select-${room.id}`
                            ) as HTMLSelectElement;
                            if (select.value)
                              handleAssign(room.id, select.value);
                          }}
                          disabled={!!assigning}
                        >
                          Assign
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* RIGHT: Stats / Info */}
            <div className="bg-blue-50 p-4 rounded-xl h-fit">
              <h3 className="font-bold text-blue-900 mb-2">Fee Impact Info</h3>
              <p className="text-xs text-blue-800 mb-4">
                Assigning a student to a room will automatically calculate the
                hostel fee for the remaining months of the academic session and
                add it to their pending dues.
              </p>
              <div className="text-xs space-y-2">
                <p>
                  <strong>Session Ends:</strong> March
                </p>
                <p>
                  <strong>Current Month:</strong>{" "}
                  {new Date().toLocaleString("default", { month: "long" })}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 pt-4 border-t text-right">
          <Button onClick={onClose}>Done</Button>
        </div>
      </Card>
    </div>
  );
};

export default ManageHostelOccupantsModal;
