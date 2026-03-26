// src/services/api.ts
import axios, { AxiosInstance } from 'axios';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Tenant {
  id: number;
  name: string;
  slug: string;
  clinic_type: string;
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  is_active: boolean;
  role: string;           // "admin" | "clinician" | "viewer"
  permissions: string[];  // ["view_clients", "create_clients", ...]
  tenant: Tenant;
  created_at: string;
}

export interface LoginResponse {
  user: AuthUser;
  token: string;
  token_type: 'Bearer';
}

export interface Address {
  line: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postal_code: string | null;
}

export interface EmergencyContact {
  name: string | null;
  phone: string | null;
  relationship: string | null;
}

export interface Client {
  id: number;
  full_name: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  date_of_birth: string | null;  // "YYYY-MM-DD"
  age: number | null;
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null;
  address: Address;
  emergency_contact: EmergencyContact;
  status: 'active' | 'inactive' | 'archived';
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

// ─── Template / Dynamic Form Types ───────────────────────────────────────────

export type FieldType = 'text' | 'number' | 'boolean' | 'select' | 'textarea' | 'date' | 'scale';

export interface FieldValidation {
  min?: number;
  max?: number;
  pattern?: string;
}

/**
 * One field definition inside template.schema.fields.
 * DynamicForm loops these to render inputs.
 */
export interface FormField {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: string[];           // For type === 'select'
  validation?: FieldValidation;
  placeholder?: string;
  help_text?: string;
}

export interface TemplateSchema {
  fields: FormField[];
}

export interface Template {
  id: number;
  name: string;
  key: string;
  version: number;
  description: string | null;
  schema: TemplateSchema;       // ← React renders this directly
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClinicalRecord {
  id: number;
  client_id: number;
  template_key: string;
  template_version: number;
  data: Record<string, unknown>;
  notes: string | null;
  status: 'draft' | 'submitted' | 'reviewed' | 'archived';
  recorded_at: string;
  created_by: { id: number; name: string } | null;
  reviewed_by: { id: number; name: string; reviewed_at: string } | null;
  created_at: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
  };
  links: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
}

// ─── Axios Instance ───────────────────────────────────────────────────────────

const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Attach Bearer token on every request
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-redirect to /login on 401
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const authApi = {
  /**
   * POST /api/auth/login
   * Usage: const { user, token } = await authApi.login(email, password);
   *        sessionStorage.setItem('auth_token', token);
   */
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const { data } = await api.post<LoginResponse>('/auth/login', { email, password });
    return data;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
    sessionStorage.removeItem('auth_token');
  },

  /**
   * GET /api/auth/user
   * Hydrate the user on page refresh without re-logging in.
   */
  getUser: async (): Promise<AuthUser> => {
    const { data } = await api.get<{ user: AuthUser }>('/auth/user');
    return data.user;
  },
};

// ─── Clients ──────────────────────────────────────────────────────────────────

export const clientsApi = {
  /** GET /api/clients?search=john&status=active&per_page=15 */
  list: async (params?: {
    search?: string;
    status?: string;
    page?: number;
    per_page?: number;
  }): Promise<PaginatedResponse<Client>> => {
    const { data } = await api.get<PaginatedResponse<Client>>('/clients', { params });
    return data;
  },

  /** GET /api/clients/{id} */
  get: async (id: number): Promise<Client> => {
    const { data } = await api.get<{ data: Client }>(`/clients/${id}`);
    return data.data;
  },

  /** POST /api/clients */
  create: async (payload: Partial<Client>): Promise<Client> => {
    const { data } = await api.post<{ data: Client }>('/clients', payload);
    return data.data;
  },

  /** PUT /api/clients/{id} */
  update: async (id: number, payload: Partial<Client>): Promise<Client> => {
    const { data } = await api.put<{ data: Client }>(`/clients/${id}`, payload);
    return data.data;
  },

  /** DELETE /api/clients/{id} */
  delete: async (id: number): Promise<void> => {
    await api.delete(`/clients/${id}`);
  },
};

