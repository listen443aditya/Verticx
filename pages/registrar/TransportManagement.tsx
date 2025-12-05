import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useAuth } from "../../hooks/useAuth";
// FIX: Correctly import the service class and create an instance.
import { RegistrarApiService } from "../../services/registrarApiService";
import type {
  TransportRoute,
  Student,
  Teacher,
  BusStop,
  User,
} from "../../types";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import ConfirmationModal from "../../components/ui/ConfirmationModal";
import { useDataRefresh } from "../../contexts/DataRefreshContext";

const apiService = new RegistrarApiService();

type Member = (Student | User) & { type: "Student" | "Teacher" };

// --- MODAL COMPONENTS ---

const ManageMembersModal: React.FC<{
  route: TransportRoute;
  onClose: () => void;
  onSave: () => void;
}> = ({ route, onClose, onSave }) => {
  const { user } = useAuth();

  // State for the detailed route data (which includes the member list)
  const [detailedRoute, setDetailedRoute] = useState<TransportRoute | null>(
    null
  );
  const [assignedMembers, setAssignedMembers] = useState<Member[]>([]);
  const [unassignedMembers, setUnassignedMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [selectedStopId, setSelectedStopId] = useState("");
  const [isActionLoading, setIsActionLoading] = useState(false);

const fetchData = useCallback(async () => {
  if (!user?.branchId) return;
  setLoading(true);
  try {
    const routeDetails = await apiService.getTransportRouteDetails(route.id);
    setDetailedRoute(routeDetails);
    const unassignedData: any = await apiService.getUnassignedMembers();
    const assigned = (routeDetails.assignedMembers as any[]).map((m) => ({
      id: m.memberId,
      name: m.name,
      type: m.type as "Student" | "Teacher",
      stopId: m.stopId,
    })) as (Member & { stopId?: string })[];
    const unassigned = Array.isArray(unassignedData)
      ? (unassignedData.map((m: any) => ({
          ...m,
          role: m.type === "Teacher" ? "Teacher" : undefined,
        })) as Member[])
      : []; 

    setAssignedMembers(assigned);
    setUnassignedMembers(unassigned);

    if (routeDetails.busStops.length > 0) {
      setSelectedStopId(routeDetails.busStops[0].id);
    }
  } catch (error) {
    console.error("Failed to fetch route details:", error);
  } finally {
    setLoading(false);
  }
}, [route.id, user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const searchResults = useMemo(() => {
    if (searchQuery.length < 2 || selectedMember) return [];
    const lowercasedQuery = searchQuery.toLowerCase();
    return unassignedMembers
      .filter(
        (member: Member) =>
          member.name.toLowerCase().includes(lowercasedQuery) ||
          member.id.toLowerCase().includes(lowercasedQuery)
      )
      .slice(0, 10);
  }, [searchQuery, unassignedMembers, selectedMember]);

  const handleAssignMember = async () => {
    if (!selectedMember || !selectedStopId) return;
    setIsActionLoading(true);
    await apiService.assignMemberToRoute(
      route.id,
      selectedMember.id,
      selectedMember.type,
      selectedStopId
    );
    setSelectedMember(null);
    setSearchQuery("");
    await fetchData(); // Refresh list
    setIsActionLoading(false);
  };

 const handleRemoveMember = async (member: Member) => {
   setIsActionLoading(true);
   // FIX: Pass both member.id AND member.type
   await apiService.removeMemberFromRoute(member.id, member.type);
   await fetchData(); // Refresh list
   setIsActionLoading(false);
 };

  const handleSelectMember = (member: Member) => {
    setSelectedMember(member);
    setSearchQuery(`${member.name} (${member.id})`);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col">
        <h2 className="text-xl font-bold text-text-primary-dark mb-4">
          Manage Members for {route.routeName}
        </h2>
        {loading ? (
          <p>Loading members...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-grow overflow-hidden">
            {/* LEFT: Assign New Member */}
            <div className="bg-slate-50 p-4 rounded-lg flex flex-col">
              <h3 className="font-semibold mb-2">Assign New Member</h3>
              <div className="space-y-4">
                <div className="relative">
                  <Input
                    label="Search Unassigned Member"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setSelectedMember(null);
                    }}
                    placeholder="Start typing name or ID..."
                    autoComplete="off"
                  />
                  {searchResults.length > 0 && (
                    <ul className="absolute z-10 w-full bg-white border border-slate-300 rounded-md mt-1 shadow-lg max-h-40 overflow-y-auto">
                      {searchResults.map((member) => (
                        <li
                          key={member.userId}
                          onClick={() => handleSelectMember(member)}
                          className="px-4 py-2 hover:bg-slate-100 cursor-pointer text-sm"
                        >
                          {member.name} ({member.userId} - {member.type})
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Assign to Stop
                  </label>
                  <select
                    value={selectedStopId}
                    onChange={(e) => setSelectedStopId(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-md py-2 px-3"
                  >
                    {detailedRoute?.busStops.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <Button
                  onClick={handleAssignMember}
                  disabled={
                    isActionLoading || !selectedMember || !selectedStopId
                  }
                >
                  {isActionLoading ? "Assigning..." : "Assign Member"}
                </Button>
              </div>
            </div>

            {/* RIGHT: Assigned Members List */}
            <div className="bg-slate-50 p-4 rounded-lg flex flex-col">
              <h3 className="font-semibold mb-2">
                Assigned Members ({assignedMembers.length}/{route.capacity})
              </h3>
              <div className="overflow-y-auto flex-grow space-y-2 pr-2">
                {assignedMembers.map((member: any) => {
                  // Find the stop name using the stopId attached to the member
                  const stopName =
                    detailedRoute?.busStops.find((s) => s.id === member.stopId)
                      ?.name || "Unknown Stop";

                  return (
                    <div
                      key={member.userId}
                      className="flex justify-between items-center bg-white p-2 rounded shadow-sm"
                    >
                      <div>
                        <p className="font-medium">
                          {member.name}{" "}
                          <span className="text-xs text-slate-500">
                            ({member.type})
                          </span>
                        </p>
                        <p className="text-xs text-slate-600">
                          Stop: {stopName}
                        </p>
                      </div>
                      <Button
                        variant="danger"
                        className="!px-2 !py-1 text-xs"
                        onClick={() => handleRemoveMember(member)}
                        disabled={isActionLoading}
                      >
                        Remove
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
        <div className="flex justify-end gap-4 pt-4 mt-4 border-t border-slate-200">
          <Button
            type="button"
            onClick={() => {
              onSave();
              onClose();
            }}
          >
            Done
          </Button>
        </div>
      </Card>
    </div>
  );
};
const RouteFormModal: React.FC<{
  routeToEdit: Partial<TransportRoute> | null;
  onClose: () => void;
  onSave: () => void;
  branchId: string;
}> = ({ routeToEdit, onClose, onSave, branchId }) => {
  const [formData, setFormData] = useState<Partial<TransportRoute>>({
    routeName: "",
    busNumber: "",
    driverName: "",
    driverNumber: "",
    conductorName: "",
    conductorNumber: "",
    capacity: 20,
    busStops: [],
    ...routeToEdit,
  });
  const [newStop, setNewStop] = useState({
    name: "",
    pickupTime: "07:00",
    dropTime: "16:00",
    charges: 50,
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "capacity" ? Number(value) : value,
    }));
  };

  const handleAddStop = () => {
    if (newStop.name && newStop.pickupTime && newStop.dropTime) {
      setFormData((prev) => ({
        ...prev,
        busStops: [
          ...(prev.busStops || []),
          { id: `new-${Date.now()}`, ...newStop },
        ],
      }));
      setNewStop({
        name: "",
        pickupTime: "07:00",
        dropTime: "16:00",
        charges: 500,
      });
    }
  };

  const handleRemoveStop = (stopId: string) => {
    setFormData((prev) => ({
      ...prev,
      busStops: prev.busStops?.filter((s) => s.id !== stopId),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    if (formData.id) {
      await apiService.updateTransportRoute(formData.id, formData);
    } else {
      await apiService.createTransportRoute({
        ...formData,
        branchId,
        assignedMembers: [],
      } as TransportRoute);
    }
    setIsSaving(false);
    onSave();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] flex flex-col">
        <h2 className="text-xl font-bold mb-4">
          {formData.id ? "Edit Transport Route" : "Create New Transport Route"}
        </h2>
        <form
          id="route-form"
          onSubmit={handleSubmit}
          className="flex-grow overflow-y-auto pr-2 space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Route Name"
              name="routeName"
              value={formData.routeName}
              onChange={handleChange}
              required
            />
            <Input
              label="Bus Number"
              name="busNumber"
              value={formData.busNumber}
              onChange={handleChange}
              required
            />
            <Input
              label="Driver Name"
              name="driverName"
              value={formData.driverName}
              onChange={handleChange}
              required
            />
            <Input
              label="Driver Number"
              name="driverNumber"
              value={formData.driverNumber}
              onChange={handleChange}
            />
            <Input
              label="Conductor Name"
              name="conductorName"
              value={formData.conductorName}
              onChange={handleChange}
            />
            <Input
              label="Conductor Number"
              name="conductorNumber"
              value={formData.conductorNumber}
              onChange={handleChange}
            />
            <Input
              label="Capacity"
              name="capacity"
              type="number"
              min="1"
              value={String(formData.capacity)}
              onChange={handleChange}
              required
            />
          </div>
          <div className="pt-4 border-t">
            <h3 className="text-lg font-semibold mb-2">Bus Stops</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {formData.busStops?.map((stop) => (
                <div
                  key={stop.id}
                  className="flex items-center gap-2 bg-slate-100 p-2 rounded"
                >
                  <p className="flex-grow">
                    {stop.name} (Pick: {stop.pickupTime}, Drop: {stop.dropTime},
                    Fee: {stop.charges})
                  </p>
                  <Button
                    type="button"
                    variant="danger"
                    className="!p-1 h-6 w-6"
                    onClick={() => handleRemoveStop(stop.id)}
                  >
                    &times;
                  </Button>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 items-end gap-2 pt-4 border-t mt-2">
              <Input
                label="Stop Name"
                value={newStop.name}
                onChange={(e) =>
                  setNewStop((s) => ({ ...s, name: e.target.value }))
                }
              />
              <Input
                label="Pickup Time"
                type="time"
                value={newStop.pickupTime}
                onChange={(e) =>
                  setNewStop((s) => ({ ...s, pickupTime: e.target.value }))
                }
              />
              <Input
                label="Drop Time"
                type="time"
                value={newStop.dropTime}
                onChange={(e) =>
                  setNewStop((s) => ({ ...s, dropTime: e.target.value }))
                }
              />
              <Input
                label="Charges"
                type="number"
                value={String(newStop.charges)}
                onChange={(e) =>
                  setNewStop((s) => ({ ...s, charges: Number(e.target.value) }))
                }
              />
            </div>
            <div className="text-right mt-2">
              <Button type="button" onClick={handleAddStop}>
                Add Stop
              </Button>
            </div>
          </div>
        </form>
        <div className="flex justify-end gap-4 mt-6 pt-4 border-t">
          <Button variant="secondary" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button form="route-form" type="submit" disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Route"}
          </Button>
        </div>
      </Card>
    </div>
  );
};

const TransportManagement: React.FC = () => {
  const { user } = useAuth();
  const { refreshKey, triggerRefresh } = useDataRefresh();
  const [routes, setRoutes] = useState<TransportRoute[]>([]);
  const [loading, setLoading] = useState(true);

  const [modal, setModal] = useState<
    "manage_members" | "edit" | "create" | null
  >(null);
  const [selectedRoute, setSelectedRoute] = useState<TransportRoute | null>(
    null
  );
  const [deletingRoute, setDeletingRoute] = useState<TransportRoute | null>(
    null
  );
  const [isActionLoading, setIsActionLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const routeData = await apiService.getTransportRoutes();
    setRoutes(routeData);
    setLoading(false);
  }, [user, refreshKey]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = () => {
    setModal(null);
    setSelectedRoute(null);
    triggerRefresh();
  };

  const handleDelete = async () => {
    if (!deletingRoute) return;
    setIsActionLoading(true);
    await apiService.deleteTransportRoute(deletingRoute.id);
    setIsActionLoading(false);
    setDeletingRoute(null);
    triggerRefresh();
  };

  if (loading) return <p>Loading transport data...</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-text-primary-dark">
          Transport Management
        </h1>
        <Button
          onClick={() => {
            setSelectedRoute(null);
            setModal("create");
          }}
        >
          Create New Route
        </Button>
      </div>

      {routes.length === 0 ? (
        <Card>
          <p className="text-center text-text-secondary-dark p-8">
            No transport routes have been created yet.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {routes.map((route) => (
            <Card key={route.id}>
              <div className="flex justify-between items-start mb-3">
                <h2 className="text-xl font-bold">{route.routeName}</h2>
                <p className="text-sm text-text-secondary-dark font-mono">
                  {route.busNumber}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <p>
                  <strong>Driver:</strong> {route.driverName} (
                  {route.driverNumber})
                </p>
                <p>
                  <strong>Conductor:</strong> {route.conductorName} (
                  {route.conductorNumber})
                </p>
              </div>

              <div className="mb-4">
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-sm font-medium text-text-secondary-dark">
                    Occupancy
                  </span>
                  <span className="font-semibold">
                    {route.assignedMembers.length} / {route.capacity}
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2.5">
                  <div
                    className="bg-brand-secondary h-2.5 rounded-full"
                    style={{
                      width: `${
                        (route.assignedMembers.length / route.capacity) * 100
                      }%`,
                    }}
                  ></div>
                </div>
              </div>

              <div>
                <h3 className="text-md font-semibold mb-2">
                  Bus Stops & Charges
                </h3>
                <div className="space-y-1 text-xs max-h-24 overflow-y-auto pr-1">
                  {route.busStops.map((stop) => (
                    <div
                      key={stop.id}
                      className="flex justify-between bg-slate-50 p-1.5 rounded"
                    >
                      <span>
                        {stop.name} (Pick: {stop.pickupTime}, Drop:{" "}
                        {stop.dropTime})
                      </span>
                      <span className="font-semibold">{stop.charges}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                <Button
                  variant="primary"
                  onClick={() => {
                    setSelectedRoute(route);
                    setModal("manage_members");
                  }}
                >
                  Manage Members
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSelectedRoute(route);
                    setModal("edit");
                  }}
                >
                  Edit
                </Button>
                <Button
                  variant="danger"
                  onClick={() => setDeletingRoute(route)}
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {(modal === "create" || (modal === "edit" && selectedRoute)) &&
        user?.branchId && (
          <RouteFormModal
            routeToEdit={selectedRoute}
            onClose={() => {
              setModal(null);
              setSelectedRoute(null);
            }}
            onSave={handleSave}
            branchId={user.branchId}
          />
        )}

      {modal === "manage_members" && selectedRoute && (
        <ManageMembersModal
          route={selectedRoute}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}

      {deletingRoute && (
        <ConfirmationModal
          isOpen={!!deletingRoute}
          onClose={() => setDeletingRoute(null)}
          onConfirm={handleDelete}
          title="Confirm Route Deletion"
          message={
            <>
              Are you sure you want to delete the route "
              <strong>{deletingRoute.routeName}</strong>"? All members will be
              unassigned from this route.
            </>
          }
          isConfirming={isActionLoading}
        />
      )}
    </div>
  );
};

export default TransportManagement;
