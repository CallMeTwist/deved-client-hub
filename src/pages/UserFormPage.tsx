import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { usersApi, rolesApi, type AppRole } from "@/services/api";

export default function UserFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [roles,    setRoles]    = useState<AppRole[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [error,    setError]    = useState("");

  const [form, setForm] = useState({
    name:      "",
    email:     "",
    password:  "",
    phone:     "",
    role:      "",
    is_active: true,
  });

  // Load roles
  useEffect(() => {
    rolesApi.list().then(setRoles);
  }, []);

  // Hydrate when editing
  useEffect(() => {
    if (!id) return;
    usersApi.get(Number(id))
      .then((u) => setForm({
        name:      u.name,
        email:     u.email,
        password:  "",
        phone:     u.phone ?? "",
        role:      u.role,
        is_active: u.is_active,
      }))
      .finally(() => setFetching(false));
  }, [id]);

  const set = (key: string, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload: Record<string, unknown> = {
        name:      form.name,
        email:     form.email,
        phone:     form.phone || undefined,
        role:      form.role,
        is_active: form.is_active,
      };
      if (form.password) payload.password = form.password;

      if (isEdit) {
        await usersApi.update(Number(id), payload);
      } else {
        if (!form.password) { setError("Password is required."); setLoading(false); return; }
        await usersApi.create({ ...payload, password: form.password } as Parameters<typeof usersApi.create>[0]);
      }
      navigate("/users");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const inputClasses =
    "w-full h-10 px-3 rounded-lg bg-muted/40 border border-border text-sm text-foreground " +
    "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 transition-all";

  if (fetching) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Loading...
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="animate-in">
        <button
          onClick={() => navigate(isEdit ? `/users/${id}` : "/users")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          {isEdit ? "Back to User" : "Back to Users"}
        </button>
        <div className="page-header">
          <h1 className="page-title">{isEdit ? "Edit User" : "New User"}</h1>
          <p className="page-subtitle">
            {isEdit ? "Update user details or role" : "Create a new team member account"}
          </p>
        </div>
      </div>

      <div className="max-w-lg animate-in animate-in-delay-1">
        <form
          onSubmit={handleSubmit}
          className="bg-card rounded-xl border border-border/50 shadow-sm p-6 space-y-5"
        >
          {error && (
            <div className="px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Full Name <span className="text-destructive">*</span>
            </label>
            <input
              required
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className={inputClasses}
              placeholder="Dr. Amara Osei"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Email <span className="text-destructive">*</span>
            </label>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              className={inputClasses}
              placeholder="amara@clinic.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              {isEdit ? "New Password (leave blank to keep current)" : "Password *"}
            </label>
            <input
              type="password"
              required={!isEdit}
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              className={inputClasses}
              placeholder={isEdit ? "Leave blank to keep current" : "Minimum 8 characters"}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Phone</label>
            <input
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              className={inputClasses}
              placeholder="+234 800 000 0000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Role <span className="text-destructive">*</span>
            </label>
            <select
              required
              value={form.role}
              onChange={(e) => set("role", e.target.value)}
              className={inputClasses}
            >
              <option value="">Select a role</option>
              {roles.map((r) => (
                <option key={r.id} value={r.name}>
                  {r.name.charAt(0).toUpperCase() + r.name.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={form.is_active}
              onChange={(e) => set("is_active", e.target.checked)}
              className="rounded border-border h-4 w-4"
            />
            <label htmlFor="is_active" className="text-sm text-foreground">
              Account active
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={loading} className="active:scale-[0.97]">
              {loading ? "Saving..." : isEdit ? "Update User" : "Create User"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(isEdit ? `/users/${id}` : "/users")}
              className="active:scale-[0.97]"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}