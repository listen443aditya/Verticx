// import React, { useState, useEffect, useCallback, useMemo } from "react";
// import { useAuth } from "../../hooks/useAuth.ts";
// import { PrincipalApiService } from "../../services";
// import type { PayrollStaffDetails } from "../../types.ts";
// import Card from "../../components/ui/Card.tsx";
// import Button from "../../components/ui/Button.tsx";
// import Input from "../../components/ui/Input.tsx";
// import { useDataRefresh } from "../../contexts/DataRefreshContext.tsx";
// import ConfirmationModal from "../../components/ui/ConfirmationModal.tsx";
// import SalaryAdjustmentModal from "../../components/modals/SalaryAdjustmentModal.tsx";

// const principalApiService = new PrincipalApiService();

// const PayrollManagement: React.FC = () => {
//   const { user } = useAuth();
//   const { refreshKey, triggerRefresh } = useDataRefresh();
//   const [payrollData, setPayrollData] = useState<PayrollStaffDetails[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [selectedMonth, setSelectedMonth] = useState(
//     new Date().toISOString().slice(0, 7)
//   ); // YYYY-MM format

//   const [selectedStaffIds, setSelectedStaffIds] = useState<Set<string>>(
//     new Set()
//   );
//   const [adjustingStaff, setAdjustingStaff] =
//     useState<PayrollStaffDetails | null>(null);
//   const [confirmingPayment, setConfirmingPayment] = useState<
//     PayrollStaffDetails[]
//   >([]);
//   const [isProcessing, setIsProcessing] = useState(false);

//   const monthString = useMemo(() => {
//     if (!selectedMonth) return "";
//     const [year, month] = selectedMonth.split("-");
//     const date = new Date(Number(year), Number(month) - 1);
//     return date.toLocaleString("default", { month: "long", year: "numeric" });
//   }, [selectedMonth]);

//   const fetchData = useCallback(async () => {
//     if (!user) return; // We only need to know a user is logged in.
//     setLoading(true);
//     // The branchId is no longer sent. The backend infers it from the user's token.
//     const data = await principalApiService.getStaffPayrollForMonth(
//       selectedMonth
//     );
//     setPayrollData(data);
//     setLoading(false);
//   }, [user, selectedMonth, refreshKey]);

//   useEffect(() => {
//     fetchData();
//   }, [fetchData]);

//   const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (e.target.checked) {
//       const pendingIds = payrollData
//         .filter((p) => p.status === "Pending")
//         .map((p) => p.staffId);
//       setSelectedStaffIds(new Set(pendingIds));
//     } else {
//       setSelectedStaffIds(new Set());
//     }
//   };

//   const handleSelectOne = (staffId: string) => {
//     setSelectedStaffIds((prev) => {
//       const newSet = new Set(prev);
//       if (newSet.has(staffId)) {
//         newSet.delete(staffId);
//       } else {
//         newSet.add(staffId);
//       }
//       return newSet;
//     });
//   };

//   const handleProcessPayment = async () => {
//     if (!user || confirmingPayment.length === 0) return;
//     setIsProcessing(true);
//     // The user's name is also inferred by the backend. We only send the essential data.
//     await principalApiService.processPayroll(confirmingPayment);
//     setIsProcessing(false);
//     setConfirmingPayment([]);
//     setSelectedStaffIds(new Set());
//     triggerRefresh();
//   };

//   const handleGenerateReport = () => {
//     alert(`Generating payroll report for ${monthString}... (mock action)`);
//     console.log("Payroll Data:", payrollData);
//   };

//   const isAllSelected =
//     payrollData.filter((p) => p.status === "Pending").length > 0 &&
//     selectedStaffIds.size ===
//       payrollData.filter((p) => p.status === "Pending").length;

//   return (
//     <div>
//       <div className="flex justify-between items-center mb-6">
//         <div>
//           <h1 className="text-3xl font-bold text-text-primary-dark mb-1">
//             Staff Payroll
//           </h1>
//           <p className="text-text-secondary-dark">
//             Payroll calculation for {monthString}
//           </p>
//         </div>
//         <div className="w-48">
//           <Input
//             label="Select Month"
//             type="month"
//             value={selectedMonth}
//             onChange={(e) => setSelectedMonth(e.target.value)}
//           />
//         </div>
//       </div>

//       <Card>
//         <div className="flex justify-between items-center mb-4">
//           <div className="flex items-center gap-4">
//             <Button
//               onClick={() => {
//                 const toPay = payrollData.filter((p) =>
//                   selectedStaffIds.has(p.staffId)
//                 );
//                 setConfirmingPayment(toPay);
//               }}
//               disabled={selectedStaffIds.size === 0}
//             >
//               Mark {selectedStaffIds.size} Selected as Paid
//             </Button>
//           </div>
//           <Button variant="secondary" onClick={handleGenerateReport}>
//             Generate Report
//           </Button>
//         </div>