// ─── Templates ────────────────────────────────────────────────────────────────

export const templatesApi = {
  /**
   * GET /api/templates
   * Returns the latest active version of every template.
   * Usage: const physio = templates.find(t => t.key === 'physio_assessment');
   *        <DynamicForm template={physio} clientId={client.id} />
   */
  list: async (): Promise<Template[]> => {
    const { data } = await api.get<{ data: Template[] }>('/templates');
    return data.data;
  },

  get: async (id: number): Promise<Template> => {
    const { data } = await api.get<{ data: Template }>(`/templates/${id}`);
    return data.data;
  },

  /**
   * POST /api/templates
   * If `key` already exists, a new version is created automatically.
   */
  create: async (payload: {
    name: string;
    key: string;
    description?: string;
    schema: TemplateSchema;
  }): Promise<Template> => {
    const { data } = await api.post<{ data: Template }>('/templates', payload);
    return data.data;
  },

  /** PUT /api/templates/{id} — metadata only */
  update: async (
    id: number,
    payload: { name?: string; description?: string; is_active?: boolean },
  ): Promise<Template> => {
    const { data } = await api.put<{ data: Template }>(`/templates/${id}`, payload);
    return data.data;
  },
};

// ─── Records ──────────────────────────────────────────────────────────────────

export const recordsApi = {
  /** GET /api/clients/{clientId}/records?template_key=physio_assessment */
  list: async (
    clientId: number,
    params?: { template_key?: string; page?: number; per_page?: number },
  ): Promise<PaginatedResponse<ClinicalRecord>> => {
    const { data } = await api.get<PaginatedResponse<ClinicalRecord>>(
      `/clients/${clientId}/records`,
      { params },
    );
    return data;
  },

  /**
   * POST /api/clients/{clientId}/records
   *
   * The `data` object must satisfy the template schema for `template_key`.
   * The API will return 422 with `errors` if it does not.
   *
   * Usage:
   *   await recordsApi.create(client.id, {
   *     template_key: 'physio_assessment',
   *     data: { pain_level: 6, joint_tested: 'Knee', outcome: 'improved' },
   *     notes: 'Improvement since last visit.',
   *   });
   */
  create: async (
    clientId: number,
    payload: {
      template_key: string;
      data: Record<string, unknown>;
      notes?: string;
      recorded_at?: string;
    },
  ): Promise<ClinicalRecord> => {
    const { data } = await api.post<{ data: ClinicalRecord }>(
      `/clients/${clientId}/records`,
      payload,
    );
    return data.data;
  },

  get: async (clientId: number, recordId: number): Promise<ClinicalRecord> => {
    const { data } = await api.get<{ data: ClinicalRecord }>(
      `/clients/${clientId}/records/${recordId}`,
    );
    return data.data;
  },

  update: async (
    clientId: number,
    recordId: number,
    payload: {
      data?: Record<string, unknown>;
      notes?: string;
      status?: string;
      recorded_at?: string;
    }
  ): Promise<ClinicalRecord> => {
    const { data } = await api.put<{ data: ClinicalRecord }>(
      `/clients/${clientId}/records/${recordId}`,
      payload
    );
    return data.data;
  },
};

// ─── Aliases to match component imports ──────────────────────────────────────

// Your DynamicForm imports TemplateField, api.ts calls it FormField — alias it
export type TemplateField = FormField;

// Your pages import templatesService/recordsService — alias them
export const templatesService = {
  list: templatesApi.list,
  get: templatesApi.get,
  create: templatesApi.create,
  update: templatesApi.update,
};

export const recordsService = {
  list: recordsApi.list,

  // Your DynamicRecordFormPage calls recordsService.submit()
  // but recordsApi uses .create() — bridge them here
  submit: async (
    clientId: number,
    templateKey: string,
    formData: Record<string, unknown>,
    notes?: string,
  ) => {
    return recordsApi.create(clientId, {
      template_key: templateKey,
      data: formData,
      notes,
    });
  },

  get: recordsApi.get,
};

