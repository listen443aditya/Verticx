// services/adminApiService.ts

// ✅ STEP 1: Import the configured baseApi client and necessary types.
//    All dependencies on the local 'database.ts' have been removed.
import baseApi from "./baseApiService";
import type {
  User,
  Branch,
  RegistrationRequest,
  AdminDashboardData,
  SystemWideFinancials,
  SystemWideAnalytics,
  SystemInfrastructureData,
  AdminSms,
  AdminEmail,
  AdminNotification,
  CommunicationTarget,
  SystemSettings,
  SchoolDetails,
  ErpPayment,
  SystemWideErpFinancials,
  SchoolFinancialDetails,
  AuditLog,
  PrincipalQuery,
} from "../types";

// ✅ STEP 2: Refactor the class. Every method now makes a direct, asynchronous API call.
//    All complex logic, calculations, and data filtering now happen on the backend.
export class AdminApiService {
  async getRegistrationRequests(): Promise<RegistrationRequest[]> {
    const { data } = await baseApi.get("/admin/requests/registration");
    return data;
  }

  async approveRequest(requestId: string): Promise<void> {
    // The backend now handles user creation, branch creation, and sending credentials.
    await baseApi.put(`/admin/requests/registration/${requestId}/approve`);
  }

  async denyRequest(requestId: string): Promise<void> {
    await baseApi.put(`/admin/requests/registration/${requestId}/deny`);
  }

  async getBranches(status?: "active"): Promise<Branch[]> {
    // All complex stat calculations (health score, etc.) are now done by the backend.
    const { data } = await baseApi.get<Branch[]>("/admin/branches", {
      params: status ? { status } : {},
    });
    return data;
  }

  async getAdminDashboardData(): Promise<AdminDashboardData> {
    // The backend aggregates all dashboard data into a single, efficient call.
    const { data } = await baseApi.get<AdminDashboardData>("/admin/dashboard");
    return data;
  }

  async updateBranchStatus(
    branchId: string,
    status: Branch["status"]
  ): Promise<void> {
    await baseApi.put(`/admin/branches/${branchId}/status`, { status });
  }

  async deleteBranch(branchId: string): Promise<void> {
    // The backend handles the cascading deletion of all associated data.
    await baseApi.delete(`/admin/branches/${branchId}`);
  }

  async getAllUsers(): Promise<User[]> {
    const { data } = await baseApi.get<User[]>("/admin/users");
    return data;
  }

  async getSystemWideFinancials(
    startDate?: string,
    endDate?: string
  ): Promise<SystemWideFinancials> {
    const { data } = await baseApi.get<SystemWideFinancials>(
      "/admin/finance/system-wide",
      {
        params: { startDate, endDate },
      }
    );
    return data;
  }

  async getSystemWideAnalytics(): Promise<SystemWideAnalytics> {
    const { data } = await baseApi.get<SystemWideAnalytics>("/admin/analytics");
    return data;
  }

  async getSystemWideInfrastructureData(): Promise<SystemInfrastructureData> {
    const { data } = await baseApi.get<SystemInfrastructureData>(
      "/admin/infrastructure"
    );
    return data;
  }

  async getAdminCommunicationHistory(): Promise<{
    sms: AdminSms[];
    email: AdminEmail[];
    notification: AdminNotification[];
  }> {
    const { data } = await baseApi.get("/admin/communication/history");
    return data;
  }

  async sendBulkSms(
    target: CommunicationTarget,
    message: string,
    sentBy: string
  ): Promise<void> {
    await baseApi.post("/admin/communication/sms", {
      target,
      message,
      sentBy,
    });
  }

  async sendBulkEmail(
    target: CommunicationTarget,
    subject: string,
    body: string,
    sentBy: string
  ): Promise<void> {
    await baseApi.post("/admin/communication/email", {
      target,
      subject,
      body,
      sentBy,
    });
  }

  async sendBulkNotification(
    target: CommunicationTarget,
    title: string,
    message: string,
    sentBy: string
  ): Promise<void> {
    await baseApi.post("/admin/communication/notification", {
      target,
      title,
      message,
      sentBy,
    });
  }

  async getSchoolDetails(branchId: string): Promise<SchoolDetails> {
    const { data } = await baseApi.get(`/admin/schools/${branchId}`);
    return data;
  }

  async getSystemSettings(): Promise<SystemSettings> {
    const { data } = await baseApi.get("/admin/system/settings");
    return data;
  }

  async updateSystemSettings(settings: SystemSettings): Promise<void> {
    // Backend now handles propagating global settings to all branches.
    await baseApi.put("/admin/system/settings", settings);
  }

  async resetUserPassword(userId: string): Promise<{ newPassword: string }> {
    const { data } = await baseApi.post(
      `/admin/users/${userId}/reset-password`
    );
    return data;
  }

  async updateBranchDetails(
    branchId: string,
    updates: Partial<Branch>
  ): Promise<void> {
    await baseApi.put(`/admin/branches/${branchId}`, updates);
  }

  async getErpPayments(): Promise<ErpPayment[]> {
    const { data } = await baseApi.get("/admin/finance/erp-billing");
    return data;
  }

  async getSystemWideErpFinancials(): Promise<SystemWideErpFinancials> {
    const { data } = await baseApi.get("/admin/finance/system-wide-erp");
    return data;
  }

  async getSchoolFinancialDetails(
    branchId: string
  ): Promise<SchoolFinancialDetails> {
    const { data } = await baseApi.get(`/admin/finance/school/${branchId}`);
    return data;
  }

  async getAuditLogs(): Promise<AuditLog[]> {
    const { data } = await baseApi.get("/admin/audit-logs");
    return data;
  }

  async getPrincipalQueries(
    status?: "Open" | "Resolved"
  ): Promise<PrincipalQuery[]> {
    const { data } = await baseApi.get("/admin/queries/principal", {
      params: { status },
    });
    return data;
  }

  async resolvePrincipalQuery(
    queryId: string,
    adminNotes: string,
    adminId: string
  ): Promise<PrincipalQuery> {
    const { data } = await baseApi.put(
      `/admin/queries/principal/${queryId}/resolve`,
      {
        adminNotes,
        adminId,
      }
    );
    return data;
  }

  async recordManualErpPayment(
    branchId: string,
    paymentDetails: {
      amount: number;
      paymentDate: string;
      notes: string;
      periodEndDate: string;
    },
    adminId: string
  ): Promise<void> {
    await baseApi.post(`/admin/finance/erp-billing/${branchId}/manual`, {
      ...paymentDetails,
      adminId,
    });
  }
}
