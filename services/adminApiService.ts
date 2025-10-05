// services/adminApiService.ts

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

// This is our single source of truth for API routing.
const getApiPrefix = (role: UserRole) => {
  return role === "SuperAdmin" ? "/superadmin" : "/admin";
};

// This helper ensures we always fetch fresh data, banishing the ghosts of the cache.
const get_config = (params = {}) => {
  return {
    params: {
      ...params,
      _cacheBust: new Date().getTime(),
    },
  };
};

export class AdminApiService {
  // --- Registration & Branch Management ---

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

  async getBranches(
    role: UserRole,
    status?: Branch["status"]
  ): Promise<Branch[]> {
    const params = status ? { status } : {};
    const { data } = await baseApi.get<Branch[]>(
      `${getApiPrefix(role)}/branches`,
      get_config(params)
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

  // --- Dashboard & Analytics ---

  async getAdminDashboardData(role: UserRole): Promise<AdminDashboardData> {
    const { data } = await baseApi.get<AdminDashboardData>(
      `${getApiPrefix(role)}/dashboard`,
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

  // --- User Management ---

  async getAllUsers(role: UserRole): Promise<User[]> {
    const { data } = await baseApi.get<User[]>(
      `${getApiPrefix(role)}/users`,
      get_config()
    );
    return data;
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

  // --- Communication ---

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

  // --- SuperAdmin / System Settings ---

  async getSystemSettings(role: UserRole): Promise<SystemSettings> {
    // The path is now true. The old way is forgotten.
   const { data } = await baseApi.get(
     `/superadmin/master-config`,
     get_config()
   );
    return data;
  }

  async updateSystemSettings(
    role: UserRole,
    settings: SystemSettings
  ): Promise<void> {
    // The path is now true. The old way is forgotten.
    await baseApi.put(`/superadmin/master-config`, settings);
  }

  async getErpPayments(role: UserRole): Promise<ErpPayment[]> {
    const { data } = await baseApi.get(
      `${getApiPrefix(role)}/erp-payments`,
      get_config()
    );
    return data;
  }

  async getSystemWideErpFinancials(
    role: UserRole
  ): Promise<SystemWideErpFinancials> {
    const { data } = await baseApi.get(
      `${getApiPrefix(role)}/erp-financials`,
      get_config()
    );
    return data;
  }

  async recordManualErpPayment(
    role: UserRole,
    branchId: string,
    paymentDetails: any,
    adminId: string
  ): Promise<void> {
    await baseApi.post(`${getApiPrefix(role)}/erp-payments/manual`, {
      branchId,
      ...paymentDetails,
      adminId,
    });
  }

  async getAuditLogs(role: UserRole): Promise<AuditLog[]> {
    const { data } = await baseApi.get(
      `${getApiPrefix(role)}/audit-logs`,
      get_config()
    );
    return data;
  }

  // --- Principal Queries ---

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
      { adminNotes, adminId }
    );
    return data;
  }
}
