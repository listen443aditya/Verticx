import React, { useEffect, useState, useCallback, useMemo } from "react";
import { AdminApiService } from "../../services";
import type { SystemInfrastructureData } from "../../types.ts";
import Card from "../../components/ui/Card.tsx";
import Input from "../../components/ui/Input.tsx";
import { BusIcon, HostelIcon } from "../../components/icons/Icons.tsx";
import { useAuth } from "../../hooks/useAuth.ts"; // FIX: Import the useAuth hook

const adminApiService = new AdminApiService();

const ProgressBar: React.FC<{
  value: number;
  total: number;
  colorClass: string;
}> = ({ value, total, colorClass }) => {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="w-full bg-slate-200 rounded-full h-2.5">
      <div
        className={`${colorClass} h-2.5 rounded-full`}
        style={{ width: `${percentage}%` }}
      ></div>
    </div>
  );
};

const InfrastructureStatCard: React.FC<{
  title: string;
  occupied: number;
  capacity: number;
  icon: React.ReactNode;
}> = ({ title, occupied, capacity, icon }) => (
  <Card className="flex items-center p-4">
    <div className="p-4 mr-4 text-brand-secondary bg-brand-primary/10 rounded-full">
      {icon}
    </div>
    <div className="flex-grow">
      <p className="text-lg font-semibold text-text-secondary-dark">{title}</p>
      <p className="text-3xl font-bold text-text-primary-dark">
        {occupied.toLocaleString()} /{" "}
        <span className="text-2xl text-text-secondary-dark">
          {capacity.toLocaleString()}
        </span>
      </p>
      <ProgressBar
        value={occupied}
        total={capacity}
        colorClass="bg-brand-secondary"
      />
    </div>
  </Card>
);

const InfrastructureOversight: React.FC = () => {
  const { user } = useAuth(); // FIX: Get the authenticated user
  const [infraData, setInfraData] = useState<SystemInfrastructureData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "transport" | "hostel">("name");

  const fetchData = useCallback(async () => {
    if (!user) return; // FIX: Add a guard clause to wait for the user object
    setLoading(true);
    try {
      // FIX: Pass the user's role to the API call
      const data = await adminApiService.getSystemWideInfrastructureData(
        user.role
      );
      setInfraData(data);
    } catch (error) {
      console.error("Failed to fetch infrastructure data:", error);
    } finally {
      setLoading(false);
    }
  }, [user]); // FIX: Add user to the dependency array

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredAndSortedBranches = useMemo(() => {
    if (!infraData) return [];

    let branches = [...infraData.branches].filter(
      (branch) =>
        branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        branch.location.toLowerCase().includes(searchTerm.toLowerCase())
    );

    branches.sort((a, b) => {
      if (sortBy === "transport") {
        const occupancyA =
          a.transportCapacity > 0
            ? a.transportOccupancy / a.transportCapacity
            : 0;
        const occupancyB =
          b.transportCapacity > 0
            ? b.transportOccupancy / b.transportCapacity
            : 0;
        return occupancyB - occupancyA;
      }
      if (sortBy === "hostel") {
        const occupancyA =
          a.hostelCapacity > 0 ? a.hostelOccupancy / a.hostelCapacity : 0;
        const occupancyB =
          b.hostelCapacity > 0 ? b.hostelOccupancy / b.hostelCapacity : 0;
        return occupancyB - occupancyA;
      }
      return a.name.localeCompare(b.name);
    });

    return branches;
  }, [infraData, searchTerm, sortBy]);

  if (loading) {
    return (
      <Card>
        <p className="p-8 text-center">Loading infrastructure data...</p>
      </Card>
    );
  }

  if (!infraData) {
    return (
      <Card>
        <p className="p-8 text-center text-red-500">
          Failed to load infrastructure data.
        </p>
      </Card>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-text-primary-dark mb-6">
        Infrastructure Oversight
      </h1>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InfrastructureStatCard
            title="System-Wide Transport Occupancy"
            occupied={infraData.summary.totalTransportOccupancy}
            capacity={infraData.summary.totalTransportCapacity}
            icon={<BusIcon className="w-8 h-8" />}
          />
          <InfrastructureStatCard
            title="System-Wide Hostel Occupancy"
            occupied={infraData.summary.totalHostelOccupancy}
            capacity={infraData.summary.totalHostelCapacity}
            icon={<HostelIcon className="w-8 h-8" />}
          />
        </div>

        <Card>
          <div className="flex justify-between items-center mb-4">
            <Input
              placeholder="Search by school name or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-1/2"
            />
            <div>
              <label className="text-sm mr-2">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-white border border-slate-300 rounded-md py-2 px-3"
              >
                <option value="name">Name</option>
                <option value="transport">Transport Occupancy</option>
                <option value="hostel">Hostel Occupancy</option>
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b">
                <tr>
                  <th className="p-4">School</th>
                  <th className="p-4">Transport</th>
                  <th className="p-4">Hostel</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedBranches.map((branch) => (
                  <tr key={branch.id} className="border-b">
                    <td className="p-4">
                      <p className="font-semibold">{branch.name}</p>
                      <p className="text-sm text-text-secondary-dark">
                        {branch.location}
                      </p>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Occupancy</span>
                        <span>
                          {branch.transportOccupancy} /{" "}
                          {branch.transportCapacity}
                        </span>
                      </div>
                      <ProgressBar
                        value={branch.transportOccupancy}
                        total={branch.transportCapacity}
                        colorClass="bg-brand-secondary"
                      />
                    </td>
                    <td className="p-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Occupancy</span>
                        <span>
                          {branch.hostelOccupancy} / {branch.hostelCapacity}
                        </span>
                      </div>
                      <ProgressBar
                        value={branch.hostelOccupancy}
                        total={branch.hostelCapacity}
                        colorClass="bg-brand-primary"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};
export default InfrastructureOversight;