export const clientsService = {
  list: clientsApi.list,
  get: clientsApi.get,
  create: clientsApi.create,
  update: clientsApi.update,
  delete: clientsApi.delete,
};

// ─── Notes ────────────────────────────────────────────────────────────────────

export interface ClientNote {
  id: number;
  content: string;  // HTML string
  created_by: { id: number; name: string } | null;
  created_at: string;
  updated_at: string;
}

export const notesApi = {
  list: async (clientId: number): Promise<ClientNote[]> => {
    const { data } = await api.get<{ data: ClientNote[] }>(
      `/clients/${clientId}/notes`
    );
    return data.data;
  },

  create: async (clientId: number, content: string): Promise<ClientNote> => {
    const { data } = await api.post<{ data: ClientNote }>(
      `/clients/${clientId}/notes`,
      { content }
    );
    return data.data;
  },

  update: async (clientId: number, noteId: number, content: string): Promise<ClientNote> => {
    const { data } = await api.put<{ data: ClientNote }>(
      `/clients/${clientId}/notes/${noteId}`,
      { content }
    );
    return data.data;
  },

  delete: async (clientId: number, noteId: number): Promise<void> => {
    await api.delete(`/clients/${clientId}/notes/${noteId}`);
  },
};

// ─── Files ────────────────────────────────────────────────────────────────────

export interface ClientFile {
  id: number;
  name: string;
  mime_type: string | null;
  size: number;
  formatted_size: string;
  uploaded_by: { id: number; name: string } | null;
  created_at: string;
}

