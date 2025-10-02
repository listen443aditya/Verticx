import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../hooks/useAuth";
// FIX: Correctly import the service class and create an instance.
import { RegistrarApiService } from "../../services/registrarApiService";
import type { InventoryItem, InventoryLog } from "../../types";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import ConfirmationModal from "../../components/ui/ConfirmationModal";
import { useDataRefresh } from "../../contexts/DataRefreshContext";

const apiService = new RegistrarApiService();

// Item Form Modal
const ItemFormModal: React.FC<{
  item: Partial<InventoryItem> | null;
  onClose: () => void;
  onSave: (data: Partial<InventoryItem>, reason: string) => void;
}> = ({ item, onClose, onSave }) => {
  const [formData, setFormData] = useState<Partial<InventoryItem>>({
    name: "",
    category: "",
    quantity: 0,
    location: "",
    ...item,
  });
  const [reason, setReason] = useState(item?.id ? "" : "Initial stock");
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "quantity" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (item?.id && !reason) {
      alert("Please provide a reason for the change.");
      return;
    }
    setIsSaving(true);
    await onSave(formData, reason);
    setIsSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg">
        <h2 className="text-xl font-bold text-text-primary-dark mb-4">
          {item?.id ? "Edit Inventory Item" : "Add New Item"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Item Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
          <Input
            label="Category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
          />
          <Input
            label="Quantity"
            name="quantity"
            type="number"
            min="0"
            value={String(formData.quantity)}
            onChange={handleChange}
            required
          />
          <Input
            label="Location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            required
          />
          {item?.id && (
            <Input
              label="Reason for Change"
              name="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            />
          )}
          <div className="flex justify-end gap-4 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

// Log view modal
const LogModal: React.FC<{
  item: InventoryItem;
  logs: InventoryLog[];
  onClose: () => void;
}> = ({ item, logs, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl h-[70vh] flex flex-col">
        <h2 className="text-xl font-bold text-text-primary-dark mb-4">
          History for {item.name}
        </h2>
        <div className="overflow-y-auto flex-grow">
          <table className="w-full text-left">
            <thead className="border-b sticky top-0 bg-surface-dark">
              <tr>
                <th className="p-2">Date</th>
                <th className="p-2">User</th>
                <th className="p-2 text-center">Change</th>
                <th className="p-2">Reason</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b">
                  <td className="p-2 text-sm">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="p-2 text-sm">{log.user}</td>
                  <td
                    className={`p-2 text-center font-bold ${
                      log.change > 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {log.change > 0 ? `+${log.change}` : log.change}
                  </td>
                  <td className="p-2 text-sm">{log.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 text-right pt-4 border-t">
          <Button onClick={onClose}>Close</Button>
        </div>
      </Card>
    </div>
  );
};

const Inventory: React.FC = () => {
  const { user } = useAuth();
  const { refreshKey, triggerRefresh } = useDataRefresh();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [viewingLogsFor, setViewingLogsFor] = useState<InventoryItem | null>(
    null
  );
  const [deletingItem, setDeletingItem] = useState<InventoryItem | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    // FIX: Removed branchId from API calls.
    const [itemData, logData] = await Promise.all([
      apiService.getInventory(),
      apiService.getInventoryLogs(),
    ]);
    setItems(itemData);
    setLogs(logData);
    setLoading(false);
  }, [user, refreshKey]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async (data: Partial<InventoryItem>, reason: string) => {
    if (!user) return;
    setIsActionLoading(true);
    if (data.id) {
      // FIX: Removed user.name from the call.
      await apiService.updateInventoryItem(data.id, data, reason);
    } else {
      // FIX: Removed user.name and user.branchId from the call.
      await apiService.createInventoryItem(data, reason);
    }
    setIsActionLoading(false);
    setModal(null);
    setSelectedItem(null);
    triggerRefresh();
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    setIsActionLoading(true);
    await apiService.deleteInventoryItem(deletingItem.id);
    setIsActionLoading(false);
    setDeletingItem(null);
    triggerRefresh();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-text-primary-dark">
          Inventory Management
        </h1>
        <Button onClick={() => setModal("add")}>Add New Item</Button>
      </div>
      <Card>
        {loading ? (
          <p>Loading inventory...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b">
                <tr>
                  <th className="p-4">Item Name</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Location</th>
                  <th className="p-4 text-center">Quantity</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-slate-50">
                    <td className="p-4 font-medium">{item.name}</td>
                    <td className="p-4">{item.category}</td>
                    <td className="p-4">{item.location}</td>
                    <td className="p-4 text-center font-semibold text-xl">
                      {item.quantity}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="secondary"
                          onClick={() => setViewingLogsFor(item)}
                        >
                          Logs
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setSelectedItem(item);
                            setModal("edit");
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() => setDeletingItem(item)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {(modal === "add" || (modal === "edit" && selectedItem)) && (
        <ItemFormModal
          item={selectedItem}
          onClose={() => {
            setModal(null);
            setSelectedItem(null);
          }}
          onSave={handleSave}
        />
      )}

      {viewingLogsFor && (
        <LogModal
          item={viewingLogsFor}
          logs={logs
            .filter((l) => l.itemId === viewingLogsFor.id)
            .sort(
              (a, b) =>
                new Date(b.timestamp).getTime() -
                new Date(a.timestamp).getTime()
            )}
          onClose={() => setViewingLogsFor(null)}
        />
      )}

      {deletingItem && (
        <ConfirmationModal
          isOpen={!!deletingItem}
          onClose={() => setDeletingItem(null)}
          onConfirm={handleDelete}
          title="Confirm Item Deletion"
          message={
            <>
              Are you sure you want to delete{" "}
              <strong>{deletingItem.name}</strong> from inventory? All
              associated logs will also be removed.
            </>
          }
          isConfirming={isActionLoading}
        />
      )}
    </div>
  );
};

export default Inventory;