//         {loading ? (
//           <p>Calculating payroll...</p>
//         ) : (
//           <div className="overflow-x-auto">
//             <table className="w-full text-left">
//               <thead className="border-b">
//                 <tr>
//                   <th className="p-2">
//                     <input
//                       type="checkbox"
//                       checked={isAllSelected}
//                       onChange={handleSelectAll}
//                     />
//                   </th>
//                   <th className="p-2">Staff Member</th>
//                   <th className="p-2 text-right">Base Salary</th>
//                   <th className="p-2 text-right">Unpaid Leaves</th>
//                   <th className="p-2 text-right">Leave Deductions</th>
//                   <th className="p-2 text-right">Adjustments</th>
//                   <th className="p-2 text-right">Net Payable</th>
//                   <th className="p-2 text-center">Status</th>
//                   <th className="p-2"></th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {payrollData.map((staff) => (
//                   <tr key={staff.staffId} className="border-b">
//                     <td className="p-2">
//                       {staff.status === "Pending" && (
//                         <input
//                           type="checkbox"
//                           checked={selectedStaffIds.has(staff.staffId)}
//                           onChange={() => handleSelectOne(staff.staffId)}
//                         />
//                       )}
//                     </td>
//                     <td className="p-2 font-medium">
//                       {staff.staffName}{" "}
//                       <span className="text-xs text-slate-500">
//                         ({staff.staffRole})
//                       </span>
//                     </td>
//                     <td className="p-2 text-right">
//                       {staff.baseSalary !== null
//                         ? `₹${staff.baseSalary.toLocaleString()}`
//                         : "N/A"}
//                     </td>
//                     <td className="p-2 text-right text-orange-600">
//                       {staff.unpaidLeaveDays}
//                     </td>
//                     <td className="p-2 text-right text-red-600">
//                       {staff.leaveDeductions !== null
//                         ? `-₹${staff.leaveDeductions.toLocaleString()}`
//                         : "N/A"}
//                     </td>
//                     <td className="p-2 text-right text-blue-600">
//                       ₹{staff.manualAdjustmentsTotal.toLocaleString()}
//                     </td>
//                     <td className="p-2 text-right font-bold text-lg text-green-700">
//                       {staff.netPayable !== null
//                         ? `₹${staff.netPayable.toLocaleString()}`
//                         : "N/A"}
//                     </td>
//                     <td className="p-2 text-center">
//                       {staff.status === "Paid" ? (
//                         <span className="text-xs text-green-600">
//                           Paid on {new Date(staff.paidAt!).toLocaleDateString()}
//                         </span>
//                       ) : staff.status === "Salary Not Set" ? (
//                         <span className="text-xs text-red-600 font-semibold">
//                           Salary Not Set
//                         </span>
//                       ) : (
//                         <span className="text-xs text-yellow-600">Pending</span>
//                       )}
//                     </td>
//                     <td className="p-2 text-right">
//                       {staff.status === "Pending" && (
//                         <Button
//                           variant="secondary"
//                           className="!px-2 !py-1 text-xs"
//                           onClick={() => setAdjustingStaff(staff)}
//                         >
//                           Adjust
//                         </Button>
//                       )}
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         )}
//       </Card>

//       {adjustingStaff && (
//         <SalaryAdjustmentModal
//           staff={adjustingStaff}
//           month={selectedMonth}
//           onClose={() => setAdjustingStaff(null)}
//           onSave={() => {
//             setAdjustingStaff(null);
//             triggerRefresh();
//           }}
//         />
//       )}
//       {confirmingPayment.length > 0 && (
//         <ConfirmationModal
//           isOpen={true}
//           onClose={() => setConfirmingPayment([])}
//           onConfirm={handleProcessPayment}
//           isConfirming={isProcessing}
//           title={`Confirm Payment for ${confirmingPayment.length} Staff`}
//           message={
//             <div>
//               <p>
//                 You are about to mark the following salaries as paid for{" "}
//                 {monthString}. This will create a permanent financial record.
//               </p>
//               <ul className="text-sm list-disc pl-5 mt-2 max-h-40 overflow-y-auto">
//                 {confirmingPayment.map((p) => (
//                   <li key={p.staffId}>
//                     {p.staffName}:{" "}
//                     <strong>₹{p.netPayable?.toLocaleString() || "N/A"}</strong>
//                   </li>
//                 ))}
//               </ul>
//             </div>
//           }
//           confirmText="Confirm & Pay"
//           confirmVariant="primary"
//         />
//       )}
//     </div>
//   );
// };

// export default PayrollManagement;


import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../hooks/useAuth";
import { PrincipalApiService } from "../../services/principalApiService";
import type { User, PayrollRecord } from "../../types";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import { useDataRefresh } from "../../contexts/DataRefreshContext";

const apiService = new PrincipalApiService();