export const filesApi = {
  list: async (clientId: number): Promise<ClientFile[]> => {
    const { data } = await api.get<{ data: ClientFile[] }>(
      `/clients/${clientId}/files`
    );
    return data.data;
  },

  upload: async (clientId: number, file: File): Promise<ClientFile> => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post<{ data: ClientFile }>(
      `/clients/${clientId}/files`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return data.data;
  },

  preview: async (clientId: number, fileId: number, fileName: string): Promise<void> => {
    const token = sessionStorage.getItem('auth_token');
    const response = await fetch(
      `${import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api'}/clients/${clientId}/files/${fileId}/preview`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!response.ok) throw new Error('Preview failed');

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    // Note: can't revoke immediately since it's opened in a new tab
    // The URL will be garbage collected when the tab closes
  },

  /**
   * Downloads a file by fetching it with the Bearer token,
   * then triggering a browser download via a blob URL.
   */
  download: async (clientId: number, fileId: number, fileName: string): Promise<void> => {
    const token = sessionStorage.getItem('auth_token');
    const response = await fetch(
      `${import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api'}/clients/${clientId}/files/${fileId}/download`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!response.ok) throw new Error('Download failed');

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  delete: async (clientId: number, fileId: number): Promise<void> => {
    await api.delete(`/clients/${clientId}/files/${fileId}`);
  },

  renameFile: (clientId: number | string, fileId: number | string, name: string) =>
  api.patch(`/clients/${clientId}/files/${fileId}/rename`, { name }),
};

// ─── Interactions ─────────────────────────────────────────────────────────────

export type InteractionType = 'call' | 'email' | 'visit' | 'meeting';

export interface ClientInteraction {
  id: number;
  type: InteractionType;
  summary: string;
  duration: string | null;     // "45 min" or null
  interacted_at: string;
  created_by: { id: number; name: string } | null;
}

export const interactionsApi = {
  list: async (clientId: number): Promise<ClientInteraction[]> => {
    const { data } = await api.get<{ data: ClientInteraction[] }>(
      `/clients/${clientId}/interactions`
    );
    return data.data;
  },

  create: async (
    clientId: number,
    payload: {
      type: InteractionType;
      summary: string;
      interacted_at?: string;
      duration_minutes?: number;
    }
  ): Promise<ClientInteraction> => {
    const { data } = await api.post<{ data: ClientInteraction }>(
      `/clients/${clientId}/interactions`,
      payload
    );
    return data.data;
  },

  update: async (
    clientId: number,
    interactionId: number,
    payload: {
      type?: InteractionType;
      summary?: string;
      interacted_at?: string;
      duration_minutes?: number;
    }
  ): Promise<ClientInteraction> => {
    const { data } = await api.put<{ data: ClientInteraction }>(
      `/clients/${clientId}/interactions/${interactionId}`,
      payload
    );
    return data.data;
  },

  delete: async (clientId: number, interactionId: number): Promise<void> => {
    await api.delete(`/clients/${clientId}/interactions/${interactionId}`);
  },
};

// ─── Activity ──────────────────────────────────────────────────────────────

export interface ActivityItem {
  id: number;
  type: string;
  description: string;
  link: string | null;
  occurred_at: string;
}

export const activityApi = {
  list: async (): Promise<ActivityItem[]> => {
    const { data } = await api.get<{ data: ActivityItem[] }>('/user/activity');
    return data.data;
  },
};

// ─── Notifications ────────────────────────────────────────────────────────────

export type NotificationType =
  | 'client_created'
  | 'note_added'
  | 'file_uploaded'
  | 'record_created'
  | 'interaction_logged'
  | 'template_created';

export interface AppNotification {
  id: number;
  type: NotificationType | string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  occurred_at: string;
}

export const notificationsApi = {
  list: async (): Promise<{ data: AppNotification[]; unread_count: number }> => {
    const { data } = await api.get('/notifications');
    return data;
  },

  markRead: async (id: number): Promise<void> => {
    await api.patch(`/notifications/${id}/read`);
  },

  markAllRead: async (): Promise<void> => {
    await api.patch('/notifications/read-all');
  },

  dismiss: async (id: number): Promise<void> => {
    await api.delete(`/notifications/${id}`);
  },
};

// ─── Users ────────────────────────────────────────────────────────────────────

export interface TenantUser {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  is_active: boolean;
  role: string;
  permissions: string[];
  created_at: string;
  activity?: ActivityItem[];
}

export const usersApi = {
  list: async (): Promise<TenantUser[]> => {
    const { data } = await api.get<{ data: TenantUser[] }>('/users');
    return data.data;
  },

  get: async (id: number): Promise<TenantUser> => {
    const { data } = await api.get<{ data: TenantUser }>(`/users/${id}`);
    return data.data;
  },

  create: async (payload: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    role: string;
    is_active?: boolean;
  }): Promise<TenantUser> => {
    const { data } = await api.post<{ data: TenantUser }>('/users', payload);
    return data.data;
  },

  update: async (id: number, payload: Partial<{
    name: string;
    email: string;
    password: string;
    phone: string;
    role: string;
    is_active: boolean;
  }>): Promise<TenantUser> => {
    const { data } = await api.put<{ data: TenantUser }>(`/users/${id}`, payload);
    return data.data;
  },

  toggleActive: async (id: number): Promise<{ is_active: boolean }> => {
    const { data } = await api.patch(`/users/${id}/toggle-active`);
    return data;
  },
};

// ─── Roles ────────────────────────────────────────────────────────────────────

export interface AppRole {
  id: number;
  name: string;
  permissions: string[];
}

export const rolesApi = {
  list: async (): Promise<AppRole[]> => {
    const { data } = await api.get<{ data: AppRole[] }>('/roles');
    return data.data;
  },

  listPermissions: async (): Promise<string[]> => {
    const { data } = await api.get<{ data: string[] }>('/permissions');
    return data.data;
  },

  create: async (payload: { name: string; permissions: string[] }): Promise<AppRole> => {
    const { data } = await api.post<{ data: AppRole }>('/roles', payload);
    return data.data;
  },

  update: async (id: number, permissions: string[]): Promise<AppRole> => {
    const { data } = await api.put<{ data: AppRole }>(`/roles/${id}`, { permissions });
    return data.data;
  },
};

export default api;