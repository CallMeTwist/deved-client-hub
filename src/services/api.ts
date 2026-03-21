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
  const token = localStorage.getItem('auth_token');
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
      localStorage.removeItem('auth_token');
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
   *        localStorage.setItem('auth_token', token);
   */
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const { data } = await api.post<LoginResponse>('/auth/login', { email, password });
    return data;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
    localStorage.removeItem('auth_token');
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

export default api;