const PayrollManagement: React.FC = () => {
  const { user } = useAuth();
  const { refreshKey, triggerRefresh } = useDataRefresh();

  const [staffList, setStaffList] = useState<User[]>([]);
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Default to current month (YYYY-MM)
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.branchId) return;
      setLoading(true);
      try {
        // 1. Fetch ALL staff (to show rows for everyone)
        // 2. Fetch existing payroll records for the selected month
        const [staffData, payrollData] = await Promise.all([
          // Assuming getStaff returns User[]
          apiService.getStaff({ params: { branchId: user.branchId } }),
          apiService.getStaffPayrollForMonth(selectedMonth),
        ]);

        setStaffList(staffData);
        setPayrollRecords(payrollData);
      } catch (error) {
        console.error("Failed to load payroll data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, selectedMonth, refreshKey]);

  const handleProcessPayroll = async (staff: User) => {
    if (!user?.branchId) return;
    setProcessingId(staff.id);

    try {
      // Calculate defaults (this logic is simple; backend does the heavy lifting)
      const baseSalary = staff.salary || 0;
      // Real logic might fetch attendance deductions here
      const deductions = 0;
      const netPayable = baseSalary - deductions;

      const payload = {
        branchId: user.branchId,
        staffId: staff.id, // This is the User ID
        staffName: staff.name,
        staffRole: staff.role,
        month: selectedMonth,
        baseSalary,
        unpaidLeaveDays: 0, // You can fetch this from attendance stats if needed
        leaveDeductions: deductions,
        manualAdjustmentsTotal: 0,
        netPayable,
        status: "Paid",
      };

      await apiService.processPayroll(payload);
      triggerRefresh(); // Reload data to show "Paid" status
    } catch (error) {
      console.error("Failed to process payroll:", error);
      alert("Failed to process payroll.");
    } finally {
      setProcessingId(null);
    }
  };

  // Merge Staff List with Payroll Records
  const mergedData = useMemo(() => {
    return staffList.map((staffMember) => {
      // Find if this staff member already has a payroll record for this month
      const record = payrollRecords.find((p) => p.staffId === staffMember.id);

      return {
        ...staffMember,
        payrollStatus: record ? "Paid" : "Pending",
        payrollRecord: record,
      };
    });
  }, [staffList, payrollRecords]);

  return (
    <Card>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Staff Payroll</h2>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-text-secondary-dark">
            Select Month:
          </label>
          <Input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="!w-auto"
          />
        </div>
      </div>

      {loading ? (
        <p className="text-center py-8">Loading payroll data...</p>
      ) : mergedData.length === 0 ? (
        <p className="text-center py-8 text-text-secondary-dark">
          No staff members found in this branch.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b bg-slate-50">
              <tr>
                <th className="p-3 font-semibold text-sm text-text-secondary-dark">
                  Staff Name
                </th>
                <th className="p-3 font-semibold text-sm text-text-secondary-dark">
                  Role
                </th>
                <th className="p-3 font-semibold text-sm text-text-secondary-dark text-right">
                  Base Salary
                </th>
                <th className="p-3 font-semibold text-sm text-text-secondary-dark text-right">
                  Net Payable
                </th>
                <th className="p-3 font-semibold text-sm text-text-secondary-dark text-center">
                  Status
                </th>
                <th className="p-3 font-semibold text-sm text-text-secondary-dark text-right">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {mergedData.map((item) => {
                const isPaid = item.payrollStatus === "Paid";
                const record = item.payrollRecord;

                return (
                  <tr
                    key={item.id}
                    className="border-b hover:bg-slate-50 transition-colors"
                  >
                    <td className="p-3 font-medium text-text-primary-dark">
                      {item.name}
                    </td>
                    <td className="p-3 text-sm text-text-secondary-dark">
                      {item.role}
                    </td>
                    <td className="p-3 text-right text-sm font-mono">
                      {/* Show record salary if paid, otherwise user profile salary */}
                      ₹
                      {(
                        record?.baseSalary ??
                        item.salary ??
                        0
                      ).toLocaleString()}
                    </td>
                    <td className="p-3 text-right font-bold text-brand-primary">
                      {isPaid
                        ? `₹${(record?.netPayable || 0).toLocaleString()}`
                        : "—"}
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          isPaid
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {item.payrollStatus}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {isPaid ? (
                        <Button
                          variant="secondary"
                          className="!py-1 !px-3 text-xs"
                          disabled
                        >
                          View Slip
                        </Button>
                      ) : (
                        <Button
                          className="!py-1 !px-3 text-xs"
                          onClick={() => handleProcessPayroll(item)}
                          disabled={processingId === item.id || !item.salary}
                          title={
                            !item.salary
                              ? "Set salary in Faculty/Staff tab first"
                              : ""
                          }
                        >
                          {processingId === item.id
                            ? "Processing..."
                            : "Process Pay"}
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
};

export default PayrollManagement;