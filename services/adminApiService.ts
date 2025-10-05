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
  AuditLog,
  PrincipalQuery,
  UserRole,
} from "../types";

// Helper function to get the correct API prefix based on role
const getApiPrefix = (role: UserRole) => {
  return role === "SuperAdmin" ? "/superadmin" : "/admin";
};

// FIX: Helper to add a cache-busting parameter to all GET requests.
// This prevents the browser from showing stale data (304 Not Modified).
const get_config = (params = {}) => {
  return {
    params: {
      ...params,
      _cacheBust: new Date().getTime(),
    },
  };
};

export class AdminApiService {
  async getRegistrationRequests(
    role: UserRole
  ): Promise<RegistrationRequest[]> {
    const { data } = await baseApi.get(
      `${getApiPrefix(role)}/registration-requests`,
      get_config()
    );
    return data;
  }

  async approveRequest(
    role: UserRole,
    requestId: string
  ): Promise<{
    message: string;
    credentials: { email: string; password: string };
  }> {
    const { data } = await baseApi.post(
      `${getApiPrefix(role)}/registration-requests/${requestId}/approve`
    );
    return data;
  }

  async denyRequest(role: UserRole, requestId: string): Promise<void> {
    await baseApi.post(
      `${getApiPrefix(role)}/registration-requests/${requestId}/deny`
    );
  }

  async getBranches(role: UserRole, status?: "active"): Promise<Branch[]> {
    const params = status ? { status } : {};
    const { data } = await baseApi.get<Branch[]>(
      `${getApiPrefix(role)}/branches`,
      get_config(params)
    );
    return data;
  }

  async getAdminDashboardData(role: UserRole): Promise<AdminDashboardData> {
    const endpoint =
      role === "SuperAdmin" ? "/superadmin/dashboard" : "/admin/dashboard";
    const { data } = await baseApi.get<AdminDashboardData>(
      endpoint,
      get_config()
    );
    return data;
  }

  async updateBranchStatus(
    role: UserRole,
    branchId: string,
    status: Branch["status"]
  ): Promise<void> {
    await baseApi.patch(`${getApiPrefix(role)}/branches/${branchId}/status`, {
      status,
    });
  }

  async deleteBranch(role: UserRole, branchId: string): Promise<void> {
    await baseApi.delete(`${getApiPrefix(role)}/branches/${branchId}`);
  }

  async getAllUsers(role: UserRole): Promise<User[]> {
    const { data } = await baseApi.get<User[]>(
      `${getApiPrefix(role)}/users`,
      get_config()
    );
    return data;
  }

  async getSystemWideFinancials(
    role: UserRole,
    startDate?: string,
    endDate?: string
  ): Promise<SystemWideFinancials> {
    const { data } = await baseApi.get<SystemWideFinancials>(
      `${getApiPrefix(role)}/financials`,
      get_config({ startDate, endDate })
    );
    return data;
  }

  async getSystemWideAnalytics(role: UserRole): Promise<SystemWideAnalytics> {
    const { data } = await baseApi.get<SystemWideAnalytics>(
      `${getApiPrefix(role)}/analytics`,
      get_config()
    );
    return data;
  }

  async getSystemWideInfrastructureData(
    role: UserRole
  ): Promise<SystemInfrastructureData> {
    const { data } = await baseApi.get<SystemInfrastructureData>(
      `${getApiPrefix(role)}/infrastructure`,
      get_config()
    );
    return data;
  }

  async getAdminCommunicationHistory(role: UserRole): Promise<{
    sms: AdminSms[];
    email: AdminEmail[];
    notification: AdminNotification[];
  }> {
    const { data } = await baseApi.get(
      `${getApiPrefix(role)}/communication-history`,
      get_config()
    );
    return data;
  }

  async sendBulkSms(
    role: UserRole,
    target: CommunicationTarget,
    message: string,
    sentBy: string
  ): Promise<void> {
    await baseApi.post(`${getApiPrefix(role)}/send-sms`, {
      target,
      message,
      sentBy,
    });
  }

  async sendBulkEmail(
    role: UserRole,
    target: CommunicationTarget,
    subject: string,
    body: string,
    sentBy: string
  ): Promise<void> {
    await baseApi.post(`${getApiPrefix(role)}/send-email`, {
      target,
      subject,
      body,
      sentBy,
    });
  }

  async sendBulkNotification(
    role: UserRole,
    target: CommunicationTarget,
    title: string,
    message: string,
    sentBy: string
  ): Promise<void> {
    await baseApi.post(`${getApiPrefix(role)}/send-notification`, {
      target,
      title,
      message,
      sentBy,
    });
  }

  async getSchoolDetails(
    role: UserRole,
    branchId: string
  ): Promise<SchoolDetails> {
    const { data } = await baseApi.get(
      `${getApiPrefix(role)}/branches/${branchId}/details`,
      get_config()
    );
    return data;
  }

  async getSystemSettings(): Promise<SystemSettings> {
    const { data } = await baseApi.get(
      "/superadmin/system-settings",
      get_config()
    );
    return data;
  }

  async updateSystemSettings(settings: SystemSettings): Promise<void> {
    await baseApi.put("/superadmin/system-settings", settings);
  }

  async resetUserPassword(
    role: UserRole,
    userId: string
  ): Promise<{ newPassword: string }> {
    const { data } = await baseApi.post(
      `${getApiPrefix(role)}/users/${userId}/reset-password`
    );
    return data;
  }

  async updateBranchDetails(
    role: UserRole,
    branchId: string,
    updates: Partial<Branch>
  ): Promise<void> {
    await baseApi.patch(
      `${getApiPrefix(role)}/branches/${branchId}/details`,
      updates
    );
  }

  async getErpPayments(): Promise<ErpPayment[]> {
    const { data } = await baseApi.get(
      "/superadmin/erp-payments",
      get_config()
    );
    return data;
  }

  async getSystemWideErpFinancials(): Promise<SystemWideErpFinancials> {
    const { data } = await baseApi.get(
      "/superadmin/erp-financials",
      get_config()
    );
    return data;
  }

  async getAuditLogs(): Promise<AuditLog[]> {
    const { data } = await baseApi.get("/superadmin/audit-logs", get_config());
    return data;
  }

  async getPrincipalQueries(
    role: UserRole,
    status?: "Open" | "Resolved"
  ): Promise<PrincipalQuery[]> {
    const params = status ? { status } : {};
    const { data } = await baseApi.get(
      `${getApiPrefix(role)}/principal-queries`,
      get_config(params)
    );
    return data;
  }

  async resolvePrincipalQuery(
    role: UserRole,
    queryId: string,
    adminNotes: string,
    adminId: string
  ): Promise<PrincipalQuery> {
    const { data } = await baseApi.post(
      `${getApiPrefix(role)}/principal-queries/${queryId}/resolve`,
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
    await baseApi.post(`/superadmin/erp-payments/manual`, {
      branchId,
      ...paymentDetails,
      adminId,
    });
  }
}
