// components/modals/ManageHostelOccupantsModal.tsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
// FIX: Correctly import the service class and create an instance.
import { RegistrarApiService } from "../../services/registrarApiService";
import type { Hostel, Room, Student } from "../../types";
import Card from "../ui/Card";
import Button from "../ui/Button";
import Input from "../ui/Input";

const apiService = new RegistrarApiService();

interface ManageHostelOccupantsModalProps {
  hostel: Hostel;
  onClose: () => void;
  branchId: string;
}

const ManageHostelOccupantsModal: React.FC<ManageHostelOccupantsModalProps> = ({
  hostel,
  onClose,
  branchId,
}) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  // Assignment state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [isActionLoading, setIsActionLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    // FIX: Removed branchId from API calls as the new service structure infers it.
    const [roomData, studentData] = await Promise.all([
      apiService.getRooms(hostel.id),
      apiService.getStudentsByBranch(branchId),
    ]);
    setRooms(roomData);
    setAllStudents(studentData);
    setLoading(false);
  }, [hostel.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const unassignedStudents = useMemo(
    () => allStudents.filter((s) => !s.roomId),
    [allStudents]
  );
  const availableRooms = useMemo(
    () => rooms.filter((r) => r.occupantIds.length < r.capacity),
    [rooms]
  );

  const searchResults = useMemo(() => {
    if (searchQuery.length < 2 || selectedStudent) return [];
    const lowercasedQuery = searchQuery.toLowerCase();
    return unassignedStudents
      .filter(
        (student) =>
          student.name.toLowerCase().includes(lowercasedQuery) ||
          student.id.toLowerCase().includes(lowercasedQuery)
      )
      .slice(0, 10);
  }, [searchQuery, unassignedStudents, selectedStudent]);

  const handleSelectStudent = (student: Student) => {
    setSelectedStudent(student);
    setSearchQuery(`${student.name} (${student.id})`);
  };

  const handleAssignStudent = async () => {
    if (!selectedStudent || !selectedRoomId) return;
    setIsActionLoading(true);
    await apiService.assignStudentToRoom(selectedStudent.id, selectedRoomId);
    setSelectedStudent(null);
    setSearchQuery("");
    await fetchData();
    setIsActionLoading(false);
  };

  const handleRemoveStudent = async (studentId: string) => {
    setIsActionLoading(true);
    await apiService.removeStudentFromRoom(studentId);
    await fetchData();
    setIsActionLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col">
        <h2 className="text-xl font-bold text-text-primary-dark mb-4">
          Manage Occupants for {hostel.name}
        </h2>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-grow overflow-hidden">
            <div className="bg-slate-50 p-4 rounded-lg flex flex-col">
              <h3 className="font-semibold mb-2">Assign Student</h3>
              <div className="space-y-4">
                <div className="relative">
                  <Input
                    label="Search Unassigned Student"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setSelectedStudent(null);
                    }}
                    placeholder="Start typing..."
                    autoComplete="off"
                  />
                  {searchResults.length > 0 && (
                    <ul className="absolute z-10 w-full bg-white border border-slate-300 rounded-md mt-1 shadow-lg max-h-40 overflow-y-auto">
                      {searchResults.map((student) => (
                        <li
                          key={student.id}
                          onClick={() => handleSelectStudent(student)}
                          className="px-4 py-2 hover:bg-slate-100 cursor-pointer text-sm"
                        >
                          {student.name} ({student.id})
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Assign to Room
                  </label>
                  <select
                    value={selectedRoomId}
                    onChange={(e) => setSelectedRoomId(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-md py-2 px-3"
                  >
                    <option value="">-- Select Available Room --</option>
                    {availableRooms.map((r) => (
                      <option key={r.id} value={r.id}>
                        Room {r.roomNumber} ({r.occupantIds.length}/{r.capacity}
                        )
                      </option>
                    ))}
                  </select>
                </div>
                <Button
                  onClick={handleAssignStudent}
                  disabled={
                    isActionLoading || !selectedStudent || !selectedRoomId
                  }
                >
                  {isActionLoading ? "Assigning..." : "Assign Student"}
                </Button>
              </div>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg flex flex-col">
              <h3 className="font-semibold mb-2">Room Occupancy</h3>
              <div className="overflow-y-auto flex-grow space-y-2 pr-2">
                {rooms.map((room) => (
                  <div key={room.id} className="bg-white p-2 rounded shadow-sm">
                    <p className="font-medium border-b pb-1 mb-1">
                      Room {room.roomNumber} ({room.occupantIds.length}/
                      {room.capacity})
                    </p>
                    {room.occupantIds.length > 0 ? (
                      room.occupantIds.map((studentId) => {
                        const student = allStudents.find(
                          (s) => s.id === studentId
                        );
                        return (
                          <div
                            key={studentId}
                            className="flex justify-between items-center text-sm py-1"
                          >
                            <span>{student?.name || "Unknown Student"}</span>
                            <Button
                              variant="danger"
                              className="!px-2 !py-1 text-xs"
                              onClick={() => handleRemoveStudent(studentId)}
                              disabled={isActionLoading}
                            >
                              Remove
                            </Button>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-xs text-slate-400 text-center">
                        Empty
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        <div className="flex justify-end gap-4 pt-4 mt-4 border-t border-slate-200">
          <Button type="button" onClick={onClose}>
            Done
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default ManageHostelOccupantsModal;
