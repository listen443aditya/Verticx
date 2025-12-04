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
  const [rooms, setRooms] = useState<any[]>([]);
  const [unassignedStudents, setUnassignedStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState<string | null>(null);

  // New state to track selected student per room
  const [selectedStudents, setSelectedStudents] = useState<
    Record<string, string>
  >({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const roomsData = await apiService.getRooms(hostel.id);

      // Use the generic getStudents (which fetches for the branch)
      // or getStudentsForBranch if that's what you named it
      const allStudents = await apiService.getStudents();
      const unassigned = allStudents.filter((s: Student) => !s.roomId);

      setRooms(roomsData);
      setUnassignedStudents(unassigned);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [hostel.id]);

  const handleAssign = async (roomId: string) => {
    // Get the selected student ID from state
    const studentId = selectedStudents[roomId];
    if (!studentId) return;

    setAssigning(studentId);
    try {
      // FIX: Ensure order is (roomId, studentId) matching the service
      await apiService.assignStudentToRoom(roomId, studentId);

      // Clear selection for this room
      setSelectedStudents((prev) => ({ ...prev, [roomId]: "" }));
      await fetchData();
    } catch (error) {
      console.error("Assign failed:", error);
      alert("Failed to assign student.");
    } finally {
      setAssigning(null);
    }
  };

  const handleRemove = async (studentId: string) => {
    setAssigning(studentId);
    try {
      await apiService.removeStudentFromRoom(studentId);
      await fetchData();
    } catch (error) {
      console.error("Remove failed:", error);
    } finally {
      setAssigning(null);
    }
  };

  const onSelectChange = (roomId: string, val: string) => {
    setSelectedStudents((prev) => ({ ...prev, [roomId]: val }));
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
                      {room.occupantIds.map((occId: string) => (
                        <div
                          key={occId}
                          className="flex justify-between items-center bg-slate-50 p-2 rounded text-sm"
                        >
                          {/* Ideally we'd show the name here, but we only have ID from room object. 
                                    For now showing ID or "Occupant" */}
                          <span className="font-mono text-xs">{occId}</span>
                          <button
                            onClick={() => handleRemove(occId)}
                            className="text-red-500 hover:text-red-700 text-xs font-medium"
                            disabled={!!assigning}
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Assign Action */}
                    {!isFull && (
                      <div className="flex gap-2">
                        <select
                          className="w-full text-sm border-slate-300 rounded-md"
                          value={selectedStudents[room.id] || ""}
                          onChange={(e) =>
                            onSelectChange(room.id, e.target.value)
                          }
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
                          onClick={() => handleAssign(room.id)}
                          disabled={!!assigning || !selectedStudents[room.id]}
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